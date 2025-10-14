import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { generateWorkoutPlans } from '../utils/WorkoutGenerator';
import './WorkoutSetup.css';

const FITNESS_GOALS = [
  { value: 'gain_muscle', label: 'Gain Muscle', icon: '💪', description: 'Build strength and muscle mass' },
  { value: 'lose_fat', label: 'Lose Fat', icon: '🔥', description: 'Burn fat and improve definition' },
  { value: 'body_recomposition', label: 'Body Recomposition', icon: '⚡', description: 'Lose fat and gain muscle simultaneously' }
];

const BODY_FOCUS_AREAS = [
  { value: 'full_body', label: 'Full Body', icon: '🏃' },
  { value: 'upper_body', label: 'Upper Body', icon: '💪' },
  { value: 'lower_body', label: 'Lower Body', icon: '🦵' },
  { value: 'chest', label: 'Chest (Pectorals)', icon: '🫀' },
  { value: 'back', label: 'Back', icon: '🧍' },
  { value: 'shoulders', label: 'Shoulders', icon: '🏋️' },
  { value: 'arms', label: 'Arms', icon: '💪' },
  { value: 'core', label: 'Core (Abs)', icon: '🎯' },
  { value: 'glutes', label: 'Glutes', icon: '🍑' },
  { value: 'legs', label: 'Legs (Quads/Hamstrings)', icon: '🦿' }
];

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' }
];

function WorkoutSetup({ userProfile, onComplete, onPlansGenerated }) {
  const { currentUser, updateUserProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    fitness_goal: userProfile?.fitness_goal || '',
    workout_days: userProfile?.workout_days || [],
    workout_duration: userProfile?.workout_duration || 60,
    body_focus: userProfile?.body_focus || [],
    gender: userProfile?.sex || '',
    height_cm: userProfile?.height_cm || '',
    weight_kg: userProfile?.weight_kg || '',
    experience_level: userProfile?.experience_level || 'beginner'
  });

  const totalSteps = 5;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMultiSelect = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1: return formData.fitness_goal !== '';
      case 2: return formData.workout_days.length > 0;
      case 3: return formData.workout_duration > 0;
      case 4: return formData.body_focus.length > 0;
      case 5: return formData.gender && formData.height_cm && formData.weight_kg;
      default: return false;
    }
  };

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleGeneratePlans();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleGeneratePlans = async () => {
    setLoading(true);
    setMessage('Generating your personalized workout plans...');

    try {
      console.log('Starting workout plan generation with data:', formData);

      // Save workout preferences to profile
      console.log('Saving to profile...');
      const { data: savedProfile, error: updateError } = await updateUserProfile(currentUser.id, {
        fitness_goal: formData.fitness_goal,
        workout_days: formData.workout_days,
        workout_duration: formData.workout_duration,
        body_focus: formData.body_focus,
        experience_level: formData.experience_level,
        sex: formData.gender,
        height_cm: parseFloat(formData.height_cm),
        weight_kg: parseFloat(formData.weight_kg)
      });

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw new Error('Failed to save workout preferences: ' + updateError.message);
      }

      console.log('Profile saved successfully:', savedProfile);
      console.log('Generating workout plans...');

      // Generate workout plans (synchronous function)
      const plans = generateWorkoutPlans(formData);
      console.log('Generated plans:', plans);

      if (!plans || plans.length === 0) {
        throw new Error('No plans were generated');
      }

      console.log('Plans generated successfully, calling callbacks...');
      onPlansGenerated(plans);
      onComplete(formData);
      
      setMessage('Plans generated successfully!');
      setLoading(false);

    } catch (error) {
      console.error('Error in handleGeneratePlans:', error);
      setMessage(`Error: ${error.message || 'Failed to generate plans. Please try again.'}`);
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="setup-step">
            <h2>What is your fitness goal?</h2>
            <p className="step-description">
              Choose the primary goal that aligns with what you want to achieve.
              This will determine the structure and intensity of your workouts.
            </p>
            <div className="goals-grid">
              {FITNESS_GOALS.map(goal => (
                <button
                  key={goal.value}
                  className={`goal-card ${formData.fitness_goal === goal.value ? 'selected' : ''}`}
                  onClick={() => handleInputChange('fitness_goal', goal.value)}
                >
                  <div className="goal-icon">{goal.icon}</div>
                  <div className="goal-label">{goal.label}</div>
                  <div className="goal-description">{goal.description}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="setup-step">
            <h2>Which days can you work out?</h2>
            <p className="step-description">
              Select all the days you're available to exercise. We'll create a plan
              that fits your schedule. We recommend at least 3-4 days per week.
            </p>
            <div className="days-grid">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.value}
                  className={`day-button ${formData.workout_days.includes(day.value) ? 'selected' : ''}`}
                  onClick={() => handleMultiSelect('workout_days', day.value)}
                >
                  {day.label}
                </button>
              ))}
            </div>
            <div className="selected-count">
              {formData.workout_days.length} day{formData.workout_days.length !== 1 ? 's' : ''} selected
            </div>
          </div>
        );

      case 3:
        return (
          <div className="setup-step">
            <h2>How long can you work out?</h2>
            <p className="step-description">
              Choose the typical duration for each workout session. This helps us
              determine how many exercises to include in each workout.
            </p>
            <div className="duration-options">
              {[30, 45, 60, 75, 90].map(duration => (
                <button
                  key={duration}
                  className={`duration-button ${formData.workout_duration === duration ? 'selected' : ''}`}
                  onClick={() => handleInputChange('workout_duration', duration)}
                >
                  <div className="duration-value">{duration}</div>
                  <div className="duration-label">minutes</div>
                </button>
              ))}
            </div>
            <div className="custom-duration">
              <label>Or enter custom duration:</label>
              <input
                type="number"
                min="20"
                max="180"
                value={formData.workout_duration}
                onChange={(e) => handleInputChange('workout_duration', parseInt(e.target.value) || 60)}
                placeholder="Minutes"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="setup-step">
            <h2>Which areas do you want to focus on?</h2>
            <p className="step-description">
              Select the muscle groups or body areas you want to prioritize.
              You can choose multiple areas. We'll balance your workout accordingly.
            </p>
            <div className="focus-grid">
              {BODY_FOCUS_AREAS.map(area => (
                <button
                  key={area.value}
                  className={`focus-card ${formData.body_focus.includes(area.value) ? 'selected' : ''}`}
                  onClick={() => handleMultiSelect('body_focus', area.value)}
                >
                  <div className="focus-icon">{area.icon}</div>
                  <div className="focus-label">{area.label}</div>
                </button>
              ))}
            </div>
            <div className="selected-count">
              {formData.body_focus.length} area{formData.body_focus.length !== 1 ? 's' : ''} selected
            </div>
          </div>
        );

      case 5:
        return (
          <div className="setup-step">
            <h2>Tell us about yourself</h2>
            <p className="step-description">
              We need some basic information to personalize your workout intensity
              and recommendations. This data is kept private.
            </p>
            
            <div className="info-form">
              <div className="form-section">
                <label>Gender</label>
                <div className="button-group">
                  <button
                    className={`option-btn ${formData.gender === 'male' ? 'selected' : ''}`}
                    onClick={() => handleInputChange('gender', 'male')}
                  >
                    Male
                  </button>
                  <button
                    className={`option-btn ${formData.gender === 'female' ? 'selected' : ''}`}
                    onClick={() => handleInputChange('gender', 'female')}
                  >
                    Female
                  </button>
                </div>
              </div>

              <div className="form-section">
                <label>Height (cm)</label>
                <input
                  type="number"
                  value={formData.height_cm}
                  onChange={(e) => handleInputChange('height_cm', parseFloat(e.target.value) || '')}
                  placeholder="170"
                  min="100"
                  max="250"
                />
              </div>

              <div className="form-section">
                <label>Weight (kg)</label>
                <input
                  type="number"
                  value={formData.weight_kg}
                  onChange={(e) => handleInputChange('weight_kg', parseFloat(e.target.value) || '')}
                  placeholder="70"
                  min="30"
                  max="300"
                />
              </div>

              <div className="form-section">
                <label>Experience Level</label>
                <select
                  value={formData.experience_level}
                  onChange={(e) => handleInputChange('experience_level', e.target.value)}
                >
                  <option value="beginner">Beginner (0-1 years)</option>
                  <option value="intermediate">Intermediate (1-3 years)</option>
                  <option value="advanced">Advanced (3+ years)</option>
                </select>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="workout-setup">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>
      <div className="step-counter">Step {step} of {totalSteps}</div>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : message.includes('Error') ? 'error' : 'info'}`}>
          {message}
        </div>
      )}

      {renderStep()}

      <div className="navigation-buttons">
        {step > 1 && (
          <button className="nav-button prev" onClick={prevStep} disabled={loading}>
            ← Previous
          </button>
        )}
        <button 
          className="nav-button next" 
          onClick={nextStep}
          disabled={!canProceed() || loading}
        >
          {loading ? 'Generating...' : step === totalSteps ? 'Generate Plans' : 'Next →'}
        </button>
      </div>
    </div>
  );
}

export default WorkoutSetup;