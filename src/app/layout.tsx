import localFont from "next/font/local";
import "../globals.css";

const hkGrotesk = localFont({
  src: [
    {
      path: "../fonts/HKGrotesk-Thin.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "../fonts/HKGrotesk-ThinItalic.woff2",
      weight: "100",
      style: "italic",
    },
    {
      path: "../fonts/HKGrotesk-ExtraLight.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "../fonts/HKGrotesk-ExtraLightItalic.woff2",
      weight: "200",
      style: "italic",
    },
    {
      path: "../fonts/HKGrotesk-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/HKGrotesk-LightItalic.woff2",
      weight: "300",
      style: "italic",
    },
    {
      path: "../fonts/HKGrotesk-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/HKGrotesk-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../fonts/HKGrotesk-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/HKGrotesk-MediumItalic.woff2",
      weight: "500",
      style: "italic",
    },
    {
      path: "../fonts/HKGrotesk-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/HKGrotesk-SemiBoldItalic.woff2",
      weight: "600",
      style: "italic",
    },
    {
      path: "../fonts/HKGrotesk-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/HKGrotesk-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
    {
      path: "../fonts/HKGrotesk-ExtraBold.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "../fonts/HKGrotesk-ExtraBoldItalic.woff2",
      weight: "800",
      style: "italic",
    },
    {
      path: "../fonts/HKGrotesk-Black.woff2",
      weight: "900",
      style: "normal",
    },
    {
      path: "../fonts/HKGrotesk-BlackItalic.woff2",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-hk-grotesk",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${hkGrotesk.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
