import type { CustomPreset } from '../types/thumbnail';

const PRESETS_STORAGE_KEY = 'nullysh_thumbnail_studio_presets_v1';
const MAX_CUSTOM_PRESETS = 24;

export function loadCustomPresets(): CustomPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveCustomPresets(presets: CustomPreset[]): CustomPreset[] {
  const trimmed = presets.slice(0, MAX_CUSTOM_PRESETS);
  try {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore storage quota issues safely
  }
  return trimmed;
}
