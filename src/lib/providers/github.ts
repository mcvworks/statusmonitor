import { BaseStatuspageProvider } from './base-statuspage';
import type { ProviderMetadata } from './types';

export class GitHubProvider extends BaseStatuspageProvider {
  name = 'github';
  category = 'cloud';
  pollInterval = 'fast' as const;
  metadata: ProviderMetadata = {
    name: 'github',
    displayName: 'GitHub',
    description: 'Code hosting, CI/CD, and developer collaboration platform',
    url: 'https://www.githubstatus.com',
  };

  constructor() {
    super('https://www.githubstatus.com');
  }
}
