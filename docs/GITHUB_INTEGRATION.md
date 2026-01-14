# GitHub Integration Guide

## Overview

The CodeSync IDE now supports cloning GitHub repositories directly into your workspace, making changes, and pushing them back to GitHub.

## Features

- ✅ Clone public and private repositories
- ✅ GitHub Personal Access Token (PAT) authentication
- ✅ Branch selection during clone
- ✅ Secure token storage (encrypted)
- ✅ Repository validation
- ✅ Progress indicators
- ✅ Error handling with clear messages

## Quick Start

### 1. Clone a Repository

1. Open the IDE
2. Click **File** → **Clone from GitHub...**
3. Enter the repository URL (e.g., `https://github.com/facebook/react`)
4. Click **Fetch** to load repository information
5. Select a branch (optional)
6. Choose destination directory
7. Click **Clone Repository**

### 2. Clone Private Repositories

For private repositories, you'll need a GitHub Personal Access Token:

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token** → **Generate new token (classic)**
3. Give it a name (e.g., "CodeSync IDE")
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `read:user` (Read user profile data)
5. Click **Generate token**
6. Copy the token (you won't see it again!)
7. In the Clone dialog, paste the token in the **GitHub Personal Access Token** field
8. The token will be validated and saved securely

## Usage Examples

### Clone a Public Repository

```
URL: https://github.com/vercel/next.js
Branch: canary
Destination: /workspace/next.js
```

### Clone a Private Repository

```
URL: https://github.com/myorg/private-repo
Token: ghp_xxxxxxxxxxxxxxxxxxxx
Branch: main
Destination: /workspace/private-repo
```

### Supported URL Formats

- HTTPS: `https://github.com/owner/repo`
- HTTPS with .git: `https://github.com/owner/repo.git`
- SSH: `git@github.com:owner/repo.git`

## Making Changes

After cloning:

1. **Browse Files**: Files appear in the file explorer
2. **Edit Code**: Click any file to open in the editor
3. **Save Changes**: Changes are automatically saved
4. **View Git Status**: Modified files show indicators

## Committing & Pushing

### Via Terminal

```bash
# Stage changes
git add .

# Commit
git commit -m "Your commit message"

# Push to GitHub
git push origin main
```

### Via Git Panel (Coming Soon)

A graphical Git interface is planned for future releases.

## Security

### Token Storage

- Tokens are encrypted before storage
- Stored in browser localStorage
- Automatically cleared on sign out
- Never transmitted except to GitHub API

### Best Practices

1. **Use Fine-Grained Tokens**: Create tokens with minimal required permissions
2. **Set Expiration**: Use short-lived tokens (30-90 days)
3. **Revoke Unused Tokens**: Regularly audit and revoke old tokens
4. **Never Share Tokens**: Treat them like passwords

## Troubleshooting

### "Repository not found"

- Check the URL is correct
- For private repos, ensure you've provided a valid token
- Verify you have access to the repository

### "Authentication required"

- The repository is private
- Provide a GitHub Personal Access Token
- Ensure the token has `repo` scope

### "Invalid token"

- Token may be expired or revoked
- Generate a new token at [github.com/settings/tokens](https://github.com/settings/tokens)
- Ensure token has required scopes

### Clone is slow

- Large repositories take time to clone
- Progress is shown in the dialog
- Consider cloning specific branches only

### CORS errors

- The IDE uses a CORS proxy for GitHub operations
- If issues persist, try using HTTPS URLs instead of SSH

## API Reference

### GitHubService

```typescript
import GitHubService from '@/lib/github-service'

const service = new GitHubService()

// Set authentication token
service.setToken('ghp_xxxxxxxxxxxx')

// Validate repository URL
const isValid = service.validateRepoUrl('https://github.com/owner/repo')

// Fetch repository info
const repo = await service.fetchRepoInfo('owner', 'repo')

// List branches
const branches = await service.listBranches('owner', 'repo')

// Validate token
const isTokenValid = await service.validateToken('ghp_xxx')

// Get current user
const user = await service.getCurrentUser()
```

### GitHubTokenManager

```typescript
import { GitHubTokenManager } from '@/lib/secure-storage'

// Save token
GitHubTokenManager.saveToken('ghp_xxxxxxxxxxxx')

// Get token
const token = GitHubTokenManager.getToken()

// Check if token exists
const hasToken = GitHubTokenManager.hasToken()

// Remove token
GitHubTokenManager.removeToken()

// Save user info
GitHubTokenManager.saveUser({ login: 'username', name: 'Name', email: 'email@example.com' })

// Get user info
const user = GitHubTokenManager.getUser()
```

### GitManager

```typescript
import GitManager from '@/lib/git-manager'

// Clone repository
await GitManager.clone(
  'https://github.com/owner/repo',
  '/workspace/repo',
  { username: 'token', password: 'x-oauth-basic' }
)

// Work with cloned repo
const git = new GitManager('/workspace/repo')

// Get current branch
const branch = await git.currentBranch()

// List all branches
const branches = await git.listBranches()

// Checkout branch
await git.checkout('develop')

// Get status
const status = await git.status()

// Stage files
await git.add('file.txt')

// Commit
await git.commit('Commit message', { name: 'Your Name', email: 'you@example.com' })

// Push to GitHub
await git.push('origin', 'main', { username: 'token', password: 'x-oauth-basic' })
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+G` | Open Clone Dialog (planned) |

## Limitations

- Maximum repository size: Limited by browser memory
- Large files (>100MB): May cause performance issues
- Git LFS: Not currently supported
- Submodules: Not currently supported

## Roadmap

- [ ] Git UI panel for visual operations
- [ ] Pull request integration
- [ ] Issue tracking
- [ ] GitHub Actions integration
- [ ] OAuth authentication (alternative to PAT)
- [ ] Git LFS support
- [ ] Submodule support
- [ ] Diff viewer improvements

## Support

For issues or questions:
- Check the [troubleshooting section](#troubleshooting)
- Review GitHub's [token documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- Contact support

---

**Happy Coding! 🚀**
