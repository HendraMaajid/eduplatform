import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { getPlatformSettings } from "@/lib/platform-settings";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const requestedLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const locale =
    requestedLocale === "id" || requestedLocale === "en"
      ? requestedLocale
      : (await getPlatformSettings()).defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
