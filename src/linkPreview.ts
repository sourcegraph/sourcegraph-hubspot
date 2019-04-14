import * as sourcegraph from 'sourcegraph'
import { getAPIKey } from './extension'
import { getCompanyInfo } from './hubspot'

export function registerLinkPreviewProvider(): sourcegraph.Unsubscribable {
    return sourcegraph.content.registerLinkPreviewProvider('https://app.hubspot.com/contacts/', {
        provideLinkPreview: async url => {
            if (!url.pathname.startsWith('/contacts/') || !url.pathname.includes('/company/')) {
                return null
            }
            url.pathname = url.pathname.replace(/\/$/, '')
            const companyId = url.pathname.slice(url.pathname.lastIndexOf('/') + 1)

            const apiKey = getAPIKey()
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
}
