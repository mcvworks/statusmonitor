import { BaseStatusRSSProvider } from './base-status-rss';
import type { ProviderMetadata } from './types';

export class DockerHubProvider extends BaseStatusRSSProvider {
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
    super('https://www.dockerstatus.com/pages/533c6539221ae15e3f000031/rss');
  }
}
