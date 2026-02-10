import Papa from 'papaparse';
import type { IncomeRecord, ExpenseRecord, ColumnMapping, FileType, ExpenseCategory } from '../types';
import { EXPENSE_CATEGORIES } from '../types';

interface ParsedRow {
  [key: string]: string;
}

function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function columnMatches(normalized: string, patterns: string[]): boolean {
  // Exact match
  if (patterns.includes(normalized)) return true;
  // Partial/contains match
  return patterns.some((p) => normalized.includes(p) || p.includes(normalized));
}

function findColumnIndex(normalized: string[], patterns: string[]): number {
  // Try exact match first
  const exact = normalized.findIndex((h) => patterns.includes(h));
  if (exact >= 0) return exact;
  // Try contains match
  return normalized.findIndex((h) =>
    patterns.some((p) => h.includes(p) || p.includes(h))
  );
}

function detectFileType(headers: string[]): FileType {
  const normalized = headers.map(normalizeColumnName);
  const hasIncome = normalized.some((h) =>
    columnMatches(h, ['rental_income', 'rent', 'income', 'rental', 'revenue', 'rent_income', 'gross_income', 'rental_revenue'])
  );
  const hasCategory = normalized.some((h) =>
    columnMatches(h, ['category', 'expense_category', 'type', 'expense_type'])
  );

  if (hasIncome && hasCategory) return 'combined';
  if (hasCategory) return 'expenses';
  return 'income';
}

function autoMapColumns(
  headers: string[],
  fileType: FileType
): ColumnMapping {
  const mapping: ColumnMapping = {};
  const normalized = headers.map(normalizeColumnName);

  // Year - also handle "date" column
  const yearIdx = findColumnIndex(normalized, ['year', 'yr', 'annee']);
  if (yearIdx >= 0) mapping.year = headers[yearIdx];

  // Month
  const monthIdx = findColumnIndex(normalized, ['month', 'mo', 'period', 'mois']);
  if (monthIdx >= 0) mapping.month = headers[monthIdx];

  // If no year column found, look for a date column we can extract year/month from
  if (!mapping.year) {
    const dateIdx = findColumnIndex(normalized, ['date', 'transaction_date', 'payment_date', 'invoice_date']);
    if (dateIdx >= 0) {
      mapping.year = headers[dateIdx];
      // Mark that this is a date column so we parse it differently
      (mapping as any)._dateColumn = headers[dateIdx];
    }
  }

  if (fileType === 'income' || fileType === 'combined') {
    const incomeIdx = findColumnIndex(normalized, [
      'rental_income', 'rent', 'income', 'rental', 'rent_income',
      'revenue', 'gross_income', 'rental_revenue', 'amount',
      'monthly_rent', 'rent_amount', 'total_income',
    ]);
    if (incomeIdx >= 0) mapping.rentalIncome = headers[incomeIdx];

    const otherIdx = findColumnIndex(normalized, [
      'other_income', 'other', 'misc_income', 'additional_income',
      'misc', 'other_revenue',
    ]);
    if (otherIdx >= 0) mapping.otherIncome = headers[otherIdx];

    const vacIdx = findColumnIndex(normalized, [
      'vacancy_loss', 'vacancy', 'loss', 'vacancy_rate',
      'vacant', 'vacancy_cost',
    ]);
    if (vacIdx >= 0) mapping.vacancyLoss = headers[vacIdx];
  }

  if (fileType === 'expenses' || fileType === 'combined') {
    const catIdx = findColumnIndex(normalized, [
      'category', 'expense_category', 'type', 'expense_type',
      'expense_cat', 'cat',
    ]);
    if (catIdx >= 0) mapping.category = headers[catIdx];

    const amtIdx = findColumnIndex(normalized, [
      'amount', 'cost', 'expense', 'total', 'payment',
      'expense_amount', 'total_amount', 'sum', 'value', 'price',
    ]);
    if (amtIdx >= 0) mapping.amount = headers[amtIdx];

    const descIdx = findColumnIndex(normalized, [
      'description', 'desc', 'note', 'notes', 'memo',
      'details', 'comment', 'comments', 'label', 'name',
    ]);
    if (descIdx >= 0) mapping.description = headers[descIdx];
  }

  return mapping;
}

function parseDateValue(value: string): { year: number; month: number } | null {
  if (!value) return null;

  // Try ISO format: 2015-01-15 or 2015/01/15
  const isoMatch = value.match(/^(\d{4})[-/](\d{1,2})(?:[-/]\d{1,2})?$/);
  if (isoMatch) {
    return { year: parseInt(isoMatch[1], 10), month: parseInt(isoMatch[2], 10) };
  }

  // Try US format: 01/15/2015 or 1-15-2015
  const usMatch = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (usMatch) {
    return { year: parseInt(usMatch[3], 10), month: parseInt(usMatch[1], 10) };
  }

  // Try just year: 2015
  const yearMatch = value.match(/^(\d{4})$/);
  if (yearMatch) {
    return { year: parseInt(yearMatch[1], 10), month: 1 };
  }

  // Try Date parsing as fallback
  const d = new Date(value);
  if (!isNaN(d.getTime()) && d.getFullYear() > 1900) {
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }

  return null;
}

function parseCategory(value: string): ExpenseCategory {
  const normalized = normalizeColumnName(value);
  if (EXPENSE_CATEGORIES.includes(normalized as ExpenseCategory)) {
    return normalized as ExpenseCategory;
  }
  // Fuzzy matching
  const mappings: Record<string, ExpenseCategory> = {
    tax: 'property_tax',
    taxes: 'property_tax',
    prop_tax: 'property_tax',
    property_taxes: 'property_tax',
    ins: 'insurance',
    maint: 'maintenance',
    repair: 'repairs',
    mgmt: 'management',
    property_management: 'management',
    util: 'utilities',
    utility: 'utilities',
    capital: 'capex',
    capital_expenditure: 'capex',
    capital_expense: 'capex',
    misc: 'other',
    interest: 'mortgage',
    mortgage_payment: 'mortgage',
    loan: 'mortgage',
    homeowners_association: 'hoa',
  };
  // Try exact key match first, then partial
  if (mappings[normalized]) return mappings[normalized];
  for (const [key, cat] of Object.entries(mappings)) {
    if (normalized.includes(key) || key.includes(normalized)) return cat;
  }
  return 'other';
}

function parseNumericValue(value: string | undefined): number {
  if (!value) return 0;
  // Remove currency symbols, commas, spaces
  const cleaned = value.replace(/[$€£,\s]/g, '').replace(/\((.+)\)/, '-$1');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export interface ParseResult {
  headers: string[];
  rows: ParsedRow[];
  fileType: FileType;
  mapping: ColumnMapping;
  mappingDetails: string[];
}

export function parseCSV(fileContent: string): ParseResult {
  const result = Papa.parse<ParsedRow>(fileContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const headers = result.meta.fields || [];
  const fileType = detectFileType(headers);
  const mapping = autoMapColumns(headers, fileType);

  // Build human-readable mapping details for debugging
  const mappingDetails: string[] = [
    `Detected file type: ${fileType}`,
    `Headers found: ${headers.join(', ')}`,
    `Rows parsed: ${result.data.length}`,
  ];
  if (mapping.year) mappingDetails.push(`Year/Date column: "${mapping.year}"`);
  else mappingDetails.push('WARNING: No year/date column found');
  if (mapping.month) mappingDetails.push(`Month column: "${mapping.month}"`);
  if (mapping.rentalIncome) mappingDetails.push(`Income column: "${mapping.rentalIncome}"`);
  if (mapping.category) mappingDetails.push(`Category column: "${mapping.category}"`);
  if (mapping.amount) mappingDetails.push(`Amount column: "${mapping.amount}"`);

  return {
    headers,
    rows: result.data,
    fileType,
    mapping,
    mappingDetails,
  };
}

export function mapToIncomeRecords(
  rows: ParsedRow[],
  mapping: ColumnMapping
): IncomeRecord[] {
  const isDateColumn = !!(mapping as any)._dateColumn;

  return rows
    .filter((row) => mapping.year && row[mapping.year])
    .map((row) => {
      let year: number;
      let month: number;

      if (isDateColumn) {
        const parsed = parseDateValue(row[mapping.year!]);
        if (!parsed) return null;
        year = parsed.year;
        month = parsed.month;
      } else {
        year = parseInt(row[mapping.year!] || '0', 10);
        month = mapping.month ? parseInt(row[mapping.month] || '1', 10) : 1;
      }

      return {
        year,
        month,
        rentalIncome: parseNumericValue(row[mapping.rentalIncome || '']),
        otherIncome: parseNumericValue(row[mapping.otherIncome || '']),
        vacancyLoss: parseNumericValue(row[mapping.vacancyLoss || '']),
      };
    })
    .filter((r): r is IncomeRecord => r !== null && r.year > 0);
}

export function mapToExpenseRecords(
  rows: ParsedRow[],
  mapping: ColumnMapping
): ExpenseRecord[] {
  const isDateColumn = !!(mapping as any)._dateColumn;

  return rows
    .filter((row) => mapping.year && row[mapping.year] && mapping.category && row[mapping.category])
    .map((row) => {
      let year: number;
      let month: number;

      if (isDateColumn) {
        const parsed = parseDateValue(row[mapping.year!]);
        if (!parsed) return null;
        year = parsed.year;
        month = parsed.month;
      } else {
        year = parseInt(row[mapping.year!] || '0', 10);
        month = mapping.month ? parseInt(row[mapping.month] || '1', 10) : 1;
      }

      return {
        year,
        month,
        category: parseCategory(row[mapping.category!] || 'other'),
        amount: parseNumericValue(row[mapping.amount || '']),
        description: row[mapping.description || ''] || '',
      };
    })
    .filter((r): r is ExpenseRecord => r !== null && r.year > 0);
}
