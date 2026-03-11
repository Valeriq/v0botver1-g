import { describe, it, expect } from '@jest/globals'
import { parseGoogleSheetsHTML, detectColumns } from '../lib/sheets-parser'

// Sample Google Sheets HTML (simplified structure)
const SAMPLE_SHEETS_HTML = `
<!DOCTYPE html>
<html>
<head><title>Test Sheet</title></head>
<body>
<table class="waffle">
  <tr>
    <th>Email</th>
    <th>Name</th>
    <th>Company</th>
    <th>Position</th>
  </tr>
  <tr>
    <td>john@example.com</td>
    <td>John Doe</td>
    <td>Acme Inc</td>
    <td>Developer</td>
  </tr>
  <tr>
    <td>jane@example.com</td>
    <td>Jane Smith</td>
    <td>Tech Corp</td>
    <td>Manager</td>
  </tr>
  <tr>
    <td>bob@test.org</td>
    <td>Bob Wilson</td>
    <td>Startup XYZ</td>
    <td>CEO</td>
  </tr>
</table>
</body>
</html>
`

// HTML with empty rows
const HTML_WITH_EMPTY_ROWS = `
<!DOCTYPE html>
<html>
<body>
<table class="waffle">
  <tr><th>Email</th><th>Name</th></tr>
  <tr><td>test@example.com</td><td>Test</td></tr>
  <tr><td>   </td><td>   </td></tr>
  <tr><td>another@test.org</td><td>Another</td></tr>
</table>
</body>
</html>
`

// HTML without email header - need to detect by data
const HTML_WITHOUT_EMAIL_HEADER = `
<!DOCTYPE html>
<html>
<body>
<table id="sheet-0">
  <tr>
    <th>Col1</th>
    <th>Col2</th>
    <th>Col3</th>
  </tr>
  <tr>
    <td>john@example.com</td>
    <td>John</td>
    <td>Acme</td>
  </tr>
  <tr>
    <td>jane@test.org</td>
    <td>Jane</td>
    <td>Tech</td>
  </tr>
</table>
</body>
</html>
`

// Empty table
const EMPTY_TABLE_HTML = `
<!DOCTYPE html>
<html>
<body>
<table class="waffle">
  <tr>
    <th>Email</th>
    <th>Name</th>
  </tr>
</table>
</body>
</html>
`

// No table
const NO_TABLE_HTML = `
<!DOCTYPE html>
<html>
<body>
<p>No table here</p>
</body>
</html>
`

describe('parseGoogleSheetsHTML', () => {
  it('should parse HTML table and return array of rows', () => {
    const result = parseGoogleSheetsHTML(SAMPLE_SHEETS_HTML)
    
    expect(result.headers).toEqual(['Email', 'Name', 'Company', 'Position'])
    expect(result.rows).toHaveLength(3)
    expect(result.rows[0]).toEqual({
      Email: 'john@example.com',
      Name: 'John Doe',
      Company: 'Acme Inc',
      Position: 'Developer',
    })
  })

  it('should detect email column from header', () => {
    const result = parseGoogleSheetsHTML(SAMPLE_SHEETS_HTML)
    
    expect(result.detectedMapping.email).toBe('Email')
    expect(result.detectedMapping.name).toBe('Name')
    expect(result.detectedMapping.company).toBe('Company')
  })

  it('should detect email column from data when header not found', () => {
    const result = parseGoogleSheetsHTML(HTML_WITHOUT_EMAIL_HEADER)
    
    expect(result.detectedMapping.email).toBe('Col1')
  })

  it('should handle empty table', () => {
    const result = parseGoogleSheetsHTML(EMPTY_TABLE_HTML)
    
    expect(result.headers).toEqual(['Email', 'Name'])
    expect(result.rows).toHaveLength(0)
  })

  it('should handle missing table', () => {
    const result = parseGoogleSheetsHTML(NO_TABLE_HTML)
    
    expect(result.headers).toHaveLength(0)
    expect(result.rows).toHaveLength(0)
  })

  it('should skip completely empty rows', () => {
    const result = parseGoogleSheetsHTML(HTML_WITH_EMPTY_ROWS)
    
    // Should have 2 rows, the whitespace-only row should be skipped
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0].Email).toBe('test@example.com')
    expect(result.rows[1].Email).toBe('another@test.org')
  })
})

describe('detectColumns', () => {
  it('should detect email, name, company, position columns', () => {
    const headers = ['email', 'Full Name', 'COMPANY', 'Job Title']
    const sampleRows = [{ email: 'test@test.com', 'Full Name': 'Test', COMPANY: 'TestCo', 'Job Title': 'Dev' }]
    
    const mapping = detectColumns(headers, sampleRows)
    
    expect(mapping.email).toBe('email')
    expect(mapping.name).toBe('Full Name')
    expect(mapping.company).toBe('COMPANY')
    expect(mapping.position).toBe('Job Title')
  })

  it('should detect Russian column names', () => {
    const headers = ['Почта', 'Имя', 'Компания', 'Должность']
    const sampleRows = [{ 'Почта': 'test@test.com', 'Имя': 'Тест', 'Компания': 'Тест', 'Должность': 'Разработчик' }]
    
    const mapping = detectColumns(headers, sampleRows)
    
    expect(mapping.email).toBe('Почта')
    expect(mapping.name).toBe('Имя')
    expect(mapping.company).toBe('Компания')
    expect(mapping.position).toBe('Должность')
  })

  it('should detect email by data pattern when header not matched', () => {
    const headers = ['Contact', 'Name']
    const sampleRows = [
      { Contact: 'john@example.com', Name: 'John' },
      { Contact: 'jane@test.org', Name: 'Jane' },
    ]
    
    const mapping = detectColumns(headers, sampleRows)
    
    expect(mapping.email).toBe('Contact')
  })

  it('should return empty mapping for unrecognized columns', () => {
    const headers = ['A', 'B', 'C']
    const sampleRows = [{ A: 'x', B: 'y', C: 'z' }]
    
    const mapping = detectColumns(headers, sampleRows)
    
    expect(mapping.email).toBeUndefined()
    expect(mapping.name).toBeUndefined()
  })
})
