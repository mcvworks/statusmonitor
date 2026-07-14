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
  metadata?: Record<string, unknown>;
  signalKind?: 'incident' | 'advisory' | 'internet_outage' | 'community_signal' | 'maintenance';
  confidence?: 'official' | 'corroborated' | 'observed' | 'crowdsourced';
  /** For observations that have no explicit resolution update. */
  expiresAt?: Date;
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
  /** Prevent polling APIs more frequently than their published guidance. */
  minimumIntervalMs?: number;
  /** Populate existing records on the first successful poll without emitting alert events. */
  silenceInitialBackfill?: boolean;
  fetchAlerts(): Promise<AlertInput[]>;
}
