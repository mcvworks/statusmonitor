import type { AlertProvider } from './types';

const providerRegistry = new Map<string, AlertProvider>();

export function registerProvider(provider: AlertProvider): void {
  providerRegistry.set(provider.name, provider);
}

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
