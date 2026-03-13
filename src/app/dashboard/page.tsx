import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CustomDashboard } from "./CustomDashboard";

export const metadata = {
  title: "My Dashboard — StatusMonitor",
  description: "Your personalized service monitoring dashboard",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <CustomDashboard />;
}
