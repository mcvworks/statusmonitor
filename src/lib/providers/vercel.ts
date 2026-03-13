import { BaseStatuspageProvider } from './base-statuspage';
import type { ProviderMetadata } from './types';

export class VercelProvider extends BaseStatuspageProvider {
  name = 'vercel';
  category = 'cloud';
  pollInterval = 'fast' as const;
  metadata: ProviderMetadata = {
    name: 'vercel',
    displayName: 'Vercel',
    description: 'Frontend deployment and serverless platform',
    url: 'https://www.vercel-status.com',
  };

  constructor() {
    super('https://www.vercel-status.com');
  }
}
