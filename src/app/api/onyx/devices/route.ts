import { NextResponse } from 'next/server';
import { fetchOnyxDevices, isOnyxConfigured, onyxSetupHint, OnyxError } from '@/lib/onyx';

// Gerätezustände dürfen nie aus einem Zwischenspeicher kommen.
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  if (!isOnyxConfigured()) {
    // Kein Fehler: ohne hinterlegte Zugangsdaten blendet die Steuerung den
    // Bereich einfach aus, statt eine Störung zu melden.
    return NextResponse.json(
      { configured: false, hint: onyxSetupHint(), devices: [] },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const devices = await fetchOnyxDevices();

    return NextResponse.json(
      { configured: true, devices },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('ONYX-Geräte nicht abrufbar:', error);
    const status = error instanceof OnyxError ? error.status : 502;
    const message = error instanceof OnyxError ? error.message : 'ONYX nicht erreichbar';

    return NextResponse.json({ configured: true, error: message }, { status });
  }
}
