# File Validation System Documentation

Complete documentation for the IDE's file validation and type checking system.

---

## Overview

The file validation system provides type-safe file handling with runtime validation for all imported files. It ensures files meet specific criteria before being processed by the IDE.

## Supported File Types

### Text Files (`.txt`, `.md`, `.log`)
- **Size Limit**: 10 MB
- **Validation**: UTF-8 encoding, no binary data
- **Use Cases**: Documentation, logs, notes

### Code Files
- **JavaScript/TypeScript**: `.js`, `.ts`, `.jsx`, `.tsx`
- **Python**: `.py`
- **Java**: `.java`
- **C/C++**: `.c`, `.cpp`, `.h`
- **Go**: `.go`
- **Rust**: `.rs`
- **PHP**: `.php`
- **Size Limit**: 5 MB
- **Validation**: Text content, syntax checking (future)

### Web Files (`.html`, `.css`, `.scss`, `.less`)
- **Size Limit**: 5 MB
- **Validation**: Text content

### Configuration Files
- **JSON**: `.json`
  - **Validation**: Valid JSON syntax
  - **Error**: `INVALID_JSON` if parsing fails
- **YAML**: `.yaml`, `.yml`
  - **Validation**: No tabs (spaces only)
  - **Error**: `INVALID_YAML` if tabs found
- **XML**: `.xml`
- **Environment**: `.env`, `.toml`
- **Size Limit**: 1 MB

### Data Files
- **CSV**: `.csv`
  - **Validation**: Consistent column count across rows
  - **Error**: `INVALID_CSV` if structure is invalid
- **TSV**: `.tsv`
- **Size Limit**: 50 MB

### Image Files (`.jpg`, `.png`, `.gif`, `.svg`, `.webp`)
- **Size Limit**: 10 MB
- **Validation**: Binary format accepted

### Binary Files (`.pdf`, `.zip`, `.tar`, `.gz`)
- **Size Limit**: 100 MB
- **Validation**: Binary format accepted

---

## Validation Process

### 1. Extension Validation
Checks if the file extension is in the supported list.

```typescript
// Validation fails for .xyz files
Error: INVALID_EXTENSION
Message: "Unsupported file extension: .xyz"
```

### 2. Size Validation
Ensures file doesn't exceed category-specific size limits.

```typescript
// 6 MB JavaScript file (code limit: 5 MB)
Error: FILE_TOO_LARGE
Message: "File exceeds size limit of 5.00 MB"
```

### 3. Content Validation
Checks file content structure based on type.

#### JSON Validation
```typescript
// Invalid: malformed JSON
{ invalid json }

// Valid
{"name": "test", "value": 123}
```

#### CSV Validation
```typescript
// Invalid: inconsistent columns
name,age,city
John,30      // Missing column
Jane,25,LA

// Valid
name,age,city
John,30,NYC
Jane,25,LA
```

#### YAML Validation
```typescript
// Invalid: contains tabs
key:
    value  // Tab character

// Valid
key:
  value    // Spaces
```

### 4. Binary Detection
Prevents binary files from being imported as text.

```typescript
// Binary content in .txt file
Error: BINARY_AS_TEXT
Message: "File appears to contain binary data"
```

---

## Usage Examples

### Basic File Validation

```typescript
import { validateFile } from '@/lib/validation/file-validator'

const file = new File(['content'], 'test.js')
const result = await validateFile(file)

if (result.success) {
  console.log('File is valid:', result.data.name)
  console.log('Category:', result.data.category)
  console.log('Size:', result.data.size)
} else {
  console.error('Validation failed:', result.errors)
  result.errors.forEach(error => {
    console.log(`${error.code}: ${error.message}`)
  })
}
```

### Batch Validation

```typescript
import { validateFiles, getValidationSummary } from '@/lib/validation/file-validator'

const files = [file1, file2, file3]
const results = await validateFiles(files)
const summary = getValidationSummary(results)

console.log(`Total: ${summary.total}`)
console.log(`Valid: ${summary.valid}`)
console.log(`Invalid: ${summary.invalid}`)

// Process only valid files
const validFiles = results
  .filter(r => r.success)
  .map(r => r.data)
```

### Type Guards

```typescript
import { isValidatedFile, isTextFile } from '@/lib/validation/file-types'

if (isValidatedFile(file)) {
  // TypeScript knows 'file' is ValidatedFile
  console.log(file.name)
  console.log(file.metadata?.lineCount)
}

if (isTextFile(file.category)) {
  // Handle as text file
  const content = file.content as string
}
```

### Custom Error Handling

```typescript
const result = await validateFile(file)

if (!result.success) {
  result.errors.forEach(error => {
    switch (error.code) {
      case 'INVALID_EXTENSION':
        showError('Unsupported file type')
        break
      case 'FILE_TOO_LARGE':
        showError(`File too large. Max: ${error.details.limit} bytes`)
        break
      case 'INVALID_JSON':
        showError('Invalid JSON syntax')
        break
      default:
        showError(error.message)
    }
  })
}
```

---

## TypeScript Types

### ValidatedFile
```typescript
interface ValidatedFile {
  name: string           // File name
  path: string           // Full path
  content: string | ArrayBuffer  // File content
  size: number           // Size in bytes
  extension: string      // e.g., ".js"
  category: FileCategory // e.g., "code"
  mimeType: string       // e.g., "application/javascript"
  encoding?: string      // e.g., "utf-8"
  metadata?: FileMetadata
  isValid: true          // Always true for validated files
}
```

### ValidationError
```typescript
interface ValidationError {
  code: ValidationErrorCode  // Error type
  message: string            // Human-readable message
  field?: string             // Field that failed
  details?: unknown          // Additional context
}
```

### Error Codes
- `INVALID_EXTENSION` - Unsupported file extension
- `FILE_TOO_LARGE` - Exceeds size limit
- `INVALID_CONTENT` - Cannot read content
- `INVALID_JSON` - Malformed JSON
- `INVALID_CSV` - Invalid CSV structure
- `INVALID_YAML` - Invalid YAML syntax
- `UNSUPPORTED_TYPE` - File type not supported
- `EMPTY_FILE` - File has no content
- `BINARY_AS_TEXT` - Binary data in text file

---

## Integration with IDE

### Drag & Drop Handler

```typescript
import { validateFile } from '@/lib/validation/file-validator'

dragDropHandler.onFilesDropped(async (droppedFiles) => {
  for (const file of droppedFiles) {
    const result = await validateFile(file)
    
    if (result.success) {
      // Add to IDE
      addFileToEditor(result.data)
    } else {
      // Show errors
      toast.error(`${file.name}: ${result.errors[0].message}`)
    }
  }
})
```

### File System Access

```typescript
const handle = await window.showOpenFilePicker()
const file = await handle.getFile()
const result = await validateFile(file)

if (result.success) {
  openInEditor(result.data)
} else {
  showValidationErrors(result.errors)
}
```

---

## Testing

### Run Tests

```bash
npm test -- file-validator.test.ts
```

### Test Coverage

- ✅ Extension validation (supported/unsupported)
- ✅ Size limit enforcement
- ✅ JSON syntax validation
- ✅ CSV structure validation
- ✅ YAML tab detection
- ✅ Binary data detection
- ✅ Empty file rejection
- ✅ Batch validation
- ✅ Error message accuracy
- ✅ Type guard functionality

---

## Best Practices

### 1. Always Validate Before Processing
```typescript
// Good
const result = await validateFile(file)
if (result.success) {
  processFile(result.data)
}

// Bad
processFile(file) // No validation!
```

### 2. Handle All Error Cases
```typescript
if (!result.success) {
  result.errors.forEach(error => {
    // Log for debugging
    console.error(error)
    
    // Show user-friendly message
    showError(getFriendlyMessage(error.code))
  })
}
```

### 3. Use Type Guards
```typescript
if (isValidatedFile(file) && isTextFile(file.category)) {
  // TypeScript knows this is safe
  const lines = (file.content as string).split('\n')
}
```

### 4. Batch Process When Possible
```typescript
// More efficient than validating one by one
const results = await validateFiles(allFiles)
```

---

## Performance Considerations

- **Lazy Validation**: Files validated only when imported
- **Streaming**: Large files read in chunks (future)
- **Worker Threads**: Heavy validation in background (planned)
- **Caching**: Validation results cached (future)

---

## Future Enhancements

- [ ] Syntax validation for code files
- [ ] Virus scanning for uploads
- [ ] Custom validation rules
- [ ] Streaming validation for large files
- [ ] Background worker validation
- [ ] Content sanitization
- [ ] UTF-16/32 encoding support

---

## Troubleshooting

### File Rejected Despite Valid Content

**Issue**: Valid file rejected with `INVALID_EXTENSION`

**Solution**: Check if extension is in supported list. Add to configuration if needed.

### Size Limit Too Restrictive

**Issue**: Legitimate files exceeding size limit

**Solution**: Limits are configurable in `file-types.ts`:

```typescript
export const FILE_SIZE_LIMITS = {
  CODE_FILE: 10 * 1024 * 1024,  // Increase to 10 MB
  // ...
}
```

### False Positive Binary Detection

**Issue**: Text file flagged as binary

**Solution**: Check for null bytes or unusual control characters. File may actually contain binary data.

---

## API Reference

### Functions

```typescript
// Validate single file
validateFile(file: File): Promise<ValidationResult<ValidatedFile>>

// Validate multiple files
validateFiles(files: File[]): Promise<ValidationResult<ValidatedFile>[]>

// Get summary of validation results
getValidationSummary(
  results: ValidationResult<ValidatedFile>[]
): ValidationSummary

// Type guards
isValidatedFile(file: unknown): file is ValidatedFile
isTextFile(category: FileCategory): boolean
isBinaryFile(category: FileCategory): boolean

// Utility functions
getFileCategory(extension: string): FileCategory
getSizeLimit(category: FileCategory): number
getMimeType(extension: string): string
formatFileSize(bytes: number): string
isSupportedExtension(extension: string): boolean
```

---

**Last Updated**: 2025-12-09  
**Version**: 1.0.0  
**Maintainer**: CodeSync IDE Team
