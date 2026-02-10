import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, Database, Trash2, AlertTriangle } from 'lucide-react';
import { useFileParser } from '../../hooks/useFileParser';
import type { ParseFileResult } from '../../hooks/useFileParser';
import { useAppContext } from '../../context/AppContext';
import { getSampleData } from '../../constants/sample-data';
import { cn } from '../../utils/formatters';

export function FileUploader() {
  const { state, dispatch } = useAppContext();
  const { parseFile } = useFileParser();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastParseResult, setLastParseResult] = useState<ParseFileResult | null>(null);

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      setError(null);
      setLastParseResult(null);

      for (const file of Array.from(fileList)) {
        try {
          const result = await parseFile(file);
          setLastParseResult(result);

          if (result.incomeCount === 0 && result.expenseCount === 0) {
            setError(
              `No records could be mapped from "${file.name}". Check that your CSV has recognizable column headers (see mapping details below).`
            );
          }
        } catch (err) {
          setError(`Error parsing ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
    },
    [parseFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleLoadSample = () => {
    const { income, expenses } = getSampleData();
    dispatch({
      type: 'SET_ALL_DATA',
      payload: { income, expenses },
      file: { name: 'sample-data', type: 'combined' },
    });
    setError(null);
    setLastParseResult(null);
  };

  const handleClearData = () => {
    dispatch({ type: 'CLEAR_DATA' });
    setError(null);
    setLastParseResult(null);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-xl p-10 text-center transition-colors',
          isDragging
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        )}
      >
        <Upload size={36} className="mx-auto text-gray-400 mb-3" />
        <p className="text-sm font-medium text-gray-700 mb-1">
          Drop your CSV or Excel files here
        </p>
        <p className="text-xs text-gray-500 mb-4">
          Income file, expenses file, or a single combined file
        </p>
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors">
          <FileSpreadsheet size={16} />
          Browse Files
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFiles(e.target.files);
              }
            }}
          />
        </label>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 border border-red-200">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {lastParseResult && (
        <div className={cn(
          'rounded-lg px-4 py-3 border text-xs space-y-1',
          lastParseResult.incomeCount === 0 && lastParseResult.expenseCount === 0
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        )}>
          <p className="font-medium">Column Mapping Details:</p>
          {lastParseResult.mappingDetails.map((detail, i) => (
            <p key={i} className={detail.startsWith('WARNING') ? 'text-red-600 font-medium' : ''}>
              {detail}
            </p>
          ))}
        </div>
      )}

      {state.loadedFiles.length > 0 && (
        <div className="bg-green-50 rounded-lg px-4 py-3 border border-green-200">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-green-800">Files loaded:</p>
            <button
              onClick={handleClearData}
              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
            >
              <Trash2 size={12} />
              Clear all
            </button>
          </div>
          {state.loadedFiles.map((f, i) => (
            <p key={i} className="text-xs text-green-700">
              {f.name} ({f.type})
            </p>
          ))}
          <p className="text-xs text-green-600 mt-1">
            {state.incomeData.length} income records, {state.expenseData.length} expense records
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <button
        onClick={handleLoadSample}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Database size={16} />
        Load Sample Data (10 years)
      </button>

      <div className="text-xs text-gray-400 space-y-1">
        <p className="font-medium">Expected CSV format:</p>
        <p>Income: year, month, rental_income, other_income, vacancy_loss</p>
        <p>Expenses: year, month, category, amount, description</p>
        <p>A "date" column (e.g. 2015-01-15) works in place of separate year/month columns.</p>
        <p>Values like "$1,200.00" are handled automatically.</p>
      </div>
    </div>
  );
}
