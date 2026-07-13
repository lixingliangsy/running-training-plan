import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function PlanDetail() {
  const router = useRouter()
  const { id } = router.query
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      const savedPlan = localStorage.getItem(`plan_${id}`)
      if (savedPlan) {
        setPlan(JSON.parse(savedPlan))
      }
      setLoading(false)
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Plan not found</h2>
          <a href="/generate" className="text-green-600 hover:text-green-700">
            Generate new plan →
          </a>
        </div>
      </div>
    )
  }

  // Note
  const weeklyMileageChart = {
    labels: plan.weeks.map(w => `Week ${w.week}`),
    datasets: [
      {
        label: 'Planned mileage (km)',
        data: plan.weeks.map(w => w.totalMileage),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: 'Long run (km)',
        data: plan.weeks.map(w => w.longRunDistance),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
    ],
  }

  // Note
  const intensityChart = {
    labels: plan.weeks.map(w => `Week ${w.week}`),
    datasets: [
      {
        label: 'Training intensity (%)',
        data: plan.weeks.map(w => w.intensity),
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{plan.goal} Training Plan - Running Training Plan</title>
      </Head>

      <header className="bg-green-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{plan.goal} Training Plan</h1>
              <p className="mt-2 text-green-100">
                {plan.totalWeeks}-week training plan · Estimated finish time {plan.estimatedFinishTime}
              </p>
            </div>
            <a href="/" className="text-white hover:text-green-200">
              Home
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Plan overview */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Plan overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-md">
              <div className="text-sm text-green-600">Target distance</div>
              <div className="text-2xl font-bold text-green-800">{plan.targetDistance} km</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="text-sm text-blue-600">Training period</div>
              <div className="text-2xl font-bold text-blue-800">{plan.totalWeeks} weeks</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-md">
              <div className="text-sm text-purple-600">Base pace</div>
              <div className="text-2xl font-bold text-purple-800">
                {plan.basePace.minutes}:{plan.basePace.seconds.toString().padStart(2, '0')}
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-md">
              <div className="text-sm text-orange-600">Weekly mileage</div>
              <div className="text-2xl font-bold text-orange-800">{plan.weeklyMileage} km</div>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly mileage分布</h3>
            <div className="h-64">
              <Bar data={weeklyMileageChart} options={chartOptions} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Training intensity trend</h3>
            <div className="h-64">
              <Bar data={intensityChart} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Weekly training details */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Weekly training details</h2>
          {plan.weeks.map(week => (
            <div key={week.week} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-green-600 text-white px-6 py-4">
                <h3 className="text-xl font-bold">Week {week.week}</h3>
                <p className="text-green-100">
                  Intensity: {week.intensity}% · Total mileage: {week.totalMileage} km · Long run: {week.longRunDistance} km
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {week.days.map((day, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-md border-l-4 ${
                        day.type === 'Rest'
                          ? 'bg-gray-50 border-gray-300'
                          : 'bg-green-50 border-green-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-800">{day.day}</span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            day.type === 'Rest'
                              ? 'bg-gray-200 text-gray-600'
                              : 'bg-green-200 text-green-800'
                          }`}
                        >
                          {day.type}
                        </span>
                      </div>
                      {day.type !== 'Rest' ? (
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>{day.description}</p>
                          <div className="flex gap-4 mt-2">
                            <span>📏 {day.distance} km</span>
                            <span>⏱️ {day.pace.minutes}:{day.pace.seconds.toString().padStart(2, '0')} min/km</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            <p>Warm-up: {day.warmup}</p>
                            <p>Cool-down: {day.cooldown}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">{day.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Training tips */}
        {plan.tips && plan.tips.length > 0 && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Training tips</h3>
            <ul className="space-y-2">
              {plan.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-700">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      <footer className="bg-gray-800 text-white mt-12">
        <div className="container mx-auto px-4 py-6 text-center">
          <p>&copy; 2026 Running Training Plan. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
