# Publishing Guide for n8n Cloud

This guide explains how to publish your Claira n8n node to npm and make it available in n8n Cloud.

## Prerequisites

1. **npm account**: You need an npm account. If you don't have one, sign up at https://www.npmjs.com/signup
2. **npm organization**: Since your package uses `@claira` scope, you need to:
   - Create an npm organization named `claira` at https://www.npmjs.com/org/create
   - Or publish without scope (change package name to `n8n-nodes-claira`)
3. **n8n Creator Portal account**: Sign up at https://creator.n8n.io (for submitting to n8n Cloud)

## Step 1: Prepare Your Package

### 1.1 Update package.json

Make sure your `package.json` has all required fields:

- ✅ Package name: `@claira/n8n-nodes-claira` (or `n8n-nodes-claira` if not using scope)
- ✅ Version: `0.1.0` (increment for each release)
- ✅ Keywords: Must include `n8n-community-node-package`
- ✅ Repository: GitHub repository URL
- ✅ Homepage: (optional but recommended) Documentation URL
- ✅ Author: Your name and email

### 1.2 Build the package

```bash
cd n8n-nodes-claira
npm run build
```

This creates the `dist/` folder with compiled JavaScript files.

### 1.3 Test locally

```bash
npm run lint
npm run dev
```

Make sure everything works before publishing.

## Step 2: Publish to npm

### 2.1 Login to npm

```bash
npm login
```

Enter your npm username, password, and email when prompted.

### 2.2 Verify you're logged in

```bash
npm whoami
```

### 2.3 Publish the package

**For scoped packages (@claira/n8n-nodes-claira):**

```bash
npm publish --access public
```

The `--access public` flag is required for scoped packages to make them publicly available.

**For unscoped packages (n8n-nodes-claira):**

```bash
npm publish
```

### 2.4 Verify publication

Check your package on npm:
- https://www.npmjs.com/package/@claira/n8n-nodes-claira

## Step 3: Submit to n8n Creator Portal

### 3.1 Sign up / Login

1. Go to https://creator.n8n.io
2. Sign up or log in with your account

### 3.2 Submit your node

1. Click "Submit Node" or "New Submission"
2. Fill in the required information:
   - **Package Name**: `@claira/n8n-nodes-claira`
   - **npm URL**: `https://www.npmjs.com/package/@claira/n8n-nodes-claira`
   - **GitHub Repository**: `https://github.com/claira/n8n-nodes-claira`
   - **Description**: Brief description of what your node does
   - **Category**: Select appropriate category (e.g., "API", "Productivity")
   - **Icon**: Upload your node icon (claira.svg)

### 3.3 Review Process

n8n team will review your submission. They check:
- Code quality and security
- Node functionality
- Documentation
- User experience
- Compliance with n8n guidelines

This process typically takes a few days to a week.

### 3.4 Approval

Once approved, your node will be:
- Listed in the n8n Creator Portal
- Available for installation in n8n Cloud
- Searchable in the n8n node panel

## Step 4: Installing in n8n Cloud

After approval, users can install your node:

1. In n8n Cloud, go to **Settings** → **Community Nodes**
2. Click **Install Community Node**
3. Search for `@claira/n8n-nodes-claira` or `claira`
4. Click **Install**
5. The node will be available in the node panel

## Updating Your Node

When you need to publish updates:

### 1. Update version

```bash
npm version patch  # for bug fixes (0.1.0 → 0.1.1)
npm version minor  # for new features (0.1.0 → 0.2.0)
npm version major  # for breaking changes (0.1.0 → 1.0.0)
```

Or manually edit `package.json` and update the version.

### 2. Build and publish

```bash
npm run build
npm publish --access public
```

### 3. Update in Creator Portal

If there are significant changes, you may need to update your submission in the Creator Portal.

## Troubleshooting

### "Package name already exists"

- If using `@claira` scope, make sure you're a member of the `claira` npm organization
- Or change the package name to something unique

### "You do not have permission to publish"

- Verify you're logged in: `npm whoami`
- For scoped packages, ensure you're a member of the organization
- Check package.json name matches your npm organization

### "Package not found in n8n Cloud"

- Make sure you've submitted it to the Creator Portal
- Wait for approval (can take a few days)
- Check that the package name in Creator Portal matches npm exactly

### Build errors

- Run `npm run lint` to check for issues
- Ensure all TypeScript files compile: `npm run build`
- Check that `dist/` folder contains all necessary files

## Best Practices

1. **Versioning**: Follow semantic versioning (major.minor.patch)
2. **Documentation**: Keep README.md up to date
3. **Testing**: Test thoroughly before publishing
4. **Changelog**: Maintain a CHANGELOG.md for users
5. **Security**: Keep dependencies up to date
6. **Communication**: Respond to issues and PRs on GitHub

## Resources

- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)
- [n8n Creator Portal](https://creator.n8n.io)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [n8n Node Development Guide](https://docs.n8n.io/integrations/creating-nodes/)
