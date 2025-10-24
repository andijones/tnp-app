// src/types/aisle.ts

export interface Aisle {
    id: string;
    name: string;
    slug: string;
    parent_id?: string | null;
    created_at: string;
    updated_at: string;
    
    // Computed properties for hierarchy
    children?: Aisle[];
    level?: number;
    path?: string[];
  }
  
  export interface FoodItemAisle {
    id: string;
    food_id: string;
    aisle_id: string;
    created_at: string;
  }
  
  export interface AisleLevel {
    title: string;
    aisles: Aisle[];
    parentSlug?: string | null;
  }