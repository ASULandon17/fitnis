// components/MealBuilder.js
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { searchFoods } from '../services/foodDataService';
import { 
  createMeal, 
  updateMeal, 
  addFoodToMeal, 
  removeFoodFromMeal,
  updateFoodQuantity 
} from '../services/mealService';
import './MealBuilder.css';

function MealBuilder({ existingMeal = null, onClose, onSave }) {
  const { currentUser } = useAuth();
  
  const [mealName, setMealName] = useState(existingMeal?.name || '');
  const [mealType, setMealType] = useState(existingMeal?.type || 'other');
  const [mealFoods, setMealFoods] = useState(existingMeal?.meal_foods || []);
  const [currentMealId, setCurrentMealId] = useState(existingMeal?.id || null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Calculate meal totals
  const mealTotals = mealFoods.reduce((acc, food) => {
    const quantity = food.quantity || 1;
    return {
      calories: acc.calories + (food.calories || 0),
      protein: acc.protein + (food.protein || 0),
      carbs: acc.carbs + (food.carbs || 0),
      fat: acc.fat + (food.fat || 0)
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const handleFoodSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    const results = await searchFoods(searchQuery, 10);
    setSearchResults(results.foods || []);
    setSearching(false);
  };

  const handleAddFood = async (food) => {
  // Ensure food has an image
  if (!food.image) {
    food.image = `https://via.placeholder.com/60x60/2d4a2d/4ade80?text=${encodeURIComponent(food.name.substring(0, 10))}`;
  }
  
  // If meal doesn't exist yet, create it first
  if (!currentMealId) {
    const { data: newMeal, error } = await createMeal(currentUser.id, {
      name: mealName || 'Untitled Meal',
      type: mealType
    });
    
    if (error) {
      console.error('Error creating meal:', error);
      setMessage('Error creating meal: ' + error.message);
      return;
    }
    
    setCurrentMealId(newMeal.id);
    
    // Add food to the new meal
    const { data: mealFood, error: addError } = await addFoodToMeal(newMeal.id, food);
    if (addError) {
      console.error('Error adding food:', addError);
      setMessage('Error adding food');
    } else if (mealFood) {
      setMealFoods([...mealFoods, { ...mealFood, food_image_url: food.image }]);
    }
  } else {
    // Add to existing meal
    const { data: mealFood, error } = await addFoodToMeal(currentMealId, food);
    if (error) {
      console.error('Error adding food:', error);
      setMessage('Error adding food');
    } else if (mealFood) {
      setMealFoods([...mealFoods, { ...mealFood, food_image_url: food.image }]);
    }
  }
  
  // Clear search
  setSearchQuery('');
  setSearchResults([]);
};

  const handleRemoveFood = async (mealFood) => {
    if (!currentMealId) {
      // If meal not saved yet, just remove from local state
      setMealFoods(mealFoods.filter(f => f !== mealFood));
      return;
    }
    
    const { error } = await removeFoodFromMeal(mealFood.id, currentMealId);
    if (!error) {
      setMealFoods(mealFoods.filter(f => f.id !== mealFood.id));
    }
  };

  const handleQuantityChange = async (mealFood, newQuantity) => {
    if (newQuantity < 0.1) return;
    
    // Calculate base nutrition (per 1 serving)
    const baseNutrition = {
      calories: mealFood.calories / mealFood.quantity,
      protein: mealFood.protein / mealFood.quantity,
      carbs: mealFood.carbs / mealFood.quantity,
      fat: mealFood.fat / mealFood.quantity
    };
    
    if (currentMealId && mealFood.id) {
      await updateFoodQuantity(mealFood.id, currentMealId, newQuantity, baseNutrition);
    }
    
    // Update local state
    setMealFoods(mealFoods.map(f => {
      if (f === mealFood || f.id === mealFood.id) {
        return {
          ...f,
          quantity: newQuantity,
          calories: baseNutrition.calories * newQuantity,
          protein: baseNutrition.protein * newQuantity,
          carbs: baseNutrition.carbs * newQuantity,
          fat: baseNutrition.fat * newQuantity
        };
      }
      return f;
    }));
  };

  const handleSaveMeal = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      if (!currentMealId) {
        // Create new meal if it doesn't exist
        const { data: newMeal, error } = await createMeal(currentUser.id, {
          name: mealName || 'Untitled Meal',
          type: mealType,
          ...mealTotals
        });
        
        if (error) throw error;
        setCurrentMealId(newMeal.id);
        
        // Add all foods to the meal
        for (const food of mealFoods) {
          await addFoodToMeal(newMeal.id, food);
        }
      } else {
        // Update existing meal
        await updateMeal(currentMealId, {
          name: mealName,
          type: mealType,
          ...mealTotals
        });
      }
      
      setMessage('Meal saved successfully!');
      if (onSave) onSave();
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    } catch (error) {
      setMessage('Error saving meal');
      console.error('Save error:', error);
    }
    
    setSaving(false);
  };

  return (
    <div className="meal-builder">
      <div className="meal-builder-header">
        <h2>{existingMeal ? 'Edit Meal' : 'Create New Meal'}</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="meal-details">
        <div className="meal-info-row">
          <div className="input-group">
            <label>Meal Name</label>
            <input
              type="text"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              placeholder="Enter meal name"
              className="meal-name-input"
            />
          </div>
          
          <div className="input-group">
            <label>Meal Type</label>
            <select 
              value={mealType} 
              onChange={(e) => setMealType(e.target.value)}
              className="meal-type-select"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Meal Totals */}
        <div className="meal-totals">
          <h3>Meal Totals</h3>
          <div className="totals-grid">
            <div className="total-item">
              <span className="total-value">{Math.round(mealTotals.calories)}</span>
              <span className="total-label">Calories</span>
            </div>
            <div className="total-item">
              <span className="total-value">{Math.round(mealTotals.protein * 10) / 10}g</span>
              <span className="total-label">Protein</span>
            </div>
            <div className="total-item">
              <span className="total-value">{Math.round(mealTotals.carbs * 10) / 10}g</span>
              <span className="total-label">Carbs</span>
            </div>
            <div className="total-item">
              <span className="total-value">{Math.round(mealTotals.fat * 10) / 10}g</span>
              <span className="total-label">Fat</span>
            </div>
          </div>
        </div>
      </div>

      {/* Food Search */}
      <div className="food-search-section">
        <h3>Add Foods to Meal</h3>
        <div className="search-bar">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleFoodSearch()}
            placeholder="Search for foods to add..."
            className="search-input"
          />
          <button 
            onClick={handleFoodSearch}
            disabled={searching}
            className="search-btn"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="search-results-dropdown">
            {searchResults.map((food) => (
              <div key={food.id} className="search-result-item">
                <img 
                  src={food.image} 
                  alt={food.name}
                  className="food-thumbnail"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/60x60/2d4a2d/4ade80?text=Food';
                  }}
                />
                <div className="food-info">
                  <div className="food-name">{food.name}</div>
                  {food.brand && <div className="food-brand">{food.brand}</div>}
                  <div className="food-macros-mini">
                    {food.calories} cal | P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g
                  </div>
                </div>
                <button 
                  className="add-food-btn"
                  onClick={() => handleAddFood(food)}
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current Meal Foods */}
      <div className="meal-foods-section">
        <h3>Foods in This Meal</h3>
        {mealFoods.length === 0 ? (
          <div className="empty-meal">
            <p>No foods added yet. Search and add foods above!</p>
          </div>
        ) : (
          <div className="meal-foods-list">
            {mealFoods.map((food, index) => (
              <div key={food.id || index} className="meal-food-item">
                <img 
                  src={food.food_image_url} 
                  alt={food.food_name}
                  className="food-thumbnail"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/60x60/2d4a2d/4ade80?text=Food';
                  }}
                />
                <div className="food-details">
                  <div className="food-name">{food.food_name}</div>
                  {food.food_brand && <div className="food-brand">{food.food_brand}</div>}
                  <div className="food-macros-mini">
                    {Math.round(food.calories)} cal | 
                    P: {Math.round(food.protein * 10) / 10}g | 
                    C: {Math.round(food.carbs * 10) / 10}g | 
                    F: {Math.round(food.fat * 10) / 10}g
                  </div>
                </div>
                <div className="quantity-controls">
                  <label>Qty:</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={food.quantity || 1}
                    onChange={(e) => handleQuantityChange(food, parseFloat(e.target.value))}
                    className="quantity-input"
                  />
                  <span className="serving-info">
                    × {food.serving_size}{food.serving_unit}
                  </span>
                </div>
                <button 
                  className="remove-food-btn"
                  onClick={() => handleRemoveFood(food)}
                  title="Remove from meal"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="meal-builder-actions">
        <button className="cancel-btn" onClick={onClose}>
          Cancel
        </button>
        <button 
          className="save-meal-btn"
          onClick={handleSaveMeal}
          disabled={saving || mealFoods.length === 0}
        >
          {saving ? 'Saving...' : 'Save Meal'}
        </button>
      </div>
    </div>
  );
}

export default MealBuilder;