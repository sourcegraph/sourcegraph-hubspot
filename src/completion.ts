import { sortBy } from 'lodash'
import * as sourcegraph from 'sourcegraph'
import { getAPIKey } from './extension'
import { getAllCompanies } from './hubspot'

export function registerCompanyCompletionProvider(): sourcegraph.Unsubscribable {
    return sourcegraph.languages.registerCompletionItemProvider([{ scheme: 'comment' }], {
        provideCompletionItems: async (doc, pos) => {
            const apiKey = getAPIKey()
            if (!apiKey) {
                throw new Error('Error: HubSpot API key not set (hubspot.apiKey)')
            }

            if (!doc.text) {
                return null
            }

            const lines = doc.text.split('\n')
            const line = lines[pos.line]
            const pre = line.slice(0, pos.character)
            const m = pre.match(/^.*?([^\s]*)$/)
            if (!m || !m[1] || !m[1].startsWith('$')) {
                return null
            }
            const query = m[1].slice(1).toLowerCase()

            const allCompanies = await getAllCompanies(apiKey)
            if (!allCompanies) {
                return null
            }

            return {
                items: sortBy(
                    allCompanies
                        .filter(c => c.name.toLowerCase().includes(query))
                        .map(c => ({ label: c.name, insertText: c.hubspotUrl + ' ' })),
                    [a => !a.label.toLowerCase().startsWith(query)]
                ),
            }
        },
    })
}
