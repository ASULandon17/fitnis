import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import WorkoutSetup from './WorkoutSetup';
import WorkoutPlans from './WorkoutPlans';
import MyWorkouts from './MyWorkouts';
import './Workouts.css';

function Workouts() {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('setup');
  const [workoutData, setWorkoutData] = useState(null);
  const [generatedPlans, setGeneratedPlans] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/signin');
      return;
    }

    // Load existing workout data from profile
    if (userProfile?.current_workout) {
      setSelectedWorkout(userProfile.current_workout);
      setActiveTab('my-workouts');
    }
  }, [currentUser, userProfile, navigate]);

  const handleWorkoutDataComplete = (data) => {
    setWorkoutData(data);
    setActiveTab('plans');
  };

  const handlePlanSelect = async (plan) => {
    setSelectedWorkout(plan);
    
    // Save to user profile
    await updateUserProfile(currentUser.id, {
      current_workout: plan,
      workout_selected_at: new Date().toISOString()
    });
    
    setActiveTab('my-workouts');
  };

  const handleStartNewWorkout = () => {
    setWorkoutData(null);
    setGeneratedPlans([]);
    setSelectedWorkout(null);
    setActiveTab('setup');
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="workouts-page">
      <div className="workouts-container">
        <div className="workouts-header">
          <h1>Workout Plans</h1>
          <p>Personalized workouts based on your goals</p>
        </div>

        <div className="workouts-tabs">
          <button
            className={`tab ${activeTab === 'setup' ? 'active' : ''}`}
            onClick={() => setActiveTab('setup')}
          >
            Setup
          </button>
          <button
            className={`tab ${activeTab === 'plans' ? 'active' : ''} ${!generatedPlans.length ? 'disabled' : ''}`}
            onClick={() => generatedPlans.length && setActiveTab('plans')}
            disabled={!generatedPlans.length}
          >
            Choose Plan
          </button>
          <button
            className={`tab ${activeTab === 'my-workouts' ? 'active' : ''} ${!selectedWorkout ? 'disabled' : ''}`}
            onClick={() => selectedWorkout && setActiveTab('my-workouts')}
            disabled={!selectedWorkout}
          >
            My Workouts
          </button>
        </div>

        <div className="workouts-content">
          {activeTab === 'setup' && (
            <WorkoutSetup
              userProfile={userProfile}
              onComplete={handleWorkoutDataComplete}
              onPlansGenerated={setGeneratedPlans}
            />
          )}
          
          {activeTab === 'plans' && (
            <WorkoutPlans
              plans={generatedPlans}
              workoutData={workoutData}
              onSelectPlan={handlePlanSelect}
              onBack={() => setActiveTab('setup')}
            />
          )}
          
          {activeTab === 'my-workouts' && selectedWorkout && (
            <MyWorkouts
              workout={selectedWorkout}
              onStartNew={handleStartNewWorkout}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Workouts;