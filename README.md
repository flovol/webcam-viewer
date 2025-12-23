# 🏔️ Osttirol Webcam Viewer

Ein modernes Next.js Dashboard für Live-Webcams aus Osttirol mit integrierten Wetterdaten, Radio-Player und Slideshow-Funktion.

## ✨ Features

- 📷 **40+ Live Webcams** - HD-Webcams aus ganz Osttirol (St. Jakob, Defereggental, Lienz, Matrei, Kals, etc.)
- 🎬 **Slideshow-Modus** - Automatischer Wechsel mit smooth Transitions
- 🖼️ **Grid-Modus** - 4 Webcams gleichzeitig anzeigen
- 🌡️ **Live Wetter** - Aktuelle Wetterdaten von Open-Meteo
- 📻 **Radio Player** - Integrierter Streaming-Player (Ö3, FM4, Radio Osttirol, etc.)
- ❄️ **Schneefall-Effekt** - Visuelle Effekte nach 19:00 Uhr
- 🌍 **Mehrsprachig** - Deutsch, Englisch, Italienisch
- 📱 **Responsive** - Optimiert für alle Bildschirmgrößen
- ⚡ **Next.js 16** - App Router, Server Components
- 🎨 **Tailwind CSS** - Modern und performant
- 🔤 **HK Grotesk Font** - Professionelle Typografie

## 🗺️ Webcam-Standorte

- Defereggental (St. Veit, St. Jakob, Hopfgarten, Brunnalm, Weißspitz)
- Lienz / Zettersfeld
- Matrei in Osttirol
- Kals am Großglockner
- Virgen / Prägraten
- Villgratental
- Sillian / Hochpustertal
- Kartitsch / Obertilliach
- und viele mehr...

## Getting Started

### Installation

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) im Browser.

### Build

```bash
npm run build
```

### Production

```bash
npm run start
```

## 🏗️ Projektstruktur

```
src/
├── app/
│   ├── [locale]/
│   │   └── (main)/
│   │       └── osttirol/
│   │           └── page.tsx      # Hauptseite mit Webcam-Viewer
│   └── api/
│       └── radio-metadata/       # Radio-Metadaten API
├── components/
│   ├── ClockDisplay.tsx          # Digitale Uhr
│   ├── RadioPlayer.tsx           # Radio-Streaming
│   ├── SettingsMenu.tsx          # Einstellungen (Dauer, Grid/Slideshow)
│   ├── WeatherDisplay.tsx        # Wetter-Widget
│   ├── WebcamGrid.tsx            # 4-Kamera Grid-Ansicht
│   └── WebcamSlideshow.tsx       # Slideshow mit Blur-Hintergrund
├── fonts/                        # HK Grotesk Font
├── globals.css
├── i18n.ts
└── routing.ts
```

## ⚙️ Konfiguration

### Webcam-URLs anpassen

Die Webcam-URLs befinden sich in [src/app/[locale]/(main)/osttirol/page.tsx](src/app/[locale]/(main)/osttirol/page.tsx):

```typescript
const WEBCAM_URLS = [
  { index: 1, url: "https://...", locationId: "stveit" },
  // Weitere Webcams hinzufügen...
];
```

### Radio-Sender konfigurieren

```typescript
const RADIO_STATIONS = [
  { id: 'oe3', name: 'Hitradio Ö3', url: 'https://...' },
  // Weitere Sender hinzufügen...
];
```

### Slideshow-Dauer

Standard: 5 Sekunden pro Bild (anpassbar im Settings-Menü)

## 🎨 Features im Detail

### Slideshow-Modus
- Zufällige Bildwechsel mit Crossfade-Transition
- Blurred Background-Effekt
- Smooth Animationen (1000ms)

### Grid-Modus
- 4 Webcams gleichzeitig
- Synchroner Bildwechsel
- Responsive 2x2 Layout

### Wetter-Integration
- Open-Meteo API
- Standortbasierte Daten pro Webcam
- Temperatur, Wind, Niederschlag, Schneefall

### Schneefall-Effekt
- Aktiviert zwischen 19:00 - 06:00 Uhr
- 1000 Schneeflocken
- Läuft im Blur-Hintergrund

## 🌍 Unterstützte Sprachen

- Deutsch (de)
- Englisch (en)
- Italienisch (it)

Übersetzungen befinden sich in `messages/[locale].json`

## 📦 Technologie-Stack

- **Next.js 16** - React Framework
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **next-intl** - Internationalisierung
- **react-snowfall** - Schneefall-Effekt
- **Open-Meteo API** - Wetterdaten

## 📝 License

MIT

## 🤝 Contributing

Pull Requests sind willkommen! Für größere Änderungen bitte zuerst ein Issue öffnen.

---

Made with ❄️ in Osttirol

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## License

MIT
