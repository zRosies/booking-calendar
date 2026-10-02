import { CalendarService } from "../services/calendar.service";
import { MigrationService } from "../services/migration.service";
import { getEventsCollection, getDb } from "../connect";

export interface Events {
  date: string;
  memberName: string;
  address: string;
  phone: string;
  notes: string;
}

/**
 * Retorna os dados da Ward (Ala) com seus eventos populados.
 * Retorna no formato [{ _id: wardId, events: [...] }] garantindo compatibilidade
 * retroativa com o frontend (data[0]?.events).
 */
export async function getMonthData() {
  try {
    const ward = await CalendarService.getDefaultWard();
    const eventsCol = await getEventsCollection();

    // Verificação de auto-migração: se a collection events estiver vazia e months tiver dados
    const eventsCount = await eventsCol.countDocuments();
    if (eventsCount === 0) {
      const db = await getDb();
      const monthsCol = db.collection("months");
      const monthsCount = await monthsCol.countDocuments();
      if (monthsCount > 0) {
        console.log("Collection 'events' vazia detectada. Executando migração inicial automática...");
        await MigrationService.runMigration();
      }
    }

    // Busca eventos da Ward com $lookup na collection 'members'
    const populatedEvents = await CalendarService.getEventsByWard(ward._id);

    return [
      {
        _id: ward._id,
        name: ward.name,
        events: populatedEvents,
      },
    ];
  } catch (error) {
    console.error("Erro em getMonthData:", error);
    throw new Error(`Erro ao buscar dados do calendário: ${error}`);
  }
}

/**
 * Criação de novo compromisso/almoço
 * 1. Encontra ou cria o membro na collection 'members'
 * 2. Valida existência de Ward e Member
 * 3. Valida event.wardId === member.wardId
 * 4. Insere o evento na collection 'events'
 */
export async function BookLunch(newEvent: Events) {
  try {
    const ward = await CalendarService.getDefaultWard();

    // Encontra ou cadastra o Membro com dados fornecidos
    const member = await CalendarService.findOrCreateMember(ward._id, {
      name: newEvent.memberName,
      address: newEvent.address,
      phone: newEvent.phone,
    });

    // Criação do Event com validação de wardId e timestamps
    await CalendarService.createEvent({
      wardId: ward._id,
      memberId: member._id,
      date: newEvent.date,
      notes: newEvent.notes,
    });

    return [{ messsage: "Almoço agendado com sucesso" }, { status: 200 }];
  } catch (error) {
    console.error("Erro em BookLunch:", error);
    return [
      { messsage: `Erro ao agendar almoço: ${error instanceof Error ? error.message : error}` },
      { status: 400 },
    ];
  }
}

/**
 * Atualização de compromisso/almoço
 */
export async function UpdateBookedDate(newEvent: Events) {
  try {
    const ward = await CalendarService.getDefaultWard();

    // Atualiza ou encontra o membro
    const member = await CalendarService.findOrCreateMember(ward._id, {
      name: newEvent.memberName,
      address: newEvent.address,
      phone: newEvent.phone,
    });

    // Atualiza o evento
    const updated = await CalendarService.updateEvent(
      { date: newEvent.date, wardId: ward._id },
      {
        memberId: member._id,
        date: newEvent.date,
        notes: newEvent.notes,
      }
    );

    if (updated) {
      return [{ messsage: "Almoço atualizado com sucesso" }, { status: 200 }];
    }

    return [
      { messsage: `Nenhum almoço encontrado para a data: ${newEvent.date}` },
      { status: 404 },
    ];
  } catch (error) {
    console.error("Erro em UpdateBookedDate:", error);
    return [
      { messsage: `Erro ao atualizar almoço: ${error instanceof Error ? error.message : error}` },
      { status: 400 },
    ];
  }
}

/**
 * Exclusão de compromisso/almoço
 */
export async function DeleteBookedDate(dateId: string) {
  try {
    const deleted = await CalendarService.deleteEvent({ date: dateId });

    if (deleted) {
      return [{ messsage: "Almoço cancelado com sucesso" }, { status: 200 }];
    }

    return [
      { messsage: `Nenhum almoço encontrado com o identificador: ${dateId}` },
      { status: 404 },
    ];
  } catch (error) {
    console.error("Erro em DeleteBookedDate:", error);
    return [
      { messsage: `Erro ao cancelar almoço: ${error instanceof Error ? error.message : error}` },
      { status: 400 },
    ];
  }
}
