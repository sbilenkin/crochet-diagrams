import { apiDelete, apiGet, apiPost, apiPut } from './client';
import type { CustomSymbolDef } from '../types/canvas';

export type CustomSymbolPayload = Omit<CustomSymbolDef, 'id'>;

export function listCustomSymbols() {
  return apiGet<CustomSymbolDef[]>('/api/custom-symbols');
}

export function createCustomSymbol(payload: CustomSymbolPayload) {
  return apiPost<CustomSymbolDef>('/api/custom-symbols', payload);
}

export function updateCustomSymbol(id: string, payload: Partial<CustomSymbolPayload>) {
  return apiPut<CustomSymbolDef>(`/api/custom-symbols/${id}`, payload);
}

export function deleteCustomSymbol(id: string) {
  return apiDelete<void>(`/api/custom-symbols/${id}`);
}
