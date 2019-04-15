import * as sourcegraph from 'sourcegraph'
import { registerCompanyCompletionProvider } from './completion'
import { registerLinkPreviewProvider } from './linkPreview'

export function activate(ctx: sourcegraph.ExtensionContext): void {
    if (
        !sourcegraph.content ||
        !sourcegraph.content.registerLinkPreviewProvider ||
        !sourcegraph.languages.registerCompletionItemProvider
    ) {
        ctx.subscriptions.add(
            sourcegraph.app.activeWindowChanges.subscribe(activeWindow => {
                if (activeWindow) {
                    activeWindow.showNotification(
                        'To use the HubSpot extension, you must upgrade to Sourcegraph 3.3 (or the latest version of the browser extension).',
                        sourcegraph.NotificationType.Error
                    )
                }
            })
        )
        return
    }
    ctx.subscriptions.add(registerLinkPreviewProvider())
    ctx.subscriptions.add(registerCompanyCompletionProvider())
}

export interface Settings {
    'hubspot.apiKey'?: string
}

export const getAPIKey = () => sourcegraph.configuration.get<Settings>().get('hubspot.apiKey')
