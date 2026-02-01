# Changelog

All notable changes to the Stock Tracker project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial Angular 20 project setup with PrimeNG 21 UI library
- Target Income component for managing investment projections
  - Editable table with all financial columns
  - Add, edit, and delete functionality
  - Sample data loading feature
- Actuals component for tracking real portfolio performance
  - Monthly entry capability
  - Automatic return percentage and profit calculations
  - Visual indicators for positive/negative performance
- Comparison component showing Target vs Actual variance
  - Side-by-side comparison table
  - Variance calculations in absolute and percentage terms
  - Summary statistics cards showing performance overview
  - Status indicators (Ahead, Behind, On Track)
- Data Management component for import/export
  - Export data to JSON format
  - Import data from JSON format
  - Data validation on import
- LocalStorage persistence for all data
  - Automatic save on every change
  - Data versioning for future migrations
- Responsive navigation with routing
  - Clean header with navigation menu
  - Mobile-friendly responsive design
- TypeScript models and interfaces
  - TargetEntry model
  - ActualEntry model
  - ExportData model
- Services architecture
  - StockTrackerService for data management and calculations
  - ExportImportService for data portability
- Professional styling with PrimeNG components
  - Custom theme colors and variables
  - Consistent spacing and layout
  - Accessibility considerations

### Changed
- Updated Angular budgets to accommodate PrimeNG library size

### Fixed
- PrimeNG 21 compatibility issues with theme loading
- Type definitions for PrimeNG Tag severity property
- Angular animations module integration

## [1.0.0] - 2026-01-03

### Added
- Initial release of Stock Tracker application
- Basic Phase 1 features complete
- Documentation and README

