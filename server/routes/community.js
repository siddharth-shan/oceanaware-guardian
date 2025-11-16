import express from 'express';

const router = express.Router();

// Submit community fire hazard report
router.post('/report', async (req, res) => {
  try {
    const { 
      location, 
      description, 
      hazardType, 
      severity, 
      reporterName, 
      reporterEmail, 
      images 
    } = req.body;

    if (!location || !description || !hazardType) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Location, description, and hazard type are required'
      });
    }

    // Mock report creation
    const mockReport = {
      id: Date.now(),
      location,
      description,
      hazardType,
      severity: severity || 'Medium',
      reporterName: reporterName || 'Anonymous',
      reporterEmail,
      images: images || [],
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      report: mockReport,
      message: 'Fire hazard report submitted successfully'
    });

  } catch (error) {
    console.error('Community report error:', error);
    res.status(500).json({
      error: 'Failed to submit report',
      message: error.message
    });
  }
});

// Get community reports
router.get('/reports', async (req, res) => {
  try {
    const { lat, lng, radius = 10, limit = 20 } = req.query;

    // Mock community reports
    const mockReports = [
      {
        id: 1,
        location: {
          lat: 34.1365,
          lng: -118.2942,
          address: 'Griffith Park, Los Angeles, CA'
        },
        description: 'Large accumulation of dead brush near hiking trail',
        hazardType: 'Dead Vegetation',
        severity: 'High',
        reporterName: 'John D.',
        status: 'verified',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        distance: 1.2
      },
      {
        id: 2,
        location: {
          lat: 34.0522,
          lng: -118.2437,
          address: 'Downtown Los Angeles, CA'
        },
        description: 'Overgrown vegetation near power lines',
        hazardType: 'Power Line Hazard',
        severity: 'Medium',
        reporterName: 'Anonymous',
        status: 'pending',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        distance: 3.7
      }
    ];

    res.json({
      success: true,
      reports: mockReports,
      metadata: {
        userLocation: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
        searchRadius: parseFloat(radius),
        limit: parseInt(limit),
        count: mockReports.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      error: 'Failed to fetch community reports',
      message: error.message
    });
  }
});

// Get specific report details
router.get('/reports/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;

    // Mock detailed report
    const mockReport = {
      id: parseInt(reportId),
      location: {
        lat: 34.1365,
        lng: -118.2942,
        address: 'Griffith Park, Los Angeles, CA'
      },
      description: 'Large accumulation of dead brush near hiking trail',
      hazardType: 'Dead Vegetation',
      severity: 'High',
      reporterName: 'John D.',
      reporterEmail: 'john.d@example.com',
      status: 'verified',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      images: [
        '/uploads/reports/report1_image1.jpg',
        '/uploads/reports/report1_image2.jpg'
      ],
      verificationDetails: {
        verifiedBy: 'CAL FIRE Inspector',
        verificationDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        actionTaken: 'Vegetation cleared by maintenance crew'
      }
    };

    res.json({
      success: true,
      report: mockReport,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get report detail error:', error);
    res.status(500).json({
      error: 'Failed to fetch report details',
      message: error.message
    });
  }
});

export default router;