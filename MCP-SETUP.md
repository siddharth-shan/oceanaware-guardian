# MCP Server Configuration Setup

## Security Notice

**IMPORTANT:** Never commit `.mcp.json` to version control as it contains sensitive API keys!

## Setup Instructions

1. Copy the template file:
   ```bash
   cp .mcp.json.template .mcp.json
   ```

2. Edit `.mcp.json` and replace the placeholder values with your actual API keys:
   - `YOUR_TESTSPRITE_API_KEY_HERE` - Get from https://testsprite.com
   - `YOUR_FIRECRAWL_API_KEY_HERE` - Get from https://firecrawl.dev
   - `YOUR_REF_TOOLS_API_KEY_HERE` - Get from https://ref.tools
   - Update file paths to match your local system

3. **Never commit the `.mcp.json` file** - it's already in `.gitignore`

## API Keys to Obtain

### Firecrawl
- Sign up at: https://firecrawl.dev
- Navigate to API Keys section
- Generate a new API key
- Add to `.mcp.json` under `mcp-server-firecrawl.env.FIRECRAWL_API_KEY`

### TestSprite
- Sign up at: https://testsprite.com
- Get your API key from account settings
- Add to `.mcp.json` under `TestSprite.env.API_KEY`

### Ref Tools
- Sign up at: https://ref.tools
- Generate API key
- Add to `.mcp.json` URL parameter: `https://api.ref.tools/mcp?apiKey=YOUR_KEY`

## File Structure

```
.mcp.json.template  ← Template file (committed to git)
.mcp.json          ← Your local config with real keys (NOT committed)
```

## Troubleshooting

If you accidentally committed API keys:
1. Immediately revoke all exposed keys from their respective services
2. Generate new keys
3. Update your local `.mcp.json` with new keys
4. The sensitive files have been removed from git tracking
