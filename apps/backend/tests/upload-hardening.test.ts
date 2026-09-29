import { describe, expect, it } from 'vitest';
import { rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createCoverFilename, detectCoverExtension } from '../src/routes/shelf.js';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff, 0xdb]);
const WEBP_SIGNATURE = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);
const uploadsDirectory = fileURLToPath(new URL('../uploads', import.meta.url));

describe('cover upload hardening', () => {
  it.each([
    [PNG_SIGNATURE, '.png'],
    [JPEG_SIGNATURE, '.jpg'],
    [WEBP_SIGNATURE, '.webp'],
  ])('detects the %s image signature', (file, extension) => {
    expect(detectCoverExtension(file)).toBe(extension);
  });

  it('rejects arbitrary bytes even when the client supplies an image extension', () => {
    expect(detectCoverExtension(Buffer.from('not an image'))).toBeNull();
  });

  it('generates a UUID filename with the extension derived from the file signature', () => {
    expect(createCoverFilename(PNG_SIGNATURE)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/,
    );
  });

  it('serves uploaded files with nosniff enabled', async () => {
    const filename = 'header-check.png';
    await writeFile(path.join(uploadsDirectory, filename), PNG_SIGNATURE);

    try {
      const response = await request(createApp()).get(`/uploads/${filename}`);
      expect(response.status).toBe(200);
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    } finally {
      await rm(path.join(uploadsDirectory, filename), { force: true });
    }
  });
});
