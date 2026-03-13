import { BaseStatuspageProvider } from './base-statuspage';
import type { ProviderMetadata } from './types';

export class NpmRegistryProvider extends BaseStatuspageProvider {
  name = 'npm-registry';
  category = 'devops';
  pollInterval = 'slow' as const;
  metadata: ProviderMetadata = {
    name: 'npm-registry',
    displayName: 'npm Registry',
    description: 'JavaScript package registry',
    url: 'https://status.npmjs.org',
  };

  constructor() {
    super('https://status.npmjs.org');
  }
}
