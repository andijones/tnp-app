// Open Food Facts API Service
// https://world.openfoodfacts.org/api/v2

export interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  brands?: string;
  categories?: string;
  ingredients_text?: string;
  additives_tags?: string[];
  additives_n?: number;
  nova_group?: number;
  nutriments?: {
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    fat_100g?: number;
    'saturated-fat_100g'?: number;
    carbohydrates_100g?: number;
    sugars_100g?: number;
    fiber_100g?: number;
    salt_100g?: number;
    sodium_100g?: number;
  };
  image_front_url?: string;
  image_url?: string;
  image_ingredients_url?: string;
  image_nutrition_url?: string;
  ingredients_analysis_tags?: string[];
  // Allergens
  allergens?: string;
  allergens_tags?: string[];
  allergens_en?: string;
  traces?: string;
  traces_tags?: string[];
  traces_en?: string;
  // Nutritional scores
  nutrition_grade_fr?: string; // Nutri-Score (A, B, C, D, E)
  nutrition_score_fr_100g?: number;
  ecoscore_grade?: string; // Eco-Score (A-E)
  ecoscore_score?: number;
  // Labels and certifications
  labels?: string;
  labels_tags?: string[];
  labels_en?: string;
  // Stores
  stores?: string;
  stores_tags?: string[];
  // Vitamins and minerals
  vitamins_tags?: string[];
  minerals_tags?: string[];
}

export interface TransformedProduct {
  name: string;
  brand?: string;
  barcode: string;
  ingredients?: string;
  additives: string[];
  additivesCount: number;
  novaGroup?: number;
  nutrition?: {
    calories: number;
    protein: number;
    fat: number;
    saturatedFat?: number;
    carbs: number;
    sugar?: number;
    fiber?: number;
    sodium?: number;
    servingSize: string;
  };
  image?: string;
  imageIngredients?: string;
  imageNutrition?: string;
  categories: string[];
  hasPalmOil: boolean;
  // New fields
  allergens: string[];
  traces: string[];
  nutriScore?: string; // A, B, C, D, E
  ecoScore?: string; // A, B, C, D, E
  labels: string[];
  stores: string[];
  isVegan?: boolean;
  isVegetarian?: boolean;
  veganStatus: 'vegan' | 'non-vegan' | 'vegetarian' | 'non-vegetarian' | 'unknown';
  vitamins: string[];
  minerals: string[];
}

/**
 * Fetch product by barcode from Open Food Facts
 */
export const fetchProductByBarcode = async (barcode: string): Promise<OpenFoodFactsProduct | null> => {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      {
        headers: {
          'User-Agent': 'TheNakedPantry/1.0',
        },
      }
    );

    const data = await response.json();

    if (data.status === 0 || !data.product) {
      console.log('Product not found in Open Food Facts:', barcode);
      return null;
    }

    console.log('Product found in Open Food Facts:', data.product.product_name);
    return data.product;
  } catch (error) {
    console.error('Error fetching product from Open Food Facts:', error);
    throw error;
  }
};

/**
 * Clean and format tag strings (remove 'en:' prefix and format)
 */
const cleanTag = (tag: string): string => {
  return tag
    .replace(/^en:/i, '') // Remove 'en:' prefix
    .replace(/-/g, ' ') // Replace hyphens with spaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize
    .join(' ');
};

/**
 * Transform Open Food Facts product to our app's format
 */
export const transformToFoodData = (product: OpenFoodFactsProduct): TransformedProduct => {
  // Extract and format additives
  const additives = product.additives_tags?.map((tag: string) => {
    const match = tag.match(/e(\d+)/i);
    return match ? `E${match[1]}` : tag;
  }) || [];

  // Extract nutrition data
  const nutrition = product.nutriments ? {
    calories: product.nutriments['energy-kcal_100g'] || 0,
    protein: product.nutriments.proteins_100g || 0,
    fat: product.nutriments.fat_100g || 0,
    saturatedFat: product.nutriments['saturated-fat_100g'],
    carbs: product.nutriments.carbohydrates_100g || 0,
    sugar: product.nutriments.sugars_100g,
    fiber: product.nutriments.fiber_100g,
    sodium: product.nutriments.sodium_100g || (product.nutriments.salt_100g ? product.nutriments.salt_100g / 2.5 : undefined),
    servingSize: '100g'
  } : undefined;

  // Check for palm oil
  const hasPalmOil = product.ingredients_analysis_tags?.some(
    (tag: string) => tag.includes('palm-oil') && !tag.includes('palm-oil-free')
  ) || false;

  // Extract allergens
  const allergens = product.allergens_tags?.map(cleanTag) || [];

  // Extract traces
  const traces = product.traces_tags?.map(cleanTag) || [];

  // Extract labels (organic, vegan, gluten-free, etc.)
  const labels = product.labels_tags?.map(cleanTag) || [];

  // Extract stores
  const stores = product.stores_tags?.map(cleanTag) || [];

  // Determine vegan/vegetarian status from ingredients_analysis_tags
  const analysisiTags = product.ingredients_analysis_tags || [];
  const isVegan = analysisiTags.some(tag => tag === 'en:vegan');
  const isNonVegan = analysisiTags.some(tag => tag === 'en:non-vegan');
  const isVegetarian = analysisiTags.some(tag => tag === 'en:vegetarian');
  const isNonVegetarian = analysisiTags.some(tag => tag === 'en:non-vegetarian');

  let veganStatus: 'vegan' | 'non-vegan' | 'vegetarian' | 'non-vegetarian' | 'unknown' = 'unknown';
  if (isVegan) {
    veganStatus = 'vegan';
  } else if (isNonVegan) {
    veganStatus = 'non-vegan';
  } else if (isVegetarian) {
    veganStatus = 'vegetarian';
  } else if (isNonVegetarian) {
    veganStatus = 'non-vegetarian';
  }

  // Extract vitamins and minerals
  const vitamins = product.vitamins_tags?.map(cleanTag) || [];
  const minerals = product.minerals_tags?.map(cleanTag) || [];

  return {
    name: product.product_name || 'Unknown Product',
    brand: product.brands,
    barcode: product.code,
    ingredients: product.ingredients_text || '',
    additives,
    additivesCount: product.additives_n || additives.length,
    novaGroup: product.nova_group || undefined,
    nutrition,
    image: product.image_front_url || product.image_url,
    imageIngredients: product.image_ingredients_url,
    imageNutrition: product.image_nutrition_url,
    categories: product.categories?.split(',').map((c: string) => c.trim()) || [],
    hasPalmOil,
    // New fields
    allergens,
    traces,
    nutriScore: product.nutrition_grade_fr?.toUpperCase(),
    ecoScore: product.ecoscore_grade?.toUpperCase(),
    labels,
    stores,
    isVegan: isVegan || undefined,
    isVegetarian: isVegetarian || undefined,
    veganStatus,
    vitamins,
    minerals,
  };
};

/**
 * Validate barcode format
 */
export const isValidBarcode = (barcode: string): boolean => {
  // Check if barcode is numeric and has valid length
  // EAN-13: 13 digits, UPC-A: 12 digits, EAN-8: 8 digits
  const validLengths = [8, 12, 13];
  return /^\d+$/.test(barcode) && validLengths.includes(barcode.length);
};

/**
 * Format barcode for display
 */
export const formatBarcode = (barcode: string): string => {
  if (barcode.length === 13) {
    // EAN-13: XXX XXXX XXXX X
    return `${barcode.slice(0, 3)} ${barcode.slice(3, 7)} ${barcode.slice(7, 12)} ${barcode.slice(12)}`;
  } else if (barcode.length === 12) {
    // UPC-A: XXX XXX XXX XXX
    return `${barcode.slice(0, 3)} ${barcode.slice(3, 6)} ${barcode.slice(6, 9)} ${barcode.slice(9)}`;
  } else if (barcode.length === 8) {
    // EAN-8: XXXX XXXX
    return `${barcode.slice(0, 4)} ${barcode.slice(4)}`;
  }
  return barcode;
};
