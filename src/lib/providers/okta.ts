import { BaseStatuspageProvider } from './base-statuspage';
import type { ProviderMetadata } from './types';

export class OktaProvider extends BaseStatuspageProvider {
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
    super('https://status.okta.com');
  }
}
