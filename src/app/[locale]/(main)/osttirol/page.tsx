"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Snowfall from "react-snowfall";
import ClockDisplay from "@/components/ClockDisplay";
import WeatherDisplay from "@/components/WeatherDisplay";
import RadioPlayer from "@/components/RadioPlayer";
import SettingsMenu from "@/components/SettingsMenu";
import WebcamSlideshow from "@/components/WebcamSlideshow";
import WebcamGrid from "@/components/WebcamGrid";

const cameraLocations: Record<string, { name: string; lat: number; lon: number }> = {
  "stveit": { name: "St. Veit in Defereggen", lat: 46.9167, lon: 12.3500 },
  "stjakob": { name: "St. Jakob im Defereggental", lat: 46.9333, lon: 12.3667 },
  "hopfgarten": { name: "Hopfgarten im Defereggental", lat: 46.9500, lon: 12.4000 },
  "brunnalm-6EUB": { name: "Skizentrum St. Jakob - Mooseralm", lat: 46.9400, lon: 12.3700 },
  "weissspitz": { name: "Skizentrum St. Jakob - Weißspitz", lat: 46.9450, lon: 12.3650 },
  "mooseralm": { name: "Skizentrum St. Jakob - Mooseralm", lat: 46.9380, lon: 12.3720 },
  "lienz": { name: "Lienz / Zettersfeld", lat: 46.8289, lon: 12.7692 },
  "virgen-nord": { name: "Virgen / Würfelehütte", lat: 47.0000, lon: 12.4667 },
  "dolomitenhuette": { name: "Dolomitenhütte", lat: 46.8833, lon: 12.3833 },
  "steigerhof": { name: "Matrei in Osttirol / Steigerhof", lat: 47.0000, lon: 12.5333 },
  "bethuberhof": { name: "Matrei in Osttirol / Bethuberhof", lat: 47.0050, lon: 12.5300 },
  "glocknerwinkel": { name: "Glocknerwinkel", lat: 47.0667, lon: 12.7000 },
  "kalsertal": { name: "Kalsertal", lat: 47.0333, lon: 12.6833 },
  "lucknerhaus": { name: "Lucknerhaus", lat: 47.0500, lon: 12.7167 },
  "virgen-west": { name: "Virgen / Sonnberg", lat: 47.0100, lon: 12.4600 },
  "strumerhof": { name: "Matrei in Osttirol / Strumerhof", lat: 47.0080, lon: 12.5280 },
  "kals-nord": { name: "Kals am Großglockner", lat: 47.0167, lon: 12.6833 },
  "kreuzspitze": { name: "Kreuzspitze / Villgratental", lat: 46.9000, lon: 12.4500 },
  "kals": { name: "Kals am Großglockner", lat: 47.0167, lon: 12.6833 },
  "faschingalm": { name: "Lienz / Zettersfeld", lat: 46.8300, lon: 12.7700 },
  "eispark-osttirol": { name: "Eispark Osttirol", lat: 46.8300, lon: 12.7650 },
  "kartitsch": { name: "Kartitsch", lat: 46.7167, lon: 12.5167 },
  "kartitsch-monte": { name: "Kartitsch Monte", lat: 46.7200, lon: 12.5200 },
  "villgraten": { name: "Villgraten Kalkstein / Alfenalm", lat: 46.8833, lon: 12.4500 },
  "innervillgraten": { name: "Innervillgraten", lat: 46.9000, lon: 12.4833 },
  "ausservillgraten": { name: "Außervillgraten", lat: 46.8833, lon: 12.4333 },
  "sillian": { name: "Sillian", lat: 46.7500, lon: 12.4167 },
  "amlach": { name: "Amlach", lat: 46.8167, lon: 12.7833 },
  "obertilliach-Panorama": { name: "Obertilliach Panorama", lat: 46.7167, lon: 12.6167 },
  "obertilliach-Biathlonzentrum": { name: "Obertilliach Biathlonzentrum", lat: 46.7150, lon: 12.6150 },
  "obertilliach-Golzentipp": { name: "Obertilliach Golzentipp", lat: 46.7180, lon: 12.6180 },
  "kals-Talstation": { name: "Großglockner Resort / Kals Talstation", lat: 47.0200, lon: 12.6800 },
  "kals-Gradonna": { name: "Großglockner Resort / Kals Gradonna", lat: 47.0220, lon: 12.6820 },
  "matrei-AdlerLounge": { name: "Großglockner Resort / Matrei - AdlerLounge", lat: 47.0100, lon: 12.5400 },
  "matrei-Bergstation": { name: "Großglockner Resort / Matrei - Bergstation", lat: 47.0120, lon: 12.5420 },
  "bergstation-Gadein": { name: "Skizentrum Sillian Hochpustertal / Bergstation Gadein", lat: 46.7550, lon: 12.4200 },
  "bergstation-Ausservillgraten": { name: "Skizentrum Sillian Hochpustertal / Bergstation Außervillgraten", lat: 46.8850, lon: 12.4350 },
  "6er-Sesselbahn": { name: "Skizentrum Sillian Hochpustertal / 6er Sesselbahn Berg", lat: 46.7570, lon: 12.4220 },
  "adlersruhe": { name: "Adlersruhe / Blick zum Großglockner", lat: 47.0833, lon: 12.7167 },
  "freiwandeck": { name: "Freiwandeck / Blick zum Großglockner", lat: 47.0700, lon: 12.7000 }
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

const RADIO_STATIONS = [
  { id: 'oe3', name: 'Hitradio Ö3', url: 'https://orf-live.ors-shoutcast.at/oe3-q2a' },
  { id: 'fm4', name: 'FM4', url: 'https://orf-live.ors-shoutcast.at/fm4-q2a' },
  { id: 'osttirol', name: 'Radio Osttirol', url: 'https://live.antenne.at/ost' },
  { id: 'life-tirol', name: 'Life Radio Tirol', url: 'https://stream.liferadio.at/liferadio-tirol/mp3-128' },
  { id: 'kronehit', name: 'Kronehit', url: 'https://onair.krone.at/kronehit.mp3' },
  { id: 'rockantenne', name: 'Rock Antenne', url: 'https://stream.rockantenne.de/rockantenne' },
  { id: 'swr3', name: 'SWR3', url: 'https://liveradio.swr.de/sw282p3/swr3/play.mp3' },
  { id: 'ultra-split', name: 'Ultra Split', url: 'https://live.ultra-split.com:8443/stream' },
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
  const [viewMode, setViewMode] = useState('slideshow'); // 'slideshow' oder 'grid'
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
    const fetchMetadata = async () => {
      try {
        const response = await fetch('/api/radio-metadata');
        const data = await response.json();
        console.log('📡 API Response:', data);
        
        if (data.artist || (data.title && data.title !== 'Ö3 Livestream')) {
          const newSong = { artist: data.artist || '', title: data.title || 'Ö3 Livestream' };
          setCurrentSong(newSong);
          console.log('🎵 Aktueller Song:', data.artist ? `${data.artist} - ${data.title}` : data.title);
        } else {
          console.log('⚠️ Keine Song-Info verfügbar, behalte letzten Song');
        }
      } catch (error) {
        console.error('Error fetching metadata:', error);
      }
    };

    if (isPlaying) {
      fetchMetadata();
      const interval = setInterval(fetchMetadata, 10000); // Alle 10 Sekunden aktualisieren
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

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
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Blurry Hintergrund über gesamte Seite */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {viewMode === 'slideshow' ? (
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
        <div className="absolute inset-0 bg-black/20" />
        {/* Schneefall im Hintergrund - nur nach 19:00 Uhr */}
        {(currentTime.getHours() >= 19 || currentTime.getHours() < 6) && (
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

      {/* Osttirol Logo - Rechte obere Ecke */}
      <div className="absolute top-4 right-4 z-20 p-1">
        <Image
          src="/logo_osttirol_red.png"
          alt="Osttirol Logo"
          width={120}
          height={120}
          className="drop-shadow-2xl"
          priority
        />
      </div>

      {/* Einstellungen - Linke untere Ecke */}
      <SettingsMenu
        slideDuration={slideDuration}
        viewMode={viewMode}
        onSlideDurationChange={handleSlideDurationChange}
        onViewModeChange={handleViewModeChange}
      />

      {/* Uhr und Datum - Oben */}
      <div className="relative z-10">
        <ClockDisplay currentTime={currentTime} />
      </div>

      {/* Webcam Ansicht - Slideshow oder Grid */}
      <div className="flex-1 relative overflow-hidden">
        {viewMode === 'slideshow' ? (
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
      <div className="relative z-20 pb-6 pt-4">
        <div className="flex justify-center">
          <div className="flex items-center gap-4 px-8 py-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20 transition-all duration-500 ease-in-out">
            {/* Standort und Wetter - nur im Slideshow-Modus */}
            {viewMode === 'slideshow' && (
              <>
                <WeatherDisplay
                  weather={weather}
                  locationName={cameraLocations[WEBCAM_URLS[currentIndex].locationId]?.name || 'Osttirol'}
                  currentTime={currentTime}
                />

                {/* Trennlinie */}
                <div className="h-12 w-px bg-white/20"></div>
              </>
            )}

            {/* Radio Player */}
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
  );
}