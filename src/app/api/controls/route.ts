import { NextRequest, NextResponse } from 'next/server';
import {
  isSharedStoreConfigured,
  readControlState,
  writeControlState,
  type ControlState,
} from '@/lib/controlState';

// Befehle dürfen nie aus einem Zwischenspeicher kommen.
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const state = await readControlState();

    return NextResponse.json(
      { state, shared: isSharedStoreConfigured() },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Steuerzustand nicht lesbar:', error);
    return NextResponse.json({ error: 'Zustand nicht lesbar' }, { status: 502 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const patch = (await request.json()) as Partial<ControlState>;
    const state = await writeControlState(patch);

    return NextResponse.json(
      { state, shared: isSharedStoreConfigured() },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Steuerbefehl nicht verarbeitbar:', error);
    return NextResponse.json({ error: 'Befehl nicht verarbeitbar' }, { status: 400 });
  }
}
