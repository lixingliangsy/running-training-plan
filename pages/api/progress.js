// pages/api/progress.js
// Note

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { trainingData, planData } = req.body

    if (!trainingData || !planData) {
      return res.status(400).json({ error: 'Missing training data or plan data' })
    }

    // Note
    const progress = generateProgressData(trainingData, planData)

    res.status(200).json({
      success: true,
      progress: progress,
    })
  } catch (error) {
    console.error('Progress error:', error)
    res.status(500).json({ error: 'Failed to generate progress', details: error.message })
  }
}

// Note
function generateProgressData(trainingData, planData) {
  // Workout logs
  const runs = trainingData.runs || []
  const logs = trainingData.logs || []

  // Note
  const plan = planData.plan || planData

  // Note
  const mileageData = generateMileageChart(runs, plan)

  // Note
  const paceData = generatePaceChart(runs)

  // Note
  const completionData = generateCompletionChart(logs, plan)

  // Note
  const heartRateData = generateHeartRateChart(runs)

  // Note
  const weeklySummary = generateWeeklySummary(logs, plan)

  // Note
  const overallStats = calculateOverallStats(runs, logs, plan)

  return {
    mileageChart: mileageData,
    paceChart: paceData,
    completionChart: completionData,
    heartRateChart: heartRateData,
    weeklySummary: weeklySummary,
    overallStats: overallStats,
    chartConfig: {
      type: 'line',
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    },
  }
}

// Note
function generateMileageChart(runs, plan) {
  const weeklyMileage = {}

  // Note
  runs.forEach(run => {
    const date = new Date(run.date)
    const weekNumber = getWeekNumber(date)
    const year = date.getFullYear()
    const key = `${year}-W${weekNumber}`

    if (!weeklyMileage[key]) {
      weeklyMileage[key] = {
        week: key,
        planned: 0,
        actual: 0,
      }
    }

    weeklyMileage[key].actual += run.distance || 0
  })

  // Note
  if (plan.weeks) {
    plan.weeks.forEach((week, index) => {
      const key = `2024-W${index + 1}`
      if (weeklyMileage[key]) {
        weeklyMileage[key].planned = week.totalMileage || 0
      } else {
        weeklyMileage[key] = {
          week: key,
          planned: week.totalMileage || 0,
          actual: 0,
        }
      }
    })
  }

  const labels = Object.keys(weeklyMileage)
  const plannedData = labels.map(key => weeklyMileage[key].planned)
  const actualData = labels.map(key => weeklyMileage[key].actual)

  return {
    chartType: 'line',
    title: 'Weekly Mileage Progress',
    labels: labels,
    datasets: [
      {
        label: 'Planned',
        data: plannedData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
      },
      {
        label: 'Actual',
        data: actualData,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
      },
    ],
  }
}

// Note
function generatePaceChart(runs) {
  const paceTrend = runs
    .filter(run => run.pace && run.date)
    .map(run => ({
      date: run.date,
      pace: run.pace.minutes * 60 + run.pace.seconds, // API endpoint
      distance: run.distance,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const labels = paceTrend.map(r => r.date)
  const data = paceTrend.map(r => r.pace)
  const distances = paceTrend.map(r => r.distance)

  return {
    chartType: 'line',
    title: 'Pace Trend (seconds per km)',
    labels: labels,
    datasets: [
      {
        label: 'Pace (sec/km)',
        data: data,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        yAxisID: 'y',
      },
      {
        label: 'Distance (km)',
        data: distances,
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        yAxisID: 'y1',
      },
    ],
    options: {
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
        },
      },
    },
  }
}

// Note
function generateCompletionChart(logs, plan) {
  if (!plan.weeks) {
    return null
  }

  const completion = plan.weeks.map((week, index) => {
    const weekLogs = logs.filter(log => log.week === index + 1)
    const plannedDays = week.days.filter(d => d.type !== 'Rest').length
    const completedDays = weekLogs.filter(log => log.completed).length

    return {
      week: `Week ${index + 1}`,
      planned: plannedDays,
      completed: completedDays,
      completionRate: plannedDays > 0 ? Math.round((completedDays / plannedDays) * 100) : 0,
    }
  })

  const labels = completion.map(c => c.week)
  const plannedData = completion.map(c => c.planned)
  const completedData = completion.map(c => c.completed)

  return {
    chartType: 'bar',
    title: 'Weekly Training Completion',
    labels: labels,
    datasets: [
      {
        label: 'Planned Days',
        data: plannedData,
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      },
      {
        label: 'Completed Days',
        data: completedData,
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
      },
    ],
  }
}

// Note
function generateHeartRateChart(runs) {
  const heartRateData = runs
    .filter(run => run.avgHeartRate || run.maxHeartRate)
    .map(run => ({
      date: run.date,
      avgHR: run.avgHeartRate || null,
      maxHR: run.maxHeartRate || null,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  if (heartRateData.length === 0) {
    return null
  }

  const labels = heartRateData.map(r => r.date)
  const avgData = heartRateData.map(r => r.avgHR)
  const maxData = heartRateData.map(r => r.maxHR)

  return {
    chartType: 'line',
    title: 'Heart Rate Trend',
    labels: labels,
    datasets: [
      {
        label: 'Average HR',
        data: avgData,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
      },
      {
        label: 'Max HR',
        data: maxData,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
      },
    ],
  }
}

// Note
function generateWeeklySummary(logs, plan) {
  const currentWeek = getCurrentWeek()
  const weekPlan = plan.weeks ? plan.weeks[currentWeek - 1] : null

  if (!weekPlan) {
    return null
  }

  const weekLogs = logs.filter(log => log.week === currentWeek)
  const totalPlanned = weekPlan.days.filter(d => d.type !== 'Rest').length
  const totalCompleted = weekLogs.filter(log => log.completed).length
  const totalDistance = weekLogs.reduce((sum, log) => sum + (log.distance || 0), 0)
  const totalTime = weekLogs.reduce((sum, log) => sum + (log.duration || 0), 0)

  return {
    week: currentWeek,
    plannedDays: totalPlanned,
    completedDays: totalCompleted,
    completionRate: totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0,
    totalDistance: Math.round(totalDistance * 100) / 100,
    totalTime: totalTime,
    remainingDays: totalPlanned - totalCompleted,
  }
}

// Note
function calculateOverallStats(runs, logs, plan) {
  const totalRuns = runs.length
  const totalDistance = runs.reduce((sum, run) => sum + (run.distance || 0), 0)
  const totalTime = runs.reduce((sum, run) => sum + (run.duration || 0), 0)
  const avgPace = runs.length > 0
    ? runs.reduce((sum, run) => sum + (run.pace.minutes * 60 + run.pace.seconds), 0) / runs.length
    : null

  const totalPlannedDays = plan.weeks
    ? plan.weeks.reduce((sum, week) => sum + week.days.filter(d => d.type !== 'Rest').length, 0)
    : 0
  const totalCompletedDays = logs.filter(log => log.completed).length
  const overallCompletionRate = totalPlannedDays > 0
    ? Math.round((totalCompletedDays / totalPlannedDays) * 100)
    : 0

  return {
    totalRuns: totalRuns,
    totalDistance: Math.round(totalDistance * 100) / 100,
    totalTime: totalTime,
    avgPace: avgPace
      ? {
          minutes: Math.floor(avgPace / 60),
          seconds: Math.round(avgPace % 60),
        }
      : null,
    totalPlannedDays: totalPlannedDays,
    totalCompletedDays: totalCompletedDays,
    overallCompletionRate: overallCompletionRate,
    streak: calculateStreak(logs),
  }
}

// Note
function calculateStreak(logs) {
  const sortedLogs = logs
    .filter(log => log.completed)
    .map(log => new Date(log.date))
    .sort((a, b) => b - a)

  if (sortedLogs.length === 0) {
    return 0
  }

  let streak = 1
  for (let i = 1; i < sortedLogs.length; i++) {
    const diffDays = Math.floor((sortedLogs[i - 1] - sortedLogs[i]) / (1000 * 60 * 60 * 24))
    if (diffDays === 1) {
      streak++
    } else {
      break
    }
  }

  return streak
}

// Note
function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

// Note
function getCurrentWeek() {
  return getWeekNumber(new Date())
}
