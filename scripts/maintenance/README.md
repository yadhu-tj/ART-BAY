# Maintenance & Debug Scripts

This directory contains various scripts used for debugging, testing, and fixing specific issues in the application. They have been moved here from the root directory to keep the project clean.

## Contents

### Debugging & Diagnosis
- `debug_*.py`: Scripts to debug API endpoints, database connections, and OTP logic.
- `diagnose_*.py`: Tools to diagnose data issues (e.g., artist table, direct DB checks).
- `diag.txt`: Output log from previous diagnostic runs.

### Fixes & One-time Setup
- `fix_*.py`: Scripts run to patch data or services (e.g., fixing artist data, OTP service structure).
- `check_user.py`, `verify_json_serialization.py`: Utilities to verify data integrity.
- `create_otp_table.py`, `setup_email.py`: Setup scripts for specific features.

### Testing
- `test_*.py`: Standalone test scripts.
- `test_signup_frontend.html`: A standalone HTML file for testing signup forms in isolation.

### Documentation
- `OTP_*.md`, `QUICK_FIX.md`: Instructions related to specific fixes applied previously.

## Usage
You can run these scripts from the root directory by referencing their new path:
```bash
python scripts/maintenance/debug_db.py
```
Or by navigating into this folder (though some imports might need adjustment if they rely on running from root).
