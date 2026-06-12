# ADR 009: CSV-Only Import/Export Format

## Status
Accepted

## Context
Import/export functionality needed for data entry and reporting. Need to decide on file formats.

Options considered:
1. CSV only
2. Excel only (.xlsx)
3. JSON only
4. Multiple formats (CSV + Excel + JSON)
5. Custom binary format

## Decision
Support CSV as primary format with potential for Excel in future.

## Rationale

### Why CSV

**Simplicity:**
- **Universal Format:** Supported by all spreadsheet applications
- **Human-Readable:** Can be edited in text editors
- **Lightweight:** Small file size
- **No Dependencies:** No external libraries required for basic parsing

**Compatibility:**
- **Excel Support:** Opens natively in Excel
- **Google Sheets:** Direct import
- **Database Tools:** Easy database import/export
- **Legacy Systems:** Wide compatibility

**Implementation:**
- **Simple Parsing:** Easy to parse in JavaScript
- **Error Handling:** Line-by-line error detection
- **Validation:** Easy to validate row-by-row
- **Template Generation:** Simple to create templates

### Why Not Other Formats

**Excel (.xlsx):**
- Requires external libraries (xlsx, sheetjs)
- Binary format (not human-readable)
- Larger file size
- More complex parsing and error handling

**JSON:**
- Not spreadsheet-friendly
- Requires technical knowledge to edit
- Less familiar to business users
- Harder to validate visually

**Multiple Formats:**
- Increased complexity
- More maintenance overhead
- Confusing for users
- Testing burden

### Future Considerations
- Can add Excel support using libraries if needed
- JSON export for API integration
- PDF export for reporting

## Consequences

### Positive
- Simple implementation
- Universal compatibility
- Easy template generation
- Good error handling
- Small file sizes

### Negative
- Limited data types (everything is text)
- No formatting preservation
- No multi-sheet support
- No formulas or calculations

### Mitigation
- Use type conversion in parsing
- Document expected formats
- Provide clear templates
- Add validation for data types

## Implementation

### CSV Export
```typescript
async exportProductsToCSV(): Promise<string> {
  const headers = ['Business Code', 'Name', 'Category', ...];
  const rows = products.map(p => [
    p.businessCode,
    p.name,
    p.category,
    ...
  ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
```

### CSV Import
```typescript
async importProductsFromCSV(csvContent: string): Promise<ImportResult> {
  const rows = csvContent.split('\n');
  const headers = rows[0].split(',');
  const data = rows.slice(1).map(row => {
    const values = row.split(',');
    return parseRow(headers, values);
  });
  
  return validateAndInsert(data);
}
```

### Template Generation
```typescript
const generateTemplate = (): string => {
  return 'Business Code,Name,Category,Input Quantity,Output Quantity,...\n' +
         'PROD001,Sample Product,BEVERAGE,1,1,...';
};
```

## Alternatives Considered
- **Excel Only:** Rejected due to complexity
- **JSON Only:** Rejected due to poor UX
- **Multiple Formats:** Rejected due to overhead
- **Binary Format:** Rejected due to compatibility

## References
- CSV Specification: https://tools.ietf.org/html/rfc4180
