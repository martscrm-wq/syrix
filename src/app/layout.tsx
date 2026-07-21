import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { defaultLocale, locales, localeDirections, type Locale } from "@/i18n/config";
import { LocaleProvider } from "@/lib/locale-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "SYRIX - Enterprise Management System",
  description: "Integrated management platform for HR, Operations, Accounting, Marketing, and Sales",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = ((cookieStore.get("locale")?.value as Locale) || defaultLocale);
  const validLocale = locales.includes(locale as Locale) ? locale : defaultLocale;
  const dir = localeDirections[validLocale];
  const messages = await getMessages();

  return (
    <html lang={validLocale} dir={dir}>
      <body className="antialiased">
        <NextIntlClientProvider locale={validLocale} messages={messages}>
          <LocaleProvider initialLocale={validLocale}>
            {children}
          </LocaleProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
