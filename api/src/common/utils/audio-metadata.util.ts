import { BadRequestException } from '@nestjs/common';
import * as path from 'path';

export interface ParsedAudioMetadata {
  durationSeconds: number;
  mimeType: string;
  sizeBytes: number;
  format: 'mp3' | 'm4a' | 'ogg' | 'wav';
}

/**
 * Validates audio format (MP3, M4A, OGG, WAV up to 50MB) and extracts audio duration and metadata.
 */
export function extractAudioMetadata(buffer: Buffer, originalFilename: string = ''): ParsedAudioMetadata {
  const ext = (path.extname(originalFilename) || '').toLowerCase();
  const sizeBytes = buffer.length;

  if (sizeBytes > 50 * 1024 * 1024) {
    throw new BadRequestException(
      `Audio file size (${(sizeBytes / (1024 * 1024)).toFixed(2)} MB) exceeds 50 MB maximum limit`,
    );
  }

  // Detect format by magic bytes or extension
  let format: 'mp3' | 'm4a' | 'ogg' | 'wav' | null = null;
  let mimeType = 'audio/mpeg';

  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WAVE') {
    format = 'wav';
    mimeType = 'audio/wav';
  } else if (buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === 'OggS') {
    format = 'ogg';
    mimeType = 'audio/ogg';
  } else if (
    buffer.length >= 8 &&
    (buffer.subarray(4, 8).toString('ascii') === 'ftyp' || ext === '.m4a' || ext === '.mp4')
  ) {
    format = 'm4a';
    mimeType = 'audio/mp4';
  } else if (
    (buffer.length >= 3 && buffer.subarray(0, 3).toString('ascii') === 'ID3') ||
    (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) ||
    ext === '.mp3'
  ) {
    format = 'mp3';
    mimeType = 'audio/mpeg';
  } else if (ext === '.m4a' || ext === '.aac') {
    format = 'm4a';
    mimeType = 'audio/mp4';
  } else if (ext === '.ogg') {
    format = 'ogg';
    mimeType = 'audio/ogg';
  } else if (ext === '.wav') {
    format = 'wav';
    mimeType = 'audio/wav';
  }

  if (!format) {
    throw new BadRequestException(
      'Invalid audio format. Only MP3, M4A, OGG, and WAV audio files up to 50 MB are supported.',
    );
  }

  let durationSeconds = 0;

  try {
    if (format === 'wav') {
      durationSeconds = parseWavDuration(buffer);
    } else if (format === 'm4a') {
      durationSeconds = parseM4aDuration(buffer);
    } else if (format === 'ogg') {
      durationSeconds = parseOggDuration(buffer);
    } else if (format === 'mp3') {
      durationSeconds = parseMp3Duration(buffer);
    }
  } catch {
    // Fallback estimation
    durationSeconds = 0;
  }

  if (!durationSeconds || isNaN(durationSeconds) || durationSeconds <= 0) {
    // Fallback: estimate using standard 128 kbps (16,000 bytes/sec)
    durationSeconds = Math.round((sizeBytes / 16000) * 10) / 10;
  }

  return {
    durationSeconds: Math.round(durationSeconds * 100) / 100,
    mimeType,
    sizeBytes,
    format,
  };
}

function parseWavDuration(buffer: Buffer): number {
  let pos = 12;
  let byteRate = 0;
  let dataSize = 0;

  while (pos + 8 <= buffer.length) {
    const chunkId = buffer.subarray(pos, pos + 4).toString('ascii');
    const chunkSize = buffer.readUInt32LE(pos + 4);

    if (chunkId === 'fmt ' && chunkSize >= 16) {
      byteRate = buffer.readUInt32LE(pos + 8 + 8);
    } else if (chunkId === 'data') {
      dataSize = chunkSize;
      break;
    }

    pos += 8 + chunkSize;
  }

  if (byteRate > 0 && dataSize > 0) {
    return dataSize / byteRate;
  }
  return 0;
}

function parseM4aDuration(buffer: Buffer): number {
  // Find mvhd atom
  let pos = 0;
  while (pos + 8 <= buffer.length) {
    const size = buffer.readUInt32BE(pos);
    const type = buffer.subarray(pos + 4, pos + 8).toString('ascii');

    if (size === 0) break;
    const boxSize = size === 1 ? Number(buffer.readBigUInt64BE(pos + 8)) : size;

    if (type === 'moov') {
      // Look inside moov
      let moovPos = pos + 8;
      const moovEnd = pos + boxSize;
      while (moovPos + 8 <= moovEnd && moovPos + 8 <= buffer.length) {
        const subSize = buffer.readUInt32BE(moovPos);
        const subType = buffer.subarray(moovPos + 4, moovPos + 8).toString('ascii');

        if (subType === 'mvhd' && subSize >= 28) {
          const version = buffer.readUInt8(moovPos + 8);
          if (version === 0) {
            const timescale = buffer.readUInt32BE(moovPos + 20);
            const duration = buffer.readUInt32BE(moovPos + 24);
            if (timescale > 0) return duration / timescale;
          } else if (version === 1 && subSize >= 36) {
            const timescale = buffer.readUInt32BE(moovPos + 28);
            const duration = Number(buffer.readBigUInt64BE(moovPos + 32));
            if (timescale > 0) return duration / timescale;
          }
        }
        moovPos += subSize > 0 ? subSize : 8;
      }
      break;
    }

    pos += boxSize > 0 ? boxSize : 8;
  }
  return 0;
}

function parseOggDuration(buffer: Buffer): number {
  let sampleRate = 48000;
  if (buffer.length > 40) {
    const headStr = buffer.subarray(0, 100).toString('binary');
    if (headStr.includes('vorbis')) {
      const vIdx = buffer.indexOf(Buffer.from('vorbis'));
      if (vIdx !== -1 && vIdx + 11 < buffer.length) {
        sampleRate = buffer.readUInt32LE(vIdx + 7);
      }
    }
  }

  // Find last OggS page
  let lastOggPos = buffer.lastIndexOf(Buffer.from('OggS'));
  if (lastOggPos !== -1 && lastOggPos + 14 <= buffer.length) {
    const granule = Number(buffer.readBigUInt64LE(lastOggPos + 6));
    if (granule > 0 && sampleRate > 0) {
      return granule / sampleRate;
    }
  }

  return 0;
}

function parseMp3Duration(buffer: Buffer): number {
  let offset = 0;

  // Check ID3v2 header
  if (buffer.length >= 10 && buffer.subarray(0, 3).toString('ascii') === 'ID3') {
    const tagSize =
      ((buffer[6] & 0x7f) << 21) |
      ((buffer[7] & 0x7f) << 14) |
      ((buffer[8] & 0x7f) << 7) |
      (buffer[9] & 0x7f);
    offset = 10 + tagSize;
    if ((buffer[5] & 0x10) !== 0) {
      offset += 10; // Footer
    }
  }

  // Search for MPEG sync header
  while (offset + 4 <= buffer.length) {
    if (buffer[offset] === 0xff && (buffer[offset + 1] & 0xe0) === 0xe0) {
      const header = buffer.readUInt32BE(offset);
      const versionBits = (header >> 19) & 3;
      const layerBits = (header >> 17) & 3;
      const bitrateIndex = (header >> 12) & 15;
      const sampleRateIndex = (header >> 10) & 3;
      const padding = (header >> 9) & 1;

      if (versionBits !== 1 && layerBits === 1 && bitrateIndex > 0 && bitrateIndex < 15 && sampleRateIndex < 3) {
        const sampleRates = [44100, 48000, 32000];
        const bitratesV1L3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
        const sampleRate = sampleRates[sampleRateIndex];
        const bitrateKbps = bitratesV1L3[bitrateIndex];

        // Check for Xing / Info header
        const xingOffset = offset + 36;
        if (xingOffset + 12 <= buffer.length) {
          const id = buffer.subarray(xingOffset, xingOffset + 4).toString('ascii');
          if (id === 'Xing' || id === 'Info') {
            const flags = buffer.readUInt32BE(xingOffset + 4);
            if ((flags & 1) !== 0) {
              const frames = buffer.readUInt32BE(xingOffset + 8);
              return (frames * 1152) / sampleRate;
            }
          }
        }

        // CBR fallback calculation
        const audioSize = buffer.length - offset;
        if (bitrateKbps > 0) {
          return (audioSize * 8) / (bitrateKbps * 1000);
        }
      }
    }
    offset++;
  }

  return 0;
}

