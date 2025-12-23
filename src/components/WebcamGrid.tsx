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

      {/* Grid mit Webcams */}
      <div className="relative flex-1 p-4 z-10">
        <div className="grid grid-cols-2 grid-rows-2 gap-4 w-full h-full">
          {cameras.slice(0, 4).map((camera, index) => (
            <div key={index} className="relative bg-black/20 rounded-lg overflow-hidden">
              {/* Vorheriges Bild */}
              <Image
                key={`prev-${previousCameras[index]?.url}`}
                src={previousCameras[index]?.url || camera.url}
                alt={cameraLocations[previousCameras[index]?.locationId]?.name || `Webcam ${index + 1}`}
                fill
                className={`object-cover transition-opacity duration-1000 ease-in-out ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}
                unoptimized
                priority={false}
              />
              {/* Aktuelles Bild */}
              <Image
                key={`current-${camera.url}`}
                src={camera.url}
                alt={cameraLocations[camera.locationId]?.name || `Webcam ${index + 1}`}
                fill
                className={`object-cover transition-opacity duration-1000 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
                unoptimized
                priority={index === 0}
              />
              {/* Kamera-Name Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 z-10">
                <p className="text-white text-sm font-semibold">
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
