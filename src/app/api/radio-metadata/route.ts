import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

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

export async function GET(request: NextRequest) {
  return new Promise((resolve) => {
    const streamUrl = 'https://orf-live.ors-shoutcast.at/oe3-q2a';
    
    const options = {
      headers: {
        'Icy-MetaData': '1',
        'User-Agent': 'Mozilla/5.0'
      }
    };

    const req = https.get(streamUrl, options, (res) => {
      const metaInt = parseInt(res.headers['icy-metaint'] as string || '0');
      
      if (!metaInt) {
        resolve(NextResponse.json({ 
          error: 'No metadata available',
          title: 'Ö3 Livestream'
        }));
        return;
      }

      let buffer = Buffer.alloc(0);
      let audioDataRead = 0;
      let metadataRead = false;

      res.on('data', (chunk: Buffer) => {
        if (metadataRead) {
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

          if (metadataLength === 0) continue;

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

            resolve(NextResponse.json({
              artist,
              title,
              fullTitle: metadata.StreamTitle
            }));
            metadataRead = true;
          }

          buffer = buffer.slice(metadataLength);
        }
      });

      res.on('error', (error) => {
        resolve(NextResponse.json({ 
          error: 'Stream error',
          title: 'Ö3 Livestream',
          details: error.message 
        }));
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!metadataRead) {
          req.destroy();
          resolve(NextResponse.json({ 
            error: 'Timeout',
            title: 'Ö3 Livestream'
          }));
        }
      }, 5000);
    });

    req.on('error', (error) => {
      resolve(NextResponse.json({ 
        error: 'Connection error',
        title: 'Ö3 Livestream',
        details: error.message 
      }));
    });
  });
}
