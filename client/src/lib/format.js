// ============================================================
// Formatage — dates, montants, noms
// ============================================================
import { format as dfFormat } from 'date-fns';
import { fr } from 'date-fns/locale';

const DAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

export function fmtDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  try {
    return dfFormat(d, 'dd/MM/yyyy', { locale: fr });
  } catch {
    return '—';
  }
}

export function fmtDateLong(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  try {
    return dfFormat(d, 'EEEE dd MMMM yyyy', { locale: fr });
  } catch {
    return '—';
  }
}

export function fmtDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  try {
    return dfFormat(d, 'dd/MM/yyyy HH:mm', { locale: fr });
  } catch {
    return '—';
  }
}

const CURRENCY_FORMATTER = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function fmtMoney(value) {
  if (value === null || value === undefined) return '—';
  return `${CURRENCY_FORMATTER.format(Number(value))} F CFA`;
}

export function fmtNumber(value, decimals = 0) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(value));
}

export function fullName(row) {
  if (!row) return '—';
  if (typeof row === 'string') return row;
  const parts = [row.firstName, row.lastName].filter(Boolean);
  if (parts.length) return parts.join(' ');
  return row.fullName || row.name || '—';
}

export function nameOf(row) {
  if (!row) return '—';
  return row.name || fullName(row);
}

/** "2026-09-20T00:00:00.000Z" → "2026-09-20" (pour <input type=date>) */
export function toInputDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return dfFormat(d, 'yyyy-MM-dd');
}

/** ISO → "2026-09-20T14:30" (pour <input type=datetime-local>) */
export function toInputDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return dfFormat(d, 'yyyy-MM-dd\'T\'HH:mm');
}

/** Durée en minutes → "1 h 30" */
export function fmtDuration(min) {
  if (min === null || min === undefined) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${String(m).padStart(2, '0')}`;
}

/** Taille fichier en octets → lisible */
export function fmtBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/** Calcul de l'âge depuis une date de naissance */
export function ageOf(birthDate) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}
