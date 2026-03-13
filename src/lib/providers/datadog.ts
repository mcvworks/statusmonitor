import { BaseStatuspageProvider } from './base-statuspage';
import type { ProviderMetadata } from './types';

export class DatadogProvider extends BaseStatuspageProvider {
  name = 'datadog';
  category = 'devops';
  pollInterval = 'slow' as const;
  metadata: ProviderMetadata = {
    name: 'datadog',
    displayName: 'Datadog',
    description: 'Cloud monitoring and analytics platform',
    url: 'https://status.datadoghq.com',
  };

  constructor() {
    super('https://status.datadoghq.com');
  }
}
