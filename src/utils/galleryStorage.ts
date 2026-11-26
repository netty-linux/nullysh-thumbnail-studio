import type { SavedThumbnailItem } from '../types/thumbnail';

const STORAGE_KEY = 'nullysh_thumbnail_studio_gallery_v1';
const MAX_ITEMS = 12;

export function loadGalleryItems(): SavedThumbnailItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveGalleryItems(items: SavedThumbnailItem[]): SavedThumbnailItem[] {
  const trimmed = items.slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    return trimmed;
  } catch {
    // If quota is exceeded (e.g. large uploaded mockup dataUrl), drop oldest until it fits
    const copy = [...trimmed];
    while (copy.length > 1) {
      copy.pop();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
        return copy;
      } catch {
        // continue trimming
      }
    }
    return copy;
  }
}
