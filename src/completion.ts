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

            const wordRange = doc.getWordRangeAtPosition(pos)
            if (!wordRange) {
                return null
            }
            const word = doc.text.slice(doc.offsetAt(wordRange.start), doc.offsetAt(wordRange.end))
            if (!word.startsWith('$')) {
                return null
            }

            const allCompanies = await getAllCompanies(apiKey)
            if (!allCompanies) {
                return null
            }

            const query = word.replace(/^\$/, '').toLowerCase()
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
