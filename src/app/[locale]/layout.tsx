import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { hkGrotesk } from "@/fonts/hkGrotesk";
import "../../globals.css";

export const metadata = {
  title: 'Osttirol Webcams ',
  description: 'Live Webcams aus Osttirol - Berge, Skigebiete & Täler in HD-Qualität',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params, }: LocaleLayoutProps) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${hkGrotesk.variable} antialiased`} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
