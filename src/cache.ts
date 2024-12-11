import localforage from 'localforage'

const REFRESH_FREQUENCY = 0.01

localforage.config({
    driver: localforage.INDEXEDDB,
    name: 'sourcegraph-hubspot',
    version: 1,
    storeName: 'sourcegraph_hubspot_cache',
})

/**
 * A map that is backed by a persistent cache.
 *
 * @template K The map key type.
 * @template V The map value type.
 */
export class CachedMap<K extends string, V> {
    /**
     * @param id The unique ID of this map to distinguish it from other items in the cache.
     */
    constructor(private readonly id: string) {}

    private getFullKey(key: K): string {
        return `${this.id}__${key}`
    }

    public async get(key: K): Promise<V | undefined> {
        const cached = localforage.getItem<V | undefined>(this.getFullKey(key))

        // Every once in a while, return a false cache miss so that we occasionally refresh this data.
        if (cached && Math.random() > REFRESH_FREQUENCY) {
            return cached
        }
        return undefined
    }

    public async set(key: K, value: V): Promise<void> {
        await localforage.setItem(this.getFullKey(key), value)
    }
}

/**
 * An async value that is backed by a persistent cache.
 *
 * @template V The value type.
 */
export class CachedAsyncValue<V> {
    private promise: Promise<V> | undefined
    private stale = true

    /**
     * @param id The unique ID of this value to distinguish it from other items in the cache.
     */
    constructor(private readonly id: string, private readonly compute: () => Promise<V>) {}

    private async computeAndStore(): Promise<void> {
        this.promise = this.compute()
        // tslint:disable-next-line: no-floating-promises
        this.promise.then(async value => {
            await localforage.setItem(this.id, value)
            this.stale = false
        })
    }

    /**
     * Return cached data immediately. Kick off recomputation.
     */
    public async get(): Promise<V> {
        const cached = await localforage.getItem<V | null>(this.id)
        if (this.stale && !this.promise) {
            // Don't *always* recompute from scratch, because it's slow.
            if (cached !== null && Math.random() > REFRESH_FREQUENCY) {
                return cached
            }

            // tslint:disable-next-line: no-floating-promises
            this.computeAndStore()
        }
        return cached !== null ? cached : this.promise!
    }
}
