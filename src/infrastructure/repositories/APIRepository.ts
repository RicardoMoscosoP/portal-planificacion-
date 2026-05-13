// ─────────────────────────────────────────────────────────────────────────────
// APIRepository — Implementación para API REST externa
//
// Usa fetch() para consumir un endpoint REST.
// Puede apuntar al GAS Web App publicado como doGet() o a una API externa.
//
// Configurar VITE_API_URL en .env para activar este modo.
// ─────────────────────────────────────────────────────────────────────────────

import type { IDataRepository } from '../../domain/interfaces/IDataRepository';
import type { AppData } from '../../domain/types';

export class APIRepository implements IDataRepository {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async get<T>(action: string, params?: Record<string, string>): Promise<T> {
    let url: string;
    if (!this.baseUrl || this.baseUrl.trim() === '') {
      // Apps Script embebido: fetch relativo
      const paramsObj = { action, ...(params || {}) };
      const search = new URLSearchParams(paramsObj).toString();
      url = `?${search}`;
    } else {
      // API externa: usar baseUrl como antes
      const u = new URL(this.baseUrl, window.location.origin);
      u.searchParams.set('action', action);
      if (params) {
        Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
      }
      url = u.toString();
    }
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getAllData(_equipoId?: string): Promise<AppData> {
    return this.get<AppData>('getAllData');
  }

  async syncToSheet(data: Partial<AppData>): Promise<{ ok: boolean; entities: string[] }> {
    if (!this.baseUrl || this.baseUrl.trim() === '') {
      throw new Error('APIRepository: baseUrl no configurado');
    }
    const url = new URL(this.baseUrl, window.location.origin);
    url.searchParams.set('action', 'syncSheetData');
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(`API sync error ${res.status}: ${res.statusText}`);
    }
    return res.json() as Promise<{ ok: boolean; entities: string[] }>;
  }
}
