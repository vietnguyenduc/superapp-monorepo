import React from 'react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({ data, columns, onRowClick }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto shadow-sm border border-gray-200 dark:border-gray-700 sm:rounded-lg">
      {/* Mobile card view (visible on small screens) */}
      <div className="block sm:hidden divide-y divide-gray-200 dark:divide-gray-700">
        {data.map((row, rowIndex) => (
          <div
            key={rowIndex}
            onClick={() => onRowClick && onRowClick(row)}
            className={`px-4 py-3 space-y-2 ${onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}`}
          >
            {columns.map((col, colIndex) => (
              <div key={String(col.key) + colIndex} className="flex justify-between items-start gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase shrink-0 min-w-[80px]">
                  {col.header}
                </span>
                <span className="text-sm text-gray-900 dark:text-gray-100 text-right break-words max-w-[60vw]">
                  {col.render ? col.render(row) : String((row as any)[col.key] ?? '')}
                </span>
              </div>
            ))}
          </div>
        ))}
        {data.length === 0 && (
          <div className="px-4 py-6 text-sm text-center text-gray-500">
            No data available
          </div>
        )}
      </div>

      {/* Desktop table view (hidden on small screens) */}
      <table className="hidden sm:table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((col, index) => (
              <th
                key={String(col.key) + index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
            >
              {columns.map((col, colIndex) => (
                <td
                  key={String(col.key) + colIndex}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                >
                  {col.render ? col.render(row) : String((row as any)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500"
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
