import { BaseStatuspageProvider } from './base-statuspage';
import type { ProviderMetadata } from './types';

export class NetlifyProvider extends BaseStatuspageProvider {
  name = 'netlify';
  category = 'cloud';
  pollInterval = 'fast' as const;
  metadata: ProviderMetadata = {
    name: 'netlify',
    displayName: 'Netlify',
    description: 'Web development and hosting platform',
    url: 'https://www.netlifystatus.com',
  };

  constructor() {
    super('https://www.netlifystatus.com');
  }
}
