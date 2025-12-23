"use client";

import { useRouter } from "@/routing";
import { useTranslations } from "next-intl";

export default function HomePage() {
  const router = useRouter();
  const t = useTranslations();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
          <span className="bg-gradient-to-r from-primary to-gray-darker bg-clip-text text-transparent">
            {t("home.welcome")}
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          {t("home.subtitle")}
        </p>
      </div>
    </div>
  );
}
