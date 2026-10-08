import test from 'node:test';
import assert from 'node:assert/strict';
import { detecterTypeFichier } from '../utils/fichiers.js';

const avec = (octets) => Buffer.concat([Buffer.from(octets), Buffer.alloc(16)]);

test('reconnaît PDF, PNG, JPEG, WebP', () => {
  assert.equal(detecterTypeFichier(avec(Buffer.from('%PDF-1.7'))).ext, 'pdf');
  assert.equal(detecterTypeFichier(avec([0x89, 0x50, 0x4e, 0x47])).ext, 'png');
  assert.equal(detecterTypeFichier(avec([0xff, 0xd8, 0xff, 0xe0])).ext, 'jpg');
  const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(8)]);
  assert.equal(detecterTypeFichier(webp).ext, 'webp');
});

test('refuse HTML, SVG et exécutables', () => {
  assert.equal(detecterTypeFichier(avec(Buffer.from('<html><script>'))), null);
  assert.equal(detecterTypeFichier(avec(Buffer.from('<svg xmlns='))), null);
  assert.equal(detecterTypeFichier(avec(Buffer.from('MZ'))), null);
  assert.equal(detecterTypeFichier(Buffer.from('abc')), null);
});
