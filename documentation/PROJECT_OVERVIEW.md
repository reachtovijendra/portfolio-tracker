# Stock Tracker - Project Overview

## Purpose

Stock Tracker is a personal finance application designed to help users track their investment goals and compare them against actual portfolio performance. The application provides a clear, visual way to monitor progress toward financial targets.

## Target Users

- Individual investors managing personal portfolios
- Anyone with monthly investment goals
- Users who want to track performance without sharing data with third parties

## Key Features

### Current (Phase 1 - Basic)

1. **Target Income Management**
   - Set monthly investment targets
   - Track expected returns and growth
   - Manage projections over multiple years

2. **Actual Performance Tracking**
   - Record real portfolio values monthly
   - Calculate actual returns and profits
   - Compare against targets

3. **Comparison Analysis**
   - Visual comparison of targets vs actuals
   - Variance calculations
   - Performance status indicators

4. **Data Portability**
   - Export all data to JSON
   - Import data from previous exports
   - LocalStorage for privacy

### Future Phases

**Phase 2 - Standard Features**
- CSV/Excel export
- Advanced filtering
- Print views
- Bulk entry

**Phase 3 - Advanced Features**
- Interactive charts
- Dashboard
- Trend analysis

**Phase 4 - Full Featured**
- Multiple portfolios
- Custom scenarios
- Notes and tags
- Report generation

## Technical Architecture

### Frontend
- **Framework**: Angular 20.x
- **UI Library**: PrimeNG 21.x
- **Styling**: SCSS + PrimeFlex

### Data Storage
- **Primary**: Browser LocalStorage
- **Backup**: JSON export/import

### Component Structure
```
App (Root)
├── Target Income Component
├── Actuals Component
├── Comparison Component
└── Data Management Component
```

### Services
- **StockTrackerService**: Core data management
- **ExportImportService**: Data portability

## Design Principles

1. **Privacy First**: All data stays on user's device
2. **Simplicity**: Clean, intuitive interface
3. **Extensibility**: Built for future enhancements
4. **Responsive**: Works on desktop and tablet
5. **Accessibility**: Follows WCAG guidelines

## Development Status

- ✅ Phase 1: Complete
- ⏳ Phase 2: Planned
- ⏳ Phase 3: Planned
- ⏳ Phase 4: Planned

## Getting Started

See [README.md](../stock-tracker-app/README.md) in the application directory for installation and usage instructions.

