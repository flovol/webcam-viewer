import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import http from 'http';

export const dynamic = 'force-dynamic';

interface IcecastMetadata {
  StreamTitle?: string;
}

function parseMetadata(metadataString: string): IcecastMetadata {
  const metadata: IcecastMetadata = {};
  const regex = /StreamTitle='([^']*)'/;
  const match = metadataString.match(regex);
  
  if (match && match[1]) {
    metadata.StreamTitle = match[1];
  }
  
  return metadata;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return new Promise((resolve) => {
    const { searchParams } = new URL(request.url);
    const streamUrl = searchParams.get('url') || 'https://orf-live.ors-shoutcast.at/oe3-q2a';
    const stationName = searchParams.get('name') || 'Ö3';
    
    // Wähle http oder https basierend auf der URL
    const protocol = streamUrl.startsWith('https') ? https : http;
    
    const options = {
      headers: {
        'Icy-MetaData': '1',
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: 15000 // 15 Sekunden Verbindungs-Timeout
    };

    const timeoutId = setTimeout(() => {
      req.destroy();
      resolve(NextResponse.json({ 
        error: 'Timeout',
        title: `${stationName} Livestream`
      }));
    }, 15000);

    const req = protocol.get(streamUrl, options, (res) => {
      const metaInt = parseInt(res.headers['icy-metaint'] as string || '0');
      
      if (!metaInt) {
        clearTimeout(timeoutId);
        req.destroy();
        resolve(NextResponse.json({ 
          error: 'No metadata available',
          title: `${stationName} Livestream`
        }));
        return;
      }

      let buffer = Buffer.alloc(0);
      let audioDataRead = 0;
      let metadataRead = false;
      let emptyBlocks = 0;
      let filledBlocks = 0;
      const maxEmptyBlocks = 50; // Maximal 50 leere Blöcke
      const maxFilledBlocks = 15; // Maximal 15 gefüllte Blöcke ohne Erfolg

      res.on('data', (chunk: Buffer) => {
        if (metadataRead) {
          clearTimeout(timeoutId);
          req.destroy();
          return;
        }

        buffer = Buffer.concat([buffer, chunk]);

        while (buffer.length > 0 && !metadataRead) {
          const remaining = metaInt - audioDataRead;

          if (buffer.length < remaining) {
            audioDataRead += buffer.length;
            break;
          }

          // Skip audio data
          buffer = buffer.slice(remaining);
          audioDataRead = 0;

          if (buffer.length === 0) break;

          // Read metadata length
          const metadataLength = buffer[0] * 16;
          buffer = buffer.slice(1);

          if (metadataLength === 0) {
            // Leeres Metadaten-Block, weiter zum nächsten
            emptyBlocks++;
            if (emptyBlocks > maxEmptyBlocks) {
              clearTimeout(timeoutId);
              req.destroy();
              resolve(NextResponse.json({ 
                error: 'No metadata found after checking blocks',
                title: `${stationName} Livestream`
              }));
              return;
            }
            continue;
          }

          if (buffer.length < metadataLength) break;

          // Extract metadata
          const metadataBuffer = buffer.slice(0, metadataLength);
          const metadataString = metadataBuffer.toString('utf-8').replace(/\0/g, '');
          const metadata = parseMetadata(metadataString);

          if (metadata.StreamTitle) {
            // Parse artist - title format
            const parts = metadata.StreamTitle.split(' - ');
            const artist = parts.length > 1 ? parts[0].trim() : '';
            const title = parts.length > 1 ? parts.slice(1).join(' - ').trim() : metadata.StreamTitle;

            clearTimeout(timeoutId);
            req.destroy();
            resolve(NextResponse.json({
              artist,
              title,
              fullTitle: metadata.StreamTitle
            }));
            metadataRead = true;
            return;
          }

          // Block hatte Daten aber kein StreamTitle
          filledBlocks++;
          if (filledBlocks > maxFilledBlocks) {
            clearTimeout(timeoutId);
            req.destroy();
            resolve(NextResponse.json({ 
              error: 'No valid metadata found',
              title: `${stationName} Livestream`
            }));
            return;
          }

          buffer = buffer.slice(metadataLength);
        }
      });

      res.on('error', (error) => {
        clearTimeout(timeoutId);
        req.destroy();
        resolve(NextResponse.json({ 
          error: 'Stream error',
          title: `${stationName} Livestream`,
          details: error.message 
        }));
      });

      res.on('end', () => {
        if (!metadataRead) {
          clearTimeout(timeoutId);
          resolve(NextResponse.json({ 
            error: 'Stream ended without metadata',
            title: `${stationName} Livestream`
          }));
        }
      });
    });

    req.on('error', (error) => {
      clearTimeout(timeoutId);
      resolve(NextResponse.json({ 
        error: 'Connection error',
        title: `${stationName} Livestream`,
        details: error.message 
      }));
    });

    req.on('timeout', () => {
      clearTimeout(timeoutId);
      req.destroy();
      resolve(NextResponse.json({ 
        error: 'Request timeout',
        title: `${stationName} Livestream`
      }));
    });
  });
}
