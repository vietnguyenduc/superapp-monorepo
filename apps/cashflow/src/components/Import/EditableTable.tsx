import React, { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { ImportError } from "../../types";

interface EditableTableProps {
  data: any[];
  errors: ImportError[];
  onDataChange: (data: any[]) => void;
  columns: {
    key: string;
    label: string;
    required?: boolean;
    type?: "text" | "number" | "date" | "select";
    options?: string[];
  }[];
  maxRows?: number;
}

const EditableTable: React.FC<EditableTableProps> = ({
  data,
  errors,
  onDataChange,
  columns,
  maxRows = 100,
}) => {
  const { t } = useTranslation();
  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: string;
  } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const tableRef = useRef<HTMLTableElement>(null);

  // Get error for specific cell
  const getErrorForCell = useCallback(
    (rowIndex: number, column: string): ImportError | undefined => {
      return errors.find(
        (error) => error.row === rowIndex && error.column === column,
      );
    },
    [errors],
  );

  // Get error for specific row
  const getErrorForRow = useCallback(
    (rowIndex: number): ImportError[] => {
      return errors.filter((error) => error.row === rowIndex);
    },
    [errors],
  );

  // Handle cell click to start editing
  const handleCellClick = useCallback(
    (rowIndex: number, column: string, value: string) => {
      setEditingCell({ row: rowIndex, col: column });
      setEditValue(value || "");
    },
    [],
  );

  // Handle cell double click to start editing
  const handleCellDoubleClick = useCallback(
    (rowIndex: number, column: string, value: string) => {
      setEditingCell({ row: rowIndex, col: column });
      setEditValue(value || "");
    },
    [],
  );

  // Handle edit value change
  const handleEditChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setEditValue(e.target.value);
    },
    [],
  );

  // Handle edit completion
  const handleEditComplete = useCallback(() => {
    if (!editingCell) return;

    const { row, col } = editingCell;
    const newData = [...data];

    // Update the cell value
    newData[row] = {
      ...newData[row],
      [col]: editValue,
    };

    onDataChange(newData);
    setEditingCell(null);
    setEditValue("");
  }, [editingCell, editValue, data, onDataChange]);

  // Handle edit cancellation
  const handleEditCancel = useCallback(() => {
    setEditingCell(null);
    setEditValue("");
  }, []);

  // Handle key press in edit mode
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleEditComplete();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleEditCancel();
      }
    },
    [handleEditComplete, handleEditCancel],
  );

  // Handle blur to complete edit
  const handleBlur = useCallback(() => {
    // Small delay to allow for click events
    setTimeout(() => {
      if (editingCell) {
        handleEditComplete();
      }
    }, 100);
  }, [editingCell, handleEditComplete]);

  // Add new row
  const handleAddRow = useCallback(() => {
    if (data.length >= maxRows) return;

    const newRow = columns.reduce((acc, col) => {
      acc[col.key] = "";
      return acc;
    }, {} as any);

    onDataChange([...data, newRow]);
  }, [data, columns, maxRows, onDataChange]);

  // Remove row
  const handleRemoveRow = useCallback(
    (rowIndex: number) => {
      const newData = data.filter((_, index) => index !== rowIndex);
      onDataChange(newData);
    },
    [data, onDataChange],
  );

  // Thêm vào EditableTable:
  // Bắt sự kiện paste trên từng cell hoặc toàn bảng
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTableElement>) => {
      if (!editingCell) return;
      const clipboardData = e.clipboardData.getData("text");
      if (!clipboardData) return;
      const rows = clipboardData
        .split(/\r?\n/)
        .filter(Boolean)
        .map((row) => row.split(/\t|,/));
      if (rows.length === 0) return;
      const { row: startRow, col: startCol } = editingCell;
      const colIndex = columns.findIndex((c) => c.key === startCol);
      if (colIndex === -1) return;
      let newData = [...data];
      // Thêm dòng nếu cần
      while (newData.length < startRow + rows.length) {
        const newRow = columns.reduce((acc, col) => {
          acc[col.key] = "";
          return acc;
        }, {} as any);
        newData.push(newRow);
      }
      // Ghi đè dữ liệu
      rows.forEach((rowArr, rIdx) => {
        rowArr.forEach((cell, cIdx) => {
          const col = columns[colIndex + cIdx];
          if (col) {
            let cleanCell = cell.trim();
            if (cleanCell.startsWith('"') && cleanCell.endsWith('"')) {
              cleanCell = cleanCell.slice(1, -1);
            }
            newData[startRow + rIdx][col.key] = cleanCell;
          }
        });
      });
      onDataChange(newData);
      setEditingCell(null);
      setEditValue("");
      e.preventDefault();
    },
    [editingCell, columns, data, onDataChange],
  );

  // Render cell content
  const renderCell = useCallback(
    (rowIndex: number, column: string, value: string, columnConfig: any) => {
      const error = getErrorForCell(rowIndex, column);
      const isEditing =
        editingCell?.row === rowIndex && editingCell?.col === column;
      const hasError = !!error;

      const cellClasses = `px-3 py-2 text-sm border ${
        hasError
          ? "bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700"
          : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
      } ${isEditing ? "ring-2 ring-blue-500" : ""}`;

      if (isEditing) {
        if (columnConfig.type === "select" && columnConfig.options) {
          return (
            <select
              value={editValue}
              onChange={handleEditChange}
              onKeyDown={handleKeyPress}
              onBlur={handleBlur}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            >
              <option value="">{t("common.select")}</option>
              {columnConfig.options.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          );
        }

        return (
          <input
            type={
              columnConfig.type === "number"
                ? "number"
                : columnConfig.type === "date"
                  ? "date"
                  : "text"
            }
            value={editValue}
            onChange={handleEditChange}
            onKeyDown={handleKeyPress}
            onBlur={handleBlur}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        );
      }

      return (
        <div
          className={`${cellClasses} cursor-pointer hover:bg-gray-50 min-h-[2rem] flex items-center`}
          onClick={() => handleCellClick(rowIndex, column, value)}
          onDoubleClick={() => handleCellDoubleClick(rowIndex, column, value)}
        >
          {value ||
            (columnConfig.required ? (
              <span className="text-gray-400 italic">
                {t("import.required")}
              </span>
            ) : (
              <span className="text-gray-400">-</span>
            ))}
        </div>
      );
    },
    [
      editingCell,
      editValue,
      getErrorForCell,
      handleEditChange,
      handleKeyPress,
      handleBlur,
      handleCellClick,
      handleCellDoubleClick,
      t,
    ],
  );

  return (
    <div className="space-y-4">
      {/* Table Controls */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {t("import.totalRows")}: {data.length}
          {maxRows && (
            <span className="ml-2 text-gray-400">
              ({t("import.maxRows")}: {maxRows})
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleAddRow}
            disabled={data.length >= maxRows}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("import.addRow")}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table
          ref={tableRef}
          className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
          onPaste={handlePaste}
        >
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {column.label}
                  {column.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </th>
              ))}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                {t("common.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((row, rowIndex) => {
              const rowErrors = getErrorForRow(rowIndex);
              const hasRowError = rowErrors.length > 0;

              return (
                <tr
                  key={rowIndex}
                  className={hasRowError ? "bg-red-50 dark:bg-red-900/30" : ""}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="p-0">
                      {renderCell(
                        rowIndex,
                        column.key,
                        row[column.key] || "",
                        column,
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-sm">
                    <button
                      onClick={() => handleRemoveRow(rowIndex)}
                      className="text-red-600 hover:text-red-800"
                      title={t("import.removeRow")}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Error Summary */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">
            {t("import.validationErrors")} ({errors.length})
          </h4>
          <div className="text-sm text-red-700 space-y-1">
            {errors.slice(0, 5).map((error, index) => (
              <div key={index}>
                {t("import.row")} {error.row + 1}, {t("import.column")}{" "}
                {error.column}: {error.message}
              </div>
            ))}
            {errors.length > 5 && (
              <div className="text-red-600">
                {t("import.andMore", { count: errors.length - 5 })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="font-medium text-blue-800 mb-1">
          {t("import.editingInstructions")}
        </p>
        <ul className="text-blue-700 space-y-1">
          <li>• {t("import.clickToEdit")}</li>
          <li>• {t("import.enterToSave")}</li>
          <li>• {t("import.escapeToCancel")}</li>
          <li>• {t("import.requiredFields")}</li>
        </ul>
      </div>
    </div>
  );
};

export default EditableTable;
