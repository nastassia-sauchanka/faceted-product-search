import { Component, DestroyRef, inject } from '@angular/core';
import { SupabaseService } from '../../core/supabase.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FacetsResponse, Product, SearchState } from '../../types/search.types';
import { catchError, combineLatest, from, map, of, switchMap, tap } from 'rxjs';
import { parseCsvNumbers, toCsv } from '../../utils/url-params.util';

@Component({
  selector: 'app-search',
  imports: [FormsModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
  standalone: true
})

export class SearchComponent {
  public query: string = "";
  public brandIds: number[] = [];
  public categoryIds: number[] = [];
  public page: number = 0;
  public queryInput: string = "";
  public loading: boolean = false;
  public error: string | null = null;
  public products: Product[] = [];
  public totalCount: number = 0;
  public facets: FacetsResponse = { brands: [], categories: [] };
  public pageSize: number = 24;

  private readonly supabase: SupabaseService = inject(SupabaseService);
  private readonly activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private readonly router: Router = inject(Router);
  private readonly destroyRef: DestroyRef = inject(DestroyRef);

  public ngOnInit(): void {
    const state$ = this.activatedRoute.queryParamMap.pipe(
      map((paramMap): SearchState => {
        const q = paramMap.get("q") ?? "";
        const brandIds = parseCsvNumbers(paramMap.get("brands"));
        const categoryIds = parseCsvNumbers(paramMap.get("categories"));

        const pageParam = Number(paramMap.get("page") ?? "0");
        const page = Number.isFinite(pageParam) && pageParam >= 0 ? pageParam : 0;

        return { q, brandIds, categoryIds, page };
      }),
      tap((searchState) => {
        this.query = searchState.q;
        this.brandIds = searchState.brandIds;
        this.categoryIds = searchState.categoryIds;
        this.page = searchState.page;
        this.queryInput = searchState.q;
      })
    );

    state$
      .pipe(
        tap(() => {
          this.loading = true;
          this.error = null;
        }),
        switchMap((searchState) => {
          const products$ = from(
            this.supabase.client.rpc("search_products", {
              q: searchState.q || null,
              brand_ids: searchState.brandIds.length ? searchState.brandIds : null,
              category_ids: searchState.categoryIds.length ? searchState.categoryIds : null,
              page: searchState.page,
              page_size: this.pageSize,
            })
          );

          const facets$ = from(
            this.supabase.client.rpc("facet_counts", {
              q: searchState.q || null,
              brand_ids: searchState.brandIds.length ? searchState.brandIds : null,
              category_ids: searchState.categoryIds.length ? searchState.categoryIds : null,
            })
          );

          return combineLatest([products$, facets$]);
        }),
        tap(([productsRes, facetsRes]) => {

          if (productsRes.error) throw productsRes.error;
          const rows = (productsRes.data ?? []) as Product[];
          this.products = rows;
          this.totalCount = rows.length ? Number(rows[0].total_count) : 0;

          if (facetsRes.error) throw facetsRes.error;
          this.facets = (facetsRes.data ?? { brands: [], categories: [] }) as FacetsResponse;
        }),
        catchError((e) => {
          this.error = e?.message ?? "Unknown error";
          return of(null);
        }),
        tap(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  public get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  public applySearch(): void {
    this.patchUrl({
      q: this.queryInput || null,
      page: 0,
    });
  }

  public toggleBrand(id: number): void {
    const set = new Set(this.brandIds);
    set.has(id) ? set.delete(id) : set.add(id);

    this.patchUrl({
      brands: toCsv([...set]),
      page: 0,
    });
  }

  public toggleCategory(id: number): void {
    const set = new Set(this.categoryIds);
    set.has(id) ? set.delete(id) : set.add(id);

    this.patchUrl({
      categories: toCsv([...set]),
      page: 0,
    });
  }

  public isBrandSelected(id: number): boolean {
    return this.brandIds.includes(id);
  }

  public isCategorySelected(id: number): boolean {
    return this.categoryIds.includes(id);
  }

  public prevPage(): void {
    if (this.page <= 0) return;
    this.patchUrl({ page: this.page - 1 });
  }

  public nextPage(): void {
    const lastPage = Math.max(0, this.totalPages - 1);
    if (this.page >= lastPage) return;
    this.patchUrl({ page: this.page + 1 });
  }

  private patchUrl(patch: Record<string, any>): void {
    const current = { ...this.activatedRoute.snapshot.queryParams };

    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === undefined || value === "") delete current[key];
      else current[key] = value;
    }

    void this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: current,
    });
  }
}
