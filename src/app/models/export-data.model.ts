import { TargetEntry } from './target-entry.model';
import { ActualEntry } from './actual-entry.model';

export interface ExportData {
  version: string;
  exportDate: string;
  targets: TargetEntry[];
  actuals: ActualEntry[];
}

