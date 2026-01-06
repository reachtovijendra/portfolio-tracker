import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Firestore, collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch } from '@angular/fire/firestore';
import { TargetEntry, ActualEntry } from '../models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class StockTrackerService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private targetsSubject = new BehaviorSubject<TargetEntry[]>([]);
  private actualsSubject = new BehaviorSubject<ActualEntry[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(true);

  public targets$: Observable<TargetEntry[]> = this.targetsSubject.asObservable();
  public actuals$: Observable<ActualEntry[]> = this.actualsSubject.asObservable();
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();

  private unsubscribeTargets: (() => void) | null = null;
  private unsubscribeActuals: (() => void) | null = null;

  constructor() {
    // Subscribe to auth state changes
    this.authService.user$.subscribe(user => {
      if (user) {
        this.subscribeToUserData(user.uid);
      } else {
        this.unsubscribeFromData();
        this.targetsSubject.next([]);
        this.actualsSubject.next([]);
        this.loadingSubject.next(false);
      }
    });
  }

  private subscribeToUserData(userId: string): void {
    this.loadingSubject.next(true);

    // Subscribe to targets collection
    const targetsRef = collection(this.firestore, `users/${userId}/targets`);
    this.unsubscribeTargets = onSnapshot(targetsRef, (snapshot) => {
      const targets: TargetEntry[] = [];
      snapshot.forEach(doc => {
        targets.push({ id: doc.id, ...doc.data() } as TargetEntry);
      });
      // Sort by year and month
      targets.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
      this.targetsSubject.next(targets);
      this.loadingSubject.next(false);
    });

    // Subscribe to actuals collection
    const actualsRef = collection(this.firestore, `users/${userId}/actuals`);
    this.unsubscribeActuals = onSnapshot(actualsRef, (snapshot) => {
      const actuals: ActualEntry[] = [];
      snapshot.forEach(doc => {
        actuals.push({ id: doc.id, ...doc.data() } as ActualEntry);
      });
      // Sort by year and month
      actuals.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
      this.actualsSubject.next(actuals);
    });
  }

  private unsubscribeFromData(): void {
    if (this.unsubscribeTargets) {
      this.unsubscribeTargets();
      this.unsubscribeTargets = null;
    }
    if (this.unsubscribeActuals) {
      this.unsubscribeActuals();
      this.unsubscribeActuals = null;
    }
  }

  // Target Entry Methods
  getTargets(): TargetEntry[] {
    return this.targetsSubject.value;
  }

  async addTarget(entry: TargetEntry): Promise<void> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const id = this.generateId();
    entry.id = id;
    const docRef = doc(this.firestore, `users/${userId}/targets/${id}`);
    await setDoc(docRef, this.cleanEntry(entry));
  }

  async updateTarget(entry: TargetEntry): Promise<void> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');
    if (!entry.id) throw new Error('Entry ID is required');

    const docRef = doc(this.firestore, `users/${userId}/targets/${entry.id}`);
    await setDoc(docRef, this.cleanEntry(entry));
  }

  async deleteTarget(id: string): Promise<void> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const docRef = doc(this.firestore, `users/${userId}/targets/${id}`);
    await deleteDoc(docRef);
  }

  // Actual Entry Methods
  getActuals(): ActualEntry[] {
    return this.actualsSubject.value;
  }

  async addActual(entry: ActualEntry): Promise<void> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const id = this.generateId();
    entry.id = id;
    const docRef = doc(this.firestore, `users/${userId}/actuals/${id}`);
    await setDoc(docRef, this.cleanEntry(entry));
  }

  async updateActual(entry: ActualEntry): Promise<void> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');
    if (!entry.id) throw new Error('Entry ID is required');

    const docRef = doc(this.firestore, `users/${userId}/actuals/${entry.id}`);
    await setDoc(docRef, this.cleanEntry(entry));
  }

  async deleteActual(id: string): Promise<void> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const docRef = doc(this.firestore, `users/${userId}/actuals/${id}`);
    await deleteDoc(docRef);
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
  async setTargets(targets: TargetEntry[]): Promise<void> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const batch = writeBatch(this.firestore);
    
    // Delete existing targets
    const currentTargets = this.targetsSubject.value;
    for (const target of currentTargets) {
      if (target.id) {
        const docRef = doc(this.firestore, `users/${userId}/targets/${target.id}`);
        batch.delete(docRef);
      }
    }

    // Add new targets
    for (const target of targets) {
      const id = target.id || this.generateId();
      target.id = id;
      const docRef = doc(this.firestore, `users/${userId}/targets/${id}`);
      batch.set(docRef, this.cleanEntry(target));
    }

    await batch.commit();
  }

  async setActuals(actuals: ActualEntry[]): Promise<void> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const batch = writeBatch(this.firestore);
    
    // Delete existing actuals
    const currentActuals = this.actualsSubject.value;
    for (const actual of currentActuals) {
      if (actual.id) {
        const docRef = doc(this.firestore, `users/${userId}/actuals/${actual.id}`);
        batch.delete(docRef);
      }
    }

    // Add new actuals
    for (const actual of actuals) {
      const id = actual.id || this.generateId();
      actual.id = id;
      const docRef = doc(this.firestore, `users/${userId}/actuals/${id}`);
      batch.set(docRef, this.cleanEntry(actual));
    }

    await batch.commit();
  }

  async clearAllData(): Promise<void> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const batch = writeBatch(this.firestore);

    // Delete all targets
    const targets = this.targetsSubject.value;
    for (const target of targets) {
      if (target.id) {
        const docRef = doc(this.firestore, `users/${userId}/targets/${target.id}`);
        batch.delete(docRef);
      }
    }

    // Delete all actuals
    const actuals = this.actualsSubject.value;
    for (const actual of actuals) {
      if (actual.id) {
        const docRef = doc(this.firestore, `users/${userId}/actuals/${actual.id}`);
        batch.delete(docRef);
      }
    }

    await batch.commit();
  }

  // Helper to remove undefined values and prepare for Firestore
  private cleanEntry<T extends TargetEntry | ActualEntry>(entry: T): Omit<T, 'id'> {
    const { id, ...rest } = entry;
    return rest as Omit<T, 'id'>;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
