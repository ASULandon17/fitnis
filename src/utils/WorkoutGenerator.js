const EXERCISES_DATABASE = {
  chest: [
    { name: 'Barbell Bench Press', equipment: 'barbell', difficulty: 'intermediate' },
    { name: 'Dumbbell Bench Press', equipment: 'dumbbell', difficulty: 'beginner' },
    { name: 'Incline Dumbbell Press', equipment: 'dumbbell', difficulty: 'beginner' },
    { name: 'Push-ups', equipment: 'bodyweight', difficulty: 'beginner' },
    { name: 'Cable Flyes', equipment: 'cable', difficulty: 'intermediate' },
    { name: 'Dips', equipment: 'bodyweight', difficulty: 'intermediate' }
  ],
  back: [
    { name: 'Pull-ups', equipment: 'bodyweight', difficulty: 'intermediate' },
    { name: 'Barbell Rows', equipment: 'barbell', difficulty: 'intermediate' },
    { name: 'Lat Pulldown', equipment: 'cable', difficulty: 'beginner' },
    { name: 'Dumbbell Rows', equipment: 'dumbbell', difficulty: 'beginner' },
    { name: 'Seated Cable Rows', equipment: 'cable', difficulty: 'beginner' },
    { name: 'Deadlifts', equipment: 'barbell', difficulty: 'advanced' }
  ],
  shoulders: [
    { name: 'Overhead Press', equipment: 'barbell', difficulty: 'intermediate' },
    { name: 'Dumbbell Shoulder Press', equipment: 'dumbbell', difficulty: 'beginner' },
    { name: 'Lateral Raises', equipment: 'dumbbell', difficulty: 'beginner' },
    { name: 'Front Raises', equipment: 'dumbbell', difficulty: 'beginner' },
    { name: 'Face Pulls', equipment: 'cable', difficulty: 'beginner' },
    { name: 'Arnold Press', equipment: 'dumbbell', difficulty: 'intermediate' }
  ],
  arms: [
    { name: 'Barbell Curls', equipment: 'barbell', difficulty: 'beginner' },
    { name: 'Hammer Curls', equipment: 'dumbbell', difficulty: 'beginner' },
    { name: 'Tricep Dips', equipment: 'bodyweight', difficulty: 'intermediate' },
    { name: 'Skull Crushers', equipment: 'barbell', difficulty: 'intermediate' },
    { name: 'Cable Tricep Pushdown', equipment: 'cable', difficulty: 'beginner' },
    { name: 'Concentration Curls', equipment: 'dumbbell', difficulty: 'beginner' }
  ],
  legs: [
    { name: 'Squats', equipment: 'barbell', difficulty: 'intermediate' },
    { name: 'Leg Press', equipment: 'machine', difficulty: 'beginner' },
    { name: 'Romanian Deadlifts', equipment: 'barbell', difficulty: 'intermediate' },
    { name: 'Leg Curls', equipment: 'machine', difficulty: 'beginner' },
    { name: 'Leg Extensions', equipment: 'machine', difficulty: 'beginner' },
    { name: 'Lunges', equipment: 'dumbbell', difficulty: 'beginner' }
  ],
  glutes: [
    { name: 'Hip Thrusts', equipment: 'barbell', difficulty: 'intermediate' },
    { name: 'Glute Bridges', equipment: 'bodyweight', difficulty: 'beginner' },
    { name: 'Bulgarian Split Squats', equipment: 'dumbbell', difficulty: 'intermediate' },
    { name: 'Cable Kickbacks', equipment: 'cable', difficulty: 'beginner' },
    { name: 'Step-ups', equipment: 'dumbbell', difficulty: 'beginner' }
  ],
  core: [
    { name: 'Planks', equipment: 'bodyweight', difficulty: 'beginner' },
    { name: 'Hanging Leg Raises', equipment: 'bodyweight', difficulty: 'advanced' },
    { name: 'Russian Twists', equipment: 'bodyweight', difficulty: 'beginner' },
    { name: 'Cable Crunches', equipment: 'cable', difficulty: 'beginner' },
    { name: 'Ab Wheel Rollouts', equipment: 'equipment', difficulty: 'intermediate' },
    { name: 'Bicycle Crunches', equipment: 'bodyweight', difficulty: 'beginner' }
  ]
};

const getSetsReps = (goal, experienceLevel) => {
  const configs = {
    gain_muscle: {
      beginner: { sets: 3, reps: '8-12' },
      intermediate: { sets: 4, reps: '8-12' },
      advanced: { sets: 4, reps: '6-10' }
    },
    lose_fat: {
      beginner: { sets: 3, reps: '12-15' },
      intermediate: { sets: 3, reps: '12-15' },
      advanced: { sets: 4, reps: '12-15' }
    },
    body_recomposition: {
      beginner: { sets: 3, reps: '10-12' },
      intermediate: { sets: 4, reps: '10-12' },
      advanced: { sets: 4, reps: '8-12' }
    }
  };

  return configs[goal][experienceLevel] || { sets: 3, reps: '10-12' };
};

const selectExercises = (muscleGroup, count, experienceLevel) => {
  const exercises = EXERCISES_DATABASE[muscleGroup] || [];
  const filtered = exercises.filter(ex => {
    if (experienceLevel === 'beginner') return ex.difficulty !== 'advanced';
    if (experienceLevel === 'intermediate') return true;
    return true;
  });

  // Shuffle and select
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const createWorkoutDay = (day, focus, muscleGroups, goal, experienceLevel) => {
  const exercisesPerGroup = muscleGroups.length === 1 ? 5 : Math.floor(6 / muscleGroups.length);
  const allExercises = [];

  muscleGroups.forEach(group => {
    const exercises = selectExercises(group, exercisesPerGroup, experienceLevel);
    const setsReps = getSetsReps(goal, experienceLevel);
    
    exercises.forEach(ex => {
      allExercises.push({
        name: ex.name,
        sets: setsReps.sets,
        reps: setsReps.reps,
        muscleGroup: group
      });
    });
  });

  return {
    day,
    focus,
    exercises: allExercises
  };
};

const generatePlanA = (workoutData) => {
  // Full Body Plan (3 days/week)
  const { fitness_goal, experience_level, workout_days } = workoutData;
  const selectedDays = workout_days.slice(0, 3);

  const weeklySchedule = selectedDays.map((day, index) => {
    return createWorkoutDay(
      day.charAt(0).toUpperCase() + day.slice(1),
      'Full Body',
      ['chest', 'back', 'legs', 'shoulders'],
      fitness_goal,
      experience_level
    );
  });

  return {
    name: 'Full Body Strength',
    difficulty: experience_level,
    weeklySchedule,
    avgDuration: workoutData.workout_duration,
    totalExercises: weeklySchedule.reduce((sum, day) => sum + day.exercises.length, 0),
    description: 'A balanced full-body routine hitting all major muscle groups 3 times per week.',
    highlights: [
      'Perfect for beginners and time-efficient',
      'Balanced muscle development',
      'High frequency for each muscle group',
      'Flexible scheduling'
    ]
  };
};

const generatePlanB = (workoutData) => {
  // Upper/Lower Split (4 days/week)
  const { fitness_goal, experience_level, workout_days } = workoutData;
  const selectedDays = workout_days.slice(0, 4);

  const weeklySchedule = [
    createWorkoutDay(selectedDays[0], 'Upper Body', ['chest', 'back', 'shoulders', 'arms'], fitness_goal, experience_level),
    createWorkoutDay(selectedDays[1], 'Lower Body', ['legs', 'glutes', 'core'], fitness_goal, experience_level),
    createWorkoutDay(selectedDays[2], 'Upper Body', ['chest', 'back', 'shoulders', 'arms'], fitness_goal, experience_level),
    createWorkoutDay(selectedDays[3], 'Lower Body', ['legs', 'glutes', 'core'], fitness_goal, experience_level)
  ].map((workout, i) => ({
    ...workout,
    day: selectedDays[i].charAt(0).toUpperCase() + selectedDays[i].slice(1)
  }));

  return {
    name: 'Upper/Lower Split',
    difficulty: experience_level,
    weeklySchedule,
    avgDuration: workoutData.workout_duration,
    totalExercises: weeklySchedule.reduce((sum, day) => sum + day.exercises.length, 0),
    description: 'Alternate between upper and lower body workouts for optimal recovery and growth.',
    highlights: [
      'Great for intermediate lifters',
      'Adequate recovery between sessions',
      'Focus on compound movements',
      'Balanced upper/lower development'
    ]
  };
};

const generatePlanC = (workoutData) => {
  // Push/Pull/Legs Split (6 days/week or 3 days with rotation)
  const { fitness_goal, experience_level, workout_days } = workoutData;
  const selectedDays = workout_days.slice(0, Math.min(6, workout_days.length));

  const splits = [
    { focus: 'Push (Chest, Shoulders, Triceps)', groups: ['chest', 'shoulders', 'arms'] },
    { focus: 'Pull (Back, Biceps)', groups: ['back', 'arms'] },
    { focus: 'Legs & Core', groups: ['legs', 'glutes', 'core'] }
  ];

  const weeklySchedule = selectedDays.map((day, index) => {
    const split = splits[index % 3];
    return {
      ...createWorkoutDay(
        day.charAt(0).toUpperCase() + day.slice(1),
        split.focus,
        split.groups,
        fitness_goal,
        experience_level
      )
    };
  });

  return {
    name: 'Push/Pull/Legs',
    difficulty: experience_level === 'beginner' ? 'intermediate' : 'advanced',
    weeklySchedule,
    avgDuration: workoutData.workout_duration,
    totalExercises: weeklySchedule.reduce((sum, day) => sum + day.exercises.length, 0),
    description: 'Popular split focusing on movement patterns for maximum muscle growth.',
    highlights: [
      'Ideal for advanced lifters',
      'High training volume',
      'Excellent muscle isolation',
      'Flexible frequency (3x or 6x/week)'
    ]
  };
};

export const generateWorkoutPlans = (workoutData) => {
  const plans = [];

  // Generate 3 different plans
  plans.push(generatePlanA(workoutData));
  
  if (workoutData.workout_days.length >= 4) {
    plans.push(generatePlanB(workoutData));
  }
  
  if (workoutData.workout_days.length >= 3) {
    plans.push(generatePlanC(workoutData));
  }

  // If we don't have 3 plans, create variations
  while (plans.length < 3) {
    const variation = { ...plans[0] };
    variation.name = `${variation.name} - Variation ${plans.length}`;
    plans.push(variation);
  }

  return plans;
};