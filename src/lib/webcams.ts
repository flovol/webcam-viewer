import { buildFlightRoute } from "./geo";

/**
 * Kameras, Standorte und Radiosender.
 *
 * Liegt hier statt in der Seite, weil die Steuerseite /controls dieselben Listen
 * braucht - sonst müssten Kameranamen und Sender doppelt gepflegt werden.
 */

export interface RadioStation {
  id: string;
  name: string;
  url: string;
}

export const cameraLocations: Record<string, { name: string; lat: number; lon: number }> = {
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

export const WEBCAM_URLS = [
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

export const SLIDE_DURATION = 5000; // 5 Sekunden pro Bild

// Flug-Modus: jeder Webcam-Standort wird zu einer Station auf der 3D-Karte.
export const FLIGHT_STOPS = WEBCAM_URLS.map((camera) => {
  const location = cameraLocations[camera.locationId];

  return {
    id: camera.locationId,
    name: location?.name || 'Osttirol',
    lat: location?.lat ?? 46.8289,
    lon: location?.lon ?? 12.7692,
  };
});

// Reihenfolge mit kurzen Etappen - Indizes zeigen in WEBCAM_URLS / FLIGHT_STOPS.
export const FLIGHT_ROUTE = buildFlightRoute(FLIGHT_STOPS);

// Flugdauer skaliert mit der Distanz, damit kurze Sprünge nicht zäh wirken.
export const MIN_FLIGHT_MS = 1800;
export const MAX_FLIGHT_MS = 6000;

export const RADIO_STATIONS = [
  { id: 'oe3', name: 'Hitradio Ö3', url: 'https://orf-live.ors-shoutcast.at/oe3-q2a' },
  { id: 'fm4', name: 'FM4', url: 'https://orf-live.ors-shoutcast.at/fm4-q2a' },
  { id: 'osttirol', name: 'Radio Osttirol', url: 'https://live.antenne.at/ost' },
  { id: 'life-tirol', name: 'Life Radio Tirol', url: 'http://stream.liferadio.tirol/live/aac-256/SHQ' },
  { id: 'kronehit', name: 'Kronehit', url: 'https://secureonair.krone.at/kronehit.mp3' },
  { id: 'rockantenne', name: 'Rock Antenne', url: 'https://s1-webradio.rockantenne.de/rockantenne/stream/mp3' },
  { id: 'swr3', name: 'SWR3', url: 'https://liveradio.swr.de/sw282p3/swr3/play.mp3' },
  { id: 'antenne-bayern', name: 'Antenne Bayern', url: 'https://stream.antenne.de/antenne' },
];
