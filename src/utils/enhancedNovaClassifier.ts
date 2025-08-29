import { supabase } from '../services/supabase/config';

export interface NovaClassificationResult {
  nova_group: number;
  explanation: string;
  nova_details: {
    foundIndicators: string[];
    criticalCount: number;
    ingredientCount: number;
    confidence: number;
  };
  contains_seed_oils: boolean;
  confidence: number;
}

// Critical NOVA 4 indicators (ultra-processed markers)
const NOVA_4_INDICATORS = [
  // Flavorings
  'natural flavoring', 'natural flavouring', 'artificial flavoring', 'artificial flavouring',
  'natural flavor', 'artificial flavor', 'flavoring', 'flavouring', 'flavor',
  
  // Sweeteners
  'aspartame', 'sucralose', 'acesulfame k', 'acesulfame potassium', 'saccharin',
  'stevia extract', 'monk fruit extract', 'high fructose corn syrup',
  'corn syrup solids', 'maltodextrin', 'dextrose',
  
  // Emulsifiers & Thickeners
  'carrageenan', 'xanthan gum', 'guar gum', 'locust bean gum',
  'soy lecithin', 'sunflower lecithin', 'lecithin',
  'polydextrose', 'cellulose gum', 'microcrystalline cellulose',
  
  // Preservatives
  'sodium benzoate', 'potassium sorbate', 'calcium propionate',
  'sodium nitrite', 'sodium nitrate', 'bht', 'bha',
  'tbhq', 'sodium metabisulfite',
  
  // Modified ingredients
  'modified starch', 'modified corn starch', 'modified potato starch',
  'protein isolate', 'soy protein isolate', 'whey protein isolate',
  'hydrolyzed protein', 'autolyzed yeast',
  
  // Stabilizers
  'stabilizer', 'stabiliser', 'emulsifier', 'thickener',
  'anti-caking agent', 'humectant', 'sequestrant',
  
  // Other indicators
  'monosodium glutamate', 'msg', 'yeast extract',
  'natural identical flavoring', 'nature identical flavouring'
];

// E-numbers (European food additives)
const E_NUMBER_PATTERN = /\bE\d{3,4}[a-z]*\b/gi;

// Seed oils to detect
const SEED_OILS = [
  'canola oil', 'rapeseed oil', 'soybean oil', 'soy oil',
  'corn oil', 'sunflower oil', 'safflower oil', 'cottonseed oil',
  'grapeseed oil', 'rice bran oil', 'vegetable oil'
];

// NOVA 1 indicators (minimally processed)
const NOVA_1_INDICATORS = [
  'water', 'milk', 'flour', 'rice', 'pasta', 'meat', 'fish',
  'vegetables', 'fruits', 'nuts', 'seeds', 'eggs', 'beans',
  'lentils', 'quinoa', 'oats', 'barley'
];

// NOVA 2 indicators (culinary ingredients)
const NOVA_2_INDICATORS = [
  'salt', 'sugar', 'honey', 'maple syrup', 'olive oil',
  'coconut oil', 'butter', 'lard', 'vinegar', 'vanilla extract'
];

function parseIngredients(text: string): string[] {
  if (!text) return [];
  
  // Clean the text
  let cleaned = text
    .toLowerCase()
    .replace(/ingredients?:?\s*/i, '') // Remove "ingredients:" prefix
    .replace(/\([^)]*\)/g, '') // Remove parentheses and contents
    .replace(/\[[^\]]*\]/g, '') // Remove brackets and contents
    .replace(/\.\s*$/, '') // Remove trailing period
    .trim();
  
  // Split by common delimiters
  const ingredients = cleaned
    .split(/[,;]\s*/)
    .map(ingredient => ingredient.trim())
    .filter(ingredient => 
      ingredient.length > 0 && 
      !ingredient.match(/^\d+$/) && // Remove pure numbers
      ingredient.length < 100 // Remove suspiciously long strings
    );
    
  return ingredients;
}

function findCriticalNova4Indicators(text: string): string[] {
  const lowerText = text.toLowerCase();
  const foundIndicators: string[] = [];
  
  // Check for explicit NOVA 4 indicators
  for (const indicator of NOVA_4_INDICATORS) {
    if (lowerText.includes(indicator.toLowerCase())) {
      foundIndicators.push(indicator);
    }
  }
  
  // Check for E-numbers
  const eNumbers = text.match(E_NUMBER_PATTERN) || [];
  foundIndicators.push(...eNumbers);
  
  return [...new Set(foundIndicators)]; // Remove duplicates
}

function detectSeedOils(text: string): boolean {
  const lowerText = text.toLowerCase();
  return SEED_OILS.some(oil => lowerText.includes(oil.toLowerCase()));
}

function calculateConfidence(
  criticalIndicators: string[], 
  ingredientCount: number,
  novaGroup: number
): number {
  if (criticalIndicators.length > 0) {
    return Math.min(0.9, 0.7 + (criticalIndicators.length * 0.1));
  }
  
  if (novaGroup === 1 && ingredientCount <= 2) return 0.85;
  if (novaGroup === 2 && ingredientCount <= 5) return 0.75;
  if (novaGroup === 3) return 0.6;
  
  return 0.5;
}

export async function classifyFoodByIngredients(text: string): Promise<NovaClassificationResult> {
  try {
    if (!text || text.trim().length === 0) {
      return {
        nova_group: 3,
        explanation: 'Unable to analyze - no ingredients text provided',
        nova_details: {
          foundIndicators: [],
          criticalCount: 0,
          ingredientCount: 0,
          confidence: 0.3
        },
        contains_seed_oils: false,
        confidence: 0.3
      };
    }
    
    const ingredients = parseIngredients(text);
    const criticalIndicators = findCriticalNova4Indicators(text);
    const containsSeedOils = detectSeedOils(text);
    
    // NOVA 4: Ultra-processed foods
    if (criticalIndicators.length > 0) {
      const confidence = calculateConfidence(criticalIndicators, ingredients.length, 4);
      
      return {
        nova_group: 4,
        explanation: `Ultra-processed food detected. Contains ${criticalIndicators.length} ultra-processed indicator(s): ${criticalIndicators.slice(0, 3).join(', ')}${criticalIndicators.length > 3 ? '...' : ''}.`,
        nova_details: {
          foundIndicators: criticalIndicators,
          criticalCount: criticalIndicators.length,
          ingredientCount: ingredients.length,
          confidence
        },
        contains_seed_oils: containsSeedOils,
        confidence
      };
    }
    
    // NOVA 1: Unprocessed or minimally processed
    if (ingredients.length === 1) {
      const singleIngredient = ingredients[0];
      const isNova1 = NOVA_1_INDICATORS.some(indicator => 
        singleIngredient.includes(indicator)
      );
      
      if (isNova1) {
        return {
          nova_group: 1,
          explanation: 'Single, minimally processed ingredient.',
          nova_details: {
            foundIndicators: [],
            criticalCount: 0,
            ingredientCount: 1,
            confidence: 0.85
          },
          contains_seed_oils: containsSeedOils,
          confidence: 0.85
        };
      }
    }
    
    // NOVA 2: Processed culinary ingredients
    if (ingredients.length <= 3) {
      const isNova2 = ingredients.every(ingredient =>
        NOVA_2_INDICATORS.some(indicator => ingredient.includes(indicator)) ||
        NOVA_1_INDICATORS.some(indicator => ingredient.includes(indicator))
      );
      
      if (isNova2) {
        return {
          nova_group: 2,
          explanation: `Processed culinary ingredient with ${ingredients.length} simple ingredient(s).`,
          nova_details: {
            foundIndicators: [],
            criticalCount: 0,
            ingredientCount: ingredients.length,
            confidence: 0.75
          },
          contains_seed_oils: containsSeedOils,
          confidence: 0.75
        };
      }
    }
    
    // NOVA 3: Processed foods (default for multi-ingredient foods without ultra-processed markers)
    return {
      nova_group: 3,
      explanation: `Processed food with ${ingredients.length} ingredients. No ultra-processed markers detected.`,
      nova_details: {
        foundIndicators: [],
        criticalCount: 0,
        ingredientCount: ingredients.length,
        confidence: 0.6
      },
      contains_seed_oils: containsSeedOils,
      confidence: 0.6
    };
    
  } catch (error) {
    console.error('Classification error:', error);
    return {
      nova_group: 3,
      explanation: 'Classification failed - defaulting to processed food',
      nova_details: {
        foundIndicators: [],
        criticalCount: 0,
        ingredientCount: 0,
        confidence: 0.3
      },
      contains_seed_oils: false,
      confidence: 0.3
    };
  }
}

// Helper function to get database indicators (future enhancement)
export async function loadIndicatorsFromDatabase(): Promise<void> {
  try {
    const { data: indicators } = await supabase
      .from('ingredient_indicators')
      .select('*');
      
    if (indicators) {
      // Could enhance the classification with database indicators
      console.log('Loaded indicators from database:', indicators.length);
    }
  } catch (error) {
    console.warn('Could not load indicators from database:', error);
  }
}