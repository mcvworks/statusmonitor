import { BaseStatuspageProvider } from './base-statuspage';
import type { ProviderMetadata } from './types';

export class FastlyProvider extends BaseStatuspageProvider {
  name = 'fastly';
  category = 'cloud';
  pollInterval = 'fast' as const;
  metadata: ProviderMetadata = {
    name: 'fastly',
    displayName: 'Fastly',
    description: 'Edge cloud platform and CDN',
    url: 'https://status.fastly.com',
  };

  constructor() {
    super('https://status.fastly.com');
  }
}
