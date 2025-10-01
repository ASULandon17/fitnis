// services/foodDataService.js
const USDA_API_KEY = process.env.REACT_APP_USDA_API_KEY;
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';
const PEXELS_API_KEY = process.env.REACT_APP_PEXELS_API_KEY; // Free API for food images
const EDAMAM_APP_ID = process.env.REACT_APP_EDAMAM_APP_ID; // Alternative for food images
const EDAMAM_APP_KEY = process.env.REACT_APP_EDAMAM_APP_KEY;

// Cache for food images to reduce API calls
const imageCache = new Map();

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
    
    // Process foods and add images
    const foodsWithImages = await Promise.all(
      data.foods.map(async (food) => {
        const formattedFood = formatFoodData(food);
        formattedFood.image = await getFoodImage(formattedFood.name, formattedFood.brand);
        return formattedFood;
      })
    );

    return {
      foods: foodsWithImages,
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

// Get food image using multiple strategies
export const getFoodImage = async (foodName, brand = null) => {
  const cacheKey = `${foodName}_${brand || ''}`.toLowerCase();
  
  // Check cache first
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  let imageUrl = null;

  // Try Edamam first (better food-specific images)
  if (EDAMAM_APP_ID && EDAMAM_APP_KEY) {
    try {
      const searchTerm = brand ? `${brand} ${foodName}` : foodName;
      const response = await fetch(
        `https://api.edamam.com/api/food-database/v2/parser?app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}&ingr=${encodeURIComponent(searchTerm)}`,
        { method: 'GET' }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.hints?.[0]?.food?.image) {
          imageUrl = data.hints[0].food.image;
        }
      }
    } catch (error) {
      console.error('Edamam image fetch error:', error);
    }
  }

  // Fallback to Pexels for generic food images
  if (!imageUrl && PEXELS_API_KEY) {
    try {
      const simplifiedName = foodName.split(',')[0].split('-')[0].trim();
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(simplifiedName + ' food')}&per_page=1`,
        {
          headers: {
            'Authorization': PEXELS_API_KEY
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.photos?.[0]?.src?.medium) {
          imageUrl = data.photos[0].src.medium;
        }
      }
    } catch (error) {
      console.error('Pexels image fetch error:', error);
    }
  }

  // Fallback to placeholder
  if (!imageUrl) {
    imageUrl = `https://via.placeholder.com/300x200/2d4a2d/4ade80?text=${encodeURIComponent(foodName.substring(0, 20))}`;
  }

  // Cache the result
  imageCache.set(cacheKey, imageUrl);
  
  return imageUrl;
};

// Existing functions...
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
    const formattedFood = formatFoodData(data);
    formattedFood.image = await getFoodImage(formattedFood.name, formattedFood.brand);
    return formattedFood;
  } catch (error) {
    console.error('Error fetching food details:', error);
    return null;
  }
};

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