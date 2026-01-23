# Data Migration Rules & Standards

## 🎯 Core Rules

### 1. **User Experience Rules**

#### R1.1: Familiar Interface Principle
- ✅ **DO**: Giữ nguyên trải nghiệm Excel/Google Sheets
- ✅ **DO**: Hỗ trợ keyboard shortcuts (Tab, Enter, Ctrl+C/V)
- ❌ **DON'T**: Thay đổi workflow quen thuộc của user
- ❌ **DON'T**: Bắt buộc user học interface mới

#### R1.2: Progressive Enhancement
- ✅ **DO**: Giới thiệu tính năng mới từ từ
- ✅ **DO**: Cung cấp fallback options
- ❌ **DON'T**: Shock user với quá nhiều tính năng mới
- ❌ **DON'T**: Remove legacy features đột ngột

#### R1.3: Zero Learning Curve
- ✅ **DO**: User có thể sử dụng ngay lập tức
- ✅ **DO**: Cung cấp tooltips và guided tours
- ❌ **DON'T**: Yêu cầu training phức tạp
- ❌ **DON'T**: Hide essential features

### 2. **Technical Rules**

#### R2.1: Type Safety
```typescript
// ✅ DO: Always use strict TypeScript
interface MigrationData {
  source: DataSource;
  records: Record<string, unknown>[];
  validation: ValidationResult;
}

// ❌ DON'T: Use any or loose types
const data: any = importData();
```

#### R2.2: Error Handling
```typescript
// ✅ DO: Comprehensive error handling
try {
  const result = await migrationEngine.process(data);
  return { success: true, data: result };
} catch (error) {
  logger.error('Migration failed', { error, data });
  return { success: false, error: error.message };
}

// ❌ DON'T: Silent failures
const result = await migrationEngine.process(data); // No error handling
```

#### R2.3: Performance Standards
- ✅ **DO**: Process 1000 records in <2 seconds
- ✅ **DO**: Use pagination for large datasets
- ✅ **DO**: Implement progress indicators
- ❌ **DON'T**: Block UI during processing
- ❌ **DON'T**: Load entire dataset into memory

### 3. **Data Validation Rules**

#### R3.1: Validation Hierarchy
1. **Client-side**: Immediate feedback
2. **Server-side**: Security & integrity
3. **Database**: Final constraints

#### R3.2: Validation Messages
```typescript
// ✅ DO: User-friendly Vietnamese messages
const validationRules = {
  required: 'Trường này không được để trống',
  email: 'Vui lòng nhập email hợp lệ',
  number: 'Vui lòng nhập số hợp lệ'
};

// ❌ DON'T: Technical error messages
const validationRules = {
  required: 'Field is required',
  email: 'Invalid email format',
  number: 'NaN error'
};
```

#### R3.3: Data Integrity
- ✅ **DO**: Validate before saving
- ✅ **DO**: Provide clear error messages
- ✅ **DO**: Allow partial saves with warnings
- ❌ **DON'T**: Save invalid data
- ❌ **DON'T**: Lose user input on validation errors

### 4. **Component Architecture Rules**

#### R4.1: Shared Components
```typescript
// ✅ DO: Use shared components from @repo/ui
import { EditableDataGrid, ClipboardPasteInput } from '@repo/ui';

// ❌ DON'T: Create duplicate components
import LocalDataGrid from './LocalDataGrid'; // Avoid this
```

#### R4.2: Props Interface
```typescript
// ✅ DO: Well-defined interfaces
interface DataGridProps {
  data: MigrationRecord[];
  columns: ColumnDefinition[];
  onDataChange: (data: MigrationRecord[]) => void;
  validation?: ValidationRule[];
  loading?: boolean;
}

// ❌ DON'T: Loose or missing interfaces
interface DataGridProps {
  [key: string]: any; // Too loose
}
```

#### R4.3: State Management
- ✅ **DO**: Use React hooks for local state
- ✅ **DO**: Use context for shared state
- ✅ **DO**: Implement optimistic updates
- ❌ **DON'T**: Prop drilling beyond 2 levels
- ❌ **DON'T**: Mutate state directly

### 5. **Data Source Rules**

#### R5.1: Source Abstraction
```typescript
// ✅ DO: Implement common interface
interface DataSource {
  connect(): Promise<Connection>;
  extract(): Promise<RawData>;
  validate(schema: ValidationSchema): Promise<ValidationResult>;
  transform(data: RawData): Promise<MigrationData>;
}

// ❌ DON'T: Tight coupling to specific sources
class ExcelOnlyProcessor { } // Too specific
```

#### R5.2: Error Recovery
- ✅ **DO**: Implement retry mechanisms
- ✅ **DO**: Provide rollback capabilities
- ✅ **DO**: Log all operations
- ❌ **DON'T**: Fail silently
- ❌ **DON'T**: Leave partial data

### 6. **Testing Rules**

#### R6.1: Test Coverage
- ✅ **DO**: >90% coverage for migration logic
- ✅ **DO**: Test error scenarios
- ✅ **DO**: Test with real data samples
- ❌ **DON'T**: Skip edge cases
- ❌ **DON'T**: Test only happy paths

#### R6.2: Test Data
```typescript
// ✅ DO: Use realistic test data
const testData = {
  productCode: 'SP001',
  productName: 'Cà phê Arabica',
  quantity: 100,
  date: '2025-08-02'
};

// ❌ DON'T: Use trivial test data
const testData = { a: 1, b: 2 }; // Too simple
```

## 📋 Checklist Templates

### Pre-Development Checklist
- [ ] User story defined with acceptance criteria
- [ ] Technical design reviewed
- [ ] Data schema validated
- [ ] Error scenarios identified
- [ ] Performance requirements set
- [ ] Testing strategy planned

### Code Review Checklist
- [ ] TypeScript strict mode compliance
- [ ] Error handling implemented
- [ ] Performance benchmarks met
- [ ] User experience validated
- [ ] Tests written and passing
- [ ] Documentation updated

### Release Checklist
- [ ] All tests passing
- [ ] Performance metrics verified
- [ ] User acceptance testing completed
- [ ] Documentation updated
- [ ] Migration scripts tested
- [ ] Rollback plan prepared

## 🚨 Common Anti-Patterns

### ❌ Anti-Pattern 1: Data Loss
```typescript
// BAD: Overwriting user data without confirmation
const saveData = (newData) => {
  database.replaceAll(newData); // Dangerous!
};

// GOOD: Merge with confirmation
const saveData = (newData) => {
  const conflicts = detectConflicts(existingData, newData);
  if (conflicts.length > 0) {
    showConflictResolution(conflicts);
  } else {
    database.merge(newData);
  }
};
```

### ❌ Anti-Pattern 2: Poor Error Messages
```typescript
// BAD: Technical error messages
throw new Error('Validation failed at line 42');

// GOOD: User-friendly messages
throw new ValidationError('Dòng 42: Mã sản phẩm không được để trống');
```

### ❌ Anti-Pattern 3: Blocking UI
```typescript
// BAD: Synchronous processing
const processData = (data) => {
  return heavyProcessing(data); // Blocks UI
};

// GOOD: Asynchronous with progress
const processData = async (data, onProgress) => {
  const chunks = chunkData(data);
  for (let i = 0; i < chunks.length; i++) {
    await processChunk(chunks[i]);
    onProgress((i + 1) / chunks.length);
  }
};
```

## 🔧 Development Tools

### Required Tools
- **TypeScript**: v5.0+
- **React**: v18.0+
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier
- **Type Checking**: tsc --noEmit

### Recommended Extensions
- **VS Code**: TypeScript, ESLint, Prettier
- **Browser**: React DevTools, Redux DevTools
- **Testing**: Jest Runner, Coverage Gutters

## 📊 Monitoring & Metrics

### Key Metrics to Track
- **Import Success Rate**: Target >99%
- **Data Accuracy**: Target >99.9%
- **User Adoption**: Target >80%
- **Performance**: Target <2s for 1000 records
- **Error Rate**: Target <1%

### Monitoring Tools
- **Performance**: React Profiler, Lighthouse
- **Errors**: Sentry, LogRocket
- **Analytics**: Google Analytics, Mixpanel
- **User Feedback**: Hotjar, UserVoice

---

**Last Updated**: 2025-08-02  
**Version**: 1.0  
**Next Review**: 2025-08-09
