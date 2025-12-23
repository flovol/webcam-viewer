interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  rain: number;
  snowfall: number;
}

interface WeatherDisplayProps {
  weather: WeatherData | null;
  locationName: string;
  currentTime: Date;
}

export default function WeatherDisplay({ weather, locationName, currentTime }: WeatherDisplayProps) {
  const getWeatherIcon = (code: number) => {
    const hour = currentTime.getHours();
    const isNight = hour < 6 || hour >= 20; // Nacht zwischen 20:00 und 06:00
    
    if (code === 0) return isNight ? "🌙" : "☀️";
    if (code <= 3) return isNight ? "🌙" : "⛅";
    if (code <= 48) return "☁️";
    if (code <= 67) return "🌧️";
    if (code <= 77) return "🌨️";
    if (code <= 82) return "🌧️";
    if (code <= 86) return "🌨️";
    return "🌩️";
  };

  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  return (
    <div className="flex flex-col items-start">
      <div className="text-white text-sm font-semibold mb-1">
        {locationName}
      </div>
      {weather && (
        <div className="flex items-center gap-3 text-white/90">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">{getWeatherIcon(weather.weatherCode)}</span>
            <span className="text-sm font-medium">{weather.temperature}°C</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.5 17c0 1.65-1.35 3-3 3s-3-1.35-3-3h2c0 .55.45 1 1 1s1-.45 1-1-.45-1-1-1H2v-2h9.5c1.65 0 3 1.35 3 3zM19 6.5C19 4.57 17.43 3 15.5 3S12 4.57 12 6.5h2c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S16.33 8 15.5 8H2v2h13.5c1.93 0 3.5-1.57 3.5-3.5zm-.5 4.5H2v2h16.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5v2c1.93 0 3.5-1.57 3.5-3.5S20.43 11 18.5 11z"/>
            </svg>
            <span>{getWindDirection(weather.windDirection)} {weather.windSpeed} km/h</span>
          </div>
          {weather.rain > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <span>🌧️</span>
              <span>{weather.rain.toFixed(1)} mm (24h)</span>
            </div>
          )}
          {weather.snowfall > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <span>❄️</span>
              <span>{weather.snowfall.toFixed(1)} cm (24h)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
