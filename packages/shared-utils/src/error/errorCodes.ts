/**
 * Error codes for standardized error handling across applications
 */

export enum ERROR_CODES {
  // Database errors
  DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR = 'DB_QUERY_ERROR',
  DB_CONSTRAINT_ERROR = 'DB_CONSTRAINT_ERROR',
  DB_TIMEOUT_ERROR = 'DB_TIMEOUT_ERROR',
  
  // Authentication errors
  AUTH_NOT_AUTHENTICATED = 'AUTH_NOT_AUTHENTICATED',
  AUTH_INVALID_TOKEN = 'AUTH_INVALID_TOKEN',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  VALIDATION_INVALID_RANGE = 'VALIDATION_INVALID_RANGE',
  VALIDATION_DUPLICATE_VALUE = 'VALIDATION_DUPLICATE_VALUE',
  
  // Import/Export errors
  IMPORT_FILE_PARSE_ERROR = 'IMPORT_FILE_PARSE_ERROR',
  IMPORT_INVALID_DATA = 'IMPORT_INVALID_DATA',
  IMPORT_VALIDATION_FAILED = 'IMPORT_VALIDATION_FAILED',
  EXPORT_ERROR = 'EXPORT_ERROR',
  
  // Inventory-specific errors
  INVENTORY_PRODUCT_NOT_FOUND = 'INVENTORY_PRODUCT_NOT_FOUND',
  INVENTORY_INSUFFICIENT_STOCK = 'INVENTORY_INSUFFICIENT_STOCK',
  INVENTORY_INVALID_MOVEMENT = 'INVENTORY_INVALID_MOVEMENT',
  
  // Backup/Restore errors
  BACKUP_CREATE_ERROR = 'BACKUP_CREATE_ERROR',
  BACKUP_RESTORE_ERROR = 'BACKUP_RESTORE_ERROR',
  BACKUP_CONFLICT = 'BACKUP_CONFLICT',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * User-friendly error messages for each error code
 */
export const ERROR_MESSAGES: Record<ERROR_CODES, string> = {
  [ERROR_CODES.DB_CONNECTION_ERROR]: 'Unable to connect to the database. Please check your connection.',
  [ERROR_CODES.DB_QUERY_ERROR]: 'An error occurred while executing a database query.',
  [ERROR_CODES.DB_CONSTRAINT_ERROR]: 'The operation violates a database constraint.',
  [ERROR_CODES.DB_TIMEOUT_ERROR]: 'The database operation timed out. Please try again.',
  
  [ERROR_CODES.AUTH_NOT_AUTHENTICATED]: 'You must be logged in to perform this action.',
  [ERROR_CODES.AUTH_INVALID_TOKEN]: 'Your authentication token is invalid.',
  [ERROR_CODES.AUTH_TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
  [ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS]: 'You do not have permission to perform this action.',
  
  [ERROR_CODES.VALIDATION_REQUIRED_FIELD]: 'A required field is missing.',
  [ERROR_CODES.VALIDATION_INVALID_FORMAT]: 'The data format is invalid.',
  [ERROR_CODES.VALIDATION_INVALID_RANGE]: 'The value is outside the allowed range.',
  [ERROR_CODES.VALIDATION_DUPLICATE_VALUE]: 'This value already exists and must be unique.',
  
  [ERROR_CODES.IMPORT_FILE_PARSE_ERROR]: 'Unable to parse the import file. Please check the file format.',
  [ERROR_CODES.IMPORT_INVALID_DATA]: 'The import file contains invalid data.',
  [ERROR_CODES.IMPORT_VALIDATION_FAILED]: 'The import data failed validation.',
  [ERROR_CODES.EXPORT_ERROR]: 'An error occurred while exporting data.',
  
  [ERROR_CODES.INVENTORY_PRODUCT_NOT_FOUND]: 'The specified product was not found.',
  [ERROR_CODES.INVENTORY_INSUFFICIENT_STOCK]: 'There is not enough stock available.',
  [ERROR_CODES.INVENTORY_INVALID_MOVEMENT]: 'The inventory movement is invalid.',
  
  [ERROR_CODES.BACKUP_CREATE_ERROR]: 'An error occurred while creating the backup.',
  [ERROR_CODES.BACKUP_RESTORE_ERROR]: 'An error occurred while restoring the backup.',
  [ERROR_CODES.BACKUP_CONFLICT]: 'The backup conflicts with existing data.',
  
  [ERROR_CODES.NETWORK_ERROR]: 'A network error occurred. Please check your connection.',
  [ERROR_CODES.NETWORK_TIMEOUT]: 'The request timed out. Please try again.',
  
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unknown error occurred.',
  [ERROR_CODES.INTERNAL_ERROR]: 'An internal error occurred. Please contact support.',
};
