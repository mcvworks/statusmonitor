import { BaseStatuspageProvider } from './base-statuspage';
import type { ProviderMetadata } from './types';

export class DockerHubProvider extends BaseStatuspageProvider {
  name = 'dockerhub';
  category = 'devops';
  pollInterval = 'slow' as const;
  metadata: ProviderMetadata = {
    name: 'dockerhub',
    displayName: 'Docker Hub',
    description: 'Container image registry and build service',
    url: 'https://www.dockerstatus.com',
  };

  constructor() {
    super('https://www.dockerstatus.com');
  }
}
