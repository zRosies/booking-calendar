"use client";

const GUEST_STORAGE_KEY = "church_calendar_guest_tokens";
const GUEST_UUID_KEY = "church_calendar_guest_uuid";
const GUEST_PREF_KEY = "church_calendar_guest_mode_preferred";

export interface GuestBookingRecord {
  token: string;
  date: string;
  createdAt: string;
}

/**
 * Obtém ou inicializa o UUID persistente de convidado deste navegador (salvo em localStorage e Cookie).
 */
export function getOrCreateGuestId(): string {
  if (typeof window === "undefined") return "";

  let guestId: string | null = null;

  // 1. Tenta recuperar do localStorage
  try {
    guestId = localStorage.getItem(GUEST_UUID_KEY);
  } catch {
    // localStorage indisponível
  }

  // 2. Se não estiver no localStorage, tenta buscar no Cookie
  if (!guestId) {
    const match = document.cookie.match(/(?:^|;\s*)guest_uuid=([^;]+)/);
    if (match && match[1]) {
      guestId = decodeURIComponent(match[1]);
    }
  }

  // 3. Se ainda não existir, gera um UUID novo com prefixo 'guest_'
  if (!guestId) {
    const randomPart =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2) + Date.now().toString(36);
    guestId = `guest_${randomPart}`;
  }

  // 4. Salva em ambos (localStorage e Cookie com duração de 1 ano)
  try {
    localStorage.setItem(GUEST_UUID_KEY, guestId);
    document.cookie = `guest_uuid=${encodeURIComponent(
      guestId
    )}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  } catch (err) {
    console.error("Erro ao salvar guest_uuid:", err);
  }

  return guestId;
}

/**
 * Verifica se o usuário já optou pelo modo convidado neste navegador para não ficar perguntando toda vez
 */
export function isGuestModePreferred(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(GUEST_PREF_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Define ou remove a preferência de modo convidado (não perguntar a cada novo almoço)
 */
export function setGuestModePreferred(preferred: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (preferred) {
      getOrCreateGuestId(); // Garante o UUID gerado e no cookie
      localStorage.setItem(GUEST_PREF_KEY, "true");
    } else {
      localStorage.removeItem(GUEST_PREF_KEY);
    }
  } catch (err) {
    console.error("Erro ao salvar preferência de convidado:", err);
  }
}

export function getGuestBookings(): GuestBookingRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getGuestTokens(): string[] {
  return getGuestBookings().map((b) => b.token);
}

export function saveGuestBooking(token: string, date: string): void {
  if (typeof window === "undefined") return;
  try {
    const list = getGuestBookings();
    list.push({ token, date, createdAt: new Date().toISOString() });
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Erro ao salvar guest token no localStorage:", err);
  }
}

export function hasGuestToken(token?: string): boolean {
  if (!token || typeof window === "undefined") return false;

  // 1. Verifica contra o UUID persistente do navegador
  const currentGuestId = getOrCreateGuestId();
  if (currentGuestId && currentGuestId === token) {
    return true;
  }

  // 2. Verifica contra histórico de tokens
  return getGuestTokens().includes(token);
}

export function generateGuestToken(): string {
  return getOrCreateGuestId();
}

export function removeGuestBooking(token: string): void {
  if (typeof window === "undefined" || !token) return;
  try {
    const list = getGuestBookings().filter((b) => b.token !== token);
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Erro ao remover guest token do localStorage:", err);
  }
}

/**
 * Verifica se este navegador agendou o almoço em uma data específica
 */
export function hasGuestBookingForDate(dateStr?: string): boolean {
  if (!dateStr || typeof window === "undefined") return false;
  try {
    const list = getGuestBookings();
    const targetDate = new Date(dateStr);
    if (isNaN(targetDate.getTime())) return false;
    return list.some((b) => {
      try {
        const d = new Date(b.date);
        return (
          d.getFullYear() === targetDate.getFullYear() &&
          d.getMonth() === targetDate.getMonth() &&
          d.getDate() === targetDate.getDate()
        );
      } catch {
        return b.date === dateStr;
      }
    });
  } catch {
    return false;
  }
}

