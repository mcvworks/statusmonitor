import { BaseStatusRSSProvider } from './base-status-rss';
import type { ProviderMetadata } from './types';

export class FastlyProvider extends BaseStatusRSSProvider {
  name = 'fastly';
  category = 'cloud';
  pollInterval = 'fast' as const;
  metadata: ProviderMetadata = {
    name: 'fastly',
    displayName: 'Fastly',
    description: 'Edge cloud platform and CDN',
    url: 'https://www.fastlystatus.com',
  };

  constructor() {
    super('https://www.fastlystatus.com/rss/');
  }
}
