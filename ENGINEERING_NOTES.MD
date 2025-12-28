# Engineering Notes

This document describes a few technical decisions made during the implementation
of the faceted product search feature.

The main goal was to keep the frontend logic simple and predictable,
while still supporting filtering, facets, and pagination.

## Key tradeoffs

### Backend-driven filtering and facets
Filtering by search text, brands, and categories is handled on the backend
using Supabase.

This approach avoids downloading large datasets to the client and keeps
the frontend focused on UI and state management.

The tradeoff is that some logic lives in SQL, which is harder to debug
and change compared to TypeScript.

### URL-based search state
Search query, selected brands, categories, and current page are stored in URL parameters.

This makes the search state shareable via links and keeps browser navigation
working as expected.

The downside is additional code to synchronize URL parameters with component state.

### Normalized data structure
Brands and categories are stored in separate tables and connected to products
through join tables.

This makes filtering and facet counting more reliable than working with raw strings,
but increases complexity during data import.

## Frontend architecture notes

- Angular standalone component was used to reduce boilerplate.
- RxJS is used to react to URL changes and load products and facets together.
- The UI state (`loading`, `error`, `products`, `facets`) is managed inside the component.
- Search input is separated from the actual query to avoid unnecessary requests
  while typing.

## How this could scale further

If the project needed to support more data or traffic:

- Add database indexes for frequently used filters.
- Introduce caching for popular search queries.
- Improve pagination strategy for very large result sets.
- Split the search component into smaller UI components (facets, results, pagination).
- Add debounce to search input.

## Non-trivial edge case or technical decision

One important edge case was keeping facet counts consistent when multiple filters
are selected.

Facet counts are recalculated on the backend using the same filters as the product
query, which ensures the numbers always match the visible results.

Another edge case is incomplete product data (missing name, image, brands, or categories),
which required defensive handling both during import and rendering.