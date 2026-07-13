import React, { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function UploadData() {
  const router = useRouter()
  const [file, setFile] = useState(null)
  const [fileType, setFileType] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [parsedData, setParsedData] = useState(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    setFile(selectedFile)

    // Auto-detect file type
    const fileName = selectedFile.name.toLowerCase()
    if (fileName.endsWith('.gpx')) {
      setFileType('gpx')
    } else if (fileName.endsWith('.tcx')) {
      setFileType('tcx')
    } else {
      setError('Unsupported format. Upload .gpx or .tcx files.')
      setFile(null)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file || !fileType) {
      setError('Please select a file to upload')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Read file content
      const fileContent = await readFileAsText(file)

      const response = await fetch('/api/parse-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileContent,
          fileType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse file')
      }

      setParsedData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = (e) => reject(e)
      reader.readAsText(file)
    })
  }

  const formatTime = (seconds) => {
    if (!seconds) return '-'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatPace = (pace) => {
    if (!pace) return '-'
    return `${pace.minutes}:${pace.seconds.toString().padStart(2, '0')} min/km`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Upload run data - Running Training Plan</title>
      </Head>

      <header className="bg-green-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Upload run data</h1>
              <p className="mt-2 text-green-100">Supports GPX and TCX formats</p>
            </div>
            <a href="/" className="text-white hover:text-green-200">
              Home
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {!parsedData ? (
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload GPS data file</h2>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
                  {error}
                </div>
              )}

              <form onSubmit={handleUpload}>
                {/* Note */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select file (.gpx or .tcx)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-green-500 transition-colors">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 0 0-4 4v20m32-12v8m0 0v8a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4v-4m32-4l-3.172-3.172a4 4 0 0 0-5.656 0L28 28M8 32l9.172-9.172a4 4 0 0 1 5.656 0L28 28m0 0l4 4m-4-4v12"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none"
                        >
                          <span>Upload file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            accept=".gpx,.tcx"
                            onChange={handleFileChange}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">or drag and drop here</p>
                      </div>
                      <p className="text-xs text-gray-500">GPX or TCX format</p>
                    </div>
                  </div>
                  {file && (
                    <div className="mt-2 text-sm text-gray-600">
                      Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                      {fileType && <span className="ml-2 text-green-600">· {fileType.toUpperCase()} format</span>}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !file}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Parsing...' : 'Upload and parse'}
                </button>
              </form>

              <div className="mt-8 bg-blue-50 p-4 rounded-md">
                <h3 className="font-semibold text-blue-800 mb-2">Supported file formats</h3>
                <ul className="space-y-1 text-sm text-blue-700">
                  <li><strong>GPX (GPS Exchange Format)</strong> - Common GPS format with track points and waypoints</li>
                  <li><strong>TCX (Training Center XML)</strong> - Garmin-style training format with heart rate and pace</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Note */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-center mb-4">
                  <div className="text-6xl mb-2">✅</div>
                  <h2 className="text-2xl font-bold text-gray-800">Parsed successfully!</h2>
                  <p className="text-gray-600">File type: {parsedData.fileType.toUpperCase()}</p>
                </div>

                <button
                  onClick={() => { setParsedData(null); setFile(null); setFileType('') }}
                  className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-300"
                >
                  Upload new file
                </button>
              </div>

              {/* Statistics */}
              {parsedData.data.statistics && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-md">
                      <div className="text-sm text-blue-600">Total distance</div>
                      <div className="text-2xl font-bold text-blue-800">
                        {parsedData.data.statistics.totalDistanceKm || (parsedData.data.statistics.totalDistance / 1000).toFixed(2)} km
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-md">
                      <div className="text-sm text-green-600">Total points</div>
                      <div className="text-2xl font-bold text-green-800">{parsedData.data.totalPoints}</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-md">
                      <div className="text-sm text-purple-600">Total time</div>
                      <div className="text-2xl font-bold text-purple-800">
                        {formatTime(parsedData.data.statistics.totalTime)}
                      </div>
                    </div>
                    {parsedData.data.statistics.averagePace && (
                      <div className="bg-orange-50 p-4 rounded-md">
                        <div className="text-sm text-orange-600">Average pace</div>
                        <div className="text-2xl font-bold text-orange-800">
                          {formatPace(parsedData.data.statistics.averagePace)}
                        </div>
                      </div>
                    )}
                    {parsedData.data.statistics.totalElevationGain > 0 && (
                      <div className="bg-red-50 p-4 rounded-md">
                        <div className="text-sm text-red-600">Elevation gain</div>
                        <div className="text-2xl font-bold text-red-800">
                          {parsedData.data.statistics.totalElevationGain} m
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* GPX Track data */}
              {parsedData.data.format === 'GPX' && parsedData.data.tracks && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Track data</h3>
                  <div className="space-y-4">
                    {parsedData.data.tracks.map((track, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-4">
                        <h4 className="font-semibold text-gray-700 mb-2">{track.name}</h4>
                        <div className="text-sm text-gray-600">
                          Segments: {track.segments.length}
                        </div>
                        {track.segments[0] && (
                          <div className="mt-2 max-h-48 overflow-y-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="px-2 py-1 text-left">#</th>
                                  <th className="px-2 py-1 text-left">Latitude</th>
                                  <th className="px-2 py-1 text-left">Longitude</th>
                                  <th className="px-2 py-1 text-left">Elevation</th>
                                </tr>
                              </thead>
                              <tbody>
                                {track.segments[0].slice(0, 10).map((point, pIdx) => (
                                  <tr key={pIdx} className="border-t">
                                    <td className="px-2 py-1">{pIdx + 1}</td>
                                    <td className="px-2 py-1">{point.latitude?.toFixed(6)}</td>
                                    <td className="px-2 py-1">{point.longitude?.toFixed(6)}</td>
                                    <td className="px-2 py-1">{point.elevation?.toFixed(1)} m</td>
                                  </tr>
                                ))}
                                {track.segments[0].length > 10 && (
                                  <tr>
                                    <td colSpan="4" className="px-2 py-1 text-center text-gray-500">
                                      ... ... {track.segments[0].length - 10} more points
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TCX Activity data */}
              {parsedData.data.format === 'TCX' && parsedData.data.activities && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Activity data</h3>
                  <div className="space-y-4">
                    {parsedData.data.activities.map((activity, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-4">
                        <h4 className="font-semibold text-gray-700 mb-2">
                          {activity.sport} - {activity.laps.length} laps
                        </h4>
                        <div className="space-y-2">
                          {activity.laps.map((lap, lapIdx) => (
                            <div key={lapIdx} className="bg-gray-50 p-3 rounded">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-500">Duration: </span>
                                  {formatTime(lap.totalTimeSeconds)}
                                </div>
                                <div>
                                  <span className="text-gray-500">Distance: </span>
                                  {(lap.distanceMeters / 1000).toFixed(2)} km
                                </div>
                                {lap.averageHeartRateBpm && (
                                  <div>
                                    <span className="text-gray-500">Avg heart rate: </span>
                                    {lap.averageHeartRateBpm} bpm
                                  </div>
                                )}
                                {lap.calories && (
                                  <div>
                                    <span className="text-gray-500">Calories: </span>
                                    {lap.calories} cal
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="bg-gray-800 text-white mt-12">
        <div className="container mx-auto px-4 py-6 text-center">
          <p>&copy; 2026 Running Training Plan. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
