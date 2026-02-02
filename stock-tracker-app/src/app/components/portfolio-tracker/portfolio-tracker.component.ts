import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import * as XLSX from 'xlsx';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
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
    MultiSelectModule,
    ProgressSpinnerModule
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
  isLoading = true;
  
  // Initial contributions
  targetInitialContribution: number = 100000;
  actualInitialContribution: number | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private stockTrackerService: StockTrackerService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    // Load initial contributions from localStorage
    this.loadInitialContributions();
    
    // Subscribe to loading state
    this.stockTrackerService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });

    // Subscribe to both targets and actuals
    combineLatest([
      this.stockTrackerService.targets$,
      this.stockTrackerService.actuals$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([targets, actuals]) => {
        if (!this.isLoading) {
          if (targets.length === 0) {
            this.generateTenYearProjection();
          } else {
            this.loadPortfolioData(targets, actuals);
          }
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

  async confirmClear(): Promise<void> {
    this.portfolioData = [];
    this.filteredData = [];
    this.selectedYears = [];
    await this.stockTrackerService.clearAllData();
    await this.generateTenYearProjection();
    this.showConfirmModal = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Data Cleared',
      detail: 'All data has been cleared and regenerated',
      life: 3000
    });
  }

  private async generateTenYearProjection(): Promise<void> {
    const targets: TargetEntry[] = [];
    
    const startingInvestment = this.targetInitialContribution;
    const monthlyAddition = 3500;
    const monthlyReturnPercent = 1.6;
    
    let previousTotal = startingInvestment;
    let previousPrincipal = startingInvestment;
    
    const startYear = 2025;
    
    for (let i = 1; i <= 120; i++) {
      const year = startYear + Math.floor((i - 1) / 12);
      const monthNumber = ((i - 1) % 12) + 1;
      
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
    
    await this.stockTrackerService.setTargets(targets);
  }

  async onTargetInitialChange(): Promise<void> {
    // Save to localStorage
    localStorage.setItem('targetInitialContribution', this.targetInitialContribution.toString());
    // Regenerate projections with new target
    await this.generateTenYearProjection();
    this.messageService.add({
      severity: 'success',
      summary: 'Updated',
      detail: 'Target projections recalculated',
      life: 2000
    });
  }

  async onActualInitialChange(): Promise<void> {
    // Save to localStorage
    if (this.actualInitialContribution !== null) {
      localStorage.setItem('actualInitialContribution', this.actualInitialContribution.toString());
    } else {
      localStorage.removeItem('actualInitialContribution');
    }
    
    // Update the first row's actual investment
    if (this.portfolioData.length > 0) {
      const firstRow = this.portfolioData[0];
      firstRow.actualInvestment = this.actualInitialContribution;
      
      // Save using the existing onActualChange method
      await this.onActualChange(firstRow, false);
    }
    
    this.messageService.add({
      severity: 'success',
      summary: 'Updated',
      detail: 'Actual initial contribution updated',
      life: 2000
    });
  }

  private loadInitialContributions(): void {
    // Load from localStorage
    const savedTarget = localStorage.getItem('targetInitialContribution');
    const savedActual = localStorage.getItem('actualInitialContribution');
    
    if (savedTarget) {
      this.targetInitialContribution = parseFloat(savedTarget);
    }
    if (savedActual) {
      this.actualInitialContribution = parseFloat(savedActual);
    }
  }

  private loadPortfolioData(targets: TargetEntry[], actuals: any[]): void {
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

    // Sync first row's actualInvestment with actualInitialContribution
    if (this.portfolioData.length > 0) {
      const firstRow = this.portfolioData[0];
      
      // If we have an actual initial contribution set, use it for the first row
      if (this.actualInitialContribution !== null) {
        firstRow.actualInvestment = this.actualInitialContribution;
      } else if (firstRow.actualInvestment !== null) {
        // If first row has investment but actualInitialContribution is null, sync it
        this.actualInitialContribution = firstRow.actualInvestment;
      }
    }

    const uniqueYears = [...new Set(this.portfolioData.map(row => row.year))].sort();
    this.yearOptions = uniqueYears.map(year => ({ label: String(year), value: year }));
    
    if (this.selectedYears.length === 0 && uniqueYears.includes(2025)) {
      this.selectedYears = [2025];
    }
    
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

  async onActualChange(row: PortfolioRow, showToast: boolean = true): Promise<void> {
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

    try {
      if (existingIndex >= 0) {
        await this.stockTrackerService.updateActual(actualEntry);
      } else {
        await this.stockTrackerService.addActual(actualEntry);
      }

      if (row.actualTotal !== null) {
        await this.updateNextMonthInvestment(row);
      }

      if (showToast) {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Saved', 
          detail: `Year ${row.year}, Month ${row.month} updated`,
          life: 1500
        });
      }
    } catch (error) {
      console.error('Error saving actual:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save data. Please try again.',
        life: 3000
      });
    }
  }

  private async updateNextMonthInvestment(currentRow: PortfolioRow): Promise<void> {
    const currentIndex = this.portfolioData.findIndex(
      r => r.year === currentRow.year && r.month === currentRow.month
    );
    
    if (currentIndex >= 0 && currentIndex < this.portfolioData.length - 1) {
      const nextRow = this.portfolioData[currentIndex + 1];
      nextRow.actualInvestment = currentRow.actualTotal;
      await this.onActualChange(nextRow, false);
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

  getActualInitialContribution(): string {
    if (this.actualInitialContribution !== null) {
      return '$' + this.formatCurrency(this.actualInitialContribution);
    }
    return '$' + this.formatCurrency(this.targetInitialContribution);
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

  // Overall Profit = Actual Total Value EOM - Cumulative Actual Principal
  getOverallProfit(row: PortfolioRow): number {
    if (row.actualTotal === null) return 0;
    const cumulativePrincipal = this.getCumulativeActualPrincipal(row);
    if (cumulativePrincipal === null) return 0;
    return row.actualTotal - cumulativePrincipal;
  }

  getOverallProfitClass(row: PortfolioRow): string {
    if (row.actualTotal === null) return '';
    const cumulativePrincipal = this.getCumulativeActualPrincipal(row);
    if (cumulativePrincipal === null) return '';
    const profit = this.getOverallProfit(row);
    if (profit > 0) return 'positive';
    if (profit < 0) return 'negative';
    return '';
  }

  // Calculate cumulative actual principal: Initial Investment + all Added amounts up to this row
  getCumulativeActualPrincipal(row: PortfolioRow): number | null {
    // Find the index of this row
    const rowIndex = this.portfolioData.findIndex(r => r.year === row.year && r.month === row.month);
    if (rowIndex === -1) return null;
    
    // Get initial investment from first row (Jan 2025)
    const firstRow = this.portfolioData[0];
    if (firstRow.actualInvestment === null) return null;
    
    let cumulativePrincipal = firstRow.actualInvestment;
    
    // Add all actualAdded values from first row up to and including current row
    for (let i = 0; i <= rowIndex; i++) {
      const currentRow = this.portfolioData[i];
      if (currentRow.actualAdded === null) return null;
      cumulativePrincipal += currentRow.actualAdded;
    }
    
    return cumulativePrincipal;
  }

  getActualPrincipalDisplay(row: PortfolioRow): string {
    const principal = this.getCumulativeActualPrincipal(row);
    if (principal === null) return '-';
    return this.formatCurrency(principal);
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

  getActualPrincipalClass(row: PortfolioRow): string {
    const principal = this.getCumulativeActualPrincipal(row);
    if (principal === null) return 'no-data';
    return 'has-data';
  }

  getActualProfit(row: PortfolioRow): string {
    if (row.actualTotal === null) return '-';
    const cumulativePrincipal = this.getCumulativeActualPrincipal(row);
    if (cumulativePrincipal === null) return '-';
    const profit = row.actualTotal - cumulativePrincipal;
    return this.formatCurrency(profit);
  }

  getActualReturnPercent(row: PortfolioRow): string {
    if (row.actualTotal === null) return '-';
    const cumulativePrincipal = this.getCumulativeActualPrincipal(row);
    if (cumulativePrincipal === null || cumulativePrincipal === 0) return '-';
    const returnPercent = ((row.actualTotal - cumulativePrincipal) / cumulativePrincipal) * 100;
    return returnPercent.toFixed(1) + '%';
  }

  getProfitClass(row: PortfolioRow): string {
    if (row.actualTotal === null) return 'no-data';
    const cumulativePrincipal = this.getCumulativeActualPrincipal(row);
    if (cumulativePrincipal === null) return 'no-data';
    const profit = row.actualTotal - cumulativePrincipal;
    if (profit > 0) return 'profit-positive';
    if (profit < 0) return 'profit-negative';
    return 'has-data';
  }

  getFilledRowsCount(): number {
    return this.filteredData.filter(row => 
      row.actualTotal !== null && row.actualInvestment !== null
    ).length;
  }

  getActualTotalInvested(): number {
    // Find the latest row with actual data
    const filledRows = this.portfolioData.filter(row => 
      row.actualTotal !== null
    );
    if (filledRows.length === 0) return 0;
    
    // Get the cumulative principal of the latest filled row
    const latestRow = filledRows[filledRows.length - 1];
    const cumulativePrincipal = this.getCumulativeActualPrincipal(latestRow);
    return cumulativePrincipal ?? 0;
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
    const avgYearlyReturn = (overallReturn / monthsWithData) * 12;
    return avgYearlyReturn.toFixed(2);
  }

  isFirstMonth(row: PortfolioRow): boolean {
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

  async confirmRowClear(): Promise<void> {
    if (!this.rowToClear) return;

    const row = this.rowToClear;
    
    row.actualInvestment = null;
    row.actualAdded = null;
    row.actualTotal = null;

    const existingActuals = this.stockTrackerService.getActuals();
    const actualToDelete = existingActuals.find(
      a => a.year === row.year && a.month === row.month
    );
    
    if (actualToDelete?.id) {
      await this.stockTrackerService.deleteActual(actualToDelete.id);
    }

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

    reader.onload = async (e: ProgressEvent<FileReader>) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
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

        const monthMap: { [key: string]: number } = {
          'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
          'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
        };

        let importedCount = 0;
        for (const row of jsonData) {
          const year = row['Year'];
          const monthStr = row['Month'];
          const month = typeof monthStr === 'string' ? monthMap[monthStr] : monthStr;

          if (!year || !month) continue;

          const existingRow = this.portfolioData.find(
            p => p.year === year && p.month === month
          );

          if (existingRow) {
            if (row['Actual Investment'] !== null && row['Actual Investment'] !== undefined && row['Actual Investment'] !== '') {
              existingRow.actualInvestment = Number(row['Actual Investment']);
            }
            if (row['Actual Added'] !== null && row['Actual Added'] !== undefined && row['Actual Added'] !== '') {
              existingRow.actualAdded = Number(row['Actual Added']);
            }
            if (row['Actual Total'] !== null && row['Actual Total'] !== undefined && row['Actual Total'] !== '') {
              existingRow.actualTotal = Number(row['Actual Total']);
            }

            await this.onActualChange(existingRow, false);
            importedCount++;
          }
        }

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

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Portfolio Data');

    const colWidths = [
      { wch: 6 },
      { wch: 8 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 20 },
      { wch: 20 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 }
    ];
    worksheet['!cols'] = colWidths;

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const filename = `Portfolio_Data_${dateStr}.xlsx`;

    XLSX.writeFile(workbook, filename);

    this.messageService.add({
      severity: 'success',
      summary: 'Export Complete',
      detail: `Data exported to ${filename}`,
      life: 3000
    });
  }
}
