import * as sourcegraph from 'sourcegraph'
import { CachedAsyncValue, CachedMap } from './cache'
import { getAPIKey } from './extension'

const DEFAULT_HEADERS = { 'Content-Type': 'application/json', 'X-Requested-With': 'Sourcegraph' }

// When using on Sourcegraph (not via browser extension), use cors-anywhere with PORT=9018 to bypass
// the CORS restrictions of the HubSpot API.
const URL_PREFIX = sourcegraph.internal.clientApplication === 'sourcegraph' ? 'http://localhost:9018/' : ''

const companyInfoCache = new CachedMap<string, any>('companyInfo')

export async function getCompanyInfo(apiKey: string, companyId: string): Promise<{ properties: any } | null> {
    const cachedData = companyInfoCache.get(companyId)
    if (cachedData) {
        return cachedData
    }

    const u = new URL('https://api.hubapi.com/companies/v2/companies/')
    u.pathname += companyId
    u.searchParams.set('hapikey', apiKey)

    try {
        const data = fetch(`${u}`, {
            headers: DEFAULT_HEADERS,
            credentials: 'omit',
        })
            .then(async resp => {
                if (resp.status === 200) {
                    return resp.json()
                }
                throw new Error(await resp.text())
            })
            .then(async data => {
                await companyInfoCache.set(companyId, data)
                return data
            })
        return data
    } catch (err) {
        showPermissionsRequestAlert()
        return null
    }
}

export interface Company {
    name: string
    hubspotUrl: string
}

export const allCompaniesCache = new CachedAsyncValue<Company[]>('allCompanies', getAllCompanies)

async function getAllCompanies(): Promise<Company[]> {
    const apiKey = getAPIKey()
    if (!apiKey) {
        throw new Error('Error: HubSpot API key not set (hubspot.apiKey)')
    }

    const LIMIT = 250
    let offset = 0
    const allCompanies: Company[] = []
    while (true) {
        const { companies, nextOffset } = await getCompanies(apiKey, offset, LIMIT)
        console.log('Fetched companies from HubSpot', companies.length)
        allCompanies.push(...companies)
        if (!nextOffset) {
            break
        }
        offset = nextOffset
    }
    return allCompanies
}

async function getCompanies(
    apiKey: string,
    offset: number,
    limit: number
): Promise<{ companies: Company[]; nextOffset?: number }> {
    const u = new URL(URL_PREFIX + 'https://api.hubapi.com/companies/v2/companies/paged')
    u.searchParams.set('hapikey', apiKey)
    u.searchParams.set('properties', 'name')
    u.searchParams.set('offset', offset.toString())
    u.searchParams.set('limit', limit.toString())

    try {
        const resp = await fetch(`${u}`, {
            headers: DEFAULT_HEADERS,
            credentials: 'omit',
        })
        if (resp.status !== 200) {
            throw new Error(await resp.text())
        }
        const data = await resp.json()
        return {
            companies: data.companies
                .filter((c: any) => !!c.properties.name)
                .map((c: any) => ({
                    name: c.properties.name.value,
                    hubspotUrl: `https://app.hubspot.com/contacts/${c.portalId}/company/${c.companyId}`,
                })),
            nextOffset: data.offset,
        }
    } catch (err) {
        showPermissionsRequestAlert()
        throw err
    }
}

let shownPermissionsRequestAlert = false
function showPermissionsRequestAlert(): void {
    if (sourcegraph.app.activeWindow && !shownPermissionsRequestAlert) {
        // Request permissions to bypass CORS.
        shownPermissionsRequestAlert = true
        sourcegraph.app.activeWindow.showNotification(
            'To see HubSpot info, you must visit https://api.hubapi.com/404 and right-click the Sourcegraph toolbar icon to **Enable Sourcegraph on this domain**.',
            sourcegraph.NotificationType.Error
        )
    }
}
