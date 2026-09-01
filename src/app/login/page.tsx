import { redirect } from "next/navigation";

// Login is disabled — this route redirects home. Auth flow may return later
// (Supabase Auth is scaffolded and ready to re-enable).
export default function LoginPage() {
  redirect("/");
}
