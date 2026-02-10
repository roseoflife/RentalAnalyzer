import Papa from 'papaparse';
import type { IncomeRecord, ExpenseRecord, ExpenseCategory } from '../types';

/**
 * Custom parser for Google Sheets-exported spreadsheet-style CSVs.
 * Handles the user's specific expense files (2023/2024) and budget file (2025).
 */

type RawRow = string[];

function parseRawCSV(content: string): RawRow[] {
  const result = Papa.parse<string[]>(content, {
    header: false,
    skipEmptyLines: false,
  });
  return result.data;
}

function cleanNumber(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/[$€£,\s]/g, '').replace(/\((.+)\)/, '-$1');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function supplierToCategory(supplier: string): ExpenseCategory {
  const s = supplier.toLowerCase();

  if (/mortgage|interest on mortgage|loan|scotia\s*bank/.test(s)) return 'mortgage';
  if (/municipal\s*tax|school[\s-]*tax/.test(s)) return 'property_tax';
  if (/insurance/.test(s)) return 'insurance';
  if (/gas|hydro|electri|heating|water\s*(?:heater|tank)|internet|energir|virgin/.test(s)) return 'utilities';
  if (/snow|grass|oliver/.test(s)) return 'maintenance';
  if (/plumb|repair|appliance|maple\s*leaf/.test(s)) return 'repairs';
  if (/home\s*depot|reno\s*depot|ikea|paint|carpet|amazon|couche\s*tard|quinca/.test(s)) return 'repairs';
  if (/legal|lawyer|avocat|avocate/.test(s)) return 'other';
  if (/advertis|kijiji|facebook|sabbatical/.test(s)) return 'other';
  if (/hr\s*block|bank\s*fee|parking|uhaul|best\s*buy|stokes/.test(s)) return 'other';

  return 'other';
}

function budgetExpenseCategory(label: string): ExpenseCategory {
  const s = label.toLowerCase().trim();
  if (/mortgage/.test(s)) return 'mortgage';
  if (/municipal|tax/.test(s)) return 'property_tax';
  if (/insurance/.test(s)) return 'insurance';
  if (/electricity|heating|water\s*heater|internet/.test(s)) return 'utilities';
  if (/oliver|snow|grass|maintenance/.test(s)) return 'maintenance';
  return 'other';
}

/** Detect if content matches the spreadsheet-style format */
export function isSpreadsheetFormat(content: string): boolean {
  const upper = content.substring(0, 2000).toUpperCase();
  return (
    upper.includes('TAXES -') ||
    upper.includes('TOTAL-EXPENSES') ||
    upper.includes('EXPENSES-') ||
    upper.includes('MONTHLY BUDGET') ||
    upper.includes('SOMERLED BUILDING')
  );
}

export interface SpreadsheetParseResult {
  income: IncomeRecord[];
  expenses: ExpenseRecord[];
  year: number;
  mappingDetails: string[];
}

/** Parse a 2023 or 2024 expense file */
function parseExpenseFile(rows: RawRow[]): SpreadsheetParseResult {
  const incomeRecords: IncomeRecord[] = [];
  const expenseRecords: ExpenseRecord[] = [];
  const details: string[] = [];

  // Extract year from title row (e.g., "TAXES - 2023")
  let year = 0;
  for (const row of rows) {
    const match = row[0]?.match(/TAXES\s*-\s*(\d{4})/i);
    if (match) {
      year = parseInt(match[1], 10);
      break;
    }
  }
  if (!year) {
    // Fallback: look for Expenses-YYYY in headers
    for (const row of rows) {
      for (const cell of row) {
        const m = cell?.match(/Expenses-(\d{4})/i);
        if (m) { year = parseInt(m[1], 10); break; }
      }
      if (year) break;
    }
  }

  details.push(`Detected spreadsheet expense file for year: ${year}`);

  // Parse fixed expenses (A-H) and operating expenses (numbered or lettered)
  let inExpenses = false;
  let inIncome = false;
  let hasMonthlyRentGrid = false;
  let monthlyGridStartIdx = -1;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const col0 = (row[0] || '').trim();
    const col1 = (row[1] || '').trim();
    const col2 = (row[2] || '').trim();

    // Detect monthly rent grid section (2024)
    if (/^Rents\s+\d{4}/i.test(col0)) {
      hasMonthlyRentGrid = true;
      monthlyGridStartIdx = i + 1; // skip the header row "Month, January, ..."
      break; // process this section separately
    }

    // Detect income section
    if (/^#\s*App/i.test(col0) || (col0.includes('#') && col1.includes('Rent'))) {
      inIncome = true;
      inExpenses = false;
      continue;
    }

    // Stop income section at total
    if (inIncome && /TOTAL-INCOME/i.test(col1)) {
      inIncome = false;
      continue;
    }

    // Skip header row for expenses
    if (/^Item$/i.test(col0) && /Supplier/i.test(col1)) {
      inExpenses = true;
      continue;
    }

    // Stop expenses at total
    if (/TOTAL-EXPENSES/i.test(col1)) {
      inExpenses = false;
      continue;
    }

    // Parse expense rows
    if (inExpenses) {
      // Fixed expenses: Item is A-Z letter, or operating: numbered or lower-case letter
      const isFixedItem = /^[A-H]$/i.test(col0);
      const isOperatingItem = /^\d+$/.test(col0) || /^[a-z]$/i.test(col0);
      const isOperatingHeader = /OPERATING\s*EXPENSES/i.test(col1);

      if (isOperatingHeader) continue;

      if ((isFixedItem || isOperatingItem) && col1) {
        const amount = cleanNumber(col2);
        if (amount > 0) {
          const category = supplierToCategory(col1);
          const description = (row[6] || row[5] || '').trim();
          // Distribute annually: 1 record per month
          const monthly = amount / 12;
          for (let m = 1; m <= 12; m++) {
            expenseRecords.push({
              year,
              month: m,
              category,
              amount: Math.round(monthly * 100) / 100,
              description: `${col1}${description ? ' - ' + description : ''}`,
            });
          }
        }
      }
    }

    // Parse income rows
    if (inIncome) {
      const unitMatch = col0.match(/^(6825|6827|6829)/);
      if (unitMatch) {
        // Total income is in col3 usually
        const totalIncome = cleanNumber(row[3] || '');
        if (totalIncome > 0) {
          const monthly = totalIncome / 12;
          for (let m = 1; m <= 12; m++) {
            incomeRecords.push({
              year,
              month: m,
              rentalIncome: Math.round(monthly * 100) / 100,
              otherIncome: 0,
              vacancyLoss: 0,
            });
          }
        }
      }
    }
  }

  // If we have a monthly rent grid, prefer it over evenly-distributed summary data.
  if (hasMonthlyRentGrid && monthlyGridStartIdx > 0) {
    // Remove the evenly-distributed records from the summary section.
    // Grid records have non-uniform amounts. Summary records have uniform amounts per unit.
    // Simplest approach: just use the grid data. Clear income and re-parse.
    const gridIncome: IncomeRecord[] = [];
    for (let i = monthlyGridStartIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      const unit = (row[0] || '').trim();
      if (!unit || /^\s*$/.test(unit)) continue;
      if (/TOTAL|MARGIN|PROFIT|OPERATING/i.test(unit)) break;

      for (let m = 1; m <= 12; m++) {
        const val = cleanNumber(row[m] || '');
        if (val > 0) {
          gridIncome.push({
            year,
            month: m,
            rentalIncome: val,
            otherIncome: 0,
            vacancyLoss: 0,
          });
        }
      }
    }
    if (gridIncome.length > 0) {
      // Replace income with grid data
      incomeRecords.length = 0;
      incomeRecords.push(...gridIncome);
    }
  }

  details.push(`Parsed ${expenseRecords.length} expense records (monthly)`);
  details.push(`Parsed ${incomeRecords.length} income records`);

  return { income: incomeRecords, expenses: expenseRecords, year, mappingDetails: details };
}

/** Parse a monthly budget file — auto-detects year and reads actual values from file */
function parseBudgetFile(rows: RawRow[], filename?: string): SpreadsheetParseResult {
  const incomeRecords: IncomeRecord[] = [];
  const expenseRecords: ExpenseRecord[] = [];
  const details: string[] = [];

  // Auto-detect year: try filename first, then file content
  let year = 0;
  if (filename) {
    const fm = filename.match(/\b(20[2-3]\d)\b/);
    if (fm) year = parseInt(fm[1], 10);
  }
  if (!year) {
    for (const row of rows) {
      for (const cell of row) {
        const m = (cell || '').match(/\b(20[2-3]\d)\b/);
        if (m) {
          year = parseInt(m[1], 10);
          break;
        }
      }
      if (year) break;
    }
  }
  if (!year) year = new Date().getFullYear();

  details.push(`Detected spreadsheet budget file for year: ${year}`);

  // Layout: col1=label, col3=Planned, col4=Actual for expenses
  //         col7=label, col9=Planned, col10=Actual for income
  const expLabelCol = 1;
  const expActualCol = 4;
  const incLabelCol = 7;
  const incActualCol = 10;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const col1 = (row[expLabelCol] || '').trim();

    // Skip totals and header rows
    if (!col1 || /^(Expenses|Income|Planned|Actual|Totals|Notes)/i.test(col1)) continue;
    if (/START|END|BALANCE/i.test((row[3] || ''))) continue;

    // Parse expense detail rows
    const isExpenseLabel = /mortgage|municipal|electricity|heating|water|oliver|insurance|internet/i.test(col1);
    if (isExpenseLabel) {
      const actual = cleanNumber(row[expActualCol] || '');
      if (actual > 0) {
        const category = budgetExpenseCategory(col1);
        for (let m = 1; m <= 12; m++) {
          expenseRecords.push({
            year,
            month: m,
            category,
            amount: Math.round(actual * 100) / 100,
            description: col1,
          });
        }
      }
    }

    // Parse income from right side — include Somerled units, exclude other properties
    const incLabel = (row[incLabelCol] || '').trim();
    if (incLabel && /APP|6825|6827|6829/i.test(incLabel) && !/215/i.test(incLabel)) {
      // Try Actual column first, then Planned as fallback
      const actual = cleanNumber(row[incActualCol] || '') || cleanNumber(row[incActualCol - 1] || '');
      if (actual > 0) {
        for (let m = 1; m <= 12; m++) {
          incomeRecords.push({
            year,
            month: m,
            rentalIncome: Math.round(actual * 100) / 100,
            otherIncome: 0,
            vacancyLoss: 0,
          });
        }
        details.push(`  ${incLabel}: $${actual.toLocaleString()}/month`);
      }
    }
  }

  // Project next year using same income and expenses
  const nextYear = year + 1;
  const projectedIncome = incomeRecords.map((r) => ({ ...r, year: nextYear }));
  const projectedExpenses = expenseRecords.map((r) => ({ ...r, year: nextYear }));
  incomeRecords.push(...projectedIncome);
  expenseRecords.push(...projectedExpenses);

  const monthlyTotal = incomeRecords
    .filter((r) => r.year === year && r.month === 1)
    .reduce((sum, r) => sum + r.rentalIncome, 0);
  details.push(`Total monthly rental income: $${monthlyTotal.toLocaleString()}`);
  details.push(`Parsed ${expenseRecords.length / 2} expense records for ${year}`);
  details.push(`Parsed ${incomeRecords.length / 2} income records for ${year}`);
  details.push(`Generated ${nextYear} projected data using same monthly amounts`);

  return { income: incomeRecords, expenses: expenseRecords, year, mappingDetails: details };
}

function isBudgetFile(rows: RawRow[]): boolean {
  const first2000 = rows.slice(0, 30).flat().join(' ').toUpperCase();
  return first2000.includes('MONTHLY BUDGET') || first2000.includes('SOMERLED BUILDING');
}

export function parseSpreadsheet(content: string, filename?: string): SpreadsheetParseResult {
  const rows = parseRawCSV(content);

  if (isBudgetFile(rows)) {
    return parseBudgetFile(rows, filename);
  }
  return parseExpenseFile(rows);
}
