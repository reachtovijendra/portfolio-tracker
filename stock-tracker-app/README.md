# Stock Tracker Application

A modern Angular application for tracking investment targets and actual portfolio performance with PrimeNG components.

## Features

### Phase 1 - Basic Implementation (Current)

- **Target Income Management**: Create and manage target projections with editable tables
- **Actuals Tracking**: Record actual portfolio performance monthly
- **Comparison View**: Compare targets vs actuals with variance analysis
- **Data Management**: Export/Import data as JSON for backup and portability
- **LocalStorage Persistence**: All data stored locally in your browser
- **Sample Data**: Load pre-populated sample data to get started quickly

## Technology Stack

- **Framework**: Angular 20.x
- **UI Library**: PrimeNG 21.x
- **Icons**: PrimeIcons
- **Styling**: PrimeFlex + SCSS
- **Storage**: LocalStorage API

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation

1. Clone or navigate to the project directory:

```bash
cd stock-tracker-app
```

2. Install dependencies:

```bash
npm install --legacy-peer-deps
```

Note: The `--legacy-peer-deps` flag is needed due to Angular 20.x compatibility with PrimeNG.

### Development Server

Run the development server:

```bash
npm start
```

or

```bash
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Application Structure

```
src/
├── app/
│   ├── components/
│   │   ├── target-income/       # Target projections management
│   │   ├── actuals/             # Actual performance tracking
│   │   ├── comparison/          # Target vs Actual comparison
│   │   └── data-management/     # Export/Import functionality
│   ├── models/
│   │   ├── target-entry.model.ts
│   │   ├── actual-entry.model.ts
│   │   └── export-data.model.ts
│   ├── services/
│   │   ├── stock-tracker.service.ts
│   │   └── export-import.service.ts
│   ├── app.ts                   # Main app component
│   ├── app.routes.ts            # Routing configuration
│   └── app.config.ts            # App configuration
├── styles.scss                  # Global styles
└── index.html
```

## Usage Guide

### Target Income

1. Navigate to the "Target Income" section
2. Click "Load Sample Data" to populate with example data, or "Add Row" to create entries manually
3. Edit any row by clicking the pencil icon
4. Save changes with the checkmark or cancel with the X icon
5. Delete rows using the trash icon

### Actuals

1. Navigate to the "Actuals" section
2. Click "Add Entry" to create a new monthly entry
3. Fill in your actual portfolio values:
   - Year and Month
   - Investment amount
   - Amount added
   - Principal
   - Total Investment
   - Total portfolio value
4. Return % and Profit are automatically calculated

### Comparison

View side-by-side comparison of targets vs actuals:
- See variance in absolute numbers and percentages
- Track performance status (Ahead, Behind, On Track)
- View summary statistics including total variance

### Data Management

**Export Data:**
- Click "Export to JSON" to download your data
- Use this for backups or transferring to another device

**Import Data:**
- Click "Import from JSON" and select a previously exported file
- All data will be restored from the file

## Data Storage

Your data is stored locally in your browser using LocalStorage:

- **Privacy**: Data never leaves your device
- **Offline**: Works without internet connection
- **Browser-specific**: Data is tied to this browser/device
- **Not synced**: Use Export/Import to transfer between devices

**Important Notes:**
- Regular exports serve as backups
- Clearing browser data will delete stored information
- Incognito/Private browsing won't persist data

## Build

Build the project for production:

```bash
npm run build
```

or

```bash
ng build
```

The build artifacts will be stored in the `dist/` directory.

## Future Enhancements

### Phase 2 - Standard Features
- CSV/Excel export formats
- Advanced filtering and search
- Print-friendly views
- Bulk data entry

### Phase 3 - Advanced Features
- Interactive charts (Line, Bar, Pie)
- Dashboard view
- Performance metrics cards
- Trend analysis

### Phase 4 - Full Featured
- Multiple portfolio support
- Custom target scenarios
- Notes and tags per entry
- Report generation
- Dark mode toggle

## Troubleshooting

### Build Errors

If you encounter peer dependency errors during installation:

```bash
npm install --legacy-peer-deps
```

### LocalStorage Issues

If data isn't persisting:
1. Check if cookies/storage are enabled in your browser
2. Ensure you're not in incognito/private mode
3. Check browser storage limits

### Application Not Loading

1. Clear browser cache
2. Ensure all dependencies are installed
3. Check console for errors

## Contributing

This is a personal finance tracking tool. Feel free to fork and customize for your needs.

## License

This project is for personal use.

## Support

For issues or questions, please refer to the documentation or create an issue in the repository.

## Acknowledgments

- Built with Angular and PrimeNG
- Sample data based on compound interest calculations
- Designed for personal investment tracking
