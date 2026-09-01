import { NextResponse } from 'next/server';

// Die Seite feuerwehr.tirol/aktuelle-alarmierungen/ bindet diese Quelle in einem
// iframe ein. Sie ist öffentlich, ohne Login und ohne robots.txt-Einschränkung.
const SOURCE = 'https://aktuelle-alarmierungen.feuerwehr.tirol/';

// Ohne Referer liefert der Server den Text verwürfelt aus - ein grober Bot-Filter,
// der nur prüft, ob der Header überhaupt vorhanden ist. Wir schicken die Seite,
// in die die Quelle offiziell eingebettet ist.
const EMBEDDING_PAGE = 'https://feuerwehr.tirol/aktuelle-alarmierungen/';

// Osttirol ist der einzige Tiroler Bezirk mit 99xx-Postleitzahlen; ein Teil der
// Einträge trägt statt Ort und PLZ nur den Bezirksnamen.
const OSTTIROL_POSTAL = /^99\d{2}\b/;
const OSTTIROL_DISTRICT = /Bezirk\s+Lienz/i;

// Einmal pro Minute reicht - der Feed führt nur Tagesdatum, keine Uhrzeit.
const REVALIDATE_SECONDS = 60;

export interface Alarm {
  /** Einsatzart, z.B. "Brandmeldealarm" */
  type: string;
  /** Rohtext des Orts, z.B. "9971 Matrei in Osttirol" oder "Bezirk Lienz" */
  location: string;
  postalCode: string | null;
  place: string;
  brigade: string;
  date: string;
}

function stripTags(value: string): string {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&auml;/g, 'ä')
    .replace(/&ouml;/g, 'ö')
    .replace(/&uuml;/g, 'ü')
    .replace(/&Auml;/g, 'Ä')
    .replace(/&Ouml;/g, 'Ö')
    .replace(/&Uuml;/g, 'Ü')
    .replace(/&szlig;/g, 'ß')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseAlarms(page: string): Alarm[] {
  const alarms: Alarm[] = [];

  for (const block of page.split("<div class='row event'>").slice(1)) {
    const fields = [...block.matchAll(/<div class='[^']*'>([\s\S]*?)<\/div>/g)].map((match) =>
      stripTags(match[1])
    );

    if (fields.length < 4) continue;

    const [type, location, brigade, date] = fields;
    const postal = location.match(/^(\d{4})\s+(.*)$/);

    alarms.push({
      type,
      location,
      postalCode: postal ? postal[1] : null,
      place: postal ? postal[2] : location,
      brigade,
      date,
    });
  }

  return alarms;
}

function isOsttirol(alarm: Alarm): boolean {
  return OSTTIROL_POSTAL.test(alarm.location) || OSTTIROL_DISTRICT.test(alarm.location);
}

export async function GET(): Promise<NextResponse> {
  try {
    const response = await fetch(SOURCE, {
      headers: {
        Referer: EMBEDDING_PAGE,
        'User-Agent': 'osttirol-webcam-viewer/1.0 (Anzeigetafel, 1 Abruf pro Minute)',
        'Accept-Language': 'de-AT,de;q=0.9',
      },
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Quelle nicht erreichbar', status: response.status, alarms: [] },
        { status: 502 }
      );
    }

    const all = parseAlarms(await response.text());
    const alarms = all.filter(isOsttirol);

    return NextResponse.json(
      { fetchedAt: new Date().toISOString(), total: all.length, alarms },
      { headers: { 'Cache-Control': `public, s-maxage=${REVALIDATE_SECONDS}` } }
    );
  } catch (error) {
    console.error('Alarmierungen konnten nicht geladen werden:', error);
    return NextResponse.json({ error: 'Abruf fehlgeschlagen', alarms: [] }, { status: 502 });
  }
}
