import type { SerializedAlert } from "./alert-schema";

export function isOperationalSignal(
  alert: Pick<SerializedAlert, "signalKind">,
): boolean {
  return alert.signalKind === "incident" || alert.signalKind === "internet_outage";
}

export function isAdvisorySignal(
  alert: Pick<SerializedAlert, "signalKind">,
): boolean {
  return alert.signalKind === "advisory";
}

export function isSuspectedSignal(
  alert: Pick<SerializedAlert, "signalKind" | "confidence">,
): boolean {
  return (
    alert.signalKind === "community_signal" ||
    alert.confidence === "crowdsourced" ||
    alert.confidence === "observed"
  );
}
