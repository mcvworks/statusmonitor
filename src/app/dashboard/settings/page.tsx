import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SettingsPage } from "./SettingsPage";

export const metadata = {
  title: "Notification Settings — StatusMonitor",
  description: "Configure your notification channels and alert preferences",
};

export default async function SettingsRoute() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <SettingsPage />;
}
