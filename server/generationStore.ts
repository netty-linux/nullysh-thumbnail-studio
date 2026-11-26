import { randomUUID } from 'node:crypto';
import type { ThumbnailConfig } from '../src/types/thumbnail.js';

export interface StoredGeneration {
  id: string;
  title: string;
  createdAt: number;
  format: 'png' | 'webp';
  scale: 1 | 2;
  mimeType: 'image/png' | 'image/webp';
  width: number;
  height: number;
  byteLength: number;
  source: 'mcp' | 'api';
  buffer: Buffer;
  previewDataUrl: string;
  config: ThumbnailConfig;
}

export interface StoredGenerationMeta {
  id: string;
  title: string;
  createdAt: number;
  format: 'png' | 'webp';
  scale: 1 | 2;
  mimeType: 'image/png' | 'image/webp';
  width: number;
  height: number;
  byteLength: number;
  source: 'mcp' | 'api';
  imageUrl: string;
  previewDataUrl: string;
  config: ThumbnailConfig;
}

const MAX_ITEMS = 30;
const store: StoredGeneration[] = [];

export function saveGeneration(
  input: Omit<StoredGeneration, 'id' | 'createdAt' | 'byteLength'>
): StoredGeneration {
  const entry: StoredGeneration = {
    ...input,
    id: randomUUID(),
    createdAt: Date.now(),
    byteLength: input.buffer.byteLength,
  };
  store.unshift(entry);
  if (store.length > MAX_ITEMS) {
    store.length = MAX_ITEMS;
  }
  return entry;
}

export function getGenerationById(id: string): StoredGeneration | undefined {
  return store.find((item) => item.id === id);
}

export function deleteGenerationById(id: string): boolean {
  const idx = store.findIndex((item) => item.id === id);
  if (idx === -1) return false;
  store.splice(idx, 1);
  return true;
}

export function listGenerationsMeta(baseUrl: string): StoredGenerationMeta[] {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return store.map(({ buffer: _buf, ...rest }) => ({
    ...rest,
    imageUrl: `${cleanBase}/api/mcp/generations/${rest.id}/image`,
  }));
}

export function toGenerationMeta(
  entry: StoredGeneration,
  baseUrl: string
): StoredGenerationMeta {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const { buffer: _buf, ...rest } = entry;
  return {
    ...rest,
    imageUrl: `${cleanBase}/api/mcp/generations/${entry.id}/image`,
  };
}
