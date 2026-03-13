import { BaseStatuspageProvider } from './base-statuspage';
import type { ProviderMetadata } from './types';

export class AtlassianProvider extends BaseStatuspageProvider {
  name = 'atlassian';
  category = 'cloud';
  pollInterval = 'fast' as const;
  metadata: ProviderMetadata = {
    name: 'atlassian',
    displayName: 'Atlassian',
    description: 'Jira, Confluence, Bitbucket, and Trello collaboration tools',
    url: 'https://status.atlassian.com',
  };

  constructor() {
    super('https://status.atlassian.com');
  }
}
