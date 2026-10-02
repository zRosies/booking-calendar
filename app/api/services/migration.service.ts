import { getDb, getEventsCollection } from "../connect";
import { CalendarService } from "./calendar.service";
import { Event } from "../models";

export interface MigrationSummary {
  success: boolean;
  oldEventsFound: number;
  membersCreatedOrFound: number;
  eventsMigrated: number;
  eventsSkippedDuplicate: number;
  details: string[];
}

export class MigrationService {
  /**
   * Executa a migração segura da collection antiga 'months' para o novo modelo:
   * 1. Lê os eventos antigos.
   * 2. Encontra ou cria o Member correspondente (sem duplicidades).
   * 3. Copia name, address e phone para Member.
   * 4. Cria o Event utilizando wardId, memberId, date, notes.
   * 5. NÃO apaga os dados antigos da collection 'months'.
   */
  static async runMigration(): Promise<MigrationSummary> {
    const summary: MigrationSummary = {
      success: true,
      oldEventsFound: 0,
      membersCreatedOrFound: 0,
      eventsMigrated: 0,
      eventsSkippedDuplicate: 0,
      details: [],
    };

    try {
      const db = await getDb();
      const ward = await CalendarService.getDefaultWard();
      summary.details.push(`Ward alvo: ${ward.name} (${ward._id})`);

      const monthsCol = db.collection("months");
      const oldDocs = await monthsCol.find({}).toArray();

      const eventsCol = await getEventsCollection();
      const membersSeen = new Set<string>();

      for (const doc of oldDocs) {
        const oldEvents = Array.isArray(doc.events) ? doc.events : [];
        summary.oldEventsFound += oldEvents.length;

        for (const oldEvent of oldEvents) {
          const memberName = (oldEvent.memberName || oldEvent.name || "").trim();
          if (!memberName) {
            summary.details.push(`Evento ignorado sem nome de membro: ${JSON.stringify(oldEvent)}`);
            continue;
          }

          // 1. Encontrar ou criar o Member correspondente
          const member = await CalendarService.findOrCreateMember(ward._id, {
            name: memberName,
            address: oldEvent.address || "",
            phone: oldEvent.phone || "",
          });

          if (!membersSeen.has(String(member._id))) {
            membersSeen.add(String(member._id));
            summary.membersCreatedOrFound++;
          }

          // 2. Normaliza a data
          const eventDate = new Date(oldEvent.date);
          if (isNaN(eventDate.getTime())) {
            summary.details.push(`Data inválida para o evento de ${memberName}: ${oldEvent.date}`);
            continue;
          }

          // 3. Verifica se já existe um evento idêntico para evitar duplicação (idempotência)
          const startOfDay = new Date(eventDate);
          startOfDay.setUTCHours(0, 0, 0, 0);
          const endOfDay = new Date(eventDate);
          endOfDay.setUTCHours(23, 59, 59, 999);

          const existingEvent = await eventsCol.findOne({
            wardId: ward._id,
            memberId: member._id,
            date: { $gte: startOfDay, $lte: endOfDay },
          });

          if (existingEvent) {
            summary.eventsSkippedDuplicate++;
            continue;
          }

          // 4. Cria o Event com relacionamentos via ObjectId e timestamps
          const now = new Date();
          const newEvent: Event = {
            wardId: ward._id,
            memberId: member._id,
            date: eventDate,
            notes: oldEvent.notes || "",
            createdAt: now,
            updatedAt: now,
          };

          await eventsCol.insertOne(newEvent);
          summary.eventsMigrated++;
        }
      }

      summary.details.push(
        `Migração concluída com sucesso: ${summary.eventsMigrated} eventos migrados, ${summary.membersCreatedOrFound} membros processados.`
      );
      return summary;
    } catch (error) {
      summary.success = false;
      summary.details.push(`Erro durante a migração: ${error}`);
      console.error("Erro na migração:", error);
      return summary;
    }
  }
}
