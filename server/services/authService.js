class AuthService {
  constructor() {
    this.arcgisToken = null;
    this.tokenExpiry = null;
    this.username = process.env.ARCGIS_USR;
    this.password = process.env.ARCGIS_PWD;
    this.firmsMapKey = process.env.FIRMS_MAP_KEY;
  }

  // Generate ArcGIS token for NIFC services
  async generateArcGISToken() {
    try {
      const tokenUrl = 'https://www.arcgis.com/sharing/rest/generateToken';
      const tokenData = new URLSearchParams({
        username: this.username,
        password: this.password,
        referer: 'https://www.arcgis.com',
        f: 'json',
        expiration: 120 // 2 hours in minutes
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: tokenData
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(`ArcGIS token generation failed: ${data.error.message}`);
      }

      this.arcgisToken = data.token;
      this.tokenExpiry = new Date(data.expires);
      
      console.log('ArcGIS token generated successfully, expires:', this.tokenExpiry);
      return this.arcgisToken;
    } catch (error) {
      console.error('Error generating ArcGIS token:', error.message);
      throw error;
    }
  }

  // Ensure we have a valid ArcGIS token
  async ensureValidArcGISToken() {
    // Check if credentials are available
    if (!this.username || !this.password) {
      console.log('ArcGIS credentials not configured, skipping token generation');
      return null; // Return null instead of throwing error
    }
    
    if (!this.arcgisToken || !this.tokenExpiry || new Date() >= this.tokenExpiry) {
      console.log('ArcGIS token expired or missing, generating new token...');
      await this.generateArcGISToken();
    }
    return this.arcgisToken;
  }

  // Get FIRMS MAP_KEY (no expiration needed)
  getFirmsMapKey() {
    if (!this.firmsMapKey) {
      console.log('FIRMS_MAP_KEY not configured, skipping NASA FIRMS data');
      return null; // Return null instead of throwing error
    }
    return this.firmsMapKey;
  }

  // Test authentication
  async testAuthentication() {
    const results = {
      arcgis: false,
      firms: false,
      errors: []
    };

    // Test ArcGIS token generation
    try {
      const token = await this.ensureValidArcGISToken();
      results.arcgis = !!token;
      console.log('✅ ArcGIS authentication successful');
    } catch (error) {
      results.errors.push(`ArcGIS: ${error.message}`);
      console.log('❌ ArcGIS authentication failed:', error.message);
    }

    // Test FIRMS MAP_KEY
    try {
      const mapKey = this.getFirmsMapKey();
      results.firms = !!mapKey;
      console.log('✅ FIRMS MAP_KEY found');
    } catch (error) {
      results.errors.push(`FIRMS: ${error.message}`);
      console.log('❌ FIRMS MAP_KEY missing:', error.message);
    }

    return results;
  }
}

export default AuthService;