import React, { useState } from 'react';
import './WorkoutPlans.css';

function WorkoutPlans({ plans, workoutData, onSelectPlan, onBack }) {
  const [expandedPlan, setExpandedPlan] = useState(null);

  const togglePlan = (index) => {
    setExpandedPlan(expandedPlan === index ? null : index);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#2196F3';
    }
  };

  return (
    <div className="workout-plans">
      <div className="plans-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Setup
        </button>
        <h2>Choose Your Workout Plan</h2>
        <p>We've generated 3 personalized plans based on your preferences. Select the one that fits you best.</p>
      </div>

      <div className="plans-grid">
        {plans.map((plan, index) => (
          <div key={index} className="plan-card">
            <div className="plan-header">
              <h3>{plan.name}</h3>
              <span 
                className="plan-difficulty"
                style={{ backgroundColor: getDifficultyColor(plan.difficulty) }}
              >
                {plan.difficulty}
              </span>
            </div>

            <div className="plan-summary">
              <div className="summary-item">
                <span className="summary-icon">📅</span>
                <span>{plan.weeklySchedule.length} days/week</span>
              </div>
              <div className="summary-item">
                <span className="summary-icon">⏱️</span>
                <span>{plan.avgDuration} min/session</span>
              </div>
              <div className="summary-item">
                <span className="summary-icon">💪</span>
                <span>{plan.totalExercises} exercises</span>
              </div>
            </div>

            <p className="plan-description">{plan.description}</p>

            <div className="plan-highlights">
              <h4>Highlights:</h4>
              <ul>
                {plan.highlights.map((highlight, i) => (
                  <li key={i}>{highlight}</li>
                ))}
              </ul>
            </div>

            <button
              className="expand-button"
              onClick={() => togglePlan(index)}
            >
              {expandedPlan === index ? 'Hide Details' : 'View Full Plan'}
            </button>

            {expandedPlan === index && (
              <div className="plan-details">
                <h4>Weekly Schedule:</h4>
                {plan.weeklySchedule.map((day, dayIndex) => (
                  <div key={dayIndex} className="day-schedule">
                    <div className="day-header">
                      <h5>{day.day}</h5>
                      <span className="day-focus">{day.focus}</span>
                    </div>
                    <div className="exercises-list">
                      {day.exercises.map((exercise, exIndex) => (
                        <div key={exIndex} className="exercise-item">
                          <span className="exercise-name">{exercise.name}</span>
                          <span className="exercise-sets">{exercise.sets} × {exercise.reps}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              className="select-plan-button"
              onClick={() => onSelectPlan(plan)}
            >
              Select This Plan
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WorkoutPlans;