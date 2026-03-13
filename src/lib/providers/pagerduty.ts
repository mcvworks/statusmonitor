import { BaseStatuspageProvider } from './base-statuspage';
import type { ProviderMetadata } from './types';

export class PagerDutyProvider extends BaseStatuspageProvider {
  name = 'pagerduty';
  category = 'devops';
  pollInterval = 'slow' as const;
  metadata: ProviderMetadata = {
    name: 'pagerduty',
    displayName: 'PagerDuty',
    description: 'Incident management and on-call scheduling',
    url: 'https://status.pagerduty.com',
  };

  constructor() {
    super('https://status.pagerduty.com');
  }
}
