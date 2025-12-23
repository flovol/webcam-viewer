import { RefObject, useState } from "react";

interface RadioStation {
  id: string;
  name: string;
  url: string;
}

interface RadioPlayerProps {
  audioRef: RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  currentSong: { artist: string; title: string };
  volume: number;
  selectedStation: RadioStation;
  stations: RadioStation[];
  onTogglePlay: () => void;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStationChange: (station: RadioStation) => void;
}

export default function RadioPlayer({
  audioRef,
  isPlaying,
  currentSong,
  volume,
  selectedStation,
  stations,
  onTogglePlay,
  onVolumeChange,
  onStationChange,
}: RadioPlayerProps) {
  const [showStationMenu, setShowStationMenu] = useState(false);

  const handleStationChange = (station: RadioStation) => {
    onStationChange(station);
    setShowStationMenu(false);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Play/Pause Button */}
      <button
        onClick={onTogglePlay}
        className="hover:opacity-80 transition-opacity"
      >
        {isPlaying ? (
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Sender-Info mit Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowStationMenu(!showStationMenu)}
          className="flex flex-col items-start hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-1">
            <span className="text-white text-lg font-semibold">{selectedStation.name}</span>
            <svg className={`w-4 h-4 text-white transition-transform ${showStationMenu ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </div>
          {currentSong.artist && (
            <span className="text-white/80 text-sm">
              {currentSong.artist} - {currentSong.title}
            </span>
          )}
          {!currentSong.artist && currentSong.title !== `${selectedStation.name} Livestream` && (
            <span className="text-white/80 text-sm">{currentSong.title}</span>
          )}
        </button>
        
        {/* Dropdown-Menü */}
        {showStationMenu && (
          <div className="absolute bottom-full mb-5 left-0 bg-black/80 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden min-w-[160px] z-50">
            {stations.map((station) => (
              <button
                key={station.id}
                onClick={() => handleStationChange(station)}
                className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors ${
                  selectedStation.id === station.id ? 'bg-white/20 text-white' : 'text-white/80'
                }`}
              >
                <span className="text-sm font-medium">{station.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lautstärkeregler */}
      <div className="flex items-center gap-2 pl-4 border-l border-white/20">
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
        </svg>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={onVolumeChange}
          className="w-24 h-2 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
        />
        <span className="text-white text-sm font-medium min-w-[3ch]">{Math.round(volume * 100)}%</span>
      </div>
    </div>
  );
}
