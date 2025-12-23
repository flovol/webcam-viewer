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

  return (
    <>
      {/* Webcam Bild - Hauptbild im Original-Seitenverhältnis */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="relative w-[95%] h-[95%]">
          {/* Vorheriges Bild */}
          <Image
            key={`prev-${previousIndex}`}
            src={previousUrl}
            alt={`Webcam Previous`}
            fill
            className={`object-contain rounded-lg transition-opacity duration-1000 ease-in-out ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}
            unoptimized
            priority={false}
          />
          {/* Aktuelles Bild */}
          <Image
            key={currentIndex}
            src={currentUrl}
            alt={`Webcam ${currentIndex + 1}`}
            fill
            className={`object-contain rounded-lg transition-opacity duration-1000 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
            priority
            unoptimized
          />
        </div>
      </div>
    </>
  );
}
