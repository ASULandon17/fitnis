import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import MacroCalculator from './MacroCalculator';
import './Food.css';

function Food() {
  const { currentUser, userProfile } = useAuth();

  const hasMacros = userProfile?.target_calories;

  return (
    <div className="food-page">
      <div className="food-container">
        <div className="food-header">
          <h1>Nutrition & Macro Calculator</h1>
          {!hasMacros ? (
            <p>Let's calculate your personalized macros to help you reach your goals!</p>
          ) : (
            <p>Your current macro targets are set. Recalculate if your goals have changed!</p>
          )}
        </div>

        {currentUser ? (
          <>
            {hasMacros && (
              <div className="current-macros-summary">
                <h2>Your Current Targets</h2>
                <div className="macro-summary-grid">
                  <div className="macro-summary-card">
                    <div className="summary-value">{userProfile.target_calories}</div>
                    <div className="summary-label">Calories</div>
                  </div>
                  <div className="macro-summary-card">
                    <div className="summary-value">{userProfile.target_protein}g</div>
                    <div className="summary-label">Protein</div>
                  </div>
                  <div className="macro-summary-card">
                    <div className="summary-value">{userProfile.target_carbs}g</div>
                    <div className="summary-label">Carbs</div>
                  </div>
                  <div className="macro-summary-card">
                    <div className="summary-value">{userProfile.target_fat}g</div>
                    <div className="summary-label">Fat</div>
                  </div>
                </div>
                <p className="last-calculated">
                  Last calculated: {new Date(userProfile.macros_last_calculated).toLocaleDateString()}
                </p>
              </div>
            )}
            <MacroCalculator />
          </>
        ) : (
          <div className="signin-prompt">
            <h2>Sign in to calculate your macros</h2>
            <p>Create an account or sign in to get your personalized nutrition plan!</p>
            <a href="/signin" className="signin-link-button">
              Sign In / Sign Up
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default Food;