import * as sourcegraph from 'sourcegraph'

const companyInfoCache = new Map<string, any>()

export async function getCompanyInfo(apiKey: string, companyId: string): Promise<{ properties: any } | null> {
    const cachedData = companyInfoCache.get(companyId)
    if (cachedData) {
        return cachedData
    }

    const u = new URL('https://api.hubapi.com/companies/v2/companies/')
    u.pathname += companyId
    u.searchParams.set('hapikey', apiKey)

    try {
        const resp = await fetch(`${u}`, {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'omit',
        })
        if (resp.status !== 200) {
            return null
        }
        const data = await resp.json()
        companyInfoCache.set(companyId, data)
        return data
    } catch (err) {
        showPermissionsRequestAlert()
        return null
    }
}

interface Company {
    name: string
    hubspotUrl: string
}

let allCompaniesCache: Promise<Company[] | null>

export async function getAllCompanies(apiKey: string): Promise<Company[] | null> {
    if (allCompaniesCache) {
        return allCompaniesCache
    }

    const u = new URL('http://localhost:9018/https://api.hubapi.com/companies/v2/companies/paged')
    u.searchParams.set('hapikey', apiKey)
    u.searchParams.set('properties', 'name')
    u.searchParams.set('limit', '250')

    try {
        const resp = await fetch(`${u}`, {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'omit',
        })
        if (resp.status !== 200) {
            return null
        }
        const data = await resp.json()
        const companies = data.companies.map((c: any) => ({
            name: c.properties.name.value,
            hubspotUrl: `https://app.hubspot.com/contacts/${c.portalId}/company/${c.companyId}`,
        }))
        allCompaniesCache = Promise.resolve(companies)
        return companies
    } catch (err) {
        showPermissionsRequestAlert()
        return null
    }
}

let shownPermissionsRequestAlert = false
function showPermissionsRequestAlert(): void {
    if (sourcegraph.app.activeWindow && !shownPermissionsRequestAlert) {
        // Request permissions to bypass CORS.
        shownPermissionsRequestAlert = true
        sourcegraph.app.activeWindow.showNotification(
            'To see HubSpot info, you must visit<br>https://api.hubapi.com/404 and right-click the<br> Sourcegraph toolbar icon to<br> **Enable Sourcegraph on this domain**.',
            sourcegraph.NotificationType.Error
        )
    }
}
