// services/foodDataService.js
const USDA_API_KEY = process.env.REACT_APP_USDA_API_KEY;
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';
const PEXELS_API_KEY = process.env.REACT_APP_PEXELS_API_KEY;
const EDAMAM_APP_ID = process.env.REACT_APP_EDAMAM_APP_ID;
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
    
    // Process foods WITHOUT waiting for images - load them async
    const foods = data.foods.map(food => {
      const formattedFood = formatFoodData(food);
      // Set placeholder immediately
      formattedFood.image = getPlaceholderImage(formattedFood.name);
      // Load actual image asynchronously (non-blocking)
      loadImageAsync(formattedFood);
      return formattedFood;
    });

    return {
      foods: foods,
      totalResults: data.totalHits,
      currentPage: data.currentPage || pageNumber,
      totalPages: data.totalPages || Math.ceil(data.totalHits / pageSize)
    };
  } catch (error) {
    console.error('Error searching foods:', error);
    return { foods: [], totalResults: 0, error: error.message };
  }
};

// Non-blocking image loader
const loadImageAsync = (food) => {
  getFoodImage(food.name, food.brand).then(imageUrl => {
    food.image = imageUrl;
  }).catch(err => {
    console.warn('Failed to load image for', food.name, err);
    // Keep placeholder
  });
};

// Get placeholder image immediately
const getPlaceholderImage = (foodName) => {
  const shortName = encodeURIComponent(foodName.substring(0, 15));
  return `https://via.placeholder.com/300x200/2d4a2d/4ade80?text=${shortName}`;
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

// Get food image using multiple strategies with TIMEOUT
export const getFoodImage = async (foodName, brand = null) => {
  const cacheKey = `${foodName}_${brand || ''}`.toLowerCase();
  
  // Check cache first
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  let imageUrl = null;

  // Only try Edamam if keys are provided
  if (EDAMAM_APP_ID && EDAMAM_APP_KEY && EDAMAM_APP_ID.length > 0 && EDAMAM_APP_KEY.length > 0) {
    try {
      const searchTerm = brand ? `${brand} ${foodName}` : foodName;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(
        `https://api.edamam.com/api/food-database/v2/parser?app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}&ingr=${encodeURIComponent(searchTerm)}`,
        { 
          method: 'GET',
          signal: controller.signal 
        }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.hints?.[0]?.food?.image) {
          imageUrl = data.hints[0].food.image;
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Edamam request timeout for:', foodName);
      } else {
        console.warn('Edamam image fetch error:', error.message);
      }
    }
  }

  // Only try Pexels if key is provided and we don't have an image yet
  if (!imageUrl && PEXELS_API_KEY && PEXELS_API_KEY.length > 0) {
    try {
      const simplifiedName = foodName.split(',')[0].split('-')[0].trim();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(simplifiedName + ' food')}&per_page=1`,
        {
          headers: {
            'Authorization': PEXELS_API_KEY
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.photos?.[0]?.src?.medium) {
          imageUrl = data.photos[0].src.medium;
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Pexels request timeout for:', foodName);
      } else {
        console.warn('Pexels image fetch error:', error.message);
      }
    }
  }

  // Fallback to placeholder
  if (!imageUrl) {
    imageUrl = getPlaceholderImage(foodName);
  }

  // Cache the result
  imageCache.set(cacheKey, imageUrl);
  
  return imageUrl;
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
    const formattedFood = formatFoodData(data);
    formattedFood.image = getPlaceholderImage(formattedFood.name);
    // Load actual image async
    loadImageAsync(formattedFood);
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