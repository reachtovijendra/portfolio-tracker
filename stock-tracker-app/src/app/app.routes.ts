import { Routes } from '@angular/router';
import { PortfolioTrackerComponent } from './components/portfolio-tracker/portfolio-tracker.component';

export const routes: Routes = [
  { path: '', redirectTo: '/portfolio', pathMatch: 'full' },
  { path: 'portfolio', component: PortfolioTrackerComponent }
];
