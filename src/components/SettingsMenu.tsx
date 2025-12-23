import { useState } from "react";

interface SettingsMenuProps {
  slideDuration: number;
  viewMode: string;
  onSlideDurationChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onViewModeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function SettingsMenu({ slideDuration, viewMode, onSlideDurationChange, onViewModeChange }: SettingsMenuProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="absolute bottom-6 left-6 z-30">
      <div className="relative">
        {/* Settings Popup */}
        {showSettings && (
          <div className="absolute bottom-16 left-0 bg-black/80 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden min-w-[280px] shadow-2xl">
            <div className="px-5 py-3 border-b border-white/20">
              <h3 className="text-white font-semibold text-lg">Einstellungen</h3>
            </div>
            <div className="p-4 space-y-3">
              {/* Ansichtsmodus */}
              <div className="flex items-center justify-between">
                <span className="text-white/90 text-sm">Ansichtsmodus</span>
                <select 
                  value={viewMode}
                  onChange={onViewModeChange}
                  className="bg-white/10 text-white text-sm rounded-lg px-3 py-1.5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer [&>option]:bg-gray-900 [&>option]:text-white"
                >
                  <option value="slideshow">Diashow</option>
                  <option value="grid">4 Kacheln</option>
                </select>
              </div>

              {/* Diashow-Geschwindigkeit */}
              <div className="flex items-center justify-between">
                <span className="text-white/90 text-sm">Diashow-Geschwindigkeit</span>
                <select 
                  value={slideDuration / 1000}
                  onChange={onSlideDurationChange}
                  className="bg-white/10 text-white text-sm rounded-lg px-3 py-1.5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer [&>option]:bg-gray-900 [&>option]:text-white"
                >
                  <option value="3">3 Sek.</option>
                  <option value="5">5 Sek.</option>
                  <option value="10">10 Sek.</option>
                  <option value="20">20 Sek.</option>
                  <option value="30">30 Sek.</option>
                </select>
              </div>
              
              {/* Platzhalter für Theme */}
              
            </div>
          </div>
        )}
        
        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300 shadow-lg hover:scale-110"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
