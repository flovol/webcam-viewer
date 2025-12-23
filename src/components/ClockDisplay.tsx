interface ClockDisplayProps {
  currentTime: Date;
}

export default function ClockDisplay({ currentTime }: ClockDisplayProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("de-DE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="relative z-10 text-center pt-8">
      <div className="text-white text-6xl font-bold tracking-wide drop-shadow-2xl">
        {formatTime(currentTime)}
      </div>
      <div className="text-white text-xl font-medium mt-2 drop-shadow-lg">
        {formatDate(currentTime)}
      </div>
    </div>
  );
}
