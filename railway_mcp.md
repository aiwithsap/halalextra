# Railway MCP Server Documentation

## Installation & Setup

### Prerequisites
1. **Railway CLI Installation**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   # or
   curl -fsSL https://railway.app/install.sh | sh
   ```

2. **Authentication**
   ```bash
   # Login to Railway
   railway login
   ```

3. **MCP Server Installation**
   ```bash
   # Install Railway MCP Server
   npm install -g @railway/mcp-server
   ```

### Claude Code Configuration
The Railway MCP server is accessible through the `mcp__railway-mcp-server` namespace. No additional configuration needed if Railway CLI is properly installed and authenticated.

### Verification
Use the status check function to verify everything is working:
```javascript
mcp__railway-mcp-server__check-railway-status()
```

## Connection Status
- **MCP Server Name**: `mcp__railway-mcp-server`
- **Last Verified**: 2025-09-20
- **Status**: ✅ Operational and accessible
- **Authentication**: Active and valid
- **Railway CLI**: Installed and functional

## Available Functions

### Status & Authentication
- **`check-railway-status`**: Verify CLI installation and authentication status
  - Returns: CLI availability, authentication status, operational readiness
  - No parameters required

### Project Management
- **`create-project-and-link`**: Create new Railway project and link to directory
  - Parameters: `projectName` (string), `workspacePath` (string, required)

- **`list-projects`**: List all Railway projects for logged-in account
  - No parameters required

### Environment Management
- **`create-environment`**: Create new Railway environment
  - Parameters: `workspacePath` (string, required), `environmentName` (string, required)
  - Optional: `duplicateEnvironment` (string), `serviceVariables` (array of service/variable pairs)

- **`link-environment`**: Link to specific Railway environment
  - Parameters: `workspacePath` (string, required), `environmentName` (string, required)

### Service Management
- **`list-services`**: List all services for currently linked project
  - Parameters: `workspacePath` (string, required)

- **`link-service`**: Link service to current Railway project
  - Parameters: `workspacePath` (string, required), `serviceName` (string, optional)

### Deployment Operations
- **`deploy`**: Upload and deploy from current directory
  - Parameters: `workspacePath` (string, required)
  - Optional: `ci` (boolean), `environment` (string), `service` (string)

- **`deploy-template`**: Search and deploy Railway templates
  - Parameters: `workspacePath` (string, required), `searchQuery` (string, required)
  - Optional: `teamId` (string), `templateIndex` (number)

### Domain Management
- **`generate-domain`**: Generate domain for linked Railway project
  - Parameters: `workspacePath` (string, required)
  - Optional: `service` (string)

### Environment Variables
- **`list-variables`**: Show variables for active environment
  - Parameters: `workspacePath` (string, required)
  - Optional: `environment` (string), `json` (boolean), `kv` (boolean), `service` (string)

- **`set-variables`**: Set environment variables for active environment
  - Parameters: `workspacePath` (string, required), `variables` (array of strings in 'key=value' format)
  - Optional: `environment` (string), `service` (string), `skipDeploys` (boolean)

### Logging & Monitoring
- **`get-logs`**: Get build or deployment logs
  - Parameters: `workspacePath` (string, required), `logType` (enum: "build" or "deploy", required)
  - Optional: `deploymentId` (string), `environment` (string), `service` (string)

## Usage Examples

### Basic Project Setup
```javascript
// Check status
mcp__railway-mcp-server__check-railway-status()

// Create and link project
mcp__railway-mcp-server__create-project-and-link({
  projectName: "my-app",
  workspacePath: "/path/to/project"
})

// List projects
mcp__railway-mcp-server__list-projects()
```

### Deployment Workflow
```javascript
// Deploy from current directory
mcp__railway-mcp-server__deploy({
  workspacePath: "/path/to/project",
  ci: true
})

// Generate domain
mcp__railway-mcp-server__generate-domain({
  workspacePath: "/path/to/project"
})

// Check deployment logs
mcp__railway-mcp-server__get-logs({
  workspacePath: "/path/to/project",
  logType: "deploy"
})
```

### Environment Management
```javascript
// Create environment
mcp__railway-mcp-server__create-environment({
  workspacePath: "/path/to/project",
  environmentName: "staging"
})

// Set variables
mcp__railway-mcp-server__set-variables({
  workspacePath: "/path/to/project",
  variables: ["NODE_ENV=production", "PORT=3000"]
})
```

## Key Features
- **Full Railway CLI Integration**: Complete access to Railway platform features
- **Project Lifecycle Management**: Creation, linking, deployment, monitoring
- **Environment Management**: Multi-environment support with variable management
- **Template System**: Access to Railway's template marketplace
- **Real-time Logging**: Build and deployment log access
- **Domain Management**: Automatic domain generation and management
- **Service Orchestration**: Multi-service project management

## Authentication Requirements
- Railway CLI must be installed on the system
- User must be logged in via `railway login`
- Active authentication token required for all operations

## Workspace Path Requirements
- Most functions require `workspacePath` parameter
- Path should be absolute path to project directory
- Directory should contain Railway project configuration or be suitable for new project creation

## Error Handling
- Functions return success/failure status
- Authentication failures provide clear error messages
- Network connectivity issues are handled gracefully
- Invalid parameters result in descriptive error responses

## Integration Notes
- MCP server provides seamless integration with Railway platform
- All standard Railway CLI features available through function calls
- Real-time status monitoring and feedback
- Supports both individual operations and complex deployment workflows