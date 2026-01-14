/**
 * GitHub API Service
 * Handles GitHub repository operations and authentication
 */

export interface GitHubRepo {
    owner: string
    name: string
    fullName: string
    description: string | null
    defaultBranch: string
    isPrivate: boolean
    cloneUrl: string
    htmlUrl: string
}

export interface GitHubBranch {
    name: string
    commit: {
        sha: string
        url: string
    }
}

export interface GitHubUser {
    login: string
    name: string
    email: string
    avatarUrl: string
}

export class GitHubService {
    private static readonly API_BASE = 'https://api.github.com'
    private token: string | null = null

    /**
     * Set GitHub Personal Access Token
     */
    setToken(token: string): void {
        this.token = token
    }

    /**
     * Get authentication headers
     */
    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
        }

        if (this.token) {
            headers['Authorization'] = `token ${this.token}`
        }

        return headers
    }

    /**
     * Parse GitHub repository URL
     * Supports: https://github.com/owner/repo, git@github.com:owner/repo.git
     */
    parseRepoUrl(url: string): { owner: string; repo: string } | null {
        // HTTPS format
        const httpsMatch = url.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)(\.git)?/)
        if (httpsMatch) {
            return {
                owner: httpsMatch[1],
                repo: httpsMatch[2],
            }
        }

        // SSH format
        const sshMatch = url.match(/git@github\.com:([^\/]+)\/([^\/\.]+)(\.git)?/)
        if (sshMatch) {
            return {
                owner: sshMatch[1],
                repo: sshMatch[2],
            }
        }

        return null
    }

    /**
     * Validate GitHub repository URL
     */
    validateRepoUrl(url: string): boolean {
        return this.parseRepoUrl(url) !== null
    }

    /**
     * Fetch repository information
     */
    async fetchRepoInfo(owner: string, repo: string): Promise<GitHubRepo> {
        const response = await fetch(
            `${GitHubService.API_BASE}/repos/${owner}/${repo}`,
            { headers: this.getHeaders() }
        )

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Repository not found')
            } else if (response.status === 401) {
                throw new Error('Authentication required. Please provide a valid GitHub token.')
            } else {
                throw new Error(`GitHub API error: ${response.statusText}`)
            }
        }

        const data = await response.json()

        return {
            owner: data.owner.login,
            name: data.name,
            fullName: data.full_name,
            description: data.description,
            defaultBranch: data.default_branch,
            isPrivate: data.private,
            cloneUrl: data.clone_url,
            htmlUrl: data.html_url,
        }
    }

    /**
     * List repository branches
     */
    async listBranches(owner: string, repo: string): Promise<GitHubBranch[]> {
        const response = await fetch(
            `${GitHubService.API_BASE}/repos/${owner}/${repo}/branches`,
            { headers: this.getHeaders() }
        )

        if (!response.ok) {
            throw new Error(`Failed to fetch branches: ${response.statusText}`)
        }

        const data = await response.json()

        return data.map((branch: any) => ({
            name: branch.name,
            commit: {
                sha: branch.commit.sha,
                url: branch.commit.url,
            },
        }))
    }

    /**
     * Validate GitHub Personal Access Token
     */
    async validateToken(token: string): Promise<boolean> {
        try {
            const response = await fetch(`${GitHubService.API_BASE}/user`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
            })

            return response.ok
        } catch (error) {
            return false
        }
    }

    /**
     * Get authenticated user information
     */
    async getCurrentUser(): Promise<GitHubUser | null> {
        if (!this.token) {
            return null
        }

        try {
            const response = await fetch(`${GitHubService.API_BASE}/user`, {
                headers: this.getHeaders(),
            })

            if (!response.ok) {
                return null
            }

            const data = await response.json()

            return {
                login: data.login,
                name: data.name || data.login,
                email: data.email || `${data.login}@users.noreply.github.com`,
                avatarUrl: data.avatar_url,
            }
        } catch (error) {
            return null
        }
    }

    /**
     * Convert HTTPS URL to use token authentication
     */
    getAuthenticatedCloneUrl(url: string, token: string): string {
        // Convert https://github.com/owner/repo to https://token@github.com/owner/repo
        return url.replace('https://github.com', `https://${token}@github.com`)
    }

    /**
     * Check rate limit status
     */
    async getRateLimit(): Promise<{
        limit: number
        remaining: number
        reset: Date
    }> {
        const response = await fetch(`${GitHubService.API_BASE}/rate_limit`, {
            headers: this.getHeaders(),
        })

        const data = await response.json()
        const core = data.resources.core

        return {
            limit: core.limit,
            remaining: core.remaining,
            reset: new Date(core.reset * 1000),
        }
    }
}

export default GitHubService
