"use server";

import { cookies } from "next/headers";

export async function setLocale(locale: string) {
  if (locale !== "id" && locale !== "en") return;
  const cookieStore = await cookies();
  cookieStore.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 365 * 24 * 60 * 60, // 1 year
    sameSite: "lax",
  });
}
