import type { z } from 'zod';
import type { AlertProvider, AlertInput, ProviderMetadata } from './types';

export abstract class BaseJSONProvider<T = unknown> implements AlertProvider {
  abstract name: string;
  abstract category: string;
  abstract pollInterval: 'fast' | 'slow';
  abstract metadata: ProviderMetadata;

  constructor(
    protected apiUrl: string,
    protected schema?: z.ZodType<T>,
  ) {}

  abstract mapResponse(data: T): AlertInput[];

  async fetchAlerts(): Promise<AlertInput[]> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const response = await fetch(this.apiUrl, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        console.error(`[${this.name}] HTTP ${response.status} from JSON API`);
        return [];
      }

      const raw = await response.json();
      const data = this.schema ? this.schema.parse(raw) : (raw as T);

      return this.mapResponse(data);
    } catch (error) {
      console.error(`[${this.name}] Failed to fetch JSON data:`, error);
      return [];
    }
  }
}
