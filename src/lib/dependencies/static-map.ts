/**
 * Static infrastructure dependency map.
 * Maps major providers to the services that depend on them.
 */

export type ConfidenceLevel = "confirmed" | "likely" | "possible";

export interface DependentService {
  service: string;
  confidence: ConfidenceLevel;
  regions?: string[];
  source: string;
}

export interface ProviderDependencyMap {
  provider: string;
  services: DependentService[];
}

const AWS_DEPS: DependentService[] = [
  { service: "Slack", confidence: "confirmed", source: "https://slack.com/trust" },
  { service: "Netflix", confidence: "confirmed", source: "https://about.netflix.com/en/news/completing-the-netflix-cloud-migration" },
  { service: "Twilio", confidence: "confirmed", source: "https://www.twilio.com/en-us/security" },
  { service: "Stripe", confidence: "confirmed", source: "https://stripe.com/docs/security" },
  { service: "Reddit", confidence: "confirmed", source: "https://www.redditinc.com" },
  { service: "Vercel", confidence: "confirmed", source: "https://vercel.com/docs/security" },
  { service: "Notion", confidence: "confirmed", source: "https://www.notion.so/security" },
  { service: "Datadog", confidence: "confirmed", source: "https://www.datadoghq.com/about/leadership/" },
  { service: "PagerDuty", confidence: "confirmed", source: "https://www.pagerduty.com/trust/" },
  { service: "Auth0", confidence: "confirmed", source: "https://auth0.com/security" },
  { service: "Airtable", confidence: "confirmed", source: "https://www.airtable.com/security" },
  { service: "Figma", confidence: "likely", source: "https://www.figma.com/security/" },
  { service: "Adobe", confidence: "likely", regions: ["us-east-1", "us-west-2"], source: "https://www.adobe.com/trust.html" },
  { service: "Capital One", confidence: "confirmed", source: "https://www.capitalone.com/tech/cloud/" },
  { service: "Lyft", confidence: "confirmed", source: "https://eng.lyft.com/" },
  { service: "DoorDash", confidence: "confirmed", source: "https://doordash.engineering/" },
  { service: "Robinhood", confidence: "confirmed", source: "https://robinhood.engineering/" },
  { service: "Airbnb", confidence: "confirmed", source: "https://medium.com/airbnb-engineering" },
  { service: "Twitch", confidence: "confirmed", source: "https://aws.amazon.com/solutions/case-studies/twitch/" },
  { service: "iRobot", confidence: "confirmed", source: "https://aws.amazon.com/solutions/case-studies/irobot/" },
];

const CLOUDFLARE_DEPS: DependentService[] = [
  { service: "Discord", confidence: "confirmed", source: "https://discord.com/safety" },
  { service: "Canva", confidence: "confirmed", source: "https://www.canva.com/trust/" },
  { service: "Shopify", confidence: "confirmed", source: "https://www.shopify.com/enterprise/security" },
  { service: "Medium", confidence: "likely", source: "https://medium.com" },
  { service: "Udemy", confidence: "likely", source: "https://www.udemy.com" },
  { service: "DoorDash", confidence: "likely", source: "https://doordash.engineering/" },
  { service: "Stack Overflow", confidence: "confirmed", source: "https://stackoverflow.com" },
  { service: "Notion", confidence: "possible", source: "https://www.notion.so" },
  { service: "Zendesk", confidence: "likely", source: "https://www.zendesk.com" },
  { service: "Curseforge", confidence: "confirmed", source: "https://www.curseforge.com" },
];

const GCP_DEPS: DependentService[] = [
  { service: "Spotify", confidence: "confirmed", source: "https://cloud.google.com/customers/spotify" },
  { service: "Snapchat", confidence: "confirmed", source: "https://cloud.google.com/customers/snap" },
  { service: "Twitter/X", confidence: "likely", source: "https://cloud.google.com/customers" },
  { service: "PayPal", confidence: "confirmed", source: "https://cloud.google.com/customers/paypal" },
  { service: "Target", confidence: "confirmed", source: "https://cloud.google.com/customers/target" },
  { service: "Home Depot", confidence: "confirmed", source: "https://cloud.google.com/customers/the-home-depot" },
  { service: "Etsy", confidence: "confirmed", source: "https://cloud.google.com/customers/etsy" },
  { service: "Shopify", confidence: "possible", source: "https://www.shopify.com" },
  { service: "Duolingo", confidence: "confirmed", source: "https://cloud.google.com/customers/duolingo" },
  { service: "HSBC", confidence: "confirmed", source: "https://cloud.google.com/customers/hsbc" },
];

const AZURE_DEPS: DependentService[] = [
  { service: "Microsoft 365", confidence: "confirmed", source: "https://www.microsoft.com/en-us/trust-center" },
  { service: "Microsoft Teams", confidence: "confirmed", source: "https://www.microsoft.com/en-us/trust-center" },
  { service: "LinkedIn", confidence: "confirmed", source: "https://engineering.linkedin.com/" },
  { service: "OpenAI/ChatGPT", confidence: "confirmed", source: "https://openai.com" },
  { service: "SAP", confidence: "confirmed", source: "https://www.sap.com/about/trust-center.html" },
  { service: "Adobe", confidence: "possible", regions: ["eu-west-1"], source: "https://www.adobe.com/trust.html" },
  { service: "eBay", confidence: "confirmed", source: "https://tech.ebayinc.com/" },
  { service: "FedEx", confidence: "confirmed", source: "https://www.fedex.com" },
  { service: "Walmart", confidence: "confirmed", source: "https://tech.walmart.com/" },
  { service: "GE Healthcare", confidence: "confirmed", source: "https://azure.microsoft.com/en-us/case-studies/" },
  { service: "NBC Universal", confidence: "likely", source: "https://azure.microsoft.com/en-us/case-studies/" },
];

const FASTLY_DEPS: DependentService[] = [
  { service: "GitHub", confidence: "confirmed", source: "https://github.blog/" },
  { service: "Stripe", confidence: "possible", source: "https://stripe.com" },
  { service: "Twitch", confidence: "likely", source: "https://www.fastly.com/customers" },
  { service: "Pinterest", confidence: "confirmed", source: "https://www.fastly.com/customers/pinterest" },
  { service: "NYTimes", confidence: "confirmed", source: "https://www.fastly.com/customers/the-new-york-times" },
  { service: "The Guardian", confidence: "confirmed", source: "https://www.fastly.com/customers/the-guardian" },
  { service: "Reddit", confidence: "possible", source: "https://www.redditinc.com" },
  { service: "Vimeo", confidence: "confirmed", source: "https://www.fastly.com/customers/vimeo" },
  { service: "BuzzFeed", confidence: "likely", source: "https://www.fastly.com/customers" },
  { service: "Yelp", confidence: "likely", source: "https://www.fastly.com/customers" },
];

export const DEPENDENCY_MAP: ProviderDependencyMap[] = [
  { provider: "aws", services: AWS_DEPS },
  { provider: "cloudflare", services: CLOUDFLARE_DEPS },
  { provider: "gcp", services: GCP_DEPS },
  { provider: "azure", services: AZURE_DEPS },
  { provider: "fastly", services: FASTLY_DEPS },
];

/** Flat list of all dependency entries for seeding */
export function getAllDependencies(): Array<{
  provider: string;
  dependentService: string;
  confidence: ConfidenceLevel;
  region: string | null;
  source: string;
}> {
  const entries: Array<{
    provider: string;
    dependentService: string;
    confidence: ConfidenceLevel;
    region: string | null;
    source: string;
  }> = [];

  for (const map of DEPENDENCY_MAP) {
    for (const dep of map.services) {
      if (dep.regions && dep.regions.length > 0) {
        for (const region of dep.regions) {
          entries.push({
            provider: map.provider,
            dependentService: dep.service,
            confidence: dep.confidence,
            region,
            source: dep.source,
          });
        }
      } else {
        entries.push({
          provider: map.provider,
          dependentService: dep.service,
          confidence: dep.confidence,
          region: null,
          source: dep.source,
        });
      }
    }
  }

  return entries;
}
