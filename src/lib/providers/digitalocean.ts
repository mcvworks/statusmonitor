import { BaseStatuspageProvider } from './base-statuspage';
import type { ProviderMetadata } from './types';

export class DigitalOceanProvider extends BaseStatuspageProvider {
  name = 'digitalocean';
  category = 'cloud';
  pollInterval = 'fast' as const;
  metadata: ProviderMetadata = {
    name: 'digitalocean',
    displayName: 'DigitalOcean',
    description: 'Cloud infrastructure and platform-as-a-service',
    url: 'https://status.digitalocean.com',
  };

  constructor() {
    super('https://status.digitalocean.com');
  }
}
