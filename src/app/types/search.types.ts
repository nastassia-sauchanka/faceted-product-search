export interface Product {
  id: string;
  name: string | null;
  image: string | null;
  total_count: number;
};

export interface FacetItem { 
    id: number; 
    name: string; 
    count: number;
};

export interface FacetsResponse { 
    brands: FacetItem[]; 
    categories: FacetItem[];
};

export interface SearchState {
  q: string;
  brandIds: number[];
  categoryIds: number[];
  page: number;
};