import { Injectable } from '@angular/core';
import { ExportData, TargetEntry, ActualEntry } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ExportImportService {
  private readonly APP_VERSION = '1.0.0';

  constructor() { }

  // Export data to JSON file
  exportToJson(targets: TargetEntry[], actuals: ActualEntry[]): void {
    const exportData: ExportData = {
      version: this.APP_VERSION,
      exportDate: new Date().toISOString(),
      targets,
      actuals
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock-tracker-data-${this.getDateString()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  // Import data from JSON file
  async importFromJson(file: File): Promise<ExportData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data: ExportData = JSON.parse(content);
          
          // Validate imported data
          if (!this.validateImportData(data)) {
            reject(new Error('Invalid data format'));
            return;
          }
          
          resolve(data);
        } catch (error) {
          reject(new Error('Failed to parse JSON file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  // Validate import data structure
  private validateImportData(data: any): data is ExportData {
    if (!data || typeof data !== 'object') {
      return false;
    }
    
    if (!data.version || !data.exportDate) {
      return false;
    }
    
    if (!Array.isArray(data.targets) || !Array.isArray(data.actuals)) {
      return false;
    }
    
    // Validate each target entry
    for (const target of data.targets) {
      if (!this.validateEntry(target)) {
        return false;
      }
    }
    
    // Validate each actual entry
    for (const actual of data.actuals) {
      if (!this.validateEntry(actual)) {
        return false;
      }
    }
    
    return true;
  }

  private validateEntry(entry: any): boolean {
    const requiredFields = [
      'year', 'month', 'investment', 'added', 'principal',
      'totalInvestment', 'returnPercent', 'profit', 'total'
    ];
    
    for (const field of requiredFields) {
      if (!(field in entry) || typeof entry[field] !== 'number') {
        return false;
      }
    }
    
    return true;
  }

  private getDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

