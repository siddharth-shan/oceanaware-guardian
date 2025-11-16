/**
 * Local Development Database Service
 * Simulates database operations using local JSON files for development
 * Maintains proper verification tracking and report management
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LocalDevDatabase {
  constructor() {
    this.dbPath = path.join(__dirname, '..', 'data');
    this.reportsFile = path.join(this.dbPath, 'reports.json');
    this.verificationsFile = path.join(this.dbPath, 'verifications.json');
    this.usersFile = path.join(this.dbPath, 'users.json');
    
    this.reports = new Map();
    this.verifications = new Map(); // reportId -> Set of userIds who verified
    this.users = new Map(); // userId -> user data
    
    this.initialized = false;
  }

  /**
   * Initialize the local database
   */
  async initialize() {
    try {
      // Create data directory if it doesn't exist
      await fs.mkdir(this.dbPath, { recursive: true });
      
      // Load existing data
      await this.loadData();
      
      this.initialized = true;
      console.log('✅ Local development database initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize local database:', error);
      return false;
    }
  }

  /**
   * Load data from JSON files
   */
  async loadData() {
    try {
      // Load reports
      try {
        const reportsData = await fs.readFile(this.reportsFile, 'utf8');
        const reports = JSON.parse(reportsData);
        this.reports = new Map(Object.entries(reports));
      } catch (error) {
        // File doesn't exist, start with empty data
        this.reports = new Map();
      }

      // Load verifications
      try {
        const verificationsData = await fs.readFile(this.verificationsFile, 'utf8');
        const verifications = JSON.parse(verificationsData);
        this.verifications = new Map();
        for (const [reportId, userIds] of Object.entries(verifications)) {
          this.verifications.set(reportId, new Set(userIds));
        }
      } catch (error) {
        this.verifications = new Map();
      }

      // Load users
      try {
        const usersData = await fs.readFile(this.usersFile, 'utf8');
        const users = JSON.parse(usersData);
        this.users = new Map(Object.entries(users));
      } catch (error) {
        this.users = new Map();
      }

      console.log(`📊 Loaded ${this.reports.size} reports, ${this.verifications.size} verification records`);
    } catch (error) {
      console.warn('⚠️ Error loading data, starting fresh:', error.message);
    }
  }

  /**
   * Save data to JSON files
   */
  async saveData() {
    try {
      // Save reports
      const reportsObj = Object.fromEntries(this.reports);
      await fs.writeFile(this.reportsFile, JSON.stringify(reportsObj, null, 2));

      // Save verifications (convert Sets to Arrays)
      const verificationsObj = {};
      for (const [reportId, userIds] of this.verifications) {
        verificationsObj[reportId] = Array.from(userIds);
      }
      await fs.writeFile(this.verificationsFile, JSON.stringify(verificationsObj, null, 2));

      // Save users
      const usersObj = Object.fromEntries(this.users);
      await fs.writeFile(this.usersFile, JSON.stringify(usersObj, null, 2));
    } catch (error) {
      console.error('❌ Error saving data:', error);
    }
  }

  /**
   * Submit community report (matching OptimizedCosmosService interface)
   */
  async submitCommunityReport(reportData) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    const report = {
      ...reportData,
      id: reportData.id || `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: reportData.timestamp || new Date().toISOString(),
      verificationCount: 0,
      verifiedByUsers: [],
      status: 'active'
    };

    this.reports.set(report.id, report);
    await this.saveData();

    console.log(`✅ Created report: ${report.id}`);
    return { success: true, reportId: report.id, report };
  }

  /**
   * Get community reports (matching OptimizedCosmosService interface)
   */
  async getCommunityReports(lat, lng, options = {}) {
    return this.getReports(lat, lng, options);
  }

  /**
   * Get reports by location (simplified for development)
   */
  async getReports(lat, lng, options = {}) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    const { limit = 20, maxAge = 7 } = options;
    const cutoff = Date.now() - maxAge * 24 * 60 * 60 * 1000;

    let reports = Array.from(this.reports.values())
      .filter(report => {
        // Filter by age
        if (new Date(report.timestamp).getTime() < cutoff) return false;
        
        // Simple location filtering (within ~10km for development)
        if (report.location && report.location.lat && report.location.lng) {
          const distance = this.calculateDistance(lat, lng, report.location.lat, report.location.lng);
          return distance <= 10; // 10km radius
        }
        
        return true;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    return {
      success: true,
      reports,
      totalReports: reports.length,
      hasMore: false
    };
  }

  /**
   * Verify a report
   */
  async verifyReport(reportId, userId, options = {}) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    // Check if user is the original author
    if (report.originalUserId === userId || report.userId === userId) {
      throw new Error('Cannot verify own report');
    }

    // Check if user has already verified
    const verifications = this.verifications.get(reportId) || new Set();
    if (verifications.has(userId)) {
      throw new Error('You have already verified this report');
    }

    // Add verification
    verifications.add(userId);
    this.verifications.set(reportId, verifications);

    // Update report verification count
    report.verificationCount = verifications.size;
    report.verifiedByUsers = Array.from(verifications);
    report.lastVerified = new Date().toISOString();

    this.reports.set(reportId, report);
    await this.saveData();

    console.log(`✅ Report ${reportId} verified by ${userId} (count: ${report.verificationCount})`);
    
    return {
      success: true,
      verificationCount: report.verificationCount
    };
  }

  /**
   * Check if user has verified a report
   */
  async checkUserVerification(userId, reportId) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    const report = this.reports.get(reportId);
    if (!report) {
      // Allow verification by default when report not found (graceful degradation)
      // This enables verification for reports that might exist in Cosmos but not in local dev cache
      return {
        hasVerified: false,
        canVerify: true,
        isOriginalAuthor: false,
        error: 'Report not found in local cache, but verification allowed'
      };
    }

    const verifications = this.verifications.get(reportId) || new Set();
    const hasVerified = verifications.has(userId);
    const isOriginalAuthor = report.originalUserId === userId || report.userId === userId;
    const canVerify = !hasVerified && !isOriginalAuthor;

    return {
      hasVerified,
      canVerify,
      isOriginalAuthor
    };
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Get database health status
   */
  getHealth() {
    return {
      status: this.initialized ? 'healthy' : 'not initialized',
      reports: this.reports.size,
      verifications: this.verifications.size,
      users: this.users.size
    };
  }
}

export default LocalDevDatabase;