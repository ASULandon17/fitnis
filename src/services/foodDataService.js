// services/foodDataService.js
import { supabase } from '../supabaseClient';

const USDA_API_KEY = process.env.REACT_APP_USDA_API_KEY;
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

export const searchFoods = async (query, pageSize = 25, pageNumber = 1) => {
  try {
    const response = await fetch(
      `${USDA_BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=${pageSize}&pageNumber=${pageNumber}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch foods');
    }

    const data = await response.json();
    return {
      foods: data.foods.map(food => formatFoodData(food)),
      totalResults: data.totalHits,
      currentPage: data.currentPage || pageNumber,
      totalPages: data.totalPages || Math.ceil(data.totalHits / pageSize)
    };
  } catch (error) {
    console.error('Error searching foods:', error);
    return { foods: [], totalResults: 0, error: error.message };
  }
};

const formatFoodData = (food) => {
  // Extract nutrients
  const nutrients = {};
  food.foodNutrients?.forEach(nutrient => {
    const name = nutrient.nutrientName?.toLowerCase();
    if (name?.includes('protein')) {
      nutrients.protein = nutrient.value || 0;
    } else if (name?.includes('carbohydrate')) {
      nutrients.carbs = nutrient.value || 0;
    } else if (name?.includes('fat') && !name.includes('fatty')) {
      nutrients.fat = nutrient.value || 0;
    } else if (name?.includes('energy') || name?.includes('calor')) {
      nutrients.calories = nutrient.value || 0;
    } else if (name?.includes('fiber')) {
      nutrients.fiber = nutrient.value || 0;
    } else if (name?.includes('sugars')) {
      nutrients.sugar = nutrient.value || 0;
    }
  });

  return {
    id: food.fdcId,
    name: food.description || food.lowercaseDescription,
    brand: food.brandOwner || food.brandName || null,
    servingSize: food.servingSize || 100,
    servingUnit: food.servingSizeUnit || 'g',
    calories: Math.round(nutrients.calories || 0),
    protein: Math.round((nutrients.protein || 0) * 10) / 10,
    carbs: Math.round((nutrients.carbs || 0) * 10) / 10,
    fat: Math.round((nutrients.fat || 0) * 10) / 10,
    fiber: Math.round((nutrients.fiber || 0) * 10) / 10,
    sugar: Math.round((nutrients.sugar || 0) * 10) / 10,
    dataType: food.dataType,
    category: food.foodCategory || null
  };
};

export const getFoodDetails = async (fdcId) => {
  try {
    const response = await fetch(
      `${USDA_BASE_URL}/food/${fdcId}?api_key=${USDA_API_KEY}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch food details');
    }

    const data = await response.json();
    return formatFoodData(data);
  } catch (error) {
    console.error('Error fetching food details:', error);
    return null;
  }
};

// Filter foods by macro requirements
export const filterFoodsByMacros = (foods, filters) => {
  return foods.filter(food => {
    if (filters.minProtein && food.protein < filters.minProtein) return false;
    if (filters.maxCalories && food.calories > filters.maxCalories) return false;
    if (filters.maxCarbs && food.carbs > filters.maxCarbs) return false;
    if (filters.maxFat && food.fat > filters.maxFat) return false;
    if (filters.minCalories && food.calories < filters.minCalories) return false;
    return true;
  });
};

// Calculate how much of a food is needed to hit a macro target
export const calculateServingsForTarget = (food, targetMacro, macroType) => {
  const foodMacro = food[macroType];
  if (!foodMacro || foodMacro === 0) return null;
  
  const servingsNeeded = targetMacro / foodMacro;
  const gramsNeeded = servingsNeeded * food.servingSize;
  
  return {
    servings: Math.round(servingsNeeded * 10) / 10,
    grams: Math.round(gramsNeeded),
    calories: Math.round(food.calories * servingsNeeded),
    protein: Math.round(food.protein * servingsNeeded * 10) / 10,
    carbs: Math.round(food.carbs * servingsNeeded * 10) / 10,
    fat: Math.round(food.fat * servingsNeeded * 10) / 10
  };
};

export const saveFoodToCache = async (food) => {
  const { error } = await supabase
    .from('foods')
    .upsert({
      id: food.id,
      ...food,
      last_updated: new Date().toISOString()
    }, {
      onConflict: 'id',
      update: ['search_count']
    });
  
  if (error) console.error('Error caching food:', error);
};