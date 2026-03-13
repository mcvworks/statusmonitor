import { BaseStatuspageProvider } from './base-statuspage';
import type { ProviderMetadata } from './types';

export class StripeProvider extends BaseStatuspageProvider {
  name = 'stripe';
  category = 'cloud';
  pollInterval = 'fast' as const;
  metadata: ProviderMetadata = {
    name: 'stripe',
    displayName: 'Stripe',
    description: 'Online payment processing platform',
    url: 'https://status.stripe.com',
  };

  constructor() {
    super('https://status.stripe.com');
  }
}
