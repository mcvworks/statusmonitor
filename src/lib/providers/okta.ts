import { BaseStatusRSSProvider } from './base-status-rss';
import type { ProviderMetadata } from './types';

export class OktaProvider extends BaseStatusRSSProvider {
  name = 'okta';
  category = 'cloud';
  pollInterval = 'fast' as const;
  metadata: ProviderMetadata = {
    name: 'okta',
    displayName: 'Okta',
    description: 'Identity and access management platform',
    url: 'https://status.okta.com',
  };

  constructor() {
    super('https://feeds.feedburner.com/OktaTrustRSS');
  }
}
