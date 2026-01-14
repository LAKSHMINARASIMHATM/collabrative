import git from "isomorphic-git"
import http from "isomorphic-git/http/web"

declare global {
    interface Window {
        fs: any
    }
}

export interface GitStatus {
    file: string
    status: "modified" | "added" | "deleted" | "untracked" | "staged"
}

export interface GitCommit {
    oid: string
    message: string
    author: { name: string; email: string; timestamp: number }
    committer: { name: string; email: string; timestamp: number }
}

export class GitManager {
    private dir: string

    constructor(dir: string) {
        this.dir = dir
    }

    /**
     * Initialize a new git repository
     */
    async init(): Promise<void> {
        await git.init({
            fs: window.fs,
            dir: this.dir,
            defaultBranch: "main",
        })
    }

    /**
     * Get repository status
     */
    async status(): Promise<GitStatus[]> {
        const matrix = await git.statusMatrix({
            fs: window.fs,
            dir: this.dir,
        })

        return matrix.map(([file, head, workdir, stage]) => {
            let status: GitStatus["status"] = "untracked"

            if (head === 1 && workdir === 2 && stage === 2) status = "modified"
            else if (head === 0 && workdir === 2 && stage === 2) status = "added"
            else if (head === 1 && workdir === 0 && stage === 0) status = "deleted"
            else if (head === 0 && workdir === 2 && stage === 3) status = "staged"
            else if (head === 1 && workdir === 2 && stage === 3) status = "staged"

            return { file, status }
        })
    }

    /**
     * Stage files
     */
    async add(filepath: string | string[]): Promise<void> {
        const files = Array.isArray(filepath) ? filepath : [filepath]

        for (const file of files) {
            await git.add({
                fs: window.fs,
                dir: this.dir,
                filepath: file,
            })
        }
    }

    /**
     * Unstage files
     */
    async remove(filepath: string): Promise<void> {
        await git.remove({
            fs: window.fs,
            dir: this.dir,
            filepath,
        })
    }

    /**
     * Commit staged changes
     */
    async commit(message: string, author: { name: string; email: string }): Promise<string> {
        return await git.commit({
            fs: window.fs,
            dir: this.dir,
            message,
            author: {
                ...author,
                timestamp: Math.floor(Date.now() / 1000),
            },
        })
    }

    /**
     * Get commit log
     */
    async log(depth = 10): Promise<GitCommit[]> {
        const commits = await git.log({
            fs: window.fs,
            dir: this.dir,
            depth,
        })

        return commits.map((commit) => ({
            oid: commit.oid,
            message: commit.commit.message,
            author: commit.commit.author,
            committer: commit.commit.committer,
        }))
    }

    /**
     * Get current branch
     */
    async currentBranch(): Promise<string> {
        return await git.currentBranch({
            fs: window.fs,
            dir: this.dir,
            fullname: false,
        }) || "main"
    }

    /**
     * List all branches
     */
    async listBranches(): Promise<string[]> {
        return await git.listBranches({
            fs: window.fs,
            dir: this.dir,
        })
    }

    /**
     * Create a new branch
     */
    async branch(name: string, checkout = false): Promise<void> {
        await git.branch({
            fs: window.fs,
            dir: this.dir,
            ref: name,
            checkout,
        })
    }

    /**
     * Checkout a branch
     */
    async checkout(ref: string): Promise<void> {
        await git.checkout({
            fs: window.fs,
            dir: this.dir,
            ref,
        })
    }

    /**
     * Push to remote
     */
    async push(
        remote = "origin",
        ref?: string,
        credentials?: { username: string; password: string }
    ): Promise<void> {
        const currentRef = ref || await this.currentBranch()

        await git.push({
            fs: window.fs,
            http,
            dir: this.dir,
            remote,
            ref: currentRef,
            onAuth: () => credentials || { username: "", password: "" },
        })
    }

    /**
     * Pull from remote
     */
    async pull(
        remote = "origin",
        ref?: string,
        credentials?: { username: string; password: string }
    ): Promise<void> {
        const currentRef = ref || await this.currentBranch()

        await git.pull({
            fs: window.fs,
            http,
            dir: this.dir,
            remote,
            ref: currentRef,
            author: {
                name: "CodeSync User",
                email: "user@codesync.dev",
            },
            onAuth: () => credentials || { username: "", password: "" },
        })
    }

    /**
     * Clone a repository
     */
    static async clone(
        url: string,
        dir: string,
        credentials?: { username: string; password: string }
    ): Promise<void> {
        await git.clone({
            fs: window.fs,
            http,
            dir,
            url,
            onAuth: () => credentials || { username: "", password: "" },
            corsProxy: "https://cors.isomorphic-git.org",
        })
    }

    /**
     * Add a remote
     */
    async addRemote(name: string, url: string): Promise<void> {
        await git.addRemote({
            fs: window.fs,
            dir: this.dir,
            remote: name,
            url,
        })
    }
}

export default GitManager
