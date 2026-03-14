# Adding Providers

This guide explains how to add a new status source to StatusMonitor.

## Choose a Base Class

| Base Class | Use When | Data Source |
|---|---|---|
| `BaseStatuspageProvider` | The service uses Atlassian Statuspage | `{baseUrl}/api/v2/incidents.json` |
| `BaseRSSProvider` | The service publishes an RSS/Atom status feed | Any RSS/Atom URL |
| `BaseJSONProvider<T>` | The service has a custom JSON API | Any JSON endpoint |

## Option 1: Statuspage Provider (simplest)

Most SaaS companies use Atlassian Statuspage. Adding one takes ~10 lines.

### Example: Adding Twilio

Create `src/lib/providers/cloud/twilio.ts`:

```typescript
import { BaseStatuspageProvider } from '../base-statuspage';
import type { ProviderMetadata } from '../types';

export class TwilioProvider extends BaseStatuspageProvider {
  name = 'twilio';
  category = 'cloud';
  pollInterval = 'fast' as const;
  metadata: ProviderMetadata = {
    displayName: 'Twilio',
    statusUrl: 'https://status.twilio.com',
    iconUrl: '/icons/twilio.svg',
  };

  constructor() {
    super('https://status.twilio.com');
  }
}
```

That's it. The base class handles fetching incidents, mapping severity, and normalizing the response.

### Finding the Statuspage URL

If a service uses Statuspage, their status page URL is the `baseUrl`. Common pattern:
- `https://status.{company}.com`
- `https://{company}.statuspage.io`

Verify by checking if `{baseUrl}/api/v2/incidents.json` returns valid JSON.

## Option 2: RSS Provider

Create your provider and implement the `mapItem` method:

```typescript
import { BaseRSSProvider } from '../base-rss';
import type { AlertInput, ProviderMetadata } from '../types';

export class ExampleRSSProvider extends BaseRSSProvider {
  name = 'example';
  category = 'cloud';
  pollInterval = 'slow' as const;
  metadata: ProviderMetadata = {
    displayName: 'Example Service',
    statusUrl: 'https://status.example.com',
  };

  constructor() {
    super('https://status.example.com/feed.rss');
  }

  mapItem(item: any): AlertInput | null {
    if (!item.title || !item.pubDate) return null;

    return {
      externalId: item.guid || item.link || item.title,
      source: this.name,
      category: this.category,
      severity: this.inferSeverity(item.title),
      title: item.title,
      description: item.contentSnippet || item.content,
      url: item.link,
      timestamp: new Date(item.pubDate),
      status: this.inferStatus(item.title),
    };
  }

  private inferSeverity(title: string): AlertInput['severity'] {
    const lower = title.toLowerCase();
    if (lower.includes('outage') || lower.includes('down')) return 'critical';
    if (lower.includes('degraded')) return 'major';
    if (lower.includes('maintenance')) return 'minor';
    return 'info';
  }

  private inferStatus(title: string): AlertInput['status'] {
    const lower = title.toLowerCase();
    if (lower.includes('resolved') || lower.includes('completed')) return 'resolved';
    if (lower.includes('investigating')) return 'investigating';
    if (lower.includes('monitoring')) return 'monitoring';
    return 'active';
  }
}
```

## Option 3: JSON Provider

For custom JSON APIs, extend `BaseJSONProvider<T>` with an optional Zod schema:

```typescript
import { z } from 'zod';
import { BaseJSONProvider } from '../base-json';
import type { AlertInput, ProviderMetadata } from '../types';

const ResponseSchema = z.object({
  incidents: z.array(z.object({
    id: z.string(),
    title: z.string(),
    severity: z.string(),
    created_at: z.string(),
  })),
});

type ResponseType = z.infer<typeof ResponseSchema>;

export class CustomProvider extends BaseJSONProvider<ResponseType> {
  name = 'custom';
  category = 'devops';
  pollInterval = 'slow' as const;
  metadata: ProviderMetadata = {
    displayName: 'Custom Service',
    statusUrl: 'https://status.custom.com',
  };

  constructor() {
    super('https://api.custom.com/v1/incidents', ResponseSchema);
  }

  mapResponse(data: ResponseType): AlertInput[] {
    return data.incidents.map(inc => ({
      externalId: inc.id,
      source: this.name,
      category: this.category,
      severity: inc.severity as AlertInput['severity'],
      title: inc.title,
      timestamp: new Date(inc.created_at),
      status: 'active' as const,
    }));
  }
}
```

For APIs requiring custom headers or authentication, override `fetchAlerts()` directly.

## Register the Provider

Add your provider to `src/lib/providers/registry.ts`:

```typescript
import { TwilioProvider } from './cloud/twilio';

// In the registration block:
registerProvider(new TwilioProvider());
```

The polling engine will automatically pick it up based on its `pollInterval` tier.

## Add to Dependency Map (optional)

If your provider has known downstream services, add an entry to `src/lib/dependencies/static-map.ts`:

```typescript
{
  provider: 'twilio',
  services: [
    {
      service: 'Your App SMS',
      confidence: 'confirmed',
      source: 'https://docs.example.com/architecture',
    },
    {
      service: 'Auth OTP',
      confidence: 'likely',
      regions: ['us-east-1'],
    },
  ],
},
```

Confidence levels:
- `confirmed` — documented dependency
- `likely` — strong evidence but not confirmed
- `possible` — suspected or partial dependency

## Required Interface

All providers must implement the `AlertProvider` interface:

```typescript
interface AlertProvider {
  name: string;           // Unique identifier (lowercase, kebab-case)
  category: string;       // 'cloud' | 'devops' | 'security' | 'isp'
  pollInterval: 'fast' | 'slow';  // fast = 2min, slow = 5min
  metadata: ProviderMetadata;
  fetchAlerts(): Promise<AlertInput[]>;
}

interface AlertInput {
  externalId: string;     // Unique within this source
  source: string;         // Must match provider.name
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
```

## Checklist

- [ ] Provider class created extending appropriate base class
- [ ] `name` is unique and lowercase
- [ ] `category` and `pollInterval` are set correctly
- [ ] Registered in `src/lib/providers/registry.ts`
- [ ] Dependency map entry added (if applicable)
- [ ] Test by running `npm run dev` and waiting for first poll cycle
