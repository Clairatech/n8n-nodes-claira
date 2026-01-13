# Installation Guide

## Prerequisites

- Node.js 18.17.0 or higher
- npm
- n8n installation (cloud or self-hosted)

## Installation Methods

### Method 1: Install from npm (Recommended)

Once published to npm:

```bash
npm install @claira/n8n-nodes-claira
```

Then restart your n8n instance.

### Method 2: Install from Source

1. Clone the repository:
```bash
git clone https://github.com/claira/n8n-nodes-claira.git
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

4. Link the package locally:
```bash
npm link
```

5. In your n8n installation directory, link the package:
```bash
npm link @claira/n8n-nodes-claira
```

6. Restart n8n

### Method 3: Development Mode

For local development and testing:

1. Clone and build as above
2. Run n8n in development mode:
```bash
npm run dev
```

This will start n8n with your custom node loaded at `http://localhost:5678`

## Verification

After installation:

1. Open your n8n instance
2. Create a new workflow
3. Click the "+" button to add a node
4. Search for "Claira" - you should see the Claira node in the list
5. Add the node to your workflow
6. Configure credentials (see README.md for credential setup)

## Troubleshooting

### Node Not Appearing

- Ensure you've restarted n8n after installation
- Check that the build was successful (`npm run build`)
- Verify the node is listed in `package.json` under `n8n.nodes`
- Check n8n logs for any errors

### Build Errors

- Ensure you have the correct Node.js version
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript version compatibility

### Credential Issues

- Verify your Claira Platform credentials are correct
- Check that you're using the correct environment
- Ensure your account has API access permissions
