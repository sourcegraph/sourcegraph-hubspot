import * as sourcegraph from 'sourcegraph'

interface Settings {
    'hubspot.apiKey'?: string
}

export function activate(ctx: sourcegraph.ExtensionContext): void {
    ctx.subscriptions.add(
        sourcegraph.content.registerLinkPreviewProvider('https://app.hubspot.com/contacts/', {
            provideLinkPreview: async url => {
                if (!url.pathname.startsWith('/contacts/') || !url.pathname.includes('/company/')) {
                    return null
                }
                url.pathname = url.pathname.replace(/\/$/, '')
                const companyId = url.pathname.slice(url.pathname.lastIndexOf('/') + 1)

                const apiKey = sourcegraph.configuration.get<Settings>().get('hubspot.apiKey')
                if (!apiKey) {
                    return {
                        hover: {
                            kind: sourcegraph.MarkupKind.PlainText as sourcegraph.MarkupKind.PlainText,
                            value: 'Error: HubSpot API key not set (hubspot.apiKey)',
                        },
                    }
                }

                const resp = await getCompanyInfo(apiKey, companyId)
                if (!resp) {
                    return null
                }
                const props = resp.properties
                const issuesUrl = `https://github.com/issues?utf8=%E2%9C%93&q=is%3Aopen+archived%3Afalse+${companyId}`
                return {
                    content: props.name
                        ? {
                              kind: sourcegraph.MarkupKind.Markdown,
                              value: `${props.name.value} [📝](${issuesUrl})`,
                          }
                        : undefined,
                    hover: {
                        kind: sourcegraph.MarkupKind.PlainText as sourcegraph.MarkupKind.PlainText,
                        value:
                            (props.name ? `${props.name.value}: ` : '') +
                            [
                                props.city && props.city.value,
                                props.state && props.state.value,
                                props.country && props.country.value,
                                props.website && props.website.value,
                                props.numberofemployees && `${props.numberofemployees.value} employees`,
                            ]
                                .filter(v => !!v)
                                .join(', '),
                    },
                }
            },
        })
    )
}

const cache = new Map<string, any>()

let shownPermissionsRequestAlert = false

async function getCompanyInfo(apiKey: string, companyId: string): Promise<{ properties: any } | null> {
    const cachedData = cache.get(companyId)
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
        cache.set(companyId, data)
        return data
    } catch (err) {
        if (sourcegraph.app.activeWindow && !shownPermissionsRequestAlert) {
            // Request permissions to bypass CORS.
            shownPermissionsRequestAlert = true
            sourcegraph.app.activeWindow.showNotification(
                'To see HubSpot link info, you must visit<br>https://api.hubapi.com/404 and right-click the<br> Sourcegraph toolbar icon to<br> **Enable Sourcegraph on this domain**.',
                sourcegraph.NotificationType.Error
            )
        }
        return null
    }
}
