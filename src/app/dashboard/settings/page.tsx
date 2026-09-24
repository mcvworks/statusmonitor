import { SettingsPage } from "./SettingsPage";

export const metadata = {
  title: "Alert and Browser Settings",
  description: "Manage or stop email, browser, Slack, and Teams alerts. Export or import your saved DTMonitor preferences.",
};

export default function SettingsRoute() {
  return <SettingsPage />;
}
