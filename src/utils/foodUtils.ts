export const getIngredientCount = (ingredientsText?: string, description?: string): number => {
  const text = ingredientsText || description || '';
  if (!text) return 0;
  
  // Split by common delimiters and clean up
  const ingredients = text
    .split(/[,;]/)
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .filter(item => item.length < 100); // Remove suspiciously long strings
    
  return ingredients.length;
};