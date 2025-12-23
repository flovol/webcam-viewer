import Image from "next/image";

interface WebcamGridProps {
  cameras: Array<{ url: string; locationId: string }>;
  previousCameras: Array<{ url: string; locationId: string }>;
  cameraLocations: Record<string, { name: string; lat: number; lon: number }>;
  isTransitioning: boolean;
}

export default function WebcamGrid({ cameras, previousCameras, cameraLocations, isTransitioning }: WebcamGridProps) {
  return (
    <>
      {/* Blurry Hintergrund mit smooth transition */}
      <div className="absolute inset-0 z-0">
        {/* Vorheriger Hintergrund */}
        <Image
          key={`bg-prev-${previousCameras[0]?.url}`}
          src={previousCameras[0]?.url || cameras[0]?.url}
          alt="Background Previous"
          fill
          className={`object-cover blur-xl scale-110 transition-opacity duration-1000 ease-in-out ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}
          unoptimized
          priority={false}
        />
        {/* Aktueller Hintergrund */}
        <Image
          key={`bg-current-${cameras[0]?.url}`}
          src={cameras[0]?.url || ''}
          alt="Background"
          fill
          className={`object-cover blur-xl scale-110 transition-opacity duration-1000 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
          unoptimized
          priority
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Grid mit Webcams im Original-Seitenverhältnis */}
      <div className="relative w-full h-full p-4 z-10">
        <div className="grid grid-cols-2 grid-rows-2 gap-4 w-full h-full">
          {cameras.slice(0, 4).map((camera, index) => (
            <div key={index} className="rounded-lg overflow-hidden min-h-0 flex flex-col">
              {/* Bild Container */}
              <div className="relative flex-1">
                {/* Vorheriges Bild */}
                <Image
                  key={`prev-${previousCameras[index]?.url}`}
                  src={previousCameras[index]?.url || camera.url}
                  alt={cameraLocations[previousCameras[index]?.locationId]?.name || `Webcam ${index + 1}`}
                  fill
                  className={`object-contain transition-opacity duration-1000 ease-in-out ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}
                  unoptimized
                  priority={false}
                />
                {/* Aktuelles Bild */}
                <Image
                  key={`current-${camera.url}`}
                  src={camera.url}
                  alt={cameraLocations[camera.locationId]?.name || `Webcam ${index + 1}`}
                  fill
                  className={`object-contain transition-opacity duration-1000 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
                  unoptimized
                  priority={index === 0}
                />
              </div>
              {/* Kamera-Name unter dem Bild */}
              <div className="px-2 py-1.5 text-center">
                <p className="text-white text-xs font-medium">
                  {cameraLocations[camera.locationId]?.name || `Webcam ${index + 1}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
