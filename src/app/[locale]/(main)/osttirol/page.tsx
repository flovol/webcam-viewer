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
import { buildFlightRoute, distanceKm } from "@/lib/geo";

// MapLibre greift auf window zu und darf deshalb nicht serverseitig gerendert werden.
const WebcamFlightMap = dynamic(() => import("@/components/WebcamFlightMap"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#b9cfe4]" />,
});

const cameraLocations: Record<string, { name: string; lat: number; lon: number }> = {
  "stveit": { name: "St. Veit in Defereggen", lat: 46.92766, lon: 12.43572 },
  "stjakob": { name: "St. Jakob im Defereggental", lat: 46.91721, lon: 12.32264 },
  "hopfgarten": { name: "Hopfgarten im Defereggental", lat: 46.90979, lon: 12.47925 },
  "brunnalm-6EUB": { name: "Skizentrum St. Jakob - Mooseralm", lat: 46.89986, lon: 12.35646 },
  "weissspitz": { name: "Skizentrum St. Jakob - Weißspitz", lat: 46.89363, lon: 12.35148 },
  "mooseralm": { name: "Skizentrum St. Jakob - Mooseralm", lat: 46.89278, lon: 12.36699 },
  "lienz": { name: "Lienz / Zettersfeld", lat: 46.86034, lon: 12.80398 },
  "virgen-nord": { name: "Virgen / Würfelehütte", lat: 46.99059, lon: 12.44769 },
  "dolomitenhuette": { name: "Dolomitenhütte", lat: 46.78967, lon: 12.78353 },
  "steigerhof": { name: "Matrei in Osttirol / Steigerhof", lat: 46.99461, lon: 12.54786 },
  "bethuberhof": { name: "Matrei in Osttirol / Bethuberhof", lat: 46.98612, lon: 12.53049 },
  "glocknerwinkel": { name: "Glocknerwinkel", lat: 47.02183, lon: 12.68961 },
  "kalsertal": { name: "Kalsertal", lat: 46.91322, lon: 12.58326 },
  "lucknerhaus": { name: "Lucknerhaus", lat: 47.02099, lon: 12.68796 },
  "virgen-west": { name: "Virgen / Sonnberg", lat: 47.00832, lon: 12.47077 },
  "strumerhof": { name: "Matrei in Osttirol / Strumerhof", lat: 47.01029, lon: 12.51806 },
  "kals-nord": { name: "Kals am Großglockner", lat: 46.98332, lon: 12.62694 },
  "kreuzspitze": { name: "Kreuzspitze / Villgratental", lat: 46.82795, lon: 12.31206 },
  "kals": { name: "Kals am Großglockner", lat: 47.00748, lon: 12.64754 },
  "faschingalm": { name: "Lienz / Zettersfeld", lat: 46.86035, lon: 12.80399 },
  "eispark-osttirol": { name: "Eispark Osttirol", lat: 47.12665, lon: 12.47852 },
  "kartitsch": { name: "Kartitsch", lat: 46.72536, lon: 12.49747 },
  "kartitsch-monte": { name: "Kartitsch Monte", lat: 46.72536, lon: 12.49747 },
  "villgraten": { name: "Villgraten Kalkstein / Alfenalm", lat: 46.80501, lon: 12.31888 },
  "innervillgraten": { name: "Innervillgraten", lat: 46.80784, lon: 12.37209 },
  "ausservillgraten": { name: "Außervillgraten", lat: 46.78649, lon: 12.42906 },
  "sillian": { name: "Sillian", lat: 46.74729, lon: 12.41803 },
  "amlach": { name: "Amlach", lat: 46.81349, lon: 12.76182 },
  "obertilliach-Panorama": { name: "Obertilliach Panorama", lat: 46.71003, lon: 12.61473 },
  "obertilliach-Biathlonzentrum": { name: "Obertilliach Biathlonzentrum", lat: 46.70956, lon: 12.59201 },
  "obertilliach-Golzentipp": { name: "Obertilliach Golzentipp", lat: 46.72385, lon: 12.62345 },
  "kals-Talstation": { name: "Großglockner Resort / Kals Talstation", lat: 47.00591, lon: 12.64048 },
  "kals-Gradonna": { name: "Großglockner Resort / Kals Gradonna", lat: 47.01476, lon: 12.63662 },
  "matrei-AdlerLounge": { name: "Großglockner Resort / Matrei - AdlerLounge", lat: 46.99292, lon: 12.59632 },
  "matrei-Bergstation": { name: "Großglockner Resort / Matrei - Bergstation", lat: 46.99633, lon: 12.56597 },
  "bergstation-Gadein": { name: "Skizentrum Sillian Hochpustertal / Gadein", lat: 46.77179, lon: 12.38875 },
  "bergstation-Ausservillgraten": { name: "Skizentrum Sillian Hochpustertal/ Außervillgraten", lat: 46.77647, lon: 12.39838 },
  "6er-Sesselbahn": { name: "Skizentrum Sillian Hochpustertal / 6er Sesselbahn Berg", lat: 46.77452, lon: 12.38310 },
  "adlersruhe": { name: "Adlersruhe / Blick zum Großglockner", lat: 47.06996, lon: 12.70158 },
  "freiwandeck": { name: "Freiwandeck / Blick zum Großglockner", lat: 47.07820, lon: 12.75640 }
};

const WEBCAM_URLS = [
  { index: 1, url: "https://www.foto-webcam.eu/webcam/stveit/current/1920.jpg", locationId: "stveit" },
  { index: 2, url: "https://www.foto-webcam.eu/webcam/stjakob/current/1920.jpg", locationId: "stjakob" },
  { index: 3, url: "https://www.foto-webcam.eu/webcam/hopfgarten/current/1920.jpg", locationId: "hopfgarten" },
  { index: 4, url: "https://www.megacam.at/webcam/brunnalm-6EUB/current/1200.jpg", locationId: "brunnalm-6EUB" },
  { index: 5, url: "https://www.megacam.at/webcam/weissspitz/current/1200.jpg", locationId: "weissspitz" },
  { index: 6, url: "https://www.megacam.at/webcam/mooseralm/current/1200.jpg", locationId: "mooseralm" },
  { index: 7, url: "https://www.foto-webcam.eu/webcam/lienz/current/1920.jpg", locationId: "lienz" },
  { index: 8, url: "https://www.foto-webcam.eu/webcam/virgen-nord/current/1920.jpg", locationId: "virgen-nord" },
  { index: 9, url: "https://www.foto-webcam.eu/webcam/dolomitenhuette/current/1920.jpg", locationId: "dolomitenhuette" },
  { index: 10, url: "https://www.foto-webcam.eu/webcam/steigerhof/current/1920.jpg", locationId: "steigerhof" },
  { index: 11, url: "https://www.foto-webcam.eu/webcam/bethuberhof/current/1920.jpg", locationId: "bethuberhof" },
  { index: 12, url: "https://www.foto-webcam.eu/webcam/glocknerwinkel/current/1920.jpg", locationId: "glocknerwinkel" },
  { index: 13, url: "https://www.foto-webcam.eu/webcam/kalsertal/current/1920.jpg", locationId: "kalsertal" },
  { index: 14, url: "https://www.foto-webcam.eu/webcam/lucknerhaus/current/1920.jpg", locationId: "lucknerhaus" },
  { index: 15, url: "https://www.foto-webcam.eu/webcam/virgen-west/current/1920.jpg", locationId: "virgen-west" },
  { index: 16, url: "https://www.foto-webcam.eu/webcam/strumerhof/current/1920.jpg", locationId: "strumerhof" },
  { index: 17, url: "https://www.foto-webcam.eu/webcam/kals-nord/current/1920.jpg", locationId: "kals-nord" },
  { index: 18, url: "https://www.foto-webcam.eu/webcam/kreuzspitze/current/1920.jpg", locationId: "kreuzspitze" },
  { index: 19, url: "https://www.foto-webcam.eu/webcam/kals/current/1920.jpg", locationId: "kals" },
  { index: 20, url: "https://www.foto-webcam.eu/webcam/faschingalm/current/1920.jpg", locationId: "faschingalm" },
  { index: 21, url: "https://www.foto-webcam.eu/webcam/eispark-osttirol/current/1920.jpg", locationId: "eispark-osttirol" },
  { index: 22, url: "https://www.megacam.at/webcam/kartitsch/current/1200.jpg", locationId: "kartitsch" },
  { index: 23, url: "https://www.megacam.at/webcam/kartitsch-monte/current/1200.jpg", locationId: "kartitsch-monte" },
  { index: 24, url: "https://www.megacam.at/webcam/villgraten/current/1200.jpg", locationId: "villgraten" },
  { index: 25, url: "https://www.megacam.at/webcam/innervillgraten/current/1200.jpg", locationId: "innervillgraten" },
  { index: 26, url: "https://www.megacam.at/webcam/ausservillgraten/current/1200.jpg", locationId: "ausservillgraten" },
  { index: 27, url: "https://www.megacam.at/webcam/sillian/current/1200.jpg", locationId: "sillian" },
  { index: 28, url: "https://www.megacam.at/webcam/amlach/current/1200.jpg", locationId: "amlach" },
  { index: 29, url: "https://www.megacam.at/webcam/obertilliach-Panorama/current/1200.jpg", locationId: "obertilliach-Panorama" },
  { index: 30, url: "https://www.megacam.at/webcam/obertilliach-Biathlonzentrum/current/1200.jpg", locationId: "obertilliach-Biathlonzentrum" },
  { index: 31, url: "https://www.megacam.at/webcam/obertilliach-Golzentipp/current/1200.jpg", locationId: "obertilliach-Golzentipp" },
  { index: 32, url: "https://www.megacam.at/webcam/kals-Talstation/current/1200.jpg", locationId: "kals-Talstation" },
  { index: 33, url: "https://www.megacam.at/webcam/kals-Gradonna/current/1200.jpg", locationId: "kals-Gradonna" },
  { index: 34, url: "https://www.megacam.at/webcam/matrei-AdlerLounge/current/1200.jpg", locationId: "matrei-AdlerLounge" },
  { index: 35, url: "https://www.megacam.at/webcam/matrei-Bergstation/current/1200.jpg", locationId: "matrei-Bergstation" },
  { index: 36, url: "https://www.megacam.at/webcam/bergstation-Gadein/current/1200.jpg", locationId: "bergstation-Gadein" },
  { index: 37, url: "https://www.megacam.at/webcam/bergstation-Ausservillgraten/current/1200.jpg", locationId: "bergstation-Ausservillgraten" },
  { index: 38, url: "https://www.megacam.at/webcam/6er-Sesselbahn/current/1200.jpg", locationId: "6er-Sesselbahn" },
  { index: 39, url: "https://www.foto-webcam.eu/webcam/adlersruhe/current/1920.jpg", locationId: "adlersruhe" },
  { index: 40, url: "https://www.foto-webcam.eu/webcam/freiwandeck/current/1920.jpg", locationId: "freiwandeck" }
];

const SLIDE_DURATION = 5000; // 5 Sekunden pro Bild

// Flug-Modus: jeder Webcam-Standort wird zu einer Station auf der 3D-Karte.
const FLIGHT_STOPS = WEBCAM_URLS.map((camera) => {
  const location = cameraLocations[camera.locationId];

  return {
    id: camera.locationId,
    name: location?.name || 'Osttirol',
    lat: location?.lat ?? 46.8289,
    lon: location?.lon ?? 12.7692,
  };
});

// Reihenfolge mit kurzen Etappen - Indizes zeigen in WEBCAM_URLS / FLIGHT_STOPS.
const FLIGHT_ROUTE = buildFlightRoute(FLIGHT_STOPS);

// Flugdauer skaliert mit der Distanz, damit kurze Sprünge nicht zäh wirken.
const MIN_FLIGHT_MS = 1800;
const MAX_FLIGHT_MS = 6000;

const RADIO_STATIONS = [
  { id: 'oe3', name: 'Hitradio Ö3', url: 'https://orf-live.ors-shoutcast.at/oe3-q2a' },
  { id: 'fm4', name: 'FM4', url: 'https://orf-live.ors-shoutcast.at/fm4-q2a' },
  { id: 'osttirol', name: 'Radio Osttirol', url: 'https://live.antenne.at/ost' },
  { id: 'life-tirol', name: 'Life Radio Tirol', url: 'http://stream.liferadio.tirol/live/aac-256/SHQ' },
  { id: 'kronehit', name: 'Kronehit', url: 'https://secureonair.krone.at/kronehit.mp3' },
  { id: 'rockantenne', name: 'Rock Antenne', url: 'https://s1-webradio.rockantenne.de/rockantenne/stream/mp3' },
  { id: 'swr3', name: 'SWR3', url: 'https://liveradio.swr.de/sw282p3/swr3/play.mp3' },
  { id: 'antenne-bayern', name: 'Antenne Bayern', url: 'https://stream.antenne.de/antenne' },
];

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
    if (viewMode !== 'slideshow') return;

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
  }, [currentIndex, slideDuration, viewMode]);

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
    if (viewMode !== 'flight' || flightPhase !== 'arrived') return;

    const departure = setTimeout(
      () => setFlight((current) => ({
        step: (current.step + 1) % FLIGHT_ROUTE.length,
        previousStep: current.step,
      })),
      slideDuration
    );

    return () => clearTimeout(departure);
  }, [viewMode, flightPhase, slideDuration]);

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