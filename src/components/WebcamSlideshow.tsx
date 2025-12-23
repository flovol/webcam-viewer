import Image from "next/image";
import Snowfall from "react-snowfall";
import { useEffect, useState } from "react";

interface WebcamSlideshowProps {
  currentUrl: string;
  previousUrl: string;
  currentIndex: number;
  previousIndex: number;
  isTransitioning: boolean;
}

export default function WebcamSlideshow({
  currentUrl,
  previousUrl,
  currentIndex,
  previousIndex,
  isTransitioning,
}: WebcamSlideshowProps) {
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000); // Aktualisiere jede Minute

    return () => clearInterval(interval);
  }, []);

  const showSnowfall = currentHour >= 19 || currentHour < 6;

  return (
    <>
      {/* Blurry Hintergrund */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Vorheriges Bild */}
        <Image
          key={`bg-prev-${previousIndex}`}
          src={previousUrl}
          alt="Background Previous"
          fill
          className={`object-cover blur-xl scale-110 transition-opacity duration-1000 ease-in-out ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}
          unoptimized
          priority={false}
        />
        {/* Aktuelles Bild */}
        <Image
          key={`bg-${currentIndex}`}
          src={currentUrl}
          alt="Background"
          fill
          className={`object-cover blur-xl scale-110 transition-opacity duration-1000 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
          unoptimized
          priority
        />
        <div className="absolute inset-0 bg-black/20" />
        {/* Schneefall im Hintergrund - nur nach 19:00 Uhr */}
        {showSnowfall && (
          <Snowfall
            color="#fff"
            snowflakeCount={1000}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
            }}
          />
        )}
      </div>

      {/* Webcam Bild - Hauptbild */}
      <div className="relative flex-1 p-4">
        <div className="relative w-full h-full">
          {/* Vorheriges Bild */}
          <Image
            key={`prev-${previousIndex}`}
            src={previousUrl}
            alt={`Webcam Previous`}
            fill
            className={`object-contain transition-opacity duration-1000 ease-in-out ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}
            unoptimized
            priority={false}
          />
          {/* Aktuelles Bild */}
          <Image
            key={currentIndex}
            src={currentUrl}
            alt={`Webcam ${currentIndex + 1}`}
            fill
            className={`object-contain transition-opacity duration-1000 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
            priority
            unoptimized
          />
        </div>
      </div>
    </>
  );
}
