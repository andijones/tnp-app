export interface Food {
    id: string;
    name: string;
    description?: string;
    image?: string;
    category?: string;
    status: 'pending' | 'approved' | 'rejected';
    nova_group?: 1 | 2 | 3 | 4;
    user_id: string;
    created_at: string;
    ingredients?: string;
    nutrition?: NutritionInfo;
  }
  
  export interface NutritionInfo {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  }
  
  export interface User {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    created_at: string;
  }
  
  export interface UserProfile {
    id: string;
    full_name?: string;
    avatar_url?: string;
    bio?: string;
  }
  
  export interface Favorite {
    id: string;
    user_id: string;
    food_id: string;
    created_at: string;
    food?: Food;
  }
  
  export interface Rating {
    id: string;
    user_id: string;
    food_id: string;
    rating: number;
    review?: string;
    created_at: string;
  }
  
  export interface Supermarket {
    id: string;
    name: string;
    logo?: string;
  }
  
  export interface Aisle {
    id: string;
    name: string;
    slug: string;
    parent_id?: string;
  }