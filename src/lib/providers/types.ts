export interface AlertInput {
  externalId: string;
  source: string;
  category: string;
  severity: 'critical' | 'major' | 'minor' | 'info';
  title: string;
  description?: string;
  url?: string;
  region?: string;
  timestamp: Date;
  status: 'active' | 'resolved' | 'investigating' | 'monitoring';
  resolvedAt?: Date;
}

export interface ProviderMetadata {
  name: string;
  displayName: string;
  description: string;
  url: string;
  icon?: string;
}

export interface AlertProvider {
  name: string;
  category: string;
  pollInterval: 'fast' | 'slow';
  metadata: ProviderMetadata;
  fetchAlerts(): Promise<AlertInput[]>;
}
