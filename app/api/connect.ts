import { MongoClient, Collection, Db } from "mongodb";
import dns from "node:dns";
import { Stake, Ward, Member, Event } from "./models";

const DB_NAME = "calendar";

// Cache do client para reuso de conexões no Next.js (evita esgotamento de sockets)
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getDb(dbName: string = DB_NAME): Promise<Db> {
  if (cachedDb) return cachedDb;

  const URI = process.env.MONGOURI;
  if (!URI) throw new Error("Variável de ambiente MONGOURI não encontrada.");

  // Garante servidores DNS públicos no Node.js (Google/Cloudflare) para resolver SRV no Windows
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch {
    // Ignora caso restrito
  }

  try {
    if (!cachedClient) {
      cachedClient = new MongoClient(URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      await cachedClient.connect();
    }
    cachedDb = cachedClient.db(dbName);
    return cachedDb;
  } catch (error) {
    // Se a conexão falhar por oscilação de rede, limpa o cache para tentar de novo na próxima chamada
    cachedClient = null;
    cachedDb = null;
    throw error;
  }
}

/**
 * Função original mantida para compatibilidade
 */
export async function initDb(
  db: string = DB_NAME,
  collection: string
): Promise<Collection> {
  const database = await getDb(db);
  return database.collection(collection);
}

/**
 * Typed Collections Getters (stakes, wards, members, events)
 */
export async function getStakesCollection(): Promise<Collection<Stake>> {
  const db = await getDb();
  return db.collection<Stake>("stakes");
}

export async function getWardsCollection(): Promise<Collection<Ward>> {
  const db = await getDb();
  return db.collection<Ward>("wards");
}

// Alias para compatibilidade
export const getAlasCollection = getWardsCollection;

export async function getMembersCollection(): Promise<Collection<Member>> {
  const db = await getDb();
  return db.collection<Member>("members");
}

export async function getEventsCollection(): Promise<Collection<Event>> {
  const db = await getDb();
  return db.collection<Event>("events");
}

/**
 * Criação e garantia dos índices necessários
 * - stakes:  { slug: 1 } (unique), { name: 1 }
 * - wards:   { stakeId: 1 }, { slug: 1 }
 * - members: { wardId: 1 }, { wardId: 1, name: 1 }
 * - events:  { wardId: 1, date: 1 }, { memberId: 1, date: 1 }
 */
let indexesCreated = false;

export async function ensureIndexes(): Promise<void> {
  if (indexesCreated) return;

  try {
    const stakesCol = await getStakesCollection();
    const wardsCol = await getWardsCollection();
    const membersCol = await getMembersCollection();
    const eventsCol = await getEventsCollection();

    await Promise.all([
      // Índices de stakes
      stakesCol.createIndex({ slug: 1 }, { background: true }),
      stakesCol.createIndex({ name: 1 }, { background: true }),

      // Índices de wards
      wardsCol.createIndex({ stakeId: 1 }, { background: true }),
      wardsCol.createIndex({ slug: 1 }, { background: true }),

      // Índices de members
      membersCol.createIndex({ wardId: 1 }, { background: true }),
      membersCol.createIndex({ wardId: 1, name: 1 }, { background: true }),

      // Índices de events
      eventsCol.createIndex({ wardId: 1, date: 1 }, { background: true }),
      eventsCol.createIndex({ memberId: 1, date: 1 }, { background: true }),
    ]);

    indexesCreated = true;
    console.log(
      " Índices do MongoDB garantidos com sucesso (stakes, wards, members, events)."
    );
  } catch (error) {
    console.error("Erro ao criar índices no MongoDB:", error);
  }
}
