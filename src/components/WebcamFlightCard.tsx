import Image from "next/image";

interface WebcamFlightCardProps {
  url: string;
  locationName: string;
  /** false während des Fluges - dann gibt die Karte den Blick auf das Gelände frei. */
  visible: boolean;
}

export default function WebcamFlightCard({ url, locationName, visible }: WebcamFlightCardProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center p-4">
      <div
        className={`relative h-[95%] w-[95%] transition-all duration-700 ease-out ${
          visible ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <Image
          key={url}
          src={url}
          alt={locationName}
          fill
          className="rounded-xl object-contain drop-shadow-2xl"
          unoptimized
          priority
        />
      </div>

      {/* Standortname - bleibt auch während des Fluges sichtbar */}
      <div
        className={`absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-black/50 px-4 py-1.5 backdrop-blur-md transition-opacity duration-700 ${
          visible ? "opacity-0" : "opacity-100"
        }`}
      >
        <span className="text-sm font-semibold text-white md:text-base">{locationName}</span>
      </div>
    </div>
  );
}
