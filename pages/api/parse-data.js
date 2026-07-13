// pages/api/parse-data.js
// Note

import xml2js from 'xml2js'
import { parseString } from 'xml2js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { fileContent, fileType } = req.body

    if (!fileContent || !fileType) {
      return res.status(400).json({ error: 'Missing file content or file type' })
    }

    let parsedData = null

    if (fileType.toLowerCase() === 'gpx') {
      parsedData = await parseGPX(fileContent)
    } else if (fileType.toLowerCase() === 'tcx') {
      parsedData = await parseTCX(fileContent)
    } else {
      return res.status(400).json({ error: 'Unsupported file format. Please upload GPX or TCX file.' })
    }

    res.status(200).json({
      success: true,
      fileType: fileType,
      data: parsedData,
    })
  } catch (error) {
    console.error('Parse error:', error)
    res.status(500).json({ error: 'Failed to parse file', details: error.message })
  }
}

// Note
async function parseGPX(xmlContent) {
  return new Promise((resolve, reject) => {
    parseString(xmlContent, (err, result) => {
      if (err) {
        reject(err)
        return
      }

      try {
        const gpx = result.gpx
        const tracks = []
        const points = []

        // Note
        if (gpx.trk) {
          gpx.trk.forEach(track => {
            const trackData = {
              name: track.name ? track.name[0] : 'Unnamed Track',
              segments: []
            }

            if (track.trkseg) {
              track.trkseg.forEach(segment => {
                const segmentData = []
                if (segment.trkpt) {
                  segment.trkpt.forEach(point => {
                    const lat = parseFloat(point.$.lat)
                    const lon = parseFloat(point.$.lon)
                    const ele = point.ele ? parseFloat(point.ele[0]) : null
                    const time = point.time ? new Date(point.time[0]) : null

                    segmentData.push({
                      latitude: lat,
                      longitude: lon,
                      elevation: ele,
                      timestamp: time,
                    })

                    points.push({
                      latitude: lat,
                      longitude: lon,
                      elevation: ele,
                      timestamp: time,
                    })
                  })
                }
                trackData.segments.push(segmentData)
              })
            }

            tracks.push(trackData)
          })
        }

        // Note
        if (gpx.wpt) {
          gpx.wpt.forEach(waypoint => {
            points.push({
              latitude: parseFloat(waypoint.$.lat),
              longitude: parseFloat(waypoint.$.lon),
              name: waypoint.name ? waypoint.name[0] : null,
              elevation: waypoint.ele ? parseFloat(waypoint.ele[0]) : null,
            })
          })
        }

        // Note
        const stats = calculateStats(points)

        resolve({
          format: 'GPX',
          tracks: tracks,
          totalPoints: points.length,
          statistics: stats,
        })
      } catch (parseErr) {
        reject(parseErr)
      }
    })
  })
}

// Note
async function parseTCX(xmlContent) {
  return new Promise((resolve, reject) => {
    parseString(xmlContent, (err, result) => {
      if (err) {
        reject(err)
        return
      }

      try {
        const tcx = result.TrainingCenerDatabase
        const activities = []

        if (tcx.Activities && tcx.Activities[0].Activity) {
          tcx.Activities[0].Activity.forEach(activity => {
            const activityData = {
              sport: activity.$.Sport || 'Running',
              id: activity.Id ? activity.Id[0] : null,
              laps: [],
            }

            if (activity.Lap) {
              activity.Lap.forEach(lap => {
                const lapData = {
                  startTime: lap.$.StartTime ? new Date(lap.$.StartTime) : null,
                  totalTimeSeconds: lap.TotalTimeSeconds ? parseFloat(lap.TotalTimeSeconds[0]) : 0,
                  distanceMeters: lap.DistanceMeters ? parseFloat(lap.DistanceMeters[0]) : 0,
                  maximumSpeed: lap.MaximumSpeed ? parseFloat(lap.MaximumSpeed[0]) : null,
                  calories: lap.Calories ? parseInt(lap.Calories[0]) : 0,
                  averageHeartRateBpm: lap.AverageHeartRateBpm ? parseInt(lap.AverageHeartRateBpm[0].Value[0]) : null,
                  maximumHeartRateBpm: lap.MaximumHeartRateBpm ? parseInt(lap.MaximumHeartRateBpm[0].Value[0]) : null,
                  trackpoints: [],
                }

                if (lap.Track && lap.Track[0].Trackpoint) {
                  lap.Track[0].Trackpoint.forEach(trackpoint => {
                    const pointData = {
                      time: trackpoint.Time ? new Date(trackpoint.Time[0]) : null,
                      latitude: trackpoint.Position ? parseFloat(trackpoint.Position[0].LatitudeDegrees[0]) : null,
                      longitude: trackpoint.Position ? parseFloat(trackpoint.Position[0].LongitudeDegrees[0]) : null,
                      altitudeMeters: trackpoint.AltitudeMeters ? parseFloat(trackpoint.AltitudeMeters[0]) : null,
                      distanceMeters: trackpoint.DistanceMeters ? parseFloat(trackpoint.DistanceMeters[0]) : null,
                      heartRateBpm: trackpoint.HeartRateBpm ? parseInt(trackpoint.HeartRateBpm[0].Value[0]) : null,
                      speed: trackpoint.Speed ? parseFloat(trackpoint.Speed[0]) : null,
                    }
                    lapData.trackpoints.push(pointData)
                  })
                }

                activityData.laps.push(lapData)
              })
            }

            activities.push(activityData)
          })
        }

        // Note
        const allPoints = activities.flatMap(a => a.laps.flatMap(l => l.trackpoints))
        const stats = calculateStats(allPoints)

        resolve({
          format: 'TCX',
          activities: activities,
          totalPoints: allPoints.length,
          statistics: stats,
        })
      } catch (parseErr) {
        reject(parseErr)
      }
    })
  })
}

// Note
function calculateStats(points) {
  if (!points || points.length === 0) {
    return {
      totalDistance: 0,
      totalElevationGain: 0,
      averagePace: null,
      averageSpeed: null,
      totalTime: 0,
      startDate: null,
      endDate: null,
    }
  }

  // Note
  let totalDistance = 0
  let totalElevationGain = 0
  let validSpeeds = []

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]

    if (prev.latitude && prev.longitude && curr.latitude && curr.longitude) {
      const dist = haversineDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude)
      totalDistance += dist
    }

    if (prev.elevation !== null && curr.elevation !== null && curr.elevation > prev.elevation) {
      totalElevationGain += curr.elevation - prev.elevation
    }

    if (curr.speed) {
      validSpeeds.push(curr.speed)
    }
  }

  // Note
  const timestamps = points.filter(p => p.timestamp).map(p => p.timestamp)
  let totalTime = 0
  let startDate = null
  let endDate = null

  if (timestamps.length > 0) {
    startDate = new Date(Math.min(...timestamps))
    endDate = new Date(Math.max(...timestamps))
    totalTime = (endDate - startDate) / 1000 // seconds
  }

  // Note
  let averagePace = null
  if (totalDistance > 0 && totalTime > 0) {
    const paceSecondsPerKm = (totalTime / (totalDistance / 1000))
    averagePace = {
      minutes: Math.floor(paceSecondsPerKm / 60),
      seconds: Math.round(paceSecondsPerKm % 60),
    }
  }

  // Note
  let averageSpeed = null
  if (validSpeeds.length > 0) {
    averageSpeed = validSpeeds.reduce((sum, s) => sum + s, 0) / validSpeeds.length
  }

  return {
    totalDistance: Math.round(totalDistance * 100) / 100, // meters
    totalDistanceKm: Math.round(totalDistance / 10) / 100, // km
    totalElevationGain: Math.round(totalElevationGain * 10) / 10, // meters
    averagePace: averagePace,
    averageSpeed: averageSpeed, // meters/seconds
    totalTime: totalTime, // seconds
    startDate: startDate,
    endDate: endDate,
  }
}

// Note
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000 // API endpoint
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees) {
  return degrees * Math.PI / 180
}
