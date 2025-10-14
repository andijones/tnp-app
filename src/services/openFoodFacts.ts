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
    carbs: product.nutriments.carbohydrates_100g || 0,
    sugar: product.nutriments.sugars_100g,
    fiber: product.nutriments.fiber_100g,
    sodium: product.nutriments.sodium_100g || (product.nutriments.salt_100g ? product.nutriments.salt_100g / 2.5 : undefined),
    servingSize: '100g'
  } : undefined;

  // Check for palm oil
  const hasPalmOil = product.ingredients_analysis_tags?.some(
    (tag: string) => tag.includes('palm-oil')
  ) || false;

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
