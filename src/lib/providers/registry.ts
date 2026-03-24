import type { AlertProvider } from './types';
import { CloudflareProvider } from './cloudflare';
import { GitHubProvider } from './github';
import { AtlassianProvider } from './atlassian';
import { SlackStatusProvider } from './slack-status';
import { OktaProvider } from './okta';
import { StripeProvider } from './stripe';
import { DigitalOceanProvider } from './digitalocean';
import { FastlyProvider } from './fastly';
import { VercelProvider } from './vercel';
import { NetlifyProvider } from './netlify';
import { AWSProvider } from './aws';
import { AzureProvider } from './azure';
import { M365Provider } from './m365';
import { GCPProvider } from './gcp';
import { GoogleWorkspaceProvider } from './google-workspace';
import { DatadogProvider } from './datadog';
import { PagerDutyProvider } from './pagerduty';
import { DockerHubProvider } from './dockerhub';
import { NpmRegistryProvider } from './npm-registry';
import { CISAKEVProvider } from './cisa-kev';
import { NVDProvider } from './nvd';
import { CloudflareRadarProvider } from './cloudflare-radar';
import { DowndetectorProvider } from './downdetector';

const providerRegistry = new Map<string, AlertProvider>();

export function registerProvider(provider: AlertProvider): void {
  providerRegistry.set(provider.name, provider);
}

// Register statuspage providers
registerProvider(new CloudflareProvider());
registerProvider(new GitHubProvider());
registerProvider(new AtlassianProvider());
registerProvider(new SlackStatusProvider());
registerProvider(new OktaProvider());
registerProvider(new StripeProvider());
registerProvider(new DigitalOceanProvider());
registerProvider(new FastlyProvider());
registerProvider(new VercelProvider());
registerProvider(new NetlifyProvider());

// Register RSS providers
registerProvider(new AWSProvider());
registerProvider(new AzureProvider());
registerProvider(new M365Provider());

// Register JSON providers
registerProvider(new GCPProvider());
registerProvider(new GoogleWorkspaceProvider());

// Register DevOps providers
registerProvider(new DatadogProvider());
registerProvider(new PagerDutyProvider());
registerProvider(new DockerHubProvider());
registerProvider(new NpmRegistryProvider());

// Register Security providers
registerProvider(new CISAKEVProvider());
registerProvider(new NVDProvider());

// Register ISP provider
registerProvider(new CloudflareRadarProvider());

// Register Meta provider (crowdsourced)
registerProvider(new DowndetectorProvider());

export function getProvider(name: string): AlertProvider | undefined {
  return providerRegistry.get(name);
}

export function getAllProviders(): AlertProvider[] {
  return Array.from(providerRegistry.values());
}

export function getProvidersByCategory(category: string): AlertProvider[] {
  return getAllProviders().filter((p) => p.category === category);
}

export function getProvidersByPollTier(
  tier: 'fast' | 'slow',
): AlertProvider[] {
  return getAllProviders().filter((p) => p.pollInterval === tier);
}
