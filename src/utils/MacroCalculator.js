/**
 * Macro Calculator Utility
 * Uses Mifflin-St Jeor Equation for BMR calculation
 */

// Activity level multipliers
export const ACTIVITY_LEVELS = {
  sedentary: {
    multiplier: 1.2,
    label: 'Sedentary',
    description: 'Little or no exercise, desk job'
  },
  lightly_active: {
    multiplier: 1.375,
    label: 'Lightly Active',
    description: 'Light exercise or sports 1-3 days per week'
  },
  moderately_active: {
    multiplier: 1.55,
    label: 'Moderately Active',
    description: 'Moderate exercise or sports 3-5 days per week'
  },
  very_active: {
    multiplier: 1.725,
    label: 'Very Active',
    description: 'Hard exercise or sports 6-7 days per week'
  },
  extremely_active: {
    multiplier: 1.9,
    label: 'Extremely Active',
    description: 'Very hard exercise, physical job, or training twice per day'
  }
};

// Weight change rates (kg per week)
export const WEIGHT_CHANGE_RATES = {
  lose: [
    { value: 0.25, label: '0.25 kg (0.5 lbs) - Slow & Sustainable' },
    { value: 0.5, label: '0.5 kg (1 lb) - Moderate' },
    { value: 0.75, label: '0.75 kg (1.5 lbs) - Aggressive' },
    { value: 1.0, label: '1 kg (2 lbs) - Very Aggressive' }
  ],
  maintain: [
    { value: 0, label: 'Maintain current weight' }
  ],
  gain: [
    { value: 0.25, label: '0.25 kg (0.5 lbs) - Lean Gains' },
    { value: 0.5, label: '0.5 kg (1 lb) - Moderate' },
    { value: 0.75, label: '0.75 kg (1.5 lbs) - Aggressive' },
    { value: 1.0, label: '1 kg (2 lbs) - Very Aggressive' }
  ]
};

/**
 * Calculate BMR using Mifflin-St Jeor Equation
 * Men: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
 * Women: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
 */
export const calculateBMR = (weight_kg, height_cm, age, sex) => {
  const base = (10 * weight_kg) + (6.25 * height_cm) - (5 * age);
  return sex === 'male' ? base + 5 : base - 161;
};

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 * TDEE = BMR × Activity Level Multiplier
 */
export const calculateTDEE = (bmr, activityLevel) => {
  const multiplier = ACTIVITY_LEVELS[activityLevel]?.multiplier || 1.2;
  return bmr * multiplier;
};

/**
 * Calculate target calories based on weight goal
 * 1 kg of body weight = approximately 7700 calories
 */
export const calculateTargetCalories = (tdee, weightGoal, weightChangeRate) => {
  if (weightGoal === 'maintain') {
    return tdee;
  }
  
  // Calculate weekly calorie adjustment
  const caloriesPerKg = 7700;
  const weeklyCalorieAdjustment = weightChangeRate * caloriesPerKg;
  const dailyCalorieAdjustment = weeklyCalorieAdjustment / 7;
  
  if (weightGoal === 'lose') {
    return tdee - dailyCalorieAdjustment;
  } else if (weightGoal === 'gain') {
    return tdee + dailyCalorieAdjustment;
  }
  
  return tdee;
};

/**
 * Calculate macro distribution
 * Protein: 1.8-2.2g per kg of body weight (higher for cutting, lower for bulking)
 * Fat: 20-35% of total calories
 * Carbs: Remaining calories
 */
export const calculateMacros = (targetCalories, weight_kg, weightGoal, macroPreference) => {
  // Protein calculation (in grams)
  // More protein when losing weight to preserve muscle
  let proteinPerKg;
  if (weightGoal === 'lose') {
    proteinPerKg = 2.2; // Higher protein for muscle preservation
  } else if (weightGoal === 'gain') {
    proteinPerKg = 1.8; // Moderate protein for muscle building
  } else {
    proteinPerKg = 2.0; // Maintenance
  }
  
  const proteinGrams = weight_kg * proteinPerKg;
  const proteinCalories = proteinGrams * 4; // 4 calories per gram of protein
  
  // Fat calculation (in grams)
  let fatPercentage;
  if (macroPreference === 'low_carb') {
    fatPercentage = 0.35; // 35% of calories from fat
  } else if (macroPreference === 'low_fat') {
    fatPercentage = 0.20; // 20% of calories from fat
  } else {
    fatPercentage = 0.25; // 25% of calories from fat (balanced)
  }
  
  const fatCalories = targetCalories * fatPercentage;
  const fatGrams = fatCalories / 9; // 9 calories per gram of fat
  
  // Carbs get the remaining calories
  const carbCalories = targetCalories - proteinCalories - fatCalories;
  const carbGrams = carbCalories / 4; // 4 calories per gram of carbs
  
  return {
    protein: Math.round(proteinGrams),
    carbs: Math.round(carbGrams),
    fat: Math.round(fatGrams)
  };
};

/**
 * Complete macro calculation
 */
export const calculateCompleteMacros = (userData) => {
  const {
    age,
    sex,
    height_cm,
    weight_kg,
    activity_level,
    weight_goal,
    weight_change_rate,
    macro_preference
  } = userData;
  
  // Calculate BMR
  const bmr = calculateBMR(weight_kg, height_cm, age, sex);
  
  // Calculate TDEE
  const tdee = calculateTDEE(bmr, activity_level);
  
  // Calculate target calories
  const targetCalories = calculateTargetCalories(tdee, weight_goal, weight_change_rate);
  
  // Calculate macros
  const macros = calculateMacros(targetCalories, weight_kg, weight_goal, macro_preference);
  
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories: Math.round(targetCalories),
    protein: macros.protein,
    carbs: macros.carbs,
    fat: macros.fat
  };
};

/**
 * Unit conversion utilities
 */
export const convertLbsToKg = (lbs) => lbs * 0.453592;
export const convertKgToLbs = (kg) => kg * 2.20462;
export const convertInchesToCm = (inches) => inches * 2.54;
export const convertCmToInches = (cm) => cm / 2.54;
export const convertFeetInchesToCm = (feet, inches) => {
  const totalInches = (feet * 12) + inches;
  return convertInchesToCm(totalInches);
};