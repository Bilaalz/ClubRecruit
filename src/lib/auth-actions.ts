"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_COOKIE } from "@/lib/auth";
import { db } from "@/lib/db";

export async function switchUser(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Unknown user");
  const jar = await cookies();
  jar.set(DEMO_COOKIE, user.id, { path: "/", httpOnly: true, sameSite: "lax" });
  redirect(String(formData.get("next") || "/dashboard"));
}
