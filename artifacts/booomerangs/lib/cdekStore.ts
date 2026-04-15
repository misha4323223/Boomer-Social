export interface CdekPoint {
  code: string;
  name: string;
  address?: string;
  address_comment?: string;
  work_time?: string;
  nearest_station?: string;
  cityName?: string;
  cityCode?: number;
}

let _selected: CdekPoint | null = null;
const _listeners = new Set<(p: CdekPoint | null) => void>();

export function getCdekPoint(): CdekPoint | null {
  return _selected;
}

export function setCdekPoint(p: CdekPoint | null) {
  _selected = p;
  _listeners.forEach((fn) => fn(p));
}

export function subscribeCdekPoint(fn: (p: CdekPoint | null) => void) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
