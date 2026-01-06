export interface ActualEntry {
  id?: string;
  year: number;
  month: number;
  investment: number;      // Total invested this month
  added: number;          // New money added
  principal: number;      // Cumulative principal
  totalInvestment: number; // Total invested to date
  returnPercent: number;  // Calculated return %
  profit: number;         // Calculated profit
  total: number;          // Total portfolio value
}

