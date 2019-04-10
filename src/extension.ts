import * as sourcegraph from 'sourcegraph'
import { registerCompanyCompletionProvider } from './completion'
import { registerLinkPreviewProvider } from './linkPreview'

export function activate(ctx: sourcegraph.ExtensionContext): void {
    ctx.subscriptions.add(registerLinkPreviewProvider())
    ctx.subscriptions.add(registerCompanyCompletionProvider())
}

export interface Settings {
    'hubspot.apiKey'?: string
}

export const getAPIKey = () => sourcegraph.configuration.get<Settings>().get('hubspot.apiKey')
