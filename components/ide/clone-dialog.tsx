'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, GitBranch, Lock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import GitHubService, { type GitHubBranch, type GitHubRepo } from '@/lib/github-service'
import { GitHubTokenManager } from '@/lib/secure-storage'
import GitManager from '@/lib/git-manager'

interface CloneDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCloneSuccess?: (dir: string, repoInfo: GitHubRepo) => void
}

export function CloneDialog({ open, onOpenChange, onCloneSuccess }: CloneDialogProps) {
    const [repoUrl, setRepoUrl] = useState('')
    const [token, setToken] = useState('')
    const [selectedBranch, setSelectedBranch] = useState<string>('')
    const [destinationDir, setDestinationDir] = useState('')

    const [loading, setLoading] = useState(false)
    const [fetchingBranches, setFetchingBranches] = useState(false)
    const [validatingToken, setValidatingToken] = useState(false)

    const [repoInfo, setRepoInfo] = useState<GitHubRepo | null>(null)
    const [branches, setBranches] = useState<GitHubBranch[]>([])
    const [error, setError] = useState<string | null>(null)
    const [tokenValid, setTokenValid] = useState<boolean | null>(null)

    const githubService = new GitHubService()

    // Load saved token on mount
    useEffect(() => {
        const savedToken = GitHubTokenManager.getToken()
        if (savedToken) {
            setToken(savedToken)
            githubService.setToken(savedToken)
            setTokenValid(true)
        }
    }, [])

    // Validate token when it changes
    useEffect(() => {
        if (token && token.length > 10) {
            validateToken()
        } else {
            setTokenValid(null)
        }
    }, [token])

    const validateToken = async () => {
        setValidatingToken(true)
        try {
            const isValid = await githubService.validateToken(token)
            setTokenValid(isValid)
            if (isValid) {
                GitHubTokenManager.saveToken(token)
                githubService.setToken(token)

                // Get user info
                const user = await githubService.getCurrentUser()
                if (user) {
                    GitHubTokenManager.saveUser(user)
                }
            }
        } catch (error) {
            setTokenValid(false)
        } finally {
            setValidatingToken(false)
        }
    }

    const fetchRepoInfo = async () => {
        if (!repoUrl) {
            setError('Please enter a repository URL')
            return
        }

        const parsed = githubService.parseRepoUrl(repoUrl)
        if (!parsed) {
            setError('Invalid GitHub repository URL')
            return
        }

        setFetchingBranches(true)
        setError(null)

        try {
            // Fetch repository info
            const info = await githubService.fetchRepoInfo(parsed.owner, parsed.repo)
            setRepoInfo(info)

            // Generate default destination directory
            if (!destinationDir) {
                setDestinationDir(`/workspace/${info.name}`)
            }

            // Fetch branches
            const branchList = await githubService.listBranches(parsed.owner, parsed.repo)
            setBranches(branchList)

            // Set default branch
            if (branchList.length > 0) {
                const defaultBranch = branchList.find(b => b.name === info.defaultBranch)
                setSelectedBranch(defaultBranch?.name || branchList[0].name)
            }

            toast.success(`Found repository: ${info.fullName}`)
        } catch (err: any) {
            setError(err.message || 'Failed to fetch repository information')
            setRepoInfo(null)
            setBranches([])
        } finally {
            setFetchingBranches(false)
        }
    }

    const handleClone = async () => {
        if (!repoInfo || !destinationDir) {
            setError('Please complete all required fields')
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Prepare credentials
            const credentials = token
                ? { username: token, password: 'x-oauth-basic' }
                : undefined

            // Clone repository
            await GitManager.clone(repoInfo.cloneUrl, destinationDir, credentials)

            // If specific branch selected, checkout
            if (selectedBranch && selectedBranch !== repoInfo.defaultBranch) {
                const gitManager = new GitManager(destinationDir)
                await gitManager.checkout(selectedBranch)
            }

            toast.success(`Successfully cloned ${repoInfo.fullName}`)

            // Call success callback
            if (onCloneSuccess) {
                onCloneSuccess(destinationDir, repoInfo)
            }

            // Reset and close
            handleReset()
            onOpenChange(false)
        } catch (err: any) {
            setError(err.message || 'Failed to clone repository')
            toast.error('Clone failed: ' + (err.message || 'Unknown error'))
        } finally {
            setLoading(false)
        }
    }

    const handleReset = () => {
        setRepoUrl('')
        setSelectedBranch('')
        setDestinationDir('')
        setRepoInfo(null)
        setBranches([])
        setError(null)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Clone GitHub Repository</DialogTitle>
                    <DialogDescription>
                        Clone a repository from GitHub to your workspace
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* GitHub Token */}
                    <div className="space-y-2">
                        <Label htmlFor="token" className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            GitHub Personal Access Token (Optional for public repos)
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="token"
                                type="password"
                                placeholder="ghp_xxxxxxxxxxxx"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="flex-1"
                            />
                            {validatingToken && <Loader2 className="h-4 w-4 animate-spin mt-2" />}
                            {tokenValid === true && <CheckCircle2 className="h-4 w-4 text-green-500 mt-2" />}
                            {tokenValid === false && <AlertCircle className="h-4 w-4 text-red-500 mt-2" />}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Required for private repositories. Create one at{' '}
                            <a
                                href="https://github.com/settings/tokens"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                github.com/settings/tokens
                            </a>
                        </p>
                    </div>

                    {/* Repository URL */}
                    <div className="space-y-2">
                        <Label htmlFor="repo-url">Repository URL</Label>
                        <div className="flex gap-2">
                            <Input
                                id="repo-url"
                                placeholder="https://github.com/owner/repository"
                                value={repoUrl}
                                onChange={(e) => setRepoUrl(e.target.value)}
                                onBlur={fetchRepoInfo}
                                className="flex-1"
                            />
                            <Button
                                variant="outline"
                                onClick={fetchRepoInfo}
                                disabled={fetchingBranches || !repoUrl}
                            >
                                {fetchingBranches ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    'Fetch'
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Repository Info */}
                    {repoInfo && (
                        <Alert>
                            <AlertDescription>
                                <div className="space-y-1">
                                    <p className="font-medium">{repoInfo.fullName}</p>
                                    {repoInfo.description && (
                                        <p className="text-sm text-muted-foreground">{repoInfo.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        {repoInfo.isPrivate && (
                                            <span className="flex items-center gap-1">
                                                <Lock className="h-3 w-3" /> Private
                                            </span>
                                        )}
                                        <span>Default: {repoInfo.defaultBranch}</span>
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Branch Selection */}
                    {branches.length > 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="branch" className="flex items-center gap-2">
                                <GitBranch className="h-4 w-4" />
                                Branch
                            </Label>
                            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                                <SelectTrigger id="branch">
                                    <SelectValue placeholder="Select a branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((branch) => (
                                        <SelectItem key={branch.name} value={branch.name}>
                                            {branch.name}
                                            {repoInfo && branch.name === repoInfo.defaultBranch && (
                                                <span className="ml-2 text-xs text-muted-foreground">(default)</span>
                                            )}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Destination Directory */}
                    <div className="space-y-2">
                        <Label htmlFor="destination">Destination Directory</Label>
                        <Input
                            id="destination"
                            placeholder="/workspace/my-project"
                            value={destinationDir}
                            onChange={(e) => setDestinationDir(e.target.value)}
                        />
                    </div>

                    {/* Error Display */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleClone}
                        disabled={loading || !repoInfo || !destinationDir || !selectedBranch}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Cloning...
                            </>
                        ) : (
                            'Clone Repository'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default CloneDialog
