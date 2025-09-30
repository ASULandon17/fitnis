// components/FoodSearch.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { searchFoods, filterFoodsByMacros, calculateServingsForTarget } from '../services/foodDataService';
import './FoodSearch.css';

function FoodSearch() {
  const { userProfile } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    minProtein: '',
    maxCalories: '',
    maxCarbs: '',
    maxFat: '',
    sortBy: 'relevance'
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  
  // Search functionality
  const handleSearch = async (page = 1) => {
    if (!searchQuery.trim()) {
      setError('Please enter a search term');
      return;
    }
    
    setLoading(true);
    setError('');
    setCurrentPage(page);
    
    const results = await searchFoods(searchQuery, 25, page);
    
    if (results.error) {
      setError(results.error);
      setSearchResults([]);
    } else {
      setSearchResults(results.foods);
      setTotalPages(results.totalPages);
    }
    
    setLoading(false);
  };
  
  // Apply filters when search results or filters change
  useEffect(() => {
    let filtered = [...searchResults];
    
    // Apply macro filters
    if (filters.minProtein || filters.maxCalories || filters.maxCarbs || filters.maxFat) {
      filtered = filterFoodsByMacros(filtered, {
        minProtein: parseFloat(filters.minProtein) || 0,
        maxCalories: parseFloat(filters.maxCalories) || Infinity,
        maxCarbs: parseFloat(filters.maxCarbs) || Infinity,
        maxFat: parseFloat(filters.maxFat) || Infinity
      });
    }
    
    // Apply sorting
    switch (filters.sortBy) {
      case 'protein-high':
        filtered.sort((a, b) => b.protein - a.protein);
        break;
      case 'protein-low':
        filtered.sort((a, b) => a.protein - b.protein);
        break;
      case 'calories-high':
        filtered.sort((a, b) => b.calories - a.calories);
        break;
      case 'calories-low':
        filtered.sort((a, b) => a.calories - b.calories);
        break;
      case 'carbs-low':
        filtered.sort((a, b) => a.carbs - b.carbs);
        break;
      case 'fat-low':
        filtered.sort((a, b) => a.fat - b.fat);
        break;
      default:
        // relevance - keep original order
        break;
    }
    
    setFilteredResults(filtered);
  }, [searchResults, filters]);
  
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const clearFilters = () => {
    setFilters({
      minProtein: '',
      maxCalories: '',
      maxCarbs: '',
      maxFat: '',
      sortBy: 'relevance'
    });
  };
  
  const calculateForMacroTarget = (food, macro, target) => {
    return calculateServingsForTarget(food, target, macro);
  };
  
  const getMacroPercentage = (food) => {
    const total = food.protein * 4 + food.carbs * 4 + food.fat * 9;
    if (total === 0) return { protein: 0, carbs: 0, fat: 0 };
    
    return {
      protein: Math.round((food.protein * 4 / total) * 100),
      carbs: Math.round((food.carbs * 4 / total) * 100),
      fat: Math.round((food.fat * 9 / total) * 100)
    };
  };

  const MacroBar = ({ food }) => {
    const percentages = getMacroPercentage(food);
    
    return (
      <div className="macro-bar-container">
        <div className="macro-bar">
          <div 
            className="macro-segment protein" 
            style={{ width: `${percentages.protein}%` }}
            title={`Protein: ${percentages.protein}%`}
          />
          <div 
            className="macro-segment carbs" 
            style={{ width: `${percentages.carbs}%` }}
            title={`Carbs: ${percentages.carbs}%`}
          />
          <div 
            className="macro-segment fat" 
            style={{ width: `${percentages.fat}%` }}
            title={`Fat: ${percentages.fat}%`}
          />
        </div>
        <div className="macro-bar-legend">
          <span className="legend-item">
            <span className="legend-color protein"></span>
            P: {percentages.protein}%
          </span>
          <span className="legend-item">
            <span className="legend-color carbs"></span>
            C: {percentages.carbs}%
          </span>
          <span className="legend-item">
            <span className="legend-color fat"></span>
            F: {percentages.fat}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="food-search-container">
      <div className="search-header">
        <h2>🔍 Search Foods</h2>
        <p>Find foods to help you hit your macro targets</p>
      </div>

      {/* Search Bar */}
      <div className="search-bar-container">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search for foods (e.g., 'chicken breast', 'brown rice', 'banana')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch(1)}
          />
          <button 
            className="search-button"
            onClick={() => handleSearch(1)}
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Filters */}
      {searchResults.length > 0 && (
        <div className="filters-container">
          <div className="filters-header">
            <h3>Filters & Sort</h3>
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear All
            </button>
          </div>
          
          <div className="filters-grid">
            <div className="filter-group">
              <label>Min Protein (g)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g., 20"
                value={filters.minProtein}
                onChange={(e) => handleFilterChange('minProtein', e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>Max Calories</label>
              <input
                type="number"
                min="0"
                placeholder="e.g., 300"
                value={filters.maxCalories}
                onChange={(e) => handleFilterChange('maxCalories', e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>Max Carbs (g)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g., 30"
                value={filters.maxCarbs}
                onChange={(e) => handleFilterChange('maxCarbs', e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>Max Fat (g)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g., 10"
                value={filters.maxFat}
                onChange={(e) => handleFilterChange('maxFat', e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="relevance">Relevance</option>
                <option value="protein-high">Protein (High to Low)</option>
                <option value="protein-low">Protein (Low to High)</option>
                <option value="calories-low">Calories (Low to High)</option>
                <option value="calories-high">Calories (High to Low)</option>
                <option value="carbs-low">Carbs (Low to High)</option>
                <option value="fat-low">Fat (Low to High)</option>
              </select>
            </div>
          </div>
          
          <div className="results-count">
            Showing {filteredResults.length} of {searchResults.length} results
          </div>
        </div>
      )}

      {/* User's Macro Targets (if available) */}
      {userProfile?.target_calories && searchResults.length > 0 && (
        <div className="macro-targets-reminder">
          <div className="targets-label">Your Daily Targets:</div>
          <div className="targets-values">
            <span className="target-item">
              <strong>{userProfile.target_calories}</strong> cal
            </span>
            <span className="target-item">
              <strong>{userProfile.target_protein}g</strong> protein
            </span>
            <span className="target-item">
              <strong>{userProfile.target_carbs}g</strong> carbs
            </span>
            <span className="target-item">
              <strong>{userProfile.target_fat}g</strong> fat
            </span>
          </div>
        </div>
      )}

      {/* Search Results */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Searching food database...</p>
        </div>
      ) : filteredResults.length > 0 ? (
        <>
          <div className="search-results">
            {filteredResults.map((food) => (
              <div 
                key={food.id} 
                className="food-card"
                onClick={() => setSelectedFood(selectedFood?.id === food.id ? null : food)}
              >
                <div className="food-card-header">
                  <div className="food-name">
                    <h3>{food.name}</h3>
                    {food.brand && <span className="food-brand">{food.brand}</span>}
                  </div>
                  <div className="food-calories">
                    <span className="calories-value">{food.calories}</span>
                    <span className="calories-label">cal</span>
                  </div>
                </div>

                <div className="food-serving">
                  Per {food.servingSize}{food.servingUnit}
                </div>

                <div className="food-macros">
                  <div className="macro-item protein">
                    <span className="macro-icon">🥩</span>
                    <span className="macro-value">{food.protein}g</span>
                    <span className="macro-label">Protein</span>
                  </div>
                  <div className="macro-item carbs">
                    <span className="macro-icon">🍚</span>
                    <span className="macro-value">{food.carbs}g</span>
                    <span className="macro-label">Carbs</span>
                  </div>
                  <div className="macro-item fat">
                    <span className="macro-icon">🥑</span>
                    <span className="macro-value">{food.fat}g</span>
                    <span className="macro-label">Fat</span>
                  </div>
                </div>

                <MacroBar food={food} />

                {selectedFood?.id === food.id && (
                  <div className="food-details-expanded">
                    <div className="additional-info">
                      {food.fiber > 0 && (
                        <div className="info-item">
                          <span className="info-label">Fiber:</span>
                          <span className="info-value">{food.fiber}g</span>
                        </div>
                      )}
                      {food.sugar > 0 && (
                        <div className="info-item">
                          <span className="info-label">Sugar:</span>
                          <span className="info-value">{food.sugar}g</span>
                        </div>
                      )}
                      {food.category && (
                        <div className="info-item">
                          <span className="info-label">Category:</span>
                          <span className="info-value">{food.category}</span>
                        </div>
                      )}
                    </div>

                    {userProfile?.target_protein && (
                      <div className="macro-calculator-section">
                        <h4>To hit your targets, you'd need:</h4>
                        <div className="target-calculations">
                          {['protein', 'carbs', 'fat'].map(macro => {
                            const target = userProfile[`target_${macro}`];
                            const calculation = calculateForMacroTarget(food, macro, target);
                            
                            if (!calculation) return null;
                            
                            return (
                              <div key={macro} className="target-calc-item">
                                <div className="calc-header">
                                  For {target}g {macro}:
                                </div>
                                <div className="calc-values">
                                  <strong>{calculation.grams}g</strong> ({calculation.servings} servings)
                                  <br />
                                  <span className="calc-totals">
                                    {calculation.calories} cal | 
                                    P: {calculation.protein}g | 
                                    C: {calculation.carbs}g | 
                                    F: {calculation.fat}g
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="food-card-footer">
                  <span className="expand-hint">
                    {selectedFood?.id === food.id ? '▲ Click to collapse' : '▼ Click for details'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => handleSearch(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                ← Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="pagination-btn"
                onClick={() => handleSearch(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : searchQuery && !loading ? (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h3>No foods found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : null}

      {!searchQuery && !loading && (
        <div className="search-suggestions">
          <h3>💡 Search Tips</h3>
          <div className="suggestions-grid">
            <div className="suggestion-card">
              <h4>High Protein Foods</h4>
              <div className="suggestion-tags">
                <span onClick={() => { setSearchQuery('chicken breast'); handleSearch(1); }}>Chicken Breast</span>
                <span onClick={() => { setSearchQuery('greek yogurt'); handleSearch(1); }}>Greek Yogurt</span>
                <span onClick={() => { setSearchQuery('eggs'); handleSearch(1); }}>Eggs</span>
                <span onClick={() => { setSearchQuery('salmon'); handleSearch(1); }}>Salmon</span>
              </div>
            </div>
            <div className="suggestion-card">
              <h4>Healthy Carbs</h4>
              <div className="suggestion-tags">
                <span onClick={() => { setSearchQuery('brown rice'); handleSearch(1); }}>Brown Rice</span>
                <span onClick={() => { setSearchQuery('sweet potato'); handleSearch(1); }}>Sweet Potato</span>
                <span onClick={() => { setSearchQuery('oatmeal'); handleSearch(1); }}>Oatmeal</span>
                <span onClick={() => { setSearchQuery('quinoa'); handleSearch(1); }}>Quinoa</span>
              </div>
            </div>
            <div className="suggestion-card">
              <h4>Healthy Fats</h4>
              <div className="suggestion-tags">
                <span onClick={() => { setSearchQuery('avocado'); handleSearch(1); }}>Avocado</span>
                <span onClick={() => { setSearchQuery('almonds'); handleSearch(1); }}>Almonds</span>
                <span onClick={() => { setSearchQuery('olive oil'); handleSearch(1); }}>Olive Oil</span>
                <span onClick={() => { setSearchQuery('peanut butter'); handleSearch(1); }}>Peanut Butter</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FoodSearch;