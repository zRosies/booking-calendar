export interface Events {
  date: string;
  memberName: string;
  address: string;
  phone: string;
  notes: string;
}

// Generates realistic mock events for a given month and surrounding months (-6 to +6)
export function generateMockEvents(referenceDate: Date = new Date()): Events[] {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth(); // 0-indexed

  const formatDay = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${y}-${mm}-${dd}T12:00:00.000Z`;
  };

  // Base events corresponding to the user's design reference
  const currentMonthEvents: Events[] = [
    {
      date: formatDay(year, month, 7),
      memberName: "Bispo e Família",
      address: "Rua das Laranjeiras, 100 - Apto 302",
      phone: "(21) 98765-4321",
      notes: "Almoço da ala. Levar sobremesa.",
    },
    {
      date: formatDay(year, month, 9),
      memberName: "Rosane",
      address: "Av. Brigadeiro Trompowsky, 240",
      phone: "(21) 99876-5432",
      notes: "Almoço da ala. Opção sem glúten.",
    },
    {
      date: formatDay(year, month, 10),
      memberName: "Betinha",
      address: "Rua Cambaúba, 450",
      phone: "(21) 97654-3210",
      notes: "Almoço da ala pontual às 12:30.",
    },
    {
      date: formatDay(year, month, 12),
      memberName: "Cássia",
      address: "Estrada do Galeão, 1200",
      phone: "(21) 96543-2109",
      notes: "Almoço da ala. Preferência por saladas frescas.",
    },
    {
      date: formatDay(year, month, 13),
      memberName: "Ana e Hélio",
      address: "Rua República Árabe Unida, 80",
      phone: "(21) 95432-1098",
      notes: "Almoço da ala com toda a família reunida.",
    },
    {
      date: formatDay(year, month, 14),
      memberName: "Naide e Renan",
      address: "Praça do Avião, 15",
      phone: "(21) 94321-0987",
      notes: "Almoço da ala confirmado com os missionários.",
    },
    {
      date: formatDay(year, month, 19),
      memberName: "Heloisa e Francisco",
      address: "Rua Paranapuã, 310",
      phone: "(21) 93210-9876",
      notes: "Almoço da ala. Favor chegar às 13h.",
    },
    {
      date: formatDay(year, month, 20),
      memberName: "Júlia Quintela",
      address: "Rua Ipiru, 520",
      phone: "(21) 92109-8765",
      notes: "Almoço da ala vegetariano.",
    },
    {
      date: formatDay(year, month, 21),
      memberName: "Almir e Nancy",
      address: "Av. Paranapuã, 890",
      phone: "(21) 91098-7654",
      notes: "Almoço da ala tradicional de domingo.",
    },
    {
      date: formatDay(year, month, 24),
      memberName: "Betinha",
      address: "Rua Cambaúba, 450",
      phone: "(21) 97654-3210",
      notes: "Almoço da ala quarta-feira especial.",
    },
    {
      date: formatDay(year, month, 26),
      memberName: "Izamara Matos",
      address: "Rua Érico Veríssimo, 75",
      phone: "(21) 90987-6543",
      notes: "Almoço da ala com prato caseiro.",
    },
    {
      date: formatDay(year, month, 27),
      memberName: "Gustavo e Ana",
      address: "Rua Colina, 330",
      phone: "(21) 99123-4567",
      notes: "Almoço da ala e recepção aos missionários.",
    },
    {
      date: formatDay(year, month, 28),
      memberName: "Alessandra Rocha",
      address: "Rua Uçá, 112",
      phone: "(21) 98234-5678",
      notes: "Almoço da ala domingo.",
    },
    {
      date: formatDay(year, month, 30),
      memberName: "Margareth Silveira",
      address: "Estrada do Galeão, 2100",
      phone: "(21) 97345-6789",
      notes: "Almoço da ala com sobremesa especial.",
    },
  ];

  // Helper for surrounding months (-6 to +6)
  const surroundingEvents: Events[] = [];
  const sampleMembers = [
    { name: "Família Santos", addr: "Rua Cambaúba, 180", phone: "(21) 98123-1122", note: "Almoço pontual" },
    { name: "Luciana e Dênio", addr: "Av. Paranapuã, 410", phone: "(21) 98234-2233", note: "Almoço em família" },
    { name: "Carlos e Maria", addr: "Rua República Árabe Unida, 120", phone: "(21) 98345-3344", note: "Sobremesa incluída" },
    { name: "Fernando Dias", addr: "Estrada do Galeão, 950", phone: "(21) 98456-4455", note: "Bolo de chocolate" },
    { name: "Suzana e Remerson", addr: "Praça do Avião, 88", phone: "(21) 98567-5566", note: "Confirmado" },
    { name: "Vanessa e Tiago", addr: "Rua Ipiru, 310", phone: "(21) 98678-6677", note: "Almoço às 13h" },
  ];

  for (let offset = -6; offset <= 6; offset++) {
    if (offset === 0) continue; // Already covered by currentMonthEvents
    const targetDate = new Date(year, month + offset, 1);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();

    // 2-3 events per month
    const m1 = sampleMembers[(Math.abs(offset) * 2) % sampleMembers.length];
    const m2 = sampleMembers[(Math.abs(offset) * 2 + 1) % sampleMembers.length];

    surroundingEvents.push({
      date: formatDay(targetYear, targetMonth, 8),
      memberName: m1.name,
      address: m1.addr,
      phone: m1.phone,
      notes: m1.note,
    });
    surroundingEvents.push({
      date: formatDay(targetYear, targetMonth, 22),
      memberName: m2.name,
      address: m2.addr,
      phone: m2.phone,
      notes: m2.note,
    });
  }

  return [...currentMonthEvents, ...surroundingEvents];
}

const STORAGE_KEY = "church_calendar_mock_events_v2";

export function loadMockEvents(referenceDate: Date = new Date()): Events[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not read mock events from localStorage", e);
    }
  }

  const defaults = generateMockEvents(referenceDate);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    } catch (e) {
      console.warn("Could not write mock events to localStorage", e);
    }
  }
  return defaults;
}

export function saveMockEvents(events: Events[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      console.warn("Could not save mock events to localStorage", e);
    }
  }
}
