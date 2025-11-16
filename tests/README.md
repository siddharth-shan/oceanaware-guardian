# Test Organization

This directory contains organized test files for the EcoQuest Wildfire Watch application.

## Directory Structure

### `/development/`
- Development and integration test scripts
- API testing utilities
- Validation scripts
- Demo and sample code

### `/integration/`
- Integration tests for API endpoints
- End-to-end testing scenarios
- Cross-service testing

### `/api/`
- API-specific test files
- Service layer tests
- Data validation tests

### `/__tests__/`
- Jest unit tests
- Component tests
- Utility function tests

## Running Tests

### Development Tests
```bash
# Run specific development tests
node tests/development/test-air-quality-enhanced.js
node tests/development/test-epa-integration.js
```

### Unit Tests
```bash
# Run Jest tests
npm test
```

### Integration Tests
```bash
# Run integration test suite
npm run test:integration
```

## Test Files Moved from Root

The following files were moved from the root directory to organize the project structure:

- `test-*.js` → `tests/development/`
- `demo-*.js` → `tests/development/`
- Sample and validation scripts → `tests/development/`
- Log files → `temp/`
- Sample data files → `temp/samples/`

## Adding New Tests

When adding new tests:
1. Place unit tests in `__tests__/` directory
2. Place integration tests in `integration/` directory  
3. Place development/debugging scripts in `development/` directory
4. Follow the existing naming conventions