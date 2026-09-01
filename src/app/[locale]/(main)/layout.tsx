"use client";

import { usePathname } from "@/routing";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Add custom layout logic here if needed
  // For example, full-screen routes:
  // const FULL_SCREEN_ROUTES = ['/special-route'];
  // const isFullScreen = FULL_SCREEN_ROUTES.includes(pathname as any);

  return (
    <div className="flex h-screen">
      {/* min-w-0: ohne das schrumpft ein Flex-Item nicht unter seine
          Inhaltsbreite und schmale Seiten laufen seitlich über. */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
