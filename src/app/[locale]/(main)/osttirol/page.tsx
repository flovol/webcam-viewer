"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Snowfall from "react-snowfall";
import ClockDisplay from "@/components/ClockDisplay";
import WeatherDisplay from "@/components/WeatherDisplay";
import RadioPlayer from "@/components/RadioPlayer";
import SettingsMenu from "@/components/SettingsMenu";
import WebcamSlideshow from "@/components/WebcamSlideshow";
import WebcamGrid from "@/components/WebcamGrid";
import WebcamFlightCard from "@/components/WebcamFlightCard";
import AlarmWatcher from "@/components/AlarmWatcher";
import MessageWatcher from "@/components/MessageWatcher";
import { useRemoteControl } from "@/hooks/useRemoteControl";
import { triggerAlarmDemo } from "@/lib/alarmDemo";
import { messageEmoji, triggerMessage } from "@/lib/messages";
import { buildFlightRoute, distanceKm } from "@/lib/geo";

// MapLibre greift auf window zu und darf deshalb nicht serverseitig gerendert werden.
const WebcamFlightMap = dynamic(() => import("@/components/WebcamFlightMap"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#b9cfe4]" />,
});

import {
  cameraLocations,
  WEBCAM_URLS,
  FLIGHT_STOPS,
  FLIGHT_ROUTE,
  MIN_FLIGHT_MS,
  MAX_FLIGHT_MS,
  RADIO_STATIONS,
} from "@/lib/webcams";

interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  rain: number;
  snowfall: number;
}

export default function OsttirolPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState({ artist: '', title: 'Ö3 Livestream' });
  const [volume, setVolume] = useState(0.7);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [selectedStation, setSelectedStation] = useState(RADIO_STATIONS[0]);
  const [slideDuration, setSlideDuration] = useState(5000); // 5 Sekunden Standard
  const [viewMode, setViewMode] = useState('slideshow'); // 'slideshow', 'grid' oder 'flight'
  // Position in FLIGHT_ROUTE; previousStep = -1 heißt "noch kein Flug geflogen".
  const [flight, setFlight] = useState({ step: 0, previousStep: -1 });
  const [flightPhase, setFlightPhase] = useState<'flying' | 'arrived'>('arrived');
  // Von /controls aus schaltbar - hält Diashow und Flug an.
  const [paused, setPaused] = useState(false);
  const [gridCameras, setGridCameras] = useState(() => {
    // Wähle zufällig 4 Kameras für den Grid-Modus
    const shuffled = [...WEBCAM_URLS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  });
  const [previousGridCameras, setPreviousGridCameras] = useState(() => {
    const shuffled = [...WEBCAM_URLS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  });
  const audioRef = useRef<HTMLAudioElement>(null);

  // Diashow - rotiere zufällig durch die Bilder (nur im Slideshow-Modus)
  useEffect(() => {
    if (viewMode !== 'slideshow' || paused) return;

    const interval = setInterval(() => {
      setPreviousIndex(currentIndex);
      setIsTransitioning(true);
      
      setTimeout(() => {
        setCurrentIndex(() => {
          let newIndex;
          do {
            newIndex = Math.floor(Math.random() * WEBCAM_URLS.length);
          } while (newIndex === currentIndex && WEBCAM_URLS.length > 1);
          return newIndex;
        });
        
        setTimeout(() => setIsTransitioning(false), 50);
      }, 50);
    }, slideDuration);

    return () => clearInterval(interval);
  }, [currentIndex, slideDuration, viewMode, paused]);

  // Grid-Diashow - wechsle alle 4 Kameras gleichzeitig mit smooth transition
  useEffect(() => {
    if (viewMode !== 'grid') return;

    const interval = setInterval(() => {
      setPreviousGridCameras(gridCameras);
      setIsTransitioning(true);
      
      setTimeout(() => {
        const shuffled = [...WEBCAM_URLS].sort(() => Math.random() - 0.5);
        setGridCameras(shuffled.slice(0, 4));
        
        setTimeout(() => setIsTransitioning(false), 50);
      }, 50);
    }, slideDuration);

    return () => clearInterval(interval);
  }, [viewMode, slideDuration, gridCameras]);

  const flightTarget = FLIGHT_STOPS[FLIGHT_ROUTE[flight.step]];
  const flightOrigin =
    flight.previousStep >= 0 ? FLIGHT_STOPS[FLIGHT_ROUTE[flight.previousStep]] : null;

  const flightDuration = useMemo(() => {
    if (!flightOrigin) return 0;

    const spanned = distanceKm(flightOrigin, flightTarget);
    return Math.min(MAX_FLIGHT_MS, Math.max(MIN_FLIGHT_MS, 1400 + spanned * 130));
  }, [flightOrigin, flightTarget]);

  // Flug-Modus: Losfliegen. Wann die Kamera ankommt, meldet die Karte selbst -
  // ein großer Kurswechsel dehnt den Flug über flightDuration hinaus.
  useEffect(() => {
    if (viewMode !== 'flight') return;

    setFlightPhase('flying');
  }, [viewMode, flight]);

  const handleFlightEnd = useCallback(() => setFlightPhase('arrived'), []);

  // Nach der Landung stehenbleiben, dann zur nächsten Station.
  useEffect(() => {
    if (viewMode !== 'flight' || flightPhase !== 'arrived' || paused) return;

    const departure = setTimeout(
      () => setFlight((current) => ({
        step: (current.step + 1) % FLIGHT_ROUTE.length,
        previousStep: current.step,
      })),
      slideDuration
    );

    return () => clearTimeout(departure);
  }, [viewMode, flightPhase, slideDuration, paused]);

  // Wetter und Standortname hängen an currentIndex - im Flug mitziehen.
  useEffect(() => {
    if (viewMode !== 'flight') return;

    setCurrentIndex(FLIGHT_ROUTE[flight.step]);
  }, [viewMode, flight.step]);

  // Uhr aktualisieren
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch weather data
  useEffect(() => {
    const fetchWeather = async () => {
      const currentWebcam = WEBCAM_URLS[currentIndex];
      const location = cameraLocations[currentWebcam.locationId];
      
      if (!location) return;

      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m&daily=rain_sum,snowfall_sum&timezone=Europe/Vienna`
        );
        const data = await response.json();
        
        if (data.current && data.daily) {
          setWeather({
            temperature: Math.round(data.current.temperature_2m),
            weatherCode: data.current.weather_code,
            windSpeed: Math.round(data.current.wind_speed_10m),
            windDirection: data.current.wind_direction_10m,
            rain: data.daily.rain_sum?.[0] || 0,
            snowfall: data.daily.snowfall_sum?.[0] || 0
          });
        }
      } catch (error) {
        console.error('Error fetching weather:', error);
      }
    };

    fetchWeather();
  }, [currentIndex]);

  // Fetch radio metadata
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 2;

    const fetchMetadata = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 15 Sekunden Client-Timeout

        const response = await fetch(
          `/api/radio-metadata?url=${encodeURIComponent(selectedStation.url)}&name=${encodeURIComponent(selectedStation.name)}`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        
        const data = await response.json();
        console.log('📡 API Response:', data);
        
        if (data.artist || (data.title && data.title !== `${selectedStation.name} Livestream`)) {
          const newSong = { artist: data.artist || '', title: data.title || `${selectedStation.name} Livestream` };
          setCurrentSong(newSong);
          console.log('🎵 Aktueller Song:', data.artist ? `${data.artist} - ${data.title}` : data.title);
          retryCount = 0; // Reset retry count bei Erfolg
        } else if (!data.error) {
          console.log('⚠️ Keine Song-Info verfügbar, behalte letzten Song');
        } else if (retryCount < maxRetries) {
          retryCount++;
          console.log(`🔄 Retry ${retryCount}/${maxRetries} wegen Fehler: ${data.error}`);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.error('⏱️ Metadata-Abruf abgebrochen (Timeout)');
        } else {
          console.error('❌ Error fetching metadata:', error);
        }
        if (retryCount < maxRetries) {
          retryCount++;
        }
      }
    };

    if (isPlaying) {
      fetchMetadata();
      const interval = setInterval(fetchMetadata, 15000); // Alle 15 Sekunden
      return () => clearInterval(interval);
    }
  }, [isPlaying, selectedStation]);

  // Aktueller Index für die Sprungbefehle, ohne die Callbacks neu zu binden.
  const currentIndexRef = useRef(currentIndex);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Springt zu einer Kamera. Im Flug-Modus muss zusätzlich die Route
  // nachgezogen werden, sonst fliegt die Karte weiter zur alten Station.
  const jumpToCamera = useCallback((index: number) => {
    if (index < 0 || index >= WEBCAM_URLS.length) return;

    setPreviousIndex(currentIndexRef.current);
    setCurrentIndex(index);

    const step = FLIGHT_ROUTE.indexOf(index);
    if (step >= 0) {
      setFlight((current) => ({ step, previousStep: current.step }));
    }
  }, []);

  const stepCamera = useCallback((direction: 1 | -1) => {
    const current = currentIndexRef.current;
    const next = (current + direction + WEBCAM_URLS.length) % WEBCAM_URLS.length;

    setPreviousIndex(current);
    setCurrentIndex(next);

    const step = FLIGHT_ROUTE.indexOf(next);
    if (step >= 0) setFlight((flightNow) => ({ step, previousStep: flightNow.step }));
  }, []);

  // Fernsteuerung von /controls
  useRemoteControl({
    onViewMode: (mode) => setViewMode(mode),
    onSlideDuration: (durationMs) => setSlideDuration(durationMs),
    onPaused: (value) => setPaused(value),
    onJump: jumpToCamera,
    onStep: stepCamera,
    onAlarmDemo: triggerAlarmDemo,
    onMessage: (text) => triggerMessage({ text, emoji: messageEmoji(text) }),
    onRadio: ({ stationId, playing, volume }) => {
      const station = RADIO_STATIONS.find((entry) => entry.id === stationId);
      if (station && station.id !== selectedStation.id) {
        setSelectedStation(station);
        setCurrentSong({ artist: '', title: `${station.name} Livestream` });
      }

      setVolume(volume);
      if (audioRef.current) audioRef.current.volume = volume;

      if (playing !== isPlaying) {
        setIsPlaying(playing);
        if (playing) void audioRef.current?.play();
        else audioRef.current?.pause();
      }
    },
  });

  // Radio Player Toggle
  const toggleRadio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Sender wechseln
  const changeStation = (station: typeof RADIO_STATIONS[0]) => {
    const wasPlaying = isPlaying;
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
    }
    
    setSelectedStation(station);
    setCurrentSong({ artist: '', title: `${station.name} Livestream` });
    
    if (wasPlaying && audioRef.current) {
      setTimeout(() => {
        audioRef.current?.play();
      }, 100);
    }
  };

  // Lautstärke ändern
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleSlideDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSlideDuration(parseInt(e.target.value) * 1000);
  };

  const handleViewModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMode = e.target.value;
    setViewMode(newMode);
    
    // Wenn auf Grid gewechselt wird, wähle neue zufällige Kameras
    if (newMode === 'grid') {
      const shuffled = [...WEBCAM_URLS].sort(() => Math.random() - 0.5);
      setGridCameras(shuffled.slice(0, 4));
    }

    // Flug startet an einer zufälligen Station, damit nicht jede Sitzung gleich aussieht.
    if (newMode === 'flight') {
      setFlight({ step: Math.floor(Math.random() * FLIGHT_ROUTE.length), previousStep: -1 });
      setFlightPhase('arrived');
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Blurry Hintergrund über gesamte Seite */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {viewMode === 'flight' ? (
          <WebcamFlightMap
            stops={FLIGHT_STOPS}
            target={flightTarget}
            origin={flightOrigin}
            flightDuration={flightDuration}
            onFlightEnd={handleFlightEnd}
          />
        ) : viewMode === 'slideshow' ? (
          <>
            {/* Vorheriges Bild */}
            <Image
              key={`bg-prev-${previousIndex}`}
              src={WEBCAM_URLS[previousIndex].url}
              alt="Background Previous"
              fill
              className={`object-cover blur-xl scale-110 transition-opacity duration-1000 ease-in-out ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}
              unoptimized
              priority={false}
            />
            {/* Aktuelles Bild */}
            <Image
              key={`bg-${currentIndex}`}
              src={WEBCAM_URLS[currentIndex].url}
              alt="Background"
              fill
              className={`object-cover blur-xl scale-110 transition-opacity duration-1000 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
              unoptimized
              priority
            />
          </>
        ) : (
          <>
            {/* Vorheriger Hintergrund */}
            <Image
              key={`bg-grid-prev-${previousGridCameras[0]?.url}`}
              src={previousGridCameras[0]?.url || gridCameras[0]?.url}
              alt="Background Previous"
              fill
              className={`object-cover blur-xl scale-110 transition-opacity duration-1000 ease-in-out ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}
              unoptimized
              priority={false}
            />
            {/* Aktueller Hintergrund */}
            <Image
              key={`bg-grid-${gridCameras[0]?.url}`}
              src={gridCameras[0]?.url || ''}
              alt="Background"
              fill
              className={`object-cover blur-xl scale-110 transition-opacity duration-1000 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
              unoptimized
              priority
            />
          </>
        )}
        {viewMode !== 'flight' && <div className="absolute inset-0 bg-black/20" />}
        {/* Schneefall im Hintergrund - nur nach 19:00 Uhr */}
        {(currentTime.getHours() >= 17 || currentTime.getHours() < 6) && (
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

      {/* Audio Element für Radio */}
      <audio ref={audioRef} src={selectedStation.url} preload="none" />

      {/* Osttirol Logo - Rechte obere Ecke 
      <div className="absolute top-1 md:top-1 right-1 md:right-1 p-1">
        <Image
          src="/logo_osttirol_red.png"
          alt="Osttirol Logo"
          width={120}
          height={120}
          className="w-16 h-16 md:w-[120px] md:h-[120px] drop-shadow-2xl object-contain"
          priority
        />
      </div>*/}

      {/* Uhr und Datum - Oben */}
      <div className="relative z-10">
        <ClockDisplay currentTime={currentTime} />
      </div>

      {/* Meldet sich nur, wenn ein Einsatz dazukommt */}
      <AlarmWatcher />

      {/* Kurznachrichten aus dem Cockpit */}
      <MessageWatcher />

      {/* Webcam Ansicht - Slideshow oder Grid */}
      <div className="flex-1 relative overflow-hidden">
        {viewMode === 'flight' ? (
          <WebcamFlightCard
            url={WEBCAM_URLS[currentIndex].url}
            locationName={cameraLocations[WEBCAM_URLS[currentIndex].locationId]?.name || 'Osttirol'}
            visible={flightPhase === 'arrived'}
          />
        ) : viewMode === 'slideshow' ? (
          <WebcamSlideshow
            currentUrl={WEBCAM_URLS[currentIndex].url}
            previousUrl={WEBCAM_URLS[previousIndex].url}
            currentIndex={currentIndex}
            previousIndex={previousIndex}
            isTransitioning={isTransitioning}
          />
        ) : (
          <WebcamGrid
            cameras={gridCameras}
            previousCameras={previousGridCameras}
            cameraLocations={cameraLocations}
            isTransitioning={isTransitioning}
          />
        )}
      </div>

      {/* Radio Player Controls - Unten Mittig */}
      <div className="relative z-20 pb-4 md:pb-6 pt-2 md:pt-4 px-2 md:px-0">
        <div className="flex justify-center">
          {/* Media Bar */}
          <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 px-4 md:px-8 py-3 md:py-4 bg-white/10 backdrop-blur-md rounded-2xl md:rounded-full border border-white/20 transition-all duration-500 ease-in-out w-full md:w-auto max-w-[95%] md:max-w-none">
            {/* Erste Zeile Mobile: Settings + Wetter */}
            <div className="flex flex-row items-center gap-3 md:gap-4 w-full md:w-auto">
              {/* Settings Icon */}
              <div className="w-auto md:w-[48px] flex justify-center">
                <SettingsMenu
                  slideDuration={slideDuration}
                  viewMode={viewMode}
                  onSlideDurationChange={handleSlideDurationChange}
                  onViewModeChange={handleViewModeChange}
                />
              </div>

              {/* Trennlinie nach Settings */}
              <div className="h-10 md:h-12 w-px bg-white/20 flex-shrink-0"></div>

              {/* Wetter - im Slideshow- und Flug-Modus */}
              {viewMode !== 'grid' && (
                <>
                  <div className="flex-1 md:w-[280px] md:flex-none">
                    <WeatherDisplay
                      weather={weather}
                      locationName={cameraLocations[WEBCAM_URLS[currentIndex].locationId]?.name || 'Osttirol'}
                      currentTime={currentTime}
                    />
                  </div>

                  {/* Trennlinie nach Wetter - nur Desktop */}
                  <div className="hidden md:block h-12 w-px bg-white/20 flex-shrink-0"></div>
                </>
              )}
            </div>

            {/* Trennlinie horizontal - nur Mobile zwischen Zeilen */}
            <div className="md:hidden h-px w-full bg-white/20"></div>

            {/* Radio Player */}
            <div className="w-full md:w-[400px]">
              <RadioPlayer
                audioRef={audioRef}
                isPlaying={isPlaying}
                currentSong={currentSong}
                volume={volume}
                selectedStation={selectedStation}
                stations={RADIO_STATIONS}
                onTogglePlay={toggleRadio}
                onVolumeChange={handleVolumeChange}
                onStationChange={changeStation}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}