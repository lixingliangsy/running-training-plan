import React, { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function GeneratePlan() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    goal: '5K',
    currentFitness: 'beginner',
    weeklyMileage: 20,
    weeksAvailable: 12,
    experienceLevel: 'beginner',
    availableDaysPerWeek: 4,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [plan, setPlan] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: name === 'weeklyMileage' || name === 'weeksAvailable' || name === 'availableDaysPerWeek'
        ? parseInt(value) || 0
        : value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate plan')
      }

      // Save plan to localStorage
      const planId = Date.now().toString()
      const planWithId = { ...data.plan, id: planId, createdAt: new Date().toISOString() }
      localStorage.setItem(`plan_${planId}`, JSON.stringify(planWithId))

      // Save plan list
      const plans = JSON.parse(localStorage.getItem('plans') || '[]')
      plans.push({ id: planId, goal: data.plan.goal, createdAt: planWithId.createdAt })
      localStorage.setItem('plans', JSON.stringify(plans))

      setPlan(planWithId)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const viewPlan = () => {
    if (plan) {
      router.push(`/plan/${plan.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Generate training plan - Running Training Plan</title>
      </Head>

      <header className="bg-green-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Generate training plan</h1>
              <p className="mt-2 text-green-100">Generate a personalized running plan for your profile</p>
            </div>
            <a href="/" className="text-white hover:text-green-200">
              ← Back to home
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {!plan ? (
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Plan configuration</h2>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
                  {error}
                </div>
              )}

              {/* Goal */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Training goal *
                </label>
                <select
                  name="goal"
                  value={formData.goal}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="5K">5K (5 km)</option>
                  <option value="10K">10K (10 km)</option>
                  <option value="HalfMarathon">Half marathon (21.097 km)</option>
                  <option value="Marathon">Full marathon (42.195 km)</option>
                </select>
              </div>

              {/* Current fitness level */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current fitness level
                </label>
                <select
                  name="currentFitness"
                  value={formData.currentFitness}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="beginner">Beginner - new to running</option>
                  <option value="intermediate">Intermediate - regular running habit</option>
                  <option value="advanced">Advanced - race experience</option>
                </select>
              </div>

              {/* Note */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Running experience
                </label>
                <select
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Some experience</option>
                  <option value="advanced">Experienced</option>
                </select>
              </div>

              {/* Weekly mileage */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current weekly mileage (km): {formData.weeklyMileage} km
                </label>
                <input
                  type="range"
                  name="weeklyMileage"
                  min="5"
                  max="100"
                  step="5"
                  value={formData.weeklyMileage}
                  onChange={handleChange}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>5 km</span>
                  <span>50 km</span>
                  <span>100 km</span>
                </div>
              </div>

              {/* Note */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Training period (weeks): {formData.weeksAvailable} weeks
                </label>
                <input
                  type="range"
                  name="weeksAvailable"
                  min="4"
                  max="24"
                  step="1"
                  value={formData.weeksAvailable}
                  onChange={handleChange}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>4 weeks</span>
                  <span>12 weeks</span>
                  <span>24 weeks</span>
                </div>
              </div>

              {/* Days available per week */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Training days per week
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setFormData({ ...formData, availableDaysPerWeek: day })}
                      className={`py-2 rounded-md font-medium transition-colors
                        ${formData.availableDaysPerWeek === day
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating...' : 'Generate training plan'}
              </button>
            </form>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-gray-800">Plan generated successfully!</h2>
              </div>

              <div className="bg-green-50 p-4 rounded-md mb-6">
                <h3 className="font-semibold text-green-800 mb-2">Plan overview</h3>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-green-600">Goal</dt>
                    <dd className="font-medium text-green-900">{plan.goal}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-green-600">Total weeks</dt>
                    <dd className="font-medium text-green-900">{plan.totalWeeks} weeks</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-green-600">Estimated finish time</dt>
                    <dd className="font-medium text-green-900">{plan.estimatedFinishTime}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-green-600">Base pace</dt>
                    <dd className="font-medium text-green-900">
                      {plan.basePace.minutes}:{plan.basePace.seconds.toString().padStart(2, '0')} min/km
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={viewPlan}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md font-medium hover:bg-green-700"
                >
                  View full plan
                </button>
                <button
                  onClick={() => { setPlan(null); setFormData({ goal: '5K', currentFitness: 'beginner', weeklyMileage: 20, weeksAvailable: 12, experienceLevel: 'beginner', availableDaysPerWeek: 4 }) }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-md font-medium hover:bg-gray-300"
                >
                  Generate new plan
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
