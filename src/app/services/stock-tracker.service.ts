import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TargetEntry, ActualEntry } from '../models';

@Injectable({
  providedIn: 'root'
})
export class StockTrackerService {
  private readonly TARGETS_KEY = 'stockTracker_targets';
  private readonly ACTUALS_KEY = 'stockTracker_actuals';
  private readonly VERSION_KEY = 'stockTracker_version';
  private readonly CURRENT_VERSION = '1.0.0';

  private targetsSubject = new BehaviorSubject<TargetEntry[]>([]);
  private actualsSubject = new BehaviorSubject<ActualEntry[]>([]);

  public targets$: Observable<TargetEntry[]> = this.targetsSubject.asObservable();
  public actuals$: Observable<ActualEntry[]> = this.actualsSubject.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  // Target Entry Methods
  getTargets(): TargetEntry[] {
    return this.targetsSubject.value;
  }

  addTarget(entry: TargetEntry): void {
    const targets = [...this.targetsSubject.value];
    entry.id = this.generateId();
    targets.push(entry);
    this.updateTargets(targets);
  }

  updateTarget(entry: TargetEntry): void {
    const targets = this.targetsSubject.value.map(t => 
      t.id === entry.id ? entry : t
    );
    this.updateTargets(targets);
  }

  deleteTarget(id: string): void {
    const targets = this.targetsSubject.value.filter(t => t.id !== id);
    this.updateTargets(targets);
  }

  // Actual Entry Methods
  getActuals(): ActualEntry[] {
    return this.actualsSubject.value;
  }

  addActual(entry: ActualEntry): void {
    const actuals = [...this.actualsSubject.value];
    entry.id = this.generateId();
    actuals.push(entry);
    this.updateActuals(actuals);
  }

  updateActual(entry: ActualEntry): void {
    const actuals = this.actualsSubject.value.map(a => 
      a.id === entry.id ? entry : a
    );
    this.updateActuals(actuals);
  }

  deleteActual(id: string): void {
    const actuals = this.actualsSubject.value.filter(a => a.id !== id);
    this.updateActuals(actuals);
  }

  // Calculation Methods
  calculateReturnPercent(total: number, totalInvestment: number): number {
    if (totalInvestment === 0) return 0;
    return Number((((total - totalInvestment) / totalInvestment) * 100).toFixed(2));
  }

  calculateProfit(total: number, totalInvestment: number): number {
    return Number((total - totalInvestment).toFixed(2));
  }

  // Auto-calculate fields for entry
  autoCalculateEntry(entry: Partial<TargetEntry | ActualEntry>): void {
    if (entry.total !== undefined && entry.totalInvestment !== undefined) {
      entry.profit = this.calculateProfit(entry.total, entry.totalInvestment);
      entry.returnPercent = this.calculateReturnPercent(entry.total, entry.totalInvestment);
    }
  }

  // Bulk operations
  setTargets(targets: TargetEntry[]): void {
    this.updateTargets(targets);
  }

  setActuals(actuals: ActualEntry[]): void {
    this.updateActuals(actuals);
  }

  clearAllData(): void {
    this.updateTargets([]);
    this.updateActuals([]);
  }

  // Private helper methods
  private updateTargets(targets: TargetEntry[]): void {
    this.targetsSubject.next(targets);
    this.saveToStorage();
  }

  private updateActuals(actuals: ActualEntry[]): void {
    this.actualsSubject.next(actuals);
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.TARGETS_KEY, JSON.stringify(this.targetsSubject.value));
      localStorage.setItem(this.ACTUALS_KEY, JSON.stringify(this.actualsSubject.value));
      localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const targetsData = localStorage.getItem(this.TARGETS_KEY);
      const actualsData = localStorage.getItem(this.ACTUALS_KEY);
      
      if (targetsData) {
        this.targetsSubject.next(JSON.parse(targetsData));
      }
      
      if (actualsData) {
        this.actualsSubject.next(JSON.parse(actualsData));
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

