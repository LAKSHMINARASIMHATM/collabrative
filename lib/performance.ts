/**
 * Performance optimizations for the IDE
 */

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null

    return function (this: any, ...args: Parameters<T>) {
        const context = this

        if (timeout) clearTimeout(timeout)

        timeout = setTimeout(() => {
            func.apply(context, args)
        }, wait)
    }
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean

    return function (this: any, ...args: Parameters<T>) {
        const context = this

        if (!inThrottle) {
            func.apply(context, args)
            inThrottle = true
            setTimeout(() => (inThrottle = false), limit)
        }
    }
}

/**
 * Virtual scrolling for large lists
 */
export class VirtualScroller {
    private container: HTMLElement
    private itemHeight: number
    private visibleCount: number
    private totalCount: number
    private scrollTop = 0

    constructor(container: HTMLElement, itemHeight: number, totalCount: number) {
        this.container = container
        this.itemHeight = itemHeight
        this.totalCount = totalCount
        this.visibleCount = Math.ceil(container.clientHeight / itemHeight) + 2

        container.addEventListener('scroll', this.handleScroll.bind(this))
    }

    private handleScroll() {
        this.scrollTop = this.container.scrollTop
    }

    getVisibleRange(): { start: number; end: number } {
        const start = Math.floor(this.scrollTop / this.itemHeight)
        const end = Math.min(start + this.visibleCount, this.totalCount)

        return { start, end }
    }

    getTotalHeight(): number {
        return this.totalCount * this.itemHeight
    }

    getOffsetY(): number {
        return Math.floor(this.scrollTop / this.itemHeight) * this.itemHeight
    }
}

/**
 * Lazy load module
 */
export async function lazyLoad<T>(
    importFn: () => Promise<{ default: T }>
): Promise<T> {
    const module = await importFn()
    return module.default
}

/**
 * Memoize function results
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
    const cache = new Map<string, ReturnType<T>>()

    return function (this: any, ...args: Parameters<T>): ReturnType<T> {
        const key = JSON.stringify(args)

        if (cache.has(key)) {
            return cache.get(key)!
        }

        const result = fn.apply(this, args)
        cache.set(key, result)
        return result
    } as T
}

/**
 * IndexedDB wrapper for caching
 */
export class CacheDB {
    private dbName: string
    private storeName: string
    private db: IDBDatabase | null = null

    constructor(dbName = 'codesync-cache', storeName = 'files') {
        this.dbName = dbName
        this.storeName = storeName
    }

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
                this.db = request.result
                resolve()
            }

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName)
                }
            }
        })
    }

    async get(key: string): Promise<any> {
        if (!this.db) await this.init()

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readonly')
            const store = transaction.objectStore(this.storeName)
            const request = store.get(key)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve(request.result)
        })
    }

    async set(key: string, value: any): Promise<void> {
        if (!this.db) await this.init()

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readwrite')
            const store = transaction.objectStore(this.storeName)
            const request = store.put(value, key)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve()
        })
    }

    async delete(key: string): Promise<void> {
        if (!this.db) await this.init()

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readwrite')
            const store = transaction.objectStore(this.storeName)
            const request = store.delete(key)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve()
        })
    }

    async clear(): Promise<void> {
        if (!this.db) await this.init()

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readwrite')
            const store = transaction.objectStore(this.storeName)
            const request = store.clear()

            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve()
        })
    }
}

/**
 * Web Worker helper
 */
export function runInWorker<T>(fn: () => T): Promise<T> {
    return new Promise((resolve, reject) => {
        const fnString = `(${fn.toString()})()`
        const blob = new Blob([fnString], { type: 'application/javascript' })
        const workerUrl = URL.createObjectURL(blob)
        const worker = new Worker(workerUrl)

        worker.onmessage = (e) => {
            resolve(e.data)
            worker.terminate()
            URL.revokeObjectURL(workerUrl)
        }

        worker.onerror = (error) => {
            reject(error)
            worker.terminate()
            URL.revokeObjectURL(workerUrl)
        }
    })
}
