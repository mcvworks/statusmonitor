import { BaseStatuspageProvider } from './base-statuspage';
import type { ProviderMetadata } from './types';

export class SlackStatusProvider extends BaseStatuspageProvider {
  name = 'slack';
  category = 'cloud';
  pollInterval = 'fast' as const;
  metadata: ProviderMetadata = {
    name: 'slack',
    displayName: 'Slack',
    description: 'Team messaging and collaboration platform',
    url: 'https://status.slack.com',
  };

  constructor() {
    super('https://status.slack.com');
  }
}
