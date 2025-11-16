/**
 * Backend API Integration Tests
 * Tests all critical API endpoints to ensure they're working correctly
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../server.js';

describe('EcoQuest Wildfire Watch API', () => {
  let server;

  beforeAll(async () => {
    // Start server on a test port
    const port = process.env.TEST_PORT || 3002;
    server = app.listen(port);
    console.log(`Test server started on port ${port}`);
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('Health Checks', () => {
    test('GET /health should return server status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'OK',
        environment: expect.any(String),
        version: '1.0.0'
      });
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    test('GET /api should return API documentation', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body).toMatchObject({
        name: 'EcoQuest Wildfire Watch API',
        version: '1.0.0',
        description: expect.any(String),
        endpoints: expect.any(Object)
      });
    });
  });

  describe('Community Hub API', () => {
    test('GET /api/community/health should return service status', async () => {
      const response = await request(app)
        .get('/api/community/health')
        .expect(200);

      expect(response.body).toMatchObject({
        service: 'community-hub-optimized',
        database: 'cosmos-db-optimized',
        timestamp: expect.any(String)
      });
    });

    test('POST /api/community/report should create hazard report', async () => {
      const reportData = {
        location: { lat: 34.0522, lng: -118.2437 },
        description: 'Test hazard report for API testing',
        hazardType: 'fire-spotting',
        severity: 'high',
        reporterName: 'API Test User'
      };

      const response = await request(app)
        .post('/api/community/report')
        .send(reportData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        reportId: expect.any(String),
        hierarchicalPartition: expect.stringMatching(/^CA-LA-/),
        message: 'Community report submitted successfully'
      });
    });

    test('GET /api/community/reports should retrieve reports by location', async () => {
      const response = await request(app)
        .get('/api/community/reports')
        .query({ lat: 34.0522, lng: -118.2437 })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        hierarchicalPartition: expect.stringMatching(/^CA-LA-/),
        reports: expect.any(Array),
        totalReports: expect.any(Number)
      });
    });

    test('GET /api/community/reports should require location parameters', async () => {
      const response = await request(app)
        .get('/api/community/reports')
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Location required',
        message: 'Latitude and longitude are required'
      });
    });
  });

  describe('Family Groups API', () => {
    const testGroupCode = 'TEST-API-9999';

    test('GET /api/family-groups/health should return service status', async () => {
      const response = await request(app)
        .get('/api/family-groups/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'OK',
        service: 'family-groups',
        storage: 'cosmos-db',
        connected: true
      });
    });

    test('PUT /api/family-groups/:groupCode should create family group', async () => {
      const groupData = {
        data: {
          groupName: 'API Test Family',
          members: [
            {
              id: 'test-user-api-001',
              name: 'API Test Creator',
              role: 'creator'
            }
          ],
          status: 'active'
        }
      };

      const response = await request(app)
        .put(`/api/family-groups/${testGroupCode}`)
        .send(groupData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        groupCode: testGroupCode,
        message: 'Group data saved to Cosmos DB successfully'
      });
    });

    test('GET /api/family-groups/:groupCode should retrieve family group', async () => {
      const response = await request(app)
        .get(`/api/family-groups/${testGroupCode}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          groupName: 'API Test Family',
          members: expect.arrayContaining([
            expect.objectContaining({
              name: 'API Test Creator',
              role: 'creator'
            })
          ]),
          status: 'active'
        }
      });
    });

    test('PUT /api/family-groups/:groupCode should validate group code format', async () => {
      const invalidGroupCode = 'invalid-code';
      const groupData = {
        data: {
          groupName: 'Invalid Test',
          members: [],
          status: 'active'
        }
      };

      const response = await request(app)
        .put(`/api/family-groups/${invalidGroupCode}`)
        .send(groupData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Invalid group code format',
        message: 'Group code must be in format WORD-WORD-1234'
      });
    });
  });

  describe('Fire Data API', () => {
    test('GET /api/fire-data/nearby should return fire data', async () => {
      const response = await request(app)
        .get('/api/fire-data/nearby')
        .query({ lat: 34.0522, lng: -118.2437, radius: 50 })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        fires: expect.any(Array),
        metadata: expect.objectContaining({
          userLocation: { lat: 34.0522, lng: -118.2437 },
          searchRadius: 50,
          count: expect.any(Number),
          source: 'NASA-FIRMS'
        })
      });
    });

    test('GET /api/fire-data/state should return state fire data', async () => {
      const response = await request(app)
        .get('/api/fire-data/state')
        .query({ state: 'California' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        fires: expect.any(Array),
        metadata: expect.objectContaining({
          state: 'California',
          source: 'NASA-FIRMS'
        })
      });
    });
  });

  describe('Weather API', () => {
    test('GET /api/weather/current should return weather data', async () => {
      const response = await request(app)
        .get('/api/weather/current')
        .query({ lat: 34.0522, lng: -118.2437 })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        weather: expect.objectContaining({
          temperature: expect.any(Number),
          humidity: expect.any(Number),
          windSpeed: expect.any(Number),
          description: expect.any(String),
          fireWeatherIndex: expect.any(String)
        }),
        metadata: expect.objectContaining({
          userLocation: { lat: 34.0522, lng: -118.2437 }
        })
      });
    });

    test('GET /api/weather/forecast should return forecast data', async () => {
      const response = await request(app)
        .get('/api/weather/forecast')
        .query({ lat: 34.0522, lng: -118.2437 })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        forecast: expect.any(Array),
        metadata: expect.objectContaining({
          userLocation: { lat: 34.0522, lng: -118.2437 }
        })
      });
    });
  });

  describe('Alerts API', () => {
    test('GET /api/alerts/current should return current alerts', async () => {
      const response = await request(app)
        .get('/api/alerts/current')
        .query({ lat: 34.0522, lng: -118.2437 })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        alerts: expect.any(Array),
        metadata: expect.objectContaining({
          userLocation: { lat: 34.0522, lng: -118.2437 }
        })
      });

      // Check alert structure if alerts exist
      if (response.body.alerts.length > 0) {
        const alert = response.body.alerts[0];
        expect(alert).toMatchObject({
          id: expect.any(String),
          type: expect.any(String),
          severity: expect.any(String),
          title: expect.any(String),
          message: expect.any(String),
          timestamp: expect.any(String)
        });
      }
    });
  });

  describe('AI Analysis API', () => {
    test('POST /api/ai-analysis/analyze should analyze vegetation', async () => {
      const analysisData = {
        location: { lat: 34.0522, lng: -118.2437 },
        analysisType: 'risk-assessment'
      };

      const response = await request(app)
        .post('/api/ai-analysis/analyze')
        .send(analysisData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        analysis: expect.any(Object),
        confidence: expect.any(Number)
      });

      // Confidence should be between 0 and 1
      expect(response.body.confidence).toBeGreaterThanOrEqual(0);
      expect(response.body.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/non-existent-endpoint')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Route not found',
        message: expect.stringContaining('Cannot GET /api/non-existent-endpoint')
      });
    });

    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/community/report')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    test('should accept reasonable request volumes', async () => {
      const requests = Array(10).fill().map(() => 
        request(app).get('/health').expect(200)
      );

      const responses = await Promise.all(requests);
      expect(responses).toHaveLength(10);
      responses.forEach(response => {
        expect(response.body.status).toBe('OK');
      });
    });
  });

  describe('CORS Headers', () => {
    test('should include proper CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});