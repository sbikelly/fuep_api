# Candidate Batch Upload Templates

This directory contains CSV templates for batch uploading candidates to the system. The API accepts both CSV and Excel files (.xlsx, .xls) in base64 format.

## Template Files

### UTME Template (`utme_template.csv`)

The UTME template contains the following columns:

- `JAMB NO` - JAMB registration number (required)
- `SURNAME` - Surname (required)
- `FIRST NAME` - First name (required)
- `OTHER NAME` - Other names (optional)
- `STATE` - State of origin (optional)
- `LGA` - Local Government Area (optional)
- `GENDER` - Gender: Male, Female (optional)
- `DEPARTMENT` - Department name (optional)
- `MODE OF ENTRY` - Entry mode (optional, defaults to 'UTME')
- `JAMB SCORE` - Total JAMB score (optional, for UTME candidates)
- `SUBJECT 1` - First subject name (optional)
- `SCORE 1` - First subject score (optional)
- `SUBJECT 2` - Second subject name (optional)
- `SCORE 2` - Second subject score (optional)
- `SUBJECT 3` - Third subject name (optional)
- `SCORE 3` - Third subject score (optional)
- `SUBJECT 4` - Fourth subject name (optional)
- `SCORE 4` - Fourth subject score (optional)

### DE Template (`de_template.csv`)

The DE template contains the same columns as the UTME template, but with:

- `MODE OF ENTRY` - Entry mode (optional, defaults to 'Direct Entry')
- `JAMB SCORE` - Usually empty for DE candidates
- Subject scores are typically not applicable for DE candidates

## Usage

1. Download the appropriate template for your candidate type
2. Fill in the candidate information
3. Save as CSV file (.csv) or Excel file (.xls/.xlsx)
4. Use the batch upload API endpoint: `POST /api/admin/batch-upload/upload`
5. Send the file as base64 encoded data in the request body

## API Endpoint

```
POST /api/admin/batch-upload/upload
Content-Type: application/json

{
  "fileData": "base64_encoded_file_content",
  "fileName": "candidates.csv"
}
```

## Notes

- **No passwords are created during batch upload** - passwords are created when candidates initiate registration
- The system creates candidates with `password_hash` set to `null` initially
- Existing candidates will be updated with new information
- All candidates will have `is_first_login` set to `true` initially
- The system supports both creation and updates in a single batch upload
- JAMB scores and subject scores are stored for UTME candidates
- DE candidates typically don't have JAMB scores
- **Registration Flow**: Admin uploads candidates → Candidate enters JAMB number → System creates password and sends email → Candidate completes registration

## Usage

1. Download the appropriate template for your candidate type
2. Fill in the candidate information
3. Save as Excel file (.xls or .xlsx)
4. Use the batch upload API endpoint: `POST /api/admin/batch-upload/upload`
5. Send the file as base64 encoded data in the request body

## API Endpoint

```
POST /api/admin/batch-upload/upload
Content-Type: application/json

{
  "fileData": "base64_encoded_excel_file",
  "fileName": "candidates.xls"
}
```

## Notes

- The system will automatically generate temporary passwords for new candidates
- Temporary passwords will be sent to candidate emails if provided
- Existing candidates will be updated with new information
- All candidates will have `is_first_login` set to `true` initially
- The system supports both creation and updates in a single batch upload
