import { BaseStatuspageProvider } from "./base-statuspage";
import type { ProviderMetadata } from "./types";

export interface StatuspageProviderConfig {
  name: string;
  displayName: string;
  description: string;
  baseUrl: string;
  category?: string;
  pollInterval?: "fast" | "slow";
}

/** Configuration-driven adapter for vendors using Atlassian Statuspage. */
export class ConfiguredStatuspageProvider extends BaseStatuspageProvider {
  name: string;
  category: string;
  pollInterval: "fast" | "slow";
  metadata: ProviderMetadata;

  constructor(config: StatuspageProviderConfig) {
    super(config.baseUrl);
    this.name = config.name;
    this.category = config.category ?? "cloud";
    this.pollInterval = config.pollInterval ?? "fast";
    this.metadata = {
      name: config.name,
      displayName: config.displayName,
      description: config.description,
      url: config.baseUrl,
    };
  }
}

export const CONFIGURED_STATUSPAGE_PROVIDERS: StatuspageProviderConfig[] = [
  {
    name: "openai",
    displayName: "OpenAI",
    description: "ChatGPT, API, Sora, and related OpenAI services",
    baseUrl: "https://status.openai.com",
  },
  {
    name: "twilio",
    displayName: "Twilio",
    description: "Messaging, voice, email, and communications APIs",
    baseUrl: "https://status.twilio.com",
  },
  {
    name: "discord",
    displayName: "Discord",
    description: "Discord messaging, voice, gateway, and API services",
    baseUrl: "https://discordstatus.com",
  },
];
