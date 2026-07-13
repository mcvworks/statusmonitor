import { CustomDashboard } from "./CustomDashboard";

export const metadata = {
  title: "My Dashboard — DTMonitor",
  description: "Customize a private service monitoring dashboard stored in your browser",
};

export default function DashboardPage() {
  return <CustomDashboard />;
}
