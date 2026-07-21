import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, locales, type Locale } from "./config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value as Locale) || defaultLocale;

  if (!locales.includes(locale as Locale)) {
    return { locale: defaultLocale, messages: (await import(`../../messages/${defaultLocale}.json`)).default };
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
