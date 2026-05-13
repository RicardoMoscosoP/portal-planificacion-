import type { Bet, MOS } from '../../domain/types';

const QUARTER_ORDER = ['Q1', 'Q2', 'Q3', 'Q4'];

export function getBetProducts(bet: Bet): string[] {
  const rawProducts = Array.isArray(bet.productos) && bet.productos.length > 0
    ? bet.productos
    : [bet.producto];

  return rawProducts
    .map(item => item.trim())
    .filter((item, index, list) => item.length > 0 && list.findIndex(entry => entry.toLowerCase() === item.toLowerCase()) === index);
}

export function getBetPrimaryProduct(bet: Bet): string {
  return getBetProducts(bet)[0] ?? '';
}

export function getMosQuarters(mos: MOS): string[] {
  const rawQuarters = Array.isArray(mos.qs) && mos.qs.length > 0
    ? mos.qs
    : (mos.q ? [mos.q] : []);

  return rawQuarters
    .map(item => item.trim())
    .filter((item, index, list) => item.length > 0 && list.findIndex(entry => entry === item) === index)
    .sort((a, b) => QUARTER_ORDER.indexOf(a) - QUARTER_ORDER.indexOf(b));
}

export function formatMosQuarterLabel(mos: MOS): string {
  const quarters = getMosQuarters(mos);
  return quarters.length > 0 ? quarters.join(' · ') : 'Sin Q';
}

export function getMosByBet(bet: Bet, mos: MOS[]): MOS[] {
  return bet.mos_ids
    .map(id => mos.find(item => item.id === id))
    .filter((item): item is MOS => item !== undefined)
    .sort((a, b) => {
      const quarterA = getMosQuarters(a)[0] ?? 'Q9';
      const quarterB = getMosQuarters(b)[0] ?? 'Q9';
      return quarterA.localeCompare(quarterB) || (a.orden ?? 99) - (b.orden ?? 99) || a.descripcion.localeCompare(b.descripcion, 'es');
    });
}

export function getActiveMosByBetAndQuarter(bet: Bet, mos: MOS[], quarter: string): MOS[] {
  const inactiveIds = new Set(bet.mos_inactivos ?? []);
  return getMosByBet(bet, mos).filter(item => getMosQuarters(item).includes(quarter) && !inactiveIds.has(item.id));
}

export function betHasActiveMosForQuarter(bet: Bet, mos: MOS[], quarter: string): boolean {
  return getActiveMosByBetAndQuarter(bet, mos, quarter).length > 0;
}