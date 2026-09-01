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

### Jalousien & Licht (ONYX)

Das Admin-Cockpit unter `/controls` steuert zusätzlich die Beschattung und die Lampen einer
ONYX-Anlage von HELLA ([API-Doku](https://github.com/hella-info/onyx_api)). Ohne hinterlegte
Zugangsdaten blendet der Bereich nur einen Hinweis ein, der Rest der Steuerung läuft normal weiter.

**Zugangsdaten holen:** In der ONYX-App unter _Einstellungen/Zugriffsverwaltung_ einen temporären
Code erzeugen (15 Minuten gültig) und gegen Fingerabdruck und Token tauschen:

```bash
curl -X POST https://api.hella.link/authorize \
  -H "Content-Type: application/json" \
  -d '{"code": "H99xV2yT"}'
```

Das Token wird erst dauerhaft, wenn damit innerhalb von 15 Minuten mindestens ein Aufruf erfolgt -
also einmal `/controls` öffnen.

**Umgebungsvariablen:** Entweder gebündelt in `ONYX` oder einzeln. Einzelne Variablen haben Vorrang.

| Variable | Bedeutung |
| --- | --- |
| `ONYX` | Antwort von `/authorize` als JSON, `fingerabdruck:token` oder nur das Token |
| `ONYX_TOKEN` | API-Token der Anlage |
| `ONYX_FINGERPRINT` | Fingerabdruck der ONYX.CENTER, für den Weg über `api.hella.link` |
| `ONYX_HOST` | mDNS-Hostname der ONYX.CENTER für lokalen Zugriff, z.B. `ONYX-CENTER-C0-00-01-5e.local` |
| `ONYX_API_VERSION` | Standard `v5`, ältere Anlagen brauchen `v3` oder `v1` |

Ein Token allein reicht nicht - dazu muss entweder der Fingerabdruck oder der Hostname bekannt sein.
Der lokale Weg hat Vorrang, funktioniert aber nur im selben Netz und dessen TLS-Zertifikat lässt
sich nicht regulär prüfen; auf Vercel ist deshalb `api.hella.link` der richtige Weg.

**Was die Steuerung kann:** Auf/Stopp/Zu und Position je Beschattung, bei Raffstores zusätzlich der
Lamellenwinkel, Lampen an/aus und Helligkeit bei dimmbaren. Sammelbefehle gelten für alle gefundenen
Geräte. Welche Geräte auftauchen, entscheiden ihre Eigenschaften und nicht ihr Typ: alles mit
`target_position` gilt als Beschattung, alles mit `target_brightness` als Licht - Sensoren, Taster
und Wetterstation fallen von selbst heraus.

**Haltedauer:** Befehle über die API haben die Priorität "interactive" und übersteuern Zeit- und
Sonnenautomatik, bis sie ablaufen - standardmäßig nach 15 Minuten. Über die Auswahl im Cockpit
lässt sich das bis 24 Stunden strecken (die Route rechnet daraus `best_before` und begrenzt auf
sieben Tage). Was abläuft, ist nur die Sperre gegen die Automatik; die eingestellte Position bleibt
stehen. "Automatik übernehmen lassen" an jeder Kachel nimmt den Befehl vorzeitig zurück. Wind-,
Regen- und Hagelschutz haben in jedem Fall Vorrang.

> **Achtung:** Über `/api/onyx` fahren echte Jalousien. Die Routen unter `/api` liegen deshalb
> seit dieser Erweiterung mit hinter dem Passwortschutz aus [src/proxy.ts](src/proxy.ts) - der
> greift aber nur, wenn `BASE_AUTH_USER` und `BASE_AUTH_PASS` gesetzt sind. Ohne diese Variablen
> ist alles offen, auch die Steuerbefehle. In der Produktion gehören sie gesetzt.

### Passwortschutz

[src/proxy.ts](src/proxy.ts) legt HTTP Basic Auth vor die gesamte Anwendung, sobald
`BASE_AUTH_USER` und `BASE_AUTH_PASS` gesetzt sind - Seiten wie Routen unter `/api`. Fehlt eines
der beiden, bleibt der Schutz aus; anders wäre lokale Entwicklung mühsam. Die Aufrufe aus der
Oberfläche brauchen nichts weiter: der Browser hängt die einmal eingegebenen Zugangsdaten von
selbst an jede Anfrage an dieselbe Herkunft an.

Die Namen lauten `BASE_AUTH_*` statt des fachlich richtigen `BASIC_AUTH_*`, weil sie auf Vercel so
angelegt wurden und sich dort nicht mehr umbenennen lassen.

Der Passwortschutz allein genügt für Schreibrouten nicht: Basic Auth hängt der Browser von sich aus
auch an Anfragen an, die eine fremde Seite im Hintergrund abschickt (CSRF). `POST` und `DELETE` auf
`/api/controls` und `/api/onyx` prüfen deshalb zusätzlich `Sec-Fetch-Site` und `Origin` und
verlangen `Content-Type: application/json` - siehe [src/lib/requestGuard.ts](src/lib/requestGuard.ts).

> **Beim lokalen Entwickeln:** `next dev` horcht auf allen Netzwerkschnittstellen, und ohne gesetzte
> `BASE_AUTH_*` ist die Steuerung damit für jeden im selben Netz offen - samt Jalousien. Wer das
> nicht will, setzt die Variablen auch lokal oder startet mit `next dev -H 127.0.0.1`.

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
