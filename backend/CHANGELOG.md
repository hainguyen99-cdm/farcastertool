# Changelog

## [Unreleased] - 2024-01-20

### Changed
- **CREATE_RECORD_GAME Action**: Modified to handle array responses from the API
  - Now processes each record individually instead of saving the entire response as one record
  - Returns the list of records directly instead of wrapping them in an object
  - Added bulk creation method for better performance when handling multiple records
  - Each record is now saved as a separate GameRecord with UNUSED status

### Added
- **GameRecordService.createUnusedBulk()**: New method for bulk creation of game records
- Better handling of both single record and array responses from the API

### Technical Details
- The action now checks if the API response contains a `data` array or is a single object
- Each record is logged individually in the logging service
- Game records are created in bulk for better database performance
- The response format now matches the expected structure: `{ "status": true, "statusCode": 200, "message": "Success", "data": [...] }`
