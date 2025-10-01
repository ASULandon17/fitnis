// components/MyMeals.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getUserMeals, 
  deleteMeal, 
  toggleMealFavorite 
} from '../services/mealService';
import MealBuilder from './MealBuilder';
import './MyMeals.css';

function MyMeals() {
  const { currentUser, userProfile } = useAuth();
  
  const [meals, setMeals] = useState([]);
  const [filteredMeals, setFilteredMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [showMealBuilder, setShowMealBuilder] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    type: 'all',
    favorite: false,
    sortBy: 'date'
  });
  
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadMeals();
    }
  }, [currentUser]);

  useEffect(() => {
    applyFilters();
  }, [meals, filters, searchTerm]);

  const loadMeals = async () => {
    setLoading(true);
    const { data, error } = await getUserMeals(currentUser.id);
    if (!error) {
      setMeals(data || []);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...meals];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(meal => 
        meal.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(meal => meal.type === filters.type);
    }
    
    // Favorite filter
    if (filters.favorite) {
      filtered = filtered.filter(meal => meal.is_favorite);
    }
    
    // Sorting
    switch (filters.sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'calories':
        filtered.sort((a, b) => b.total_calories - a.total_calories);
        break;
      case 'date':
      default:
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }
    
    setFilteredMeals(filtered);
  };

  const handleDeleteMeal = async (mealId) => {
    if (window.confirm('Are you sure you want to delete this meal?')) {
      const { error } = await deleteMeal(mealId);
      if (!error) {
        setMeals(meals.filter(m => m.id !== mealId));
        if (selectedMeal?.id === mealId) {
          setSelectedMeal(null);
        }
      }
    }
  };

  const handleToggleFavorite = async (meal) => {
    const { error } = await toggleMealFavorite(meal.id, meal.is_favorite);
    if (!error) {
      setMeals(meals.map(m => 
        m.id === meal.id ? { ...m, is_favorite: !m.is_favorite } : m
      ));
    }
  };

  const handleEditMeal = (meal) => {
    setEditingMeal(meal);
    setShowMealBuilder(true);
  };

  const getMealTypeIcon = (type) => {
    switch (type) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      case 'snack': return '🍿';
      default: return '🍽️';
    }
  };

  const getMacroPercentages = (meal) => {
    const totalCalories = meal.total_calories || 1;
    return {
      protein: Math.round((meal.total_protein * 4 / totalCalories) * 100),
      carbs: Math.round((meal.total_carbs * 4 / totalCalories) * 100),
      fat: Math.round((meal.total_fat * 9 / totalCalories) * 100)
    };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your meals...</p>
      </div>
    );
  }

  return (
    <div className="my-meals-container">
      <div className="meals-header">
        <h2>My Saved Meals</h2>
        <button 
          className="create-meal-btn"
          onClick={() => {
            setEditingMeal(null);
            setShowMealBuilder(true);
          }}
        >
          + Create New Meal
        </button>
      </div>

      {/* Filters and Search */}
      <div className="meals-filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search meals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="meal-search-input"
          />
        </div>
        
        <div className="filter-controls">
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
            <option value="other">Other</option>
          </select>
          
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            className="filter-select"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="calories">Sort by Calories</option>
          </select>
          
          <button
            className={`filter-btn ${filters.favorite ? 'active' : ''}`}
            onClick={() => setFilters({ ...filters, favorite: !filters.favorite })}
          >
            ⭐ Favorites Only
          </button>
        </div>
        
        <div className="results-count">
          Showing {filteredMeals.length} of {meals.length} meals
        </div>
      </div>

      {/* Meals Grid */}
      {filteredMeals.length === 0 ? (
        <div className="no-meals">
          <div className="no-meals-icon">🍽️</div>
          <h3>No meals found</h3>
          <p>
            {meals.length === 0 
              ? "You haven't created any meals yet. Click 'Create New Meal' to get started!"
              : "Try adjusting your filters or search term"}
          </p>
        </div>
      ) : (
        <div className="meals-grid">
          {filteredMeals.map((meal) => {
            const percentages = getMacroPercentages(meal);
            
            return (
              <div 
                key={meal.id} 
                className={`meal-card ${selectedMeal?.id === meal.id ? 'selected' : ''}`}
                onClick={() => setSelectedMeal(meal.id === selectedMeal?.id ? null : meal)}
              >
                <div className="meal-card-header">
                  <div className="meal-type-icon">{getMealTypeIcon(meal.type)}</div>
                  <div className="meal-info">
                    <h3>{meal.name}</h3>
                    <span className="meal-type-label">{meal.type}</span>
                  </div>
                  <button
                    className={`favorite-btn ${meal.is_favorite ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(meal);
                    }}
                  >
                    {meal.is_favorite ? '⭐' : '☆'}
                  </button>
                </div>

                <div className="meal-card-macros">
                  <div className="macro-stat">
                    <span className="macro-value">{Math.round(meal.total_calories)}</span>
                    <span className="macro-label">Calories</span>
                  </div>
                  <div className="macro-stat">
                    <span className="macro-value">{Math.round(meal.total_protein)}g</span>
                    <span className="macro-label">Protein</span>
                  </div>
                  <div className="macro-stat">
                    <span className="macro-value">{Math.round(meal.total_carbs)}g</span>
                    <span className="macro-label">Carbs</span>
                  </div>
                  <div className="macro-stat">
                    <span className="macro-value">{Math.round(meal.total_fat)}g</span>
                    <span className="macro-label">Fat</span>
                  </div>
                </div>

                <div className="macro-bar">
                  <div 
                    className="macro-segment protein" 
                    style={{ width: `${percentages.protein}%` }}
                  />
                  <div 
                    className="macro-segment carbs" 
                    style={{ width: `${percentages.carbs}%` }}
                  />
                  <div 
                    className="macro-segment fat" 
                    style={{ width: `${percentages.fat}%` }}
                  />
                </div>

                {selectedMeal?.id === meal.id && (
                  <div className="meal-details-expanded">
                    <h4>Foods in this meal:</h4>
                    <div className="meal-foods-preview">
                      {meal.meal_foods?.map((food, index) => (
                        <div key={index} className="meal-food-preview">
                          <img 
                            src={food.food_image_url} 
                            alt={food.food_name}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/40x40/2d4a2d/4ade80?text=F';
                            }}
                          />
                          <span className="food-name">{food.food_name}</span>
                          <span className="food-quantity">
                            {food.quantity} × {food.serving_size}{food.serving_unit}
                          </span>
                        </div>
                      ))}
                    </div>

                    {userProfile?.target_calories && (
                      <div className="meal-vs-targets">
                        <h4>% of Daily Targets:</h4>
                        <div className="target-percentages">
                          <div className="target-percent">
                            <span className="percent-value">
                              {Math.round((meal.total_calories / userProfile.target_calories) * 100)}%
                            </span>
                            <span className="percent-label">Calories</span>
                          </div>
                          <div className="target-percent">
                            <span className="percent-value">
                              {Math.round((meal.total_protein / userProfile.target_protein) * 100)}%
                            </span>
                            <span className="percent-label">Protein</span>
                          </div>
                          <div className="target-percent">
                            <span className="percent-value">
                              {Math.round((meal.total_carbs / userProfile.target_carbs) * 100)}%
                            </span>
                            <span className="percent-label">Carbs</span>
                          </div>
                          <div className="target-percent">
                            <span className="percent-value">
                              {Math.round((meal.total_fat / userProfile.target_fat) * 100)}%
                            </span>
                            <span className="percent-label">Fat</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="meal-actions">
                      <button 
                        className="edit-meal-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditMeal(meal);
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        className="delete-meal-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMeal(meal.id);
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                )}

                <div className="meal-card-footer">
                  <span className="meal-date">
                    Created {new Date(meal.created_at).toLocaleDateString()}
                  </span>
                  <span className="expand-hint">
                    {selectedMeal?.id === meal.id ? '▲' : '▼'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Meal Builder Modal */}
      {showMealBuilder && (
        <div className="modal-overlay" onClick={() => setShowMealBuilder(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <MealBuilder
              existingMeal={editingMeal}
              onClose={() => {
                setShowMealBuilder(false);
                setEditingMeal(null);
              }}
              onSave={() => {
                loadMeals();
                setShowMealBuilder(false);
                setEditingMeal(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default MyMeals;