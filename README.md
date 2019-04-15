# HubSpot extension for Sourcegraph

A [Sourcegraph extension](https://docs.sourcegraph.com/extensions) that enhances GitHub with better [HubSpot](https://www.hubspot.com) integration.

[**🗃️ Source code**](https://github.com/sourcegraph/sourcegraph-hubspot)

[**➕ Add to Sourcegraph**](https://sourcegraph.com/extensions/sourcegraph/hubspot)

**Status:** beta

## Usage

This extension currently only works on GitHub (and GitHub Enterprise), not on Sourcegraph or other code hosts.

1. Install the [Sourcegraph browser extension](https://docs.sourcegraph.com/integration/browser_extension).
1. [Enable the HubSpot extension](https://sourcegraph.com/extensions/sourcegraph/hubspot) in the Sourcegraph extension registry (requires sign-in to Sourcegraph).
1. Configure the HubSpot extension in [Sourcegraph user settings](https://sourcegraph.com/user/settings): `hubspot.apiKey`.
1. Visit any text area, comment, PR, or issue on GitHub and try the [features](#features) below.

If using GitHub Enterprise, right-click on the Sourcegraph browser extension icon when you're on a GitHub Enterprise page and select **Enable Sourcegraph on this domain**.

## Features

### Autocompletion of HubSpot company names

Just start typing the name of a customer in your HubSpot contacts (like `Acme Corporation`) to complete it! Select a company to insert its HubSpot URL into the text area. It works just like GitHub's built-in autocompletion for issues, PRs, and users.

This makes it easy to denote which customers care about a specific issue. (If your repository is public, no fear: HubSpot company URLs don't contain the company's name, so your customer names won't be exposed.)

![HubSpot company autocompletion](https://storage.googleapis.com/sourcegraph-assets/extensions/sourcegraph/hubspot/hubspot-autocomplete.png)

### Link previews for HubSpot company URLs

For any HubSpot company link that appears on GitHub (in a comment, issue, PR, or rendered Markdown file), you'll see a preview with the company name and other stats (such as number of employees, location, etc.).

This makes it easy to see which customers care about a specific issue. The emoji link lets you see all _other issues_ that the same company is mentioned in, which is also very useful (to answer "what are all the issues a specific customer cares about?").

![HubSpot company link previews](https://storage.googleapis.com/sourcegraph-assets/extensions/sourcegraph/hubspot/hubspot-linkpreview.png)
