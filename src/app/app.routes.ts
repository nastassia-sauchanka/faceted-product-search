import { Routes } from '@angular/router';
import { SearchComponent } from './components/search/search.component';

export const routes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "search" },
  { path: "search", component: SearchComponent },
  { path: "**", redirectTo: "search" }
];
