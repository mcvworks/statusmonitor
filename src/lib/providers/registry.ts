import type { AlertProvider } from './types';
import { CloudflareProvider } from './cloudflare';
import { GitHubProvider } from './github';
import { AtlassianProvider } from './atlassian';
import { SlackStatusProvider } from './slack-status';

const providerRegistry = new Map<string, AlertProvider>();

export function registerProvider(provider: AlertProvider): void {
  providerRegistry.set(provider.name, provider);
}

// Register statuspage providers
registerProvider(new CloudflareProvider());
registerProvider(new GitHubProvider());
registerProvider(new AtlassianProvider());
registerProvider(new SlackStatusProvider());

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
