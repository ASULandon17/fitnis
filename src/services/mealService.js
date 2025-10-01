// services/mealService.js
import { supabase } from '../supabaseClient';

export const createMeal = async (userId, mealData) => {
  try {
    const { data, error } = await supabase
      .from('meals')
      .insert({
        user_id: userId,
        name: mealData.name || 'Untitled Meal',
        type: mealData.type || 'other',
        is_favorite: mealData.is_favorite || false,
        total_calories: mealData.total_calories || 0,
        total_protein: mealData.total_protein || 0,
        total_carbs: mealData.total_carbs || 0,
        total_fat: mealData.total_fat || 0
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating meal:', error);
    return { data: null, error };
  }
};

export const updateMeal = async (mealId, updates) => {
  try {
    const { data, error } = await supabase
      .from('meals')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', mealId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating meal:', error);
    return { data: null, error };
  }
};

export const deleteMeal = async (mealId) => {
  try {
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', mealId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting meal:', error);
    return { error };
  }
};

export const getUserMeals = async (userId, filters = {}) => {
  try {
    let query = supabase
      .from('meals')
      .select(`
        *,
        meal_foods(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.type && filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }
    
    if (filters.favorite === true) {
      query = query.eq('is_favorite', true);
    }
    
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'name':
          query = query.order('name', { ascending: true });
          break;
        case 'date':
          query = query.order('created_at', { ascending: false });
          break;
        case 'calories':
          query = query.order('total_calories', { ascending: false });
          break;
        default:
          break;
      }
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching meals:', error);
    return { data: [], error };
  }
};

export const addFoodToMeal = async (mealId, food, quantity = 1) => {
  try {
    const { data, error } = await supabase
      .from('meal_foods')
      .insert({
        meal_id: mealId,
        food_id: food.id,
        food_name: food.name,
        food_brand: food.brand,
        food_image_url: food.image,
        quantity: quantity,
        serving_size: food.servingSize,
        serving_unit: food.servingUnit,
        calories: food.calories * quantity,
        protein: food.protein * quantity,
        carbs: food.carbs * quantity,
        fat: food.fat * quantity
      })
      .select()
      .single();

    if (error) throw error;

    // Update meal totals
    await updateMealTotals(mealId);

    return { data, error: null };
  } catch (error) {
    console.error('Error adding food to meal:', error);
    return { data: null, error };
  }
};

export const removeFoodFromMeal = async (mealFoodId, mealId) => {
  try {
    const { error } = await supabase
      .from('meal_foods')
      .delete()
      .eq('id', mealFoodId);

    if (error) throw error;

    // Update meal totals
    await updateMealTotals(mealId);

    return { error: null };
  } catch (error) {
    console.error('Error removing food from meal:', error);
    return { error };
  }
};

export const updateFoodQuantity = async (mealFoodId, mealId, newQuantity, baseNutrition) => {
  try {
    const { error } = await supabase
      .from('meal_foods')
      .update({
        quantity: newQuantity,
        calories: baseNutrition.calories * newQuantity,
        protein: baseNutrition.protein * newQuantity,
        carbs: baseNutrition.carbs * newQuantity,
        fat: baseNutrition.fat * newQuantity
      })
      .eq('id', mealFoodId);

    if (error) throw error;

    // Update meal totals
    await updateMealTotals(mealId);

    return { error: null };
  } catch (error) {
    console.error('Error updating food quantity:', error);
    return { error };
  }
};

export const updateMealTotals = async (mealId) => {
  try {
    // Get all foods in the meal
    const { data: mealFoods, error: fetchError } = await supabase
      .from('meal_foods')
      .select('*')
      .eq('meal_id', mealId);

    if (fetchError) throw fetchError;

    // Calculate totals
    const totals = mealFoods.reduce((acc, food) => {
      return {
        calories: acc.calories + (food.calories || 0),
        protein: acc.protein + (food.protein || 0),
        carbs: acc.carbs + (food.carbs || 0),
        fat: acc.fat + (food.fat || 0)
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    // Update meal
    const { error: updateError } = await supabase
      .from('meals')
      .update({
        total_calories: Math.round(totals.calories),
        total_protein: Math.round(totals.protein * 10) / 10,
        total_carbs: Math.round(totals.carbs * 10) / 10,
        total_fat: Math.round(totals.fat * 10) / 10,
        updated_at: new Date().toISOString()
      })
      .eq('id', mealId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error updating meal totals:', error);
  }
};

export const toggleMealFavorite = async (mealId, currentStatus) => {
  try {
    const { error } = await supabase
      .from('meals')
      .update({ is_favorite: !currentStatus })
      .eq('id', mealId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return { error };
  }
};