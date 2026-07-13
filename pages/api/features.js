
// pages/api/features.js
// Features API

export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).json({
    product: 'running-training-plan',
    version: '1.0.0',
    features: [
      {
        id: 'feature_001',
        name: 'Running Data Parsing',
        status: 'implemented',
        description: 'Parse GPX and TCX files from GPS devices and smartwatches to extract running data including distance, pace, elevation, heart rate, and route.',
        endpoints: ['/api/parse-data (POST)']
      },
      {
        id: 'feature_002',
        name: 'Training Plan Generator',
        status: 'implemented',
        description: 'Generate personalized training plans based on goal (5K, 10K, Half Marathon, Marathon), current fitness level, and available training days.',
        endpoints: ['/api/generate-plan (POST)']
      },
      {
        id: 'feature_003',
        name: 'Progress Visualization',
        status: 'implemented',
        description: 'Visualize training progress with charts for mileage accumulation, pace trends, heart rate trends, and training completion rates.',
        endpoints: ['/api/progress (POST)']
      },
      {
        id: 'feature_004',
        name: 'Pace Analysis',
        status: 'implemented',
        description: 'Analyze pace trends over time and provide insights for improvement.',
        endpoints: ['/api/progress (POST)']
      },
      {
        id: 'feature_005',
        name: 'Training Completion Tracking',
        status: 'implemented',
        description: 'Track planned vs. actual training completion with weekly and overall statistics.',
        endpoints: ['/api/progress (POST)']
      }
    ],
    upcoming: [
      {
        id: 'upcoming_001',
        name: 'Social Sharing',
        status: 'planned',
        expectedRelease: '2024-Q2',
        description: 'Share training plans and achievements on social media platforms.'
      },
      {
        id: 'upcoming_002',
        name: 'Coach Integration',
        status: 'planned',
        expectedRelease: '2024-Q2',
        description: 'Allow certified coaches to review and adjust training plans.'
      }
    ]
  });
}
