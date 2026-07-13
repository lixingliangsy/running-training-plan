// pages/api/generate-plan.js
// Training plan generation API

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.body || {}
    const {
      goal,
      currentFitness,
      weeklyMileage,
      weeksAvailable,
      experienceLevel,
      availableDaysPerWeek,
    } = body

    if (!goal) {
      return res.status(400).json({ error: 'Missing goal (5K, 10K, HalfMarathon, Marathon)' })
    }

    // Generate training plan
    const plan = generateTrainingPlan({
      goal: goal,
      currentFitness: currentFitness || 'beginner',
      weeklyMileage: weeklyMileage || 20,
      weeksAvailable: weeksAvailable || 12,
      experienceLevel: experienceLevel || 'beginner',
      availableDaysPerWeek: availableDaysPerWeek || 4,
    })

    res.status(200).json({
      success: true,
      plan: plan,
    })
  } catch (error) {
    console.error('Generate plan error:', error)
    res.status(500).json({ error: 'Failed to generate plan', details: error.message })
  }
}

// Generate training plan
function generateTrainingPlan(config) {
  const { goal, currentFitness, weeklyMileage, weeksAvailable, experienceLevel, availableDaysPerWeek } = config

  // Target distance (km)
  const goalDistances = {
    '5K': 5,
    '10K': 10,
    'HalfMarathon': 21.0975,
    'Marathon': 42.195,
  }

  const targetDistance = goalDistances[goal] || 5

  // Calculate base pace from fitness and goal
  const basePace = calculateBasePace(currentFitness, goal)

  // Generate weekly schedule
  const weeks = []
  for (let week = 1; week <= weeksAvailable; week++) {
    const weekPlan = generateWeekPlan({
      week: week,
      totalWeeks: weeksAvailable,
      goal: goal,
      targetDistance: targetDistance,
      basePace: basePace,
      weeklyMileage: weeklyMileage,
      availableDaysPerWeek: availableDaysPerWeek,
      experienceLevel: experienceLevel,
    })
    weeks.push(weekPlan)
  }

  // Calculate estimated finish time
  const estimatedFinishTime = calculateFinishTime(targetDistance, basePace)

  return {
    goal: goal,
    targetDistance: targetDistance,
    totalWeeks: weeksAvailable,
    weeklyMileage: weeklyMileage,
    basePace: basePace,
    estimatedFinishTime: estimatedFinishTime,
    weeks: weeks,
    tips: generateTrainingTips(goal, experienceLevel),
  }
}

// Calculate base pace
function calculateBasePace(currentFitness, goal) {
  const basePaces = {
    'beginner': {
      '5K': { minutes: 7, seconds: 30 },
      '10K': { minutes: 8, seconds: 0 },
      'HalfMarathon': { minutes: 8, seconds: 30 },
      'Marathon': { minutes: 9, seconds: 0 },
    },
    'intermediate': {
      '5K': { minutes: 6, seconds: 0 },
      '10K': { minutes: 6, seconds: 30 },
      'HalfMarathon': { minutes: 7, seconds: 0 },
      'Marathon': { minutes: 7, seconds: 30 },
    },
    'advanced': {
      '5K': { minutes: 5, seconds: 0 },
      '10K': { minutes: 5, seconds: 30 },
      'HalfMarathon': { minutes: 6, seconds: 0 },
      'Marathon': { minutes: 6, seconds: 30 },
    },
  }

  return basePaces[currentFitness]?.[goal] || basePaces['beginner']['5K']
}

// Generate single-week plan
function generateWeekPlan(config) {
  const { week, totalWeeks, goal, targetDistance, basePace, weeklyMileage, availableDaysPerWeek, experienceLevel } = config

  // Note
  let intensity = 0
  if (week <= 4) {
    intensity = 0.6 + (week - 1) * 0.1 // 60% - 90%
  } else if (week <= totalWeeks - 2) {
    intensity = 0.9 + Math.sin((week - 4) * 0.5) * 0.1 // 80% - 100% variation
  } else {
    intensity = 0.5 // deload week
  }

  // Note
  const days = []
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  
  // Note
  const trainingDays = selectTrainingDays(availableDaysPerWeek)

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const dayName = dayNames[dayIndex]
    
    if (trainingDays.includes(dayIndex)) {
      const dayPlan = generateDayPlan({
        dayName: dayName,
        dayIndex: dayIndex,
        week: week,
        intensity: intensity,
        goal: goal,
        targetDistance: targetDistance,
        basePace: basePace,
        weeklyMileage: weeklyMileage,
        experienceLevel: experienceLevel,
      })
      days.push(dayPlan)
    } else {
      days.push({
        day: dayName,
        type: 'Rest',
        description: 'Rest day or cross-training',
      })
    }
  }

  const weekMileage = Math.round(weeklyMileage * intensity)
  const longRunDistance = Math.round(targetDistance * intensity * 0.3)

  return {
    week: week,
    intensity: Math.round(intensity * 100),
    totalMileage: weekMileage,
    longRunDistance: longRunDistance,
    days: days,
  }
}

// Note
function selectTrainingDays(availableDays) {
  // Note
  const defaultSchedule = [[1], [1, 3], [1, 3, 5], [1, 3, 5, 6], [0, 1, 3, 5, 6]]
  
  if (availableDays <= 5) {
    return defaultSchedule[availableDays - 1] || [1, 3, 5, 6]
  }
  
  // Note
  return [0, 1, 2, 3, 4, 5, 6].slice(0, availableDays)
}

// Note
function generateDayPlan(config) {
  const { dayName, dayIndex, week, intensity, goal, targetDistance, basePace, weeklyMileage, experienceLevel } = config

  // Note
  const isLongRunDay = (dayIndex === 6 || dayIndex === 5)
  
  // Note
  let distance = 0
  if (isLongRunDay) {
    distance = Math.round(targetDistance * intensity * 0.3)
  } else {
    distance = Math.round((weeklyMileage * intensity) / 3)
  }

  // Note
  let workoutType = 'Easy Run'
  let description = ''
  let pace = { ...basePace }

  if (isLongRunDay) {
    workoutType = 'Long Run'
    description = `Long slow distance run. Build endurance.`
    pace = { minutes: basePace.minutes + 1, seconds: basePace.seconds }
  } else if (dayIndex === 1) {
    workoutType = 'Intervals'
    description = `Speed work. ${experienceLevel === 'beginner' ? '8 x 400m' : '6 x 800m'} at 5K pace.`
    pace = { minutes: Math.max(4, basePace.minutes - 2), seconds: 0 }
  } else if (dayIndex === 3) {
    workoutType = 'Tempo Run'
    description = `Comfortably hard run. 20-30 minutes at half-marathon pace.`
    pace = { minutes: Math.max(5, basePace.minutes - 1), seconds: 0 }
  } else {
    description = `Easy run. Conversational pace. Focus on form.`
  }

  return {
    day: dayName,
    type: workoutType,
    distance: Math.max(3, distance),
    pace: pace,
    description: description,
    warmup: '10-15 min easy jog',
    cooldown: '10 min easy jog + stretching',
  }
}

// Calculate estimated finish time
function calculateFinishTime(distance, pace) {
  const totalMinutes = distance * pace.minutes + (distance * pace.seconds) / 60
  const hours = Math.floor(totalMinutes / 60)
  const minutes = Math.round(totalMinutes % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:00`
  } else {
    return `${minutes}:00`
  }
}

// Generate training tips
function generateTrainingTips(goal, experienceLevel) {
  const tips = [
    'Listen to your body. Rest when needed.',
    'Stay hydrated. Drink water before, during, and after runs.',
    'Invest in proper running shoes.',
    'Warm up before every run.',
    'Cool down and stretch after every run.',
  ]

  if (goal === 'Marathon' || goal === 'HalfMarathon') {
    tips.push('Practice your nutrition strategy on long runs.')
    tips.push('Do at least one 20-miler before marathon.')
  }

  if (experienceLevel === 'beginner') {
    tips.push('Don\'t increase weekly mileage by more than 10%.')
    tips.push('Walk breaks are okay! Try run-walk-run method.')
  }

  return tips
}
