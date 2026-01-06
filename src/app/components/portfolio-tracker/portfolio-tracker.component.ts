import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import * as XLSX from 'xlsx';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MultiSelectModule } from 'primeng/multiselect';
import { MessageService } from 'primeng/api';

import { TargetEntry } from '../../models';
import { StockTrackerService } from '../../services';

interface PortfolioRow extends TargetEntry {
  actualInvestment: number | null;
  actualAdded: number | null;
  actualTotal: number | null;
}

@Component({
  selector: 'app-portfolio-tracker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputNumberModule,
    ToastModule,
    MultiSelectModule
  ],
  providers: [MessageService],
  templateUrl: './portfolio-tracker.component.html',
  styleUrls: ['./portfolio-tracker.component.scss']
})
export class PortfolioTrackerComponent implements OnInit, OnDestroy {
  portfolioData: PortfolioRow[] = [];
  filteredData: PortfolioRow[] = [];
  showConfirmModal = false;
  showRowClearModal = false;
  rowToClear: PortfolioRow | null = null;
  yearOptions: { label: string; value: number }[] = [];
  selectedYears: number[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private stockTrackerService: StockTrackerService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.stockTrackerService.targets$
      .pipe(takeUntil(this.destroy$))
      .subscribe(targets => {
        if (targets.length === 0) {
          this.generateTenYearProjection();
        } else {
          this.loadPortfolioData(targets);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openClearConfirm(): void {
    this.showConfirmModal = true;
  }

  cancelClear(): void {
    this.showConfirmModal = false;
  }

  confirmClear(): void {
    this.portfolioData = [];
    this.filteredData = [];
    this.selectedYears = [];
    this.stockTrackerService.clearAllData();
    this.generateTenYearProjection();
    this.showConfirmModal = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Data Cleared',
      detail: 'All data has been cleared and regenerated',
      life: 3000
    });
  }

  private generateTenYearProjection(): void {
    const targets: TargetEntry[] = [];
    
    const startingInvestment = 100000;
    const monthlyAddition = 3500;
    const monthlyReturnPercent = 1.6;
    
    let previousTotal = startingInvestment;
    let previousPrincipal = startingInvestment;
    
    const startYear = 2025;
    
    for (let i = 1; i <= 120; i++) {
      const year = startYear + Math.floor((i - 1) / 12);
      const monthNumber = ((i - 1) % 12) + 1; // 1-12 for each year
      
      const investment = previousTotal;
      const added = monthlyAddition;
      const principal = previousPrincipal + added;
      const totalInvestment = previousTotal + added;
      const returnPercent = monthlyReturnPercent;
      const profit = Math.round(totalInvestment * (returnPercent / 100));
      const total = totalInvestment + profit;
      
      targets.push({
        id: `target-${i}`,
        year,
        month: monthNumber,
        investment: Math.round(investment),
        added,
        principal: Math.round(principal),
        totalInvestment: Math.round(totalInvestment),
        returnPercent,
        profit,
        total: Math.round(total)
      });
      
      previousTotal = total;
      previousPrincipal = principal;
    }
    
    this.stockTrackerService.setTargets(targets);
  }

  private loadPortfolioData(targets: TargetEntry[]): void {
    const actuals = this.stockTrackerService.getActuals();
    
    const actualsMap = new Map<string, { investment: number, added: number, total: number }>();
    actuals.forEach(a => {
      actualsMap.set(`${a.year}-${a.month}`, { 
        investment: a.investment, 
        added: a.added,
        total: a.total
      });
    });

    this.portfolioData = targets
      .map(target => {
        const key = `${target.year}-${target.month}`;
        const actual = actualsMap.get(key);

        // Convert 0 to null so placeholder shows
        const actualInvestment = actual?.investment;
        const actualAdded = actual?.added;
        const actualTotal = actual?.total;

        return {
          ...target,
          actualInvestment: (actualInvestment === 0 || actualInvestment === undefined) ? null : actualInvestment,
          actualAdded: (actualAdded === 0 || actualAdded === undefined) ? null : actualAdded,
          actualTotal: (actualTotal === 0 || actualTotal === undefined) ? null : actualTotal
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });

    // Set up year filter options
    const uniqueYears = [...new Set(this.portfolioData.map(row => row.year))].sort();
    this.yearOptions = uniqueYears.map(year => ({ label: String(year), value: year }));
    
    // Default to 2025 if no selection and 2025 exists
    if (this.selectedYears.length === 0 && uniqueYears.includes(2025)) {
      this.selectedYears = [2025];
    }
    
    // Initialize filtered data
    this.applyYearFilter();
  }

  onYearFilterChange(): void {
    this.applyYearFilter();
  }

  private applyYearFilter(): void {
    if (this.selectedYears.length === 0) {
      this.filteredData = [...this.portfolioData];
    } else {
      this.filteredData = this.portfolioData.filter(row => this.selectedYears.includes(row.year));
    }
  }

  onActualChange(row: PortfolioRow, showToast: boolean = true): void {
    // Save to actuals when any value changes
    const existingActuals = this.stockTrackerService.getActuals();
    const existingIndex = existingActuals.findIndex(
      a => a.year === row.year && a.month === row.month
    );

    const actualTotalInvestment = (row.actualInvestment ?? 0) + (row.actualAdded ?? 0);
    const actualProfit = row.actualTotal ? row.actualTotal - actualTotalInvestment : 0;
    const actualReturnPercent = actualTotalInvestment > 0 && row.actualTotal 
      ? ((row.actualTotal - actualTotalInvestment) / actualTotalInvestment) * 100 
      : 0;

    const actualEntry = {
      id: existingIndex >= 0 ? existingActuals[existingIndex].id : `actual-${row.year}-${row.month}`,
      year: row.year,
      month: row.month,
      investment: row.actualInvestment ?? 0,
      added: row.actualAdded ?? 0,
      principal: actualTotalInvestment,
      totalInvestment: actualTotalInvestment,
      returnPercent: Number(actualReturnPercent.toFixed(2)),
      profit: actualProfit,
      total: row.actualTotal ?? 0
    };

    if (existingIndex >= 0) {
      this.stockTrackerService.updateActual(actualEntry);
    } else {
      this.stockTrackerService.addActual(actualEntry);
    }

    // Auto-populate next month's investment with this month's total
    if (row.actualTotal !== null) {
      this.updateNextMonthInvestment(row);
    }

    if (showToast) {
      this.messageService.add({ 
        severity: 'success', 
        summary: 'Saved', 
        detail: `Year ${row.year}, Month ${row.month} updated`,
        life: 1500
      });
    }
  }

  private updateNextMonthInvestment(currentRow: PortfolioRow): void {
    // Find the next month's row
    const currentIndex = this.portfolioData.findIndex(
      r => r.year === currentRow.year && r.month === currentRow.month
    );
    
    if (currentIndex >= 0 && currentIndex < this.portfolioData.length - 1) {
      const nextRow = this.portfolioData[currentIndex + 1];
      
      // Set next month's actual investment to this month's actual total
      nextRow.actualInvestment = currentRow.actualTotal;
      
      // Save the next month's data silently
      this.onActualChange(nextRow, false);
    }
  }

  formatCurrency(value: number | null): string {
    if (value === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  getMonthName(month: number): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[(month - 1) % 12] || '';
  }

  getVariance(actual: number | null, target: number): number {
    if (actual === null) return 0;
    return actual - target;
  }

  getVarianceClass(actual: number | null, target: number): string {
    if (actual === null) return '';
    const variance = actual - target;
    if (variance > 0) return 'positive';
    if (variance < 0) return 'negative';
    return '';
  }

  getActualTotalInvestment(actualInvestment: number | null, actualAdded: number | null): string {
    if (actualInvestment === null || actualAdded === null) {
      return '-';
    }
    return this.formatCurrency(actualInvestment + actualAdded);
  }

  getActualClass(actualInvestment: number | null, actualAdded: number | null): string {
    if (actualInvestment === null || actualAdded === null) {
      return 'no-data';
    }
    return 'has-data';
  }

  getActualProfit(row: PortfolioRow): string {
    if (row.actualTotal === null || row.actualInvestment === null || row.actualAdded === null) {
      return '-';
    }
    const actualTotalInvestment = row.actualInvestment + row.actualAdded;
    const profit = row.actualTotal - actualTotalInvestment;
    return this.formatCurrency(profit);
  }

  getActualReturnPercent(row: PortfolioRow): string {
    if (row.actualTotal === null || row.actualInvestment === null || row.actualAdded === null) {
      return '-';
    }
    const actualTotalInvestment = row.actualInvestment + row.actualAdded;
    if (actualTotalInvestment === 0) return '0%';
    const returnPercent = ((row.actualTotal - actualTotalInvestment) / actualTotalInvestment) * 100;
    return returnPercent.toFixed(1) + '%';
  }

  getProfitClass(row: PortfolioRow): string {
    if (row.actualTotal === null || row.actualInvestment === null || row.actualAdded === null) {
      return 'no-data';
    }
    const actualTotalInvestment = row.actualInvestment + row.actualAdded;
    const profit = row.actualTotal - actualTotalInvestment;
    if (profit > 0) return 'profit-positive';
    if (profit < 0) return 'profit-negative';
    return 'has-data';
  }

  // Actual Performance Summary Methods
  getFilledRowsCount(): number {
    return this.filteredData.filter(row => 
      row.actualTotal !== null && row.actualInvestment !== null
    ).length;
  }

  getActualTotalInvested(): number {
    const filledRows = this.filteredData.filter(row => 
      row.actualInvestment !== null && row.actualAdded !== null
    );
    if (filledRows.length === 0) return 0;
    
    // Get the latest row's actual total investment (cumulative)
    const latestRow = filledRows[filledRows.length - 1];
    return (latestRow.actualInvestment ?? 0) + (latestRow.actualAdded ?? 0);
  }

  getLatestActualTotal(): number {
    const filledRows = this.filteredData.filter(row => row.actualTotal !== null);
    if (filledRows.length === 0) return 0;
    return filledRows[filledRows.length - 1].actualTotal ?? 0;
  }

  getTotalActualProfit(): number {
    const latestTotal = this.getLatestActualTotal();
    const totalInvested = this.getActualTotalInvested();
    return latestTotal - totalInvested;
  }

  getOverallReturnPercent(): string {
    const totalInvested = this.getActualTotalInvested();
    if (totalInvested === 0) return '0.00';
    const profit = this.getTotalActualProfit();
    return ((profit / totalInvested) * 100).toFixed(2);
  }

  getTotalProfitClass(): string {
    const profit = this.getTotalActualProfit();
    if (profit > 0) return 'positive';
    if (profit < 0) return 'negative';
    return '';
  }

  getOverallVariance(): number {
    const filledRows = this.filteredData.filter(row => row.actualTotal !== null);
    if (filledRows.length === 0) return 0;
    const latestRow = filledRows[filledRows.length - 1];
    return (latestRow.actualTotal ?? 0) - latestRow.total;
  }

  getOverallVarianceClass(): string {
    const variance = this.getOverallVariance();
    if (variance > 0) return 'positive';
    if (variance < 0) return 'negative';
    return '';
  }

  getAverageYearlyReturn(): string {
    const monthsWithData = this.getFilledRowsCount();
    if (monthsWithData === 0) return '0.00';
    
    const overallReturn = parseFloat(this.getOverallReturnPercent());
    // Annualize: (overall return / months) * 12
    const avgYearlyReturn = (overallReturn / monthsWithData) * 12;
    return avgYearlyReturn.toFixed(2);
  }

  isFirstMonth(row: PortfolioRow): boolean {
    // Only January 2025 (the first month) should be editable
    return row.year === 2025 && row.month === 1;
  }

  clearRowData(row: PortfolioRow): void {
    this.rowToClear = row;
    this.showRowClearModal = true;
  }

  cancelRowClear(): void {
    this.showRowClearModal = false;
    this.rowToClear = null;
  }

  confirmRowClear(): void {
    if (!this.rowToClear) return;

    const row = this.rowToClear;
    
    // Clear the actual values for this row
    row.actualInvestment = null;
    row.actualAdded = null;
    row.actualTotal = null;

    // Remove from stored actuals
    const existingActuals = this.stockTrackerService.getActuals();
    const filteredActuals = existingActuals.filter(
      a => !(a.year === row.year && a.month === row.month)
    );
    
    // Update storage by clearing and re-adding
    this.stockTrackerService.clearAllData();
    filteredActuals.forEach(actual => {
      this.stockTrackerService.addActual(actual);
    });

    // Re-save targets
    const targets = this.portfolioData.map(r => ({
      id: r.id,
      year: r.year,
      month: r.month,
      investment: r.investment,
      added: r.added,
      principal: r.principal,
      totalInvestment: r.totalInvestment,
      returnPercent: r.returnPercent,
      profit: r.profit,
      total: r.total
    }));
    this.stockTrackerService.setTargets(targets);

    this.showRowClearModal = false;
    
    this.messageService.add({
      severity: 'info',
      summary: 'Row Cleared',
      detail: `${this.getMonthName(row.month)} ${row.year} data cleared`,
      life: 2000
    });

    this.rowToClear = null;
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
        
        if (jsonData.length === 0) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Empty File',
            detail: 'The Excel file contains no data',
            life: 3000
          });
          return;
        }

        // Map month names to numbers
        const monthMap: { [key: string]: number } = {
          'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
          'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
        };

        // Process imported data
        let importedCount = 0;
        jsonData.forEach(row => {
          const year = row['Year'];
          const monthStr = row['Month'];
          const month = typeof monthStr === 'string' ? monthMap[monthStr] : monthStr;

          if (!year || !month) return;

          // Find matching row in portfolioData
          const existingRow = this.portfolioData.find(
            p => p.year === year && p.month === month
          );

          if (existingRow) {
            // Update actual values if present in import
            if (row['Actual Investment'] !== null && row['Actual Investment'] !== undefined && row['Actual Investment'] !== '') {
              existingRow.actualInvestment = Number(row['Actual Investment']);
            }
            if (row['Actual Added'] !== null && row['Actual Added'] !== undefined && row['Actual Added'] !== '') {
              existingRow.actualAdded = Number(row['Actual Added']);
            }
            if (row['Actual Total'] !== null && row['Actual Total'] !== undefined && row['Actual Total'] !== '') {
              existingRow.actualTotal = Number(row['Actual Total']);
            }

            // Save to service (silent - no toast)
            this.onActualChange(existingRow, false);
            importedCount++;
          }
        });

        // Reset file input
        input.value = '';

        this.messageService.add({
          severity: 'success',
          summary: 'Import Complete',
          detail: `${importedCount} rows imported successfully`,
          life: 3000
        });

      } catch (error) {
        console.error('Import error:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Import Failed',
          detail: 'Could not read the Excel file. Please check the format.',
          life: 4000
        });
        input.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
  }

  exportToExcel(): void {
    // Prepare data for export
    const exportData = this.portfolioData.map(row => {
      const actualTotalInvestment = (row.actualInvestment ?? 0) + (row.actualAdded ?? 0);
      const actualProfit = row.actualTotal ? row.actualTotal - actualTotalInvestment : null;
      const actualReturnPercent = actualTotalInvestment > 0 && row.actualTotal 
        ? ((row.actualTotal - actualTotalInvestment) / actualTotalInvestment) * 100 
        : null;
      const variance = row.actualTotal !== null ? row.actualTotal - row.total : null;

      return {
        'Year': row.year,
        'Month': this.getMonthName(row.month),
        'Target Investment': row.investment,
        'Actual Investment': row.actualInvestment,
        'Target Added': row.added,
        'Actual Added': row.actualAdded,
        'Target Principal': row.principal,
        'Actual Principal': row.actualInvestment !== null && row.actualAdded !== null ? actualTotalInvestment : null,
        'Target Total Invested': row.totalInvestment,
        'Actual Total Invested': row.actualInvestment !== null && row.actualAdded !== null ? actualTotalInvestment : null,
        'Target Return %': row.returnPercent,
        'Actual Return %': actualReturnPercent !== null ? Number(actualReturnPercent.toFixed(2)) : null,
        'Target Profit': row.profit,
        'Actual Profit': actualProfit,
        'Target Total': row.total,
        'Actual Total': row.actualTotal,
        'Variance': variance
      };
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Portfolio Data');

    // Set column widths
    const colWidths = [
      { wch: 6 },   // Year
      { wch: 8 },   // Month
      { wch: 18 },  // Target Investment
      { wch: 18 },  // Actual Investment
      { wch: 14 },  // Target Added
      { wch: 14 },  // Actual Added
      { wch: 16 },  // Target Principal
      { wch: 16 },  // Actual Principal
      { wch: 20 },  // Target Total Invested
      { wch: 20 },  // Actual Total Invested
      { wch: 14 },  // Target Return %
      { wch: 14 },  // Actual Return %
      { wch: 14 },  // Target Profit
      { wch: 14 },  // Actual Profit
      { wch: 14 },  // Target Total
      { wch: 14 },  // Actual Total
      { wch: 12 }   // Variance
    ];
    worksheet['!cols'] = colWidths;

    // Generate filename with date
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const filename = `Portfolio_Data_${dateStr}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, filename);

    this.messageService.add({
      severity: 'success',
      summary: 'Export Complete',
      detail: `Data exported to ${filename}`,
      life: 3000
    });
  }
}
