import { redirect } from "next/navigation";

// Dashboard is disabled — this route redirects home.
export default function DashboardPage() {
  redirect("/");
}
