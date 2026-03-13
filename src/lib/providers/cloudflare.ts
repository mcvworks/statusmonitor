import { BaseStatuspageProvider } from './base-statuspage';
import type { ProviderMetadata } from './types';

export class CloudflareProvider extends BaseStatuspageProvider {
  name = 'cloudflare';
  category = 'cloud';
  pollInterval = 'fast' as const;
  metadata: ProviderMetadata = {
    name: 'cloudflare',
    displayName: 'Cloudflare',
    description: 'CDN, DNS, DDoS protection, and edge computing platform',
    url: 'https://www.cloudflarestatus.com',
  };

  constructor() {
    super('https://www.cloudflarestatus.com');
  }
}
