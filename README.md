# n8n-nodes-claira

Custom n8n node for Claira Platform API integration.

This node provides seamless integration with Claira Platform's REST APIs, including:
- **claira_auth**: Authentication and user management
- **claira_doc_analysis**: Document analysis, deals, folders, and financial data

## About Claira

[Claira](https://claira.io) is an AI-powered Deal Intelligence Platform designed to revolutionize investment and lending processes in the financial sector. By integrating advanced AI technology, Claira transforms hours of manual work into minutes, enabling teams to underwrite and close more deals efficiently.

**Key Capabilities:**
- **Accelerated Deal Velocity**: Automates extraction and analysis of complex financial data, allowing investment professionals to focus on strategic decision-making
- **Investment & Credit Committee Workbench**: Empowers teams to identify term discrepancies, visualize deal attributes through dynamic dashboards, and collaborate seamlessly across underwriting, approval, and closing processes
- **Institutional Memory Codification**: Captures and analyzes proprietary deal knowledge, facilitating accurate trend analysis and reducing operational risk

For more information about the Claira platform, visit [claira.io](https://claira.io).

## Features

- 🔐 Automatic authentication and token management
- 📄 Document operations (list, get, upload, delete)
- 💼 Deal management (Credit Analysis)
- 📁 Folder operations
- 📊 Financial data retrieval
- 🔄 Automatic token refresh on expiration
- 🌍 Support for multiple environments (platform, stable, dev, local)

## Installation

### From npm (when published)

```bash
npm install @claira/n8n-nodes-claira
```

### From source

1. Clone this repository:
```bash
git clone https://github.com/clairaTech/n8n-nodes-claira.git
cd n8n-nodes-claira
```

2. Install dependencies:
```bash
npm install
```

3. Build the node:
```bash
npm run build
```

4. Link it to your n8n installation:
```bash
npm link
```

Then in your n8n installation:
```bash
npm link @claira/n8n-nodes-claira
```

## Configuration

### Credentials

1. In n8n, go to **Credentials** → **Add Credential**
2. Select **Claira Platform API**
3. Fill in:
   - **Email**: Your Claira Platform email address
   - **Password**: Your Claira Platform password
   - **Environment**: Select your environment (platform, stable, dev, or local)
   - **Auth Base URL** (optional): Override default auth URL
   - **Doc Analysis Base URL** (optional): Override default doc analysis URL

### Supported Environments

- **Platform**: Production environment
  - Auth: `https://auth.platform.claira.io`
  - Doc Analysis: `https://da.platform.claira.io/v2`
- **Stable**: Stable testing environment
  - Auth: `https://claira-auth.stable.aws.claira.io`
  - Doc Analysis: `https://claira-doc-analysis.stable.aws.claira.io/v2`
- **Dev**: Development environment
  - Auth: `https://claira-auth.dev.aws.claira.io`
  - Doc Analysis: `https://claira-doc-analysis.dev.aws.claira.io/v2`
- **Local**: Local development
  - Auth: `http://localhost:4999`
  - Doc Analysis: `http://localhost:4998/v2`

## Usage

### Resources

The node supports the following resources:

1. **Auth**: Authentication operations
   - Get User Info: Retrieve current authenticated user information

2. **Documents**: Document operations
   - Get Many: List documents with filtering and pagination
   - Get: Get a single document by ID
   - Upload: Upload a new document
   - Delete: Delete a document by ID

3. **Deals**: Deal operations (Credit Analysis)
   - Get Many: List deals
   - Get: Get a single deal by ID
   - Create: Create a new deal

4. **Folders**: Folder operations
   - Get Many: List folders
   - Get Tree: Get folder tree structure
   - Create: Create a new folder

5. **Financial Data**: Financial data operations
   - Get Items: Get financial data items for a document
   - Get Tables: Get financial data tables for a document

### Example Workflow

1. **Get User Info**
   - Resource: Auth
   - Operation: Get User Info

2. **List Documents**
   - Resource: Documents
   - Operation: Get Many
   - Model Type: credit_analysis
   - Filters: Optional filters (status_id, folder_id, etc.)

3. **Upload Document**
   - Resource: Documents
   - Operation: Upload
   - Model Type: credit_analysis
   - File: Binary file data
   - Deal ID: (optional, for credit analysis)
   - Folder ID: (optional)

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run build:watch
```

### Lint

```bash
npm run lint
```

### Test Locally

1. Start n8n in development mode:
```bash
npm run dev
```

2. Access n8n at `http://localhost:5678`

3. Your custom node will be available in the node panel

## API Reference

### Authentication

The node automatically handles authentication:
- Logs in on first use
- Caches access and refresh tokens
- Automatically refreshes tokens when they expire
- Retries requests with new tokens on 401 errors

### Model Types

Supported model types:
- `credit_analysis`: Credit Analysis
- `libor`: LIBOR
- `loan`: Loan
- `clo`: CLO
- `ftm`: FTM
- `cre`: CRE
- `lending_manager`: Lending Manager
- `mockup`: Mockup

## Troubleshooting

### Authentication Issues

- Verify your email and password are correct
- Check that you're using the correct environment
- Ensure your account has the necessary permissions

### Token Refresh Issues

- The node automatically refreshes tokens, but if you encounter issues:
  - Check your network connectivity
  - Verify the API endpoints are accessible
  - Check n8n logs for detailed error messages

### File Upload Issues

- Ensure the file is properly formatted
- For credit analysis documents, provide a deal_id
- Check file size limits

## License

MIT

## Publishing

To publish this node to npm and make it available in n8n Cloud, see [PUBLISHING.md](./PUBLISHING.md) for detailed instructions.

## Support

For issues and questions:
- GitHub Issues: https://github.com/Clairatech/n8n-nodes-claira/issues
- Claira Documentation: request access to support@claira.io
