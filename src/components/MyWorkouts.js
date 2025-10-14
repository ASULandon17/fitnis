import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './MyWorkouts.css';

function MyWorkouts({ workout, onStartNew }) {
  const { currentUser, updateUserProfile } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(1);
  const [workoutLog, setWorkoutLog] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);

  useEffect(() => {
    // Load saved workout log from localStorage or database
    const savedLog = localStorage.getItem(`workout_log_${currentUser.id}`);
    if (savedLog) {
      setWorkoutLog(JSON.parse(savedLog));
    }
  }, [currentUser]);

  const saveWorkoutLog = (updatedLog) => {
    setWorkoutLog(updatedLog);
    localStorage.setItem(`workout_log_${currentUser.id}`, JSON.stringify(updatedLog));
  };

  const handleLogWorkout = (dayIndex, exerciseIndex, setData) => {
    const key = `week${currentWeek}_day${dayIndex}_ex${exerciseIndex}`;
    const updatedLog = {
      ...workoutLog,
      [key]: {
        ...setData,
        date: new Date().toISOString(),
        completed: true
      }
    };
    saveWorkoutLog(updatedLog);
  };

  const getDayCompletion = (dayIndex) => {
    const day = workout.weeklySchedule[dayIndex];
    if (!day) return 0;
    
    const totalExercises = day.exercises.length;
    const completedExercises = day.exercises.filter((_, exIndex) => {
      const key = `week${currentWeek}_day${dayIndex}_ex${exIndex}`;
      return workoutLog[key]?.completed;
    }).length;
    
    return (completedExercises / totalExercises) * 100;
  };

  const openLogModal = (dayIndex) => {
    setSelectedDay(dayIndex);
    setShowLogModal(true);
  };

  const closeLogModal = () => {
    setShowLogModal(false);
    setSelectedDay(null);
  };

  return (
    <div className="my-workouts">
      <div className="workouts-header-section">
        <div>
          <h2>{workout.name}</h2>
          <p className="workout-subtitle">{workout.description}</p>
        </div>
        <button className="new-workout-button" onClick={onStartNew}>
          Start New Workout
        </button>
      </div>

      <div className="week-selector">
        <button
          onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
          disabled={currentWeek === 1}
        >
          ← Previous Week
        </button>
        <span className="week-indicator">Week {currentWeek}</span>
        <button onClick={() => setCurrentWeek(currentWeek + 1)}>
          Next Week →
        </button>
      </div>

      <div className="workout-schedule">
        {workout.weeklySchedule.map((day, dayIndex) => {
          const completion = getDayCompletion(dayIndex);
          const isCompleted = completion === 100;

          return (
            <div
              key={dayIndex}
              className={`workout-day-card ${isCompleted ? 'completed' : ''}`}
              onClick={() => openLogModal(dayIndex)}
            >
              <div className="day-card-header">
                <h3>{day.day}</h3>
                {isCompleted && <span className="check-icon">✓</span>}
              </div>
              <p className="day-focus">{day.focus}</p>
              <div className="completion-bar">
                <div
                  className="completion-fill"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <p className="completion-text">{Math.round(completion)}% Complete</p>
              <button className="log-button">
                {isCompleted ? 'View Workout' : 'Log Workout'}
              </button>
            </div>
          );
        })}
      </div>

      {showLogModal && selectedDay !== null && (
        <WorkoutLogModal
          day={workout.weeklySchedule[selectedDay]}
          dayIndex={selectedDay}
          currentWeek={currentWeek}
          workoutLog={workoutLog}
          onLog={handleLogWorkout}
          onClose={closeLogModal}
        />
      )}
    </div>
  );
}

function WorkoutLogModal({ day, dayIndex, currentWeek, workoutLog, onLog, onClose }) {
  const [exerciseData, setExerciseData] = useState({});

  useEffect(() => {
    // Load existing data for this day
    const dayData = {};
    day.exercises.forEach((exercise, exIndex) => {
      const key = `week${currentWeek}_day${dayIndex}_ex${exIndex}`;
      dayData[exIndex] = workoutLog[key] || {
        sets: Array(exercise.sets).fill({ reps: '', weight: '' })
      };
    });
    setExerciseData(dayData);
  }, [day, dayIndex, currentWeek, workoutLog]);

  const updateSet = (exIndex, setIndex, field, value) => {
    setExerciseData(prev => ({
      ...prev,
      [exIndex]: {
        ...prev[exIndex],
        sets: prev[exIndex].sets.map((set, i) =>
          i === setIndex ? { ...set, [field]: value } : set
        )
      }
    }));
  };

  const saveExercise = (exIndex) => {
    onLog(dayIndex, exIndex, exerciseData[exIndex]);
  };

  const saveAllAndClose = () => {
    day.exercises.forEach((_, exIndex) => {
      if (exerciseData[exIndex]) {
        saveExercise(exIndex);
      }
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{day.day} - {day.focus}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {day.exercises.map((exercise, exIndex) => {
            const isCompleted = workoutLog[`week${currentWeek}_day${dayIndex}_ex${exIndex}`]?.completed;
            
            return (
              <div key={exIndex} className="exercise-log-section">
                <div className="exercise-log-header">
                  <h3>{exercise.name}</h3>
                  {isCompleted && <span className="completed-badge">✓ Logged</span>}
                </div>
                <p className="exercise-target">Target: {exercise.sets} sets × {exercise.reps} reps</p>

                <div className="sets-log">
                  {exerciseData[exIndex]?.sets.map((set, setIndex) => (
                    <div key={setIndex} className="set-row">
                      <span className="set-number">Set {setIndex + 1}</span>
                      <input
                        type="number"
                        placeholder="Reps"
                        value={set.reps}
                        onChange={(e) => updateSet(exIndex, setIndex, 'reps', e.target.value)}
                        className="reps-input"
                      />
                      <input
                        type="number"
                        placeholder="Weight (kg)"
                        value={set.weight}
                        onChange={(e) => updateSet(exIndex, setIndex, 'weight', e.target.value)}
                        className="weight-input"
                      />
                    </div>
                  ))}
                </div>

                <button
                  className="save-exercise-button"
                  onClick={() => saveExercise(exIndex)}
                >
                  Save Exercise
                </button>
              </div>
            );
          })}
        </div>

        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="save-all-button" onClick={saveAllAndClose}>
            Save All & Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default MyWorkouts;