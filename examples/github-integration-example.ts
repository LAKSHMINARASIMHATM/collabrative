// Example usage of GitHub Integration

import GitHubService from '@/lib/github-service'
import { GitHubTokenManager } from '@/lib/secure-storage'
import GitManager from '@/lib/git-manager'

async function exampleGitHubIntegration() {
    // Initialize GitHub service
    const github = new GitHubService()

    // Set authentication token (if available)
    const savedToken = GitHubTokenManager.getToken()
    if (savedToken) {
        github.setToken(savedToken)
    }

    // Example 1: Validate and parse repository URL
    const repoUrl = 'https://github.com/vercel/next.js'
    const isValid = github.validateRepoUrl(repoUrl)
    console.log('URL valid:', isValid)

    const parsed = github.parseRepoUrl(repoUrl)
    console.log('Parsed:', parsed) // { owner: 'vercel', repo: 'next.js' }

    // Example 2: Fetch repository information
    if (parsed) {
        try {
            const repoInfo = await github.fetchRepoInfo(parsed.owner, parsed.repo)
            console.log('Repository:', repoInfo.fullName)
            console.log('Description:', repoInfo.description)
            console.log('Default branch:', repoInfo.defaultBranch)
            console.log('Private:', repoInfo.isPrivate)

            // Example 3: List branches
            const branches = await github.listBranches(parsed.owner, parsed.repo)
            console.log('Branches:', branches.map(b => b.name))

            // Example 4: Clone repository
            const destinationDir = '/workspace/next.js'
            const credentials = savedToken
                ? { username: savedToken, password: 'x-oauth-basic' }
                : undefined

            await GitManager.clone(repoInfo.cloneUrl, destinationDir, credentials)
            console.log('Cloned successfully to:', destinationDir)

            // Example 5: Work with cloned repository
            const git = new GitManager(destinationDir)

            // Get current branch
            const currentBranch = await git.currentBranch()
            console.log('Current branch:', currentBranch)

            // Get repository status
            const status = await git.status()
            console.log('Modified files:', status.filter(s => s.status === 'modified'))

            // Make changes and commit
            await git.add('README.md')
            await git.commit('Update README', {
                name: 'Your Name',
                email: 'you@example.com'
            })

            // Push to GitHub
            await git.push('origin', currentBranch, credentials)
            console.log('Pushed to GitHub')

        } catch (error) {
            console.error('Error:', error)
        }
    }
}

// Example 6: Token management
function exampleTokenManagement() {
    // Save a new token
    const newToken = 'ghp_xxxxxxxxxxxxxxxxxxxx'
    GitHubTokenManager.saveToken(newToken)

    // Check if token exists
    const hasToken = GitHubTokenManager.hasToken()
    console.log('Has token:', hasToken)

    // Get token
    const token = GitHubTokenManager.getToken()
    console.log('Token:', token ? '***' : 'None')

    // Save user info
    GitHubTokenManager.saveUser({
        login: 'octocat',
        name: 'The Octocat',
        email: 'octocat@github.com'
    })

    // Get user info
    const user = GitHubTokenManager.getUser()
    console.log('User:', user)

    // Remove token (on logout)
    GitHubTokenManager.removeToken()
}

// Example 7: Validate token
async function exampleTokenValidation() {
    const github = new GitHubService()
    const token = 'ghp_xxxxxxxxxxxxxxxxxxxx'

    const isValid = await github.validateToken(token)
    if (isValid) {
        console.log('Token is valid')
        github.setToken(token)
        GitHubTokenManager.saveToken(token)

        // Get authenticated user
        const user = await github.getCurrentUser()
        if (user) {
            console.log('Authenticated as:', user.login)
            GitHubTokenManager.saveUser(user)
        }
    } else {
        console.log('Token is invalid')
    }
}

// Example 8: Check rate limit
async function exampleRateLimit() {
    const github = new GitHubService()
    const token = GitHubTokenManager.getToken()
    if (token) {
        github.setToken(token)
    }

    const rateLimit = await github.getRateLimit()
    console.log('Rate limit:', rateLimit.limit)
    console.log('Remaining:', rateLimit.remaining)
    console.log('Resets at:', rateLimit.reset)
}

export {
    exampleGitHubIntegration,
    exampleTokenManagement,
    exampleTokenValidation,
    exampleRateLimit
}
