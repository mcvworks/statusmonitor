import { BaseRSSProvider } from './base-rss';
import type { RSSItem } from './base-rss';
import type { AlertInput } from './types';

const STATUS_PATTERN = /\b(resolved|completed|monitoring|identified|investigating|active|scheduled)\b/gi;

export function plainText(value: string | undefined): string {
  if (!value) return '';

  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#xA0;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

export function statusFromText(text: string): AlertInput['status'] {
  const matches = [...text.matchAll(STATUS_PATTERN)];
  const latest = matches.at(-1)?.[1]?.toLowerCase();

  if (latest === 'resolved' || latest === 'completed') return 'resolved';
  if (latest === 'monitoring') return 'monitoring';
  if (latest === 'investigating' || latest === 'identified') {
    return 'investigating';
  }
  return 'active';
}

function severityFromText(text: string): AlertInput['severity'] {
  if (/critical|global outage|major outage/i.test(text)) return 'critical';
  if (/service disruption|outage|unavailable/i.test(text)) return 'major';
  if (/degrad|partial|intermittent|elevated error/i.test(text)) return 'minor';
  return /maintenance|scheduled/i.test(text) ? 'info' : 'minor';
}

function validDate(...values: Array<string | undefined>): Date {
  for (const value of values) {
    if (!value) continue;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime()) && parsed.getUTCFullYear() < 2100) {
      return parsed;
    }
  }
  return new Date();
}

/** Normalizes official RSS/Atom status feeds that do not expose Statuspage JSON. */
export abstract class BaseStatusRSSProvider extends BaseRSSProvider {
  mapItem(item: RSSItem): AlertInput | null {
    const rawContent = item.content ?? item.contentSnippet ?? item.summary ?? '';
    const description = plainText(rawContent);
    const title = plainText(item.title) || 'Service status update';
    const combined = `${title} ${description}`;
    const status = statusFromText(combined);
    const atomFields = item as RSSItem & { id?: string; updated?: string };
    const updated = atomFields.updated;
    const timestamp = validDate(item.isoDate, item.pubDate, updated);
    const externalId = item.guid ?? atomFields.id ?? item.link ?? `${title}-${timestamp.toISOString()}`;
    const maintenance = /maintenance|scheduled/i.test(combined);

    return {
      externalId,
      source: this.name,
      category: this.category,
      severity: severityFromText(combined),
      title,
      description: description || undefined,
      url: item.link || this.metadata.url,
      timestamp,
      status,
      resolvedAt: status === 'resolved' ? timestamp : undefined,
      signalKind: maintenance ? 'maintenance' : 'incident',
      confidence: 'official',
    };
  }
}
