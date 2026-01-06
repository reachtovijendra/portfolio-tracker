import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { StockTrackerService, ExportImportService } from '../../services';

@Component({
  selector: 'app-data-management',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    FileUploadModule,
    CardModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './data-management.component.html',
  styleUrls: ['./data-management.component.scss']
})
export class DataManagementComponent {
  constructor(
    private stockTrackerService: StockTrackerService,
    private exportImportService: ExportImportService,
    private messageService: MessageService
  ) { }

  exportData(): void {
    const targets = this.stockTrackerService.getTargets();
    const actuals = this.stockTrackerService.getActuals();
    
    if (targets.length === 0 && actuals.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Data',
        detail: 'There is no data to export'
      });
      return;
    }

    this.exportImportService.exportToJson(targets, actuals);
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Data exported successfully'
    });
  }

  async onFileSelect(event: any): Promise<void> {
    const file = event.files[0];
    
    if (!file) {
      return;
    }

    try {
      const data = await this.exportImportService.importFromJson(file);
      
      // Assign IDs to imported data if they don't have them
      data.targets.forEach(t => {
        if (!t.id) {
          t.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
      });
      
      data.actuals.forEach(a => {
        if (!a.id) {
          a.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
      });

      this.stockTrackerService.setTargets(data.targets);
      this.stockTrackerService.setActuals(data.actuals);
      
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `Imported ${data.targets.length} targets and ${data.actuals.length} actuals`
      });
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Import Failed',
        detail: error.message || 'Failed to import data'
      });
    }
  }

  resetData(): void {
    // Clear all data - the portfolio tracker will regenerate the 10-year projection
    this.stockTrackerService.clearAllData();
    
    this.messageService.add({
      severity: 'success',
      summary: 'Reset Complete',
      detail: 'Data cleared. Return to Portfolio Tracker to see the fresh 10-year projection.'
    });
  }
}

