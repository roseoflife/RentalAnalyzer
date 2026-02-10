import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { parseCSV, mapToIncomeRecords, mapToExpenseRecords } from '../utils/csv-parser';
import { excelToCSV, isExcelFile } from '../utils/excel-parser';
import { isSpreadsheetFormat, parseSpreadsheet } from '../utils/spreadsheet-parser';
import type { FileType } from '../types';

export interface ParseFileResult {
  rows: Record<string, string>[];
  fileType: FileType;
  mappingDetails: string[];
  incomeCount: number;
  expenseCount: number;
}

export function useFileParser() {
  const { dispatch } = useAppContext();

  const parseFile = useCallback(
    async (file: File, fileType?: 'income' | 'expenses'): Promise<ParseFileResult> => {
      let csvContent: string;

      if (isExcelFile(file.name)) {
        const buffer = await file.arrayBuffer();
        csvContent = excelToCSV(buffer);
      } else {
        csvContent = await file.text();
      }

      // Try spreadsheet-style parser first for non-tabular formats
      if (isSpreadsheetFormat(csvContent)) {
        const result = parseSpreadsheet(csvContent, file.name);
        const { income, expenses, mappingDetails } = result;

        const fileInfo = { name: file.name, type: 'combined' as FileType };

        if (income.length > 0 && expenses.length > 0) {
          dispatch({
            type: 'SET_ALL_DATA',
            payload: { income, expenses },
            file: fileInfo,
          });
        } else if (income.length > 0) {
          dispatch({ type: 'SET_INCOME_DATA', payload: income, file: { ...fileInfo, type: 'income' } });
        } else if (expenses.length > 0) {
          dispatch({ type: 'SET_EXPENSE_DATA', payload: expenses, file: { ...fileInfo, type: 'expenses' } });
        }

        mappingDetails.push(`Mapped ${income.length} income records, ${expenses.length} expense records`);

        return {
          rows: [],
          fileType: 'combined',
          mappingDetails,
          incomeCount: income.length,
          expenseCount: expenses.length,
        };
      }

      // Fall back to standard CSV parser
      const { rows, fileType: detectedType, mapping, mappingDetails } = parseCSV(csvContent);

      const actualType = fileType || detectedType;
      const fileInfo = { name: file.name, type: actualType };

      let incomeCount = 0;
      let expenseCount = 0;

      if (actualType === 'combined') {
        const incomeRecords = mapToIncomeRecords(rows, mapping);
        const expenseRecords = mapToExpenseRecords(rows, mapping);
        incomeCount = incomeRecords.length;
        expenseCount = expenseRecords.length;
        dispatch({
          type: 'SET_ALL_DATA',
          payload: { income: incomeRecords, expenses: expenseRecords },
          file: fileInfo,
        });
      } else if (actualType === 'income') {
        const incomeRecords = mapToIncomeRecords(rows, mapping);
        incomeCount = incomeRecords.length;
        dispatch({ type: 'SET_INCOME_DATA', payload: incomeRecords, file: fileInfo });
      } else {
        const expenseRecords = mapToExpenseRecords(rows, mapping);
        expenseCount = expenseRecords.length;
        dispatch({ type: 'SET_EXPENSE_DATA', payload: expenseRecords, file: fileInfo });
      }

      mappingDetails.push(`Mapped ${incomeCount} income records, ${expenseCount} expense records`);

      return { rows, fileType: actualType, mappingDetails, incomeCount, expenseCount };
    },
    [dispatch]
  );

  return { parseFile };
}
