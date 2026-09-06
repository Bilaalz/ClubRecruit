import { redirect } from "next/navigation";

// Stage 8 replaces this with a landing page.
export default function Home() {
  redirect("/dashboard");
}
