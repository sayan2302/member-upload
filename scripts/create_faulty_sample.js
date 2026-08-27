import ExcelJS from 'exceljs';
import path from 'path';

async function createFaultyExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Enrollment Template');

  const headers = [
    'First Name*',
    'Last Name*',
    'Middle Name',
    'Employee ID / Staff ID*',
    'Date of Birth (DD/MM/YYYY)*',
    'Gender (M/F)*',
    'Marital Status (Single/Married)',
    'Relationship*',
    'Nationality',
    'Country of Residence',
    'Base Monthly Salary',
    'Email Address',
    'Mobile Number',
    'Effective Date (DD/MM/YYYY)',
    'Company Name / Sub Corporate'
  ];

  worksheet.addRow(headers);

  // Row 1: Valid
  worksheet.addRow([
    'John',
    'Doe',
    'A',
    'EMP001',
    '15/05/1990',
    'M',
    'Single',
    'Self',
    'Indian',
    'India',
    '50000',
    'john.doe@example.com',
    '9876543210',
    '01/01/2026',
    'Acme Corp'
  ]);

  // Row 2: Faulty Date & Faulty Salary
  worksheet.addRow([
    'Jane',
    'Smith',
    'B',
    'EMP002',
    '32/13/1995', // Invalid date
    'F',
    'Married',
    'Spouse',
    'Indian',
    'India',
    'INVALID_SALARY', // Invalid salary
    'jane.smith@example.com',
    '9876543211',
    '99/99/2026', // Invalid date
    'Acme Corp'
  ]);

  // Row 3: Missing Last Name & Faulty Gender
  worksheet.addRow([
    'Robert',
    '', // Missing last name
    'C',
    'EMP003',
    '20/10/1988',
    'UNKNOWN_GENDER', // Invalid gender
    'Single',
    'Child',
    'Indian',
    'India',
    '30000',
    'robert@example.com',
    '9876543212',
    '01/01/2026',
    'Acme Corp'
  ]);

  const filePath = path.resolve('scripts/sample_faulty_upload.xlsx');
  await workbook.xlsx.writeFile(filePath);
  console.log(`✔ Created sample faulty Excel file at ${filePath}`);
}

createFaultyExcel();
