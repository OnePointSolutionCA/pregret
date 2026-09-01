import { redirect } from "next/navigation";

// Check-in flow is disabled — this route redirects home.
export default function CheckInPage() {
  redirect("/");
}
