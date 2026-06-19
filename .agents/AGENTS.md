# Custom Project Rules for Money Manager

## Critical Data Integrity Rules

1. **Do NOT Delete or Reset User Data**:
   - Under no circumstances should code updates, backend database migrations, seeding logic, or test scripts perform `DELETE` or `TRUNCATE` operations on actual user transactional data (such as expenses, incomes, friend transactions, etc.).
   - Database cleanup logic or scripts must never target active user accounts.

2. **Strict User Data Isolation**:
   - Every user must only see their own transactions. 
   - Never run scripts that mix user IDs or transfer transaction ownership between developer accounts and regular users.
   - All automated test runs must operate on isolated, temporary mock user accounts (e.g., `integration_flow_test@gmail.com`) and cleanup only those mock accounts.
