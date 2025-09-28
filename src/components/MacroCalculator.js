import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  ACTIVITY_LEVELS,
  WEIGHT_CHANGE_RATES,
  calculateCompleteMacros,
  convertLbsToKg,
  convertKgToLbs,
  convertFeetInchesToCm
} from '../utils/MacroCalculator';
import './MacroCalculator.css';

function MacroCalculator() {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  
  // Form state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [calculatedMacros, setCalculatedMacros] = useState(null);
  
  // Unit preferences
  const [weightUnit, setWeightUnit] = useState('kg');
  const [heightUnit, setHeightUnit] = useState('cm');
  
  // Form data
  const [formData, setFormData] = useState({
    age: userProfile?.age || '',
    sex: userProfile?.sex || '',
    height_cm: userProfile?.height_cm || '',
    weight_kg: userProfile?.weight_kg || '',
    activity_level: userProfile?.activity_level || '',
    weight_goal: userProfile?.weight_goal || '',
    weight_change_rate: userProfile?.weight_change_rate || '',
    macro_preference: userProfile?.macro_preference || 'balanced'
  });
  
  // Display values (for imperial units)
  const [displayWeight, setDisplayWeight] = useState('');
  const [displayHeightFeet, setDisplayHeightFeet] = useState('');
  const [displayHeightInches, setDisplayHeightInches] = useState('');

  const totalSteps = 8;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWeightChange = (value, unit) => {
    if (unit === 'kg') {
      setDisplayWeight(value);
      handleInputChange('weight_kg', parseFloat(value) || 0);
    } else {
      setDisplayWeight(value);
      const kg = convertLbsToKg(parseFloat(value) || 0);
      handleInputChange('weight_kg', kg);
    }
  };

  const handleHeightChange = (value, unit, type = 'cm') => {
    if (unit === 'cm') {
      setDisplayWeight(value);
      handleInputChange('height_cm', parseFloat(value) || 0);
    } else {
      // Imperial (feet and inches)
      if (type === 'feet') {
        setDisplayHeightFeet(value);
        const cm = convertFeetInchesToCm(
          parseFloat(value) || 0,
          parseFloat(displayHeightInches) || 0
        );
        handleInputChange('height_cm', cm);
      } else {
        setDisplayHeightInches(value);
        const cm = convertFeetInchesToCm(
          parseFloat(displayHeightFeet) || 0,
          parseFloat(value) || 0
        );
        handleInputChange('height_cm', cm);
      }
    }
  };

  const handleCalculate = () => {
    try {
      const results = calculateCompleteMacros(formData);
      setCalculatedMacros(results);
      setStep(totalSteps + 1); // Go to results page
    } catch (error) {
      console.error('Calculation error:', error);
      setMessage('Error calculating macros. Please check your inputs.');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');

    const updateData = {
      ...formData,
      calculated_bmr: calculatedMacros.bmr,
      calculated_tdee: calculatedMacros.tdee,
      target_calories: calculatedMacros.targetCalories,
      target_protein: calculatedMacros.protein,
      target_carbs: calculatedMacros.carbs,
      target_fat: calculatedMacros.fat,
      macros_last_calculated: new Date().toISOString()
    };

    const { error } = await updateUserProfile(currentUser.id, updateData);

    if (error) {
      setMessage('Error saving macros: ' + error.message);
    } else {
      setMessage('Macros saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    }

    setLoading(false);
  };

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleCalculate();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return formData.age && formData.age >= 15 && formData.age <= 100;
      case 2: return formData.sex;
      case 3: return formData.height_cm > 0;
      case 4: return formData.weight_kg > 0;
      case 5: return formData.activity_level;
      case 6: return formData.weight_goal;
      case 7: return formData.weight_change_rate !== '';
      case 8: return formData.macro_preference;
      default: return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="calculator-step">
            <h2>What is your age?</h2>
            <p className="step-description">
              Age affects your basal metabolic rate (BMR) - the number of calories your body burns at rest. 
              As we age, our metabolism naturally slows down, so this helps us calculate accurate calorie needs.
            </p>
            <div className="input-group">
              <input
                type="number"
                min="15"
                max="100"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                placeholder="Enter Age"
                className="large-input"
              />
              <span className="input-suffix">years old</span>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="calculator-step">
            <h2>What is your biological sex?</h2>
            <p className="step-description">
              Biological sex affects metabolism because men and women have different muscle mass and hormonal profiles.
              Men typically have higher metabolic rates due to greater muscle mass.
            </p>
            <div className="button-group">
              <button
                className={`option-button ${formData.sex === 'male' ? 'selected' : ''}`}
                onClick={() => handleInputChange('sex', 'male')}
              >
                <span className="option-icon">♂</span>
                <span className="option-label">Male</span>
              </button>
              <button
                className={`option-button ${formData.sex === 'female' ? 'selected' : ''}`}
                onClick={() => handleInputChange('sex', 'female')}
              >
                <span className="option-icon">♀</span>
                <span className="option-label">Female</span>
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="calculator-step">
            <h2>What is your height?</h2>
            <p className="step-description">
              Height is used along with weight to understand your body composition and calculate
              your energy needs more accurately.
            </p>
            <div className="unit-toggle">
              <button
                className={heightUnit === 'cm' ? 'active' : ''}
                onClick={() => setHeightUnit('cm')}
              >
                Metric (cm)
              </button>
              <button
                className={heightUnit === 'imperial' ? 'active' : ''}
                onClick={() => setHeightUnit('imperial')}
              >
                Imperial (ft/in)
              </button>
            </div>
            {heightUnit === 'cm' ? (
              <div className="input-group">
                <input
                  type="number"
                  min="100"
                  max="250"
                  step="0.1"
                  value={formData.height_cm || ''}
                  onChange={(e) => handleInputChange('height_cm', e.target.value)}
                  placeholder="Enter height"
                  className="large-input"
                />
                <span className="input-suffix">cm</span>
              </div>
            ) : (
              <div className="imperial-height">
                <div className="input-group">
                  <input
                    type="number"
                    min="3"
                    max="8"
                    value={displayHeightFeet}
                    onChange={(e) => handleHeightChange(e.target.value, 'imperial', 'feet')}
                    placeholder="0"
                    className="medium-input"
                  />
                  <span className="input-suffix">feet</span>
                </div>
                <div className="input-group">
                  <input
                    type="number"
                    min="0"
                    max="11"
                    value={displayHeightInches}
                    onChange={(e) => handleHeightChange(e.target.value, 'imperial', 'inches')}
                    placeholder="0"
                    className="medium-input"
                  />
                  <span className="input-suffix">inches</span>
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="calculator-step">
            <h2>What is your current weight?</h2>
            <p className="step-description">
              Your current weight is crucial for calculating how many calories you need.
              It also helps determine optimal protein intake to maintain or build muscle.
            </p>
            <div className="unit-toggle">
              <button
                className={weightUnit === 'kg' ? 'active' : ''}
                onClick={() => setWeightUnit('kg')}
              >
                Kilograms
              </button>
              <button
                className={weightUnit === 'lbs' ? 'active' : ''}
                onClick={() => setWeightUnit('lbs')}
              >
                Pounds
              </button>
            </div>
            <div className="input-group">
              <input
                type="number"
                min="30"
                max="300"
                step="0.1"
                value={displayWeight || (weightUnit === 'kg' ? formData.weight_kg : convertKgToLbs(formData.weight_kg).toFixed(1))}
                onChange={(e) => handleWeightChange(e.target.value, weightUnit)}
                placeholder="Enter weight"
                className="large-input"
              />
              <span className="input-suffix">{weightUnit}</span>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="calculator-step">
            <h2>What is your activity level?</h2>
            <p className="step-description">
              Your daily activity level helps us calculate your Total Daily Energy Expenditure (TDEE).
              Be honest - overestimating can slow your progress!
            </p>
            <div className="activity-options">
              {Object.entries(ACTIVITY_LEVELS).map(([key, level]) => (
                <button
                  key={key}
                  className={`activity-option ${formData.activity_level === key ? 'selected' : ''}`}
                  onClick={() => handleInputChange('activity_level', key)}
                >
                  <div className="activity-label">{level.label}</div>
                  <div className="activity-description">{level.description}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="calculator-step">
            <h2>What is your weight goal?</h2>
            <p className="step-description">
              Your goal determines whether we add or subtract calories from your maintenance level.
              Choose what aligns with your fitness objectives.
            </p>
            <div className="button-group-vertical">
              <button
                className={`option-button-large ${formData.weight_goal === 'lose' ? 'selected' : ''}`}
                onClick={() => handleInputChange('weight_goal', 'lose')}
              >
                <span className="option-icon">📉</span>
                <div>
                  <div className="option-label">Lose Weight</div>
                  <div className="option-sublabel">Fat loss / Cutting</div>
                </div>
              </button>
              <button
                className={`option-button-large ${formData.weight_goal === 'maintain' ? 'selected' : ''}`}
                onClick={() => handleInputChange('weight_goal', 'maintain')}
              >
                <span className="option-icon">⚖️</span>
                <div>
                  <div className="option-label">Maintain Weight</div>
                  <div className="option-sublabel">Body recomposition</div>
                </div>
              </button>
              <button
                className={`option-button-large ${formData.weight_goal === 'gain' ? 'selected' : ''}`}
                onClick={() => handleInputChange('weight_goal', 'gain')}
              >
                <span className="option-icon">📈</span>
                <div>
                  <div className="option-label">Gain Weight</div>
                  <div className="option-sublabel">Muscle building / Bulking</div>
                </div>
              </button>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="calculator-step">
            <h2>How fast do you want to {formData.weight_goal === 'lose' ? 'lose' : formData.weight_goal === 'gain' ? 'gain' : 'maintain'} weight?</h2>
            <p className="step-description">
              {formData.weight_goal === 'lose' && 'Slower weight loss preserves more muscle mass. Aggressive deficits can lead to muscle loss and metabolic adaptation.'}
              {formData.weight_goal === 'gain' && 'Slower weight gain minimizes fat gain. Too fast and you\'ll gain more fat than muscle.'}
              {formData.weight_goal === 'maintain' && 'Maintain your current weight while potentially improving body composition.'}
            </p>
            <div className="rate-options">
              {WEIGHT_CHANGE_RATES[formData.weight_goal || 'maintain'].map((rate) => (
                <button
                  key={rate.value}
                  className={`rate-option ${formData.weight_change_rate === rate.value ? 'selected' : ''}`}
                  onClick={() => handleInputChange('weight_change_rate', rate.value)}
                >
                  {rate.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 8:
        return (
          <div className="calculator-step">
            <h2>What are your macro preferences?</h2>
            <p className="step-description">
              This affects how your remaining calories (after protein) are split between carbs and fats.
              Protein stays high regardless to preserve muscle mass.
            </p>
            <div className="button-group-vertical">
              <button
                className={`option-button-large ${formData.macro_preference === 'balanced' ? 'selected' : ''}`}
                onClick={() => handleInputChange('macro_preference', 'balanced')}
              >
                <span className="option-icon">⚖️</span>
                <div>
                  <div className="option-label">Balanced</div>
                  <div className="option-sublabel">Moderate carbs and fats (25% fat, rest carbs)</div>
                </div>
              </button>
              <button
                className={`option-button-large ${formData.macro_preference === 'low_carb' ? 'selected' : ''}`}
                onClick={() => handleInputChange('macro_preference', 'low_carb')}
              >
                <span className="option-icon">🥑</span>
                <div>
                  <div className="option-label">Lower Carb</div>
                  <div className="option-sublabel">Higher fat, lower carbs (35% fat)</div>
                </div>
              </button>
              <button
                className={`option-button-large ${formData.macro_preference === 'low_fat' ? 'selected' : ''}`}
                onClick={() => handleInputChange('macro_preference', 'low_fat')}
              >
                <span className="option-icon">🍝</span>
                <div>
                  <div className="option-label">Lower Fat</div>
                  <div className="option-sublabel">Higher carbs, lower fat (20% fat)</div>
                </div>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderResults = () => {
    if (!calculatedMacros) return null;

    return (
      <div className="results-container">
        <h2>Your Personalized Macro Plan</h2>
        <p className="results-intro">
          Based on your information, here's your daily nutrition target to {formData.weight_goal} weight:
        </p>

        <div className="results-grid">
          <div className="result-card highlight">
            <div className="result-icon">🎯</div>
            <div className="result-value">{calculatedMacros.targetCalories}</div>
            <div className="result-label">Daily Calories</div>
            <div className="result-sublabel">Your target intake</div>
          </div>

          <div className="result-card">
            <div className="result-icon">🥩</div>
            <div className="result-value">{calculatedMacros.protein}g</div>
            <div className="result-label">Protein</div>
            <div className="result-sublabel">{Math.round((calculatedMacros.protein * 4 / calculatedMacros.targetCalories) * 100)}% of calories</div>
          </div>

          <div className="result-card">
            <div className="result-icon">🍚</div>
            <div className="result-value">{calculatedMacros.carbs}g</div>
            <div className="result-label">Carbohydrates</div>
            <div className="result-sublabel">{Math.round((calculatedMacros.carbs * 4 / calculatedMacros.targetCalories) * 100)}% of calories</div>
          </div>

          <div className="result-card">
            <div className="result-icon">🥑</div>
            <div className="result-value">{calculatedMacros.fat}g</div>
            <div className="result-label">Fats</div>
            <div className="result-sublabel">{Math.round((calculatedMacros.fat * 9 / calculatedMacros.targetCalories) * 100)}% of calories</div>
          </div>
        </div>

        <div className="results-details">
          <h3>Understanding Your Numbers</h3>
          <div className="detail-row">
            <span className="detail-label">Basal Metabolic Rate (BMR):</span>
            <span className="detail-value">{calculatedMacros.bmr} calories/day</span>
          </div>
          <p className="detail-explanation">
            This is what your body burns at complete rest. It's the energy needed for basic functions like breathing and circulation.
          </p>

          <div className="detail-row">
            <span className="detail-label">Total Daily Energy Expenditure (TDEE):</span>
            <span className="detail-value">{calculatedMacros.tdee} calories/day</span>
          </div>
          <p className="detail-explanation">
            This includes your BMR plus the calories burned through daily activities and exercise.
          </p>

          <div className="detail-row">
            <span className="detail-label">Daily Calorie Adjustment:</span>
            <span className="detail-value">
              {formData.weight_goal === 'maintain' ? '0' : 
               (calculatedMacros.tdee - calculatedMacros.targetCalories > 0 ? '-' : '+') + 
               Math.abs(calculatedMacros.tdee - calculatedMacros.targetCalories)} calories/day
            </span>
          </div>
          <p className="detail-explanation">
            {formData.weight_goal === 'lose' && 'You\'re in a calorie deficit to promote fat loss while preserving muscle.'}
            {formData.weight_goal === 'gain' && 'You\'re in a calorie surplus to support muscle growth.'}
            {formData.weight_goal === 'maintain' && 'You\'re eating at maintenance to keep your current weight.'}
          </p>
        </div>

        {message && (
          <div className={`message ${message.includes('success') ? 'success' : '  error'}`}>
            {message}
          </div>
        )}

        <div className="results-actions">
          <button 
            className="save-button"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save My Macros'}
          </button>
          <button 
            className="recalculate-button"
            onClick={() => {
              setStep(1);
              setCalculatedMacros(null);
            }}
          >
            Recalculate
          </button>
        </div>

        <div className="tips-section">
          <h3>💡 Tips for Success</h3>
          <ul>
            <li><strong>Track consistently:</strong> Use a food tracking app to hit your macros daily</li>
            <li><strong>Protein priority:</strong> Hit your protein target first - it's crucial for muscle</li>
            <li><strong>Be flexible:</strong> Your carbs and fats can vary day-to-day as long as calories are consistent</li>
            <li><strong>Adjust as needed:</strong> Recalculate every 10-15 lbs of weight change</li>
            <li><strong>Be patient:</strong> Give it 2-3 weeks before adjusting - weight fluctuates daily</li>
          </ul>
        </div>
      </div>
    );
  };

  if (step > totalSteps) {
    return (
      <div className="macro-calculator">
        {renderResults()}
      </div>
    );
  }

  return (
    <div className="macro-calculator">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>
      <div className="step-counter">Step {step} of {totalSteps}</div>

      {renderStep()}

      <div className="navigation-buttons">
        {step > 1 && (
          <button className="nav-button prev" onClick={prevStep}>
            ← Previous
          </button>
        )}
        <button 
          className="nav-button next" 
          onClick={nextStep}
          disabled={!canProceed()}
        >
          {step === totalSteps ? 'Calculate My Macros' : 'Next →'}
        </button>
      </div>
    </div>
  );
}

export default MacroCalculator;