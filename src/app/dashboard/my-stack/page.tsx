import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MyStackPage } from "./MyStackPage";

export const metadata = {
  title: "My Stack — DTMonitor",
  description: "Define your infrastructure stack for personalized blast radius analysis",
};

export default async function MyStackRoute() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <MyStackPage />;
}
