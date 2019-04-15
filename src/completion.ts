import { sortBy } from 'lodash'
import * as sourcegraph from 'sourcegraph'
import { getAPIKey } from './extension'
import { allCompaniesCache, Company } from './hubspot'

export function registerCompanyCompletionProvider(): sourcegraph.Unsubscribable {
    return sourcegraph.languages.registerCompletionItemProvider([{ scheme: 'comment' }, { scheme: 'snippet' }], {
        provideCompletionItems: async (doc, pos) => {
            const apiKey = getAPIKey()
            if (!apiKey) {
                throw new Error('Error: HubSpot API key not set (hubspot.apiKey)')
            }

            if (!doc.text) {
                return null
            }

            const wordRange = doc.getWordRangeAtPosition(pos)
            if (!wordRange) {
                return null
            }
            const word = doc.text.slice(doc.offsetAt(wordRange.start), doc.offsetAt(wordRange.end))
            if (!word.startsWith('$')) {
                return null
            }

            const allCompanies = await allCompaniesCache.get()
            if (!allCompanies) {
                return null
            }

            const query = word.replace(/^\$/, '').toLowerCase()

            const MAX_MATCHES = 25
            const matches: Company[] = []
            for (const c of allCompanies) {
                if (c.name.toLowerCase().includes(query)) {
                    matches.push(c)
                    if (matches.length >= MAX_MATCHES) {
                        break
                    }
                }
            }

            return {
                items: sortBy(matches.map(c => ({ label: c.name, description: ' ', insertText: c.hubspotUrl + ' ' })), [
                    a => !a.label.toLowerCase().startsWith(query),
                ]),
            }
        },
    })
}
