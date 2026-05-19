import React from 'react';

export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  fixed?: 'left' | 'right';
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  rowKey?: string | ((record: T) => string);
  onRow?: (record: T, index: number) => React.HTMLAttributes<HTMLTableRowElement>;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  bordered?: boolean;
  striped?: boolean;
  hoverable?: boolean;
}

const Table = <T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyText = 'Không có dữ liệu',
  rowKey = 'id',
  onRow,
  className = '',
  size = 'md',
  bordered = true,
  striped = false,
  hoverable = true
}: TableProps<T>) => {
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return record[rowKey] || index.toString();
  };

  const getCellValue = (record: T, column: TableColumn<T>) => {
    if (column.render) {
      const index = data.indexOf(record);
      const value = column.dataIndex ? record[column.dataIndex] : record;
      return column.render(value, record, index);
    }
    return column.dataIndex ? record[column.dataIndex] : '';
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base'
  };

  const cellPaddingClasses = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4'
  };

  const baseTableClasses = `w-full ${sizeClasses[size]} ${className}`;
  const borderClass = bordered ? 'border border-gray-200 rounded-xl overflow-hidden' : '';

  if (loading) {
    return (
      <div className={`bg-white ${borderClass} ${className}`}>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`bg-white ${borderClass} ${className}`}>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600">{emptyText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white ${borderClass} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className={baseTableClasses}>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    ${cellPaddingClasses[size]}
                    font-semibold text-gray-900 text-left
                    ${column.align === 'center' ? 'text-center' : ''}
                    ${column.align === 'right' ? 'text-right' : ''}
                    ${column.width ? `w-[${column.width}]` : ''}
                  `}
                  style={column.width ? { width: column.width } : undefined}
                >
                  <div className="flex items-center space-x-2">
                    <span>{column.title}</span>
                    {column.sortable && (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((record, index) => {
              const rowProps = onRow ? onRow(record, index) : {};
              const key = getRowKey(record, index);
              
              return (
                <tr
                  key={key}
                  className={`
                    ${striped && index % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                    ${hoverable ? 'hover:bg-gray-50' : ''}
                    transition-colors duration-150
                  `}
                  {...rowProps}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`
                        ${cellPaddingClasses[size]}
                        text-gray-900
                        ${column.align === 'center' ? 'text-center' : ''}
                        ${column.align === 'right' ? 'text-right' : ''}
                      `}
                    >
                      {getCellValue(record, column)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
