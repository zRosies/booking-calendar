import { ObjectId } from "mongodb";
import { CalendarService } from "../services/calendar.service";
import { MigrationService } from "../services/migration.service";
import { getEventsCollection, getWardsCollection, getDb } from "../connect";
import { CallerAuth } from "../auth/session";

export interface Events {
  _id?: string;
  date: string;
  memberName: string;
  address: string;
  phone: string;
  notes: string;
  wardId?: string;
  userEmail?: string;
  userName?: string;
  guestToken?: string;
  authProvider?: "google" | "guest";
}

/**
 * Validação de propriedade: Apenas o criador (Google ou guestToken no mesmo navegador) ou admin pode modificar/excluir
 */
function checkOwnership(
  existingEvent: {
    memberId?: ObjectId | string;
    userEmail?: string;
    guestToken?: string;
  },
  caller?: CallerAuth,
): boolean {
  if (caller?.isAdmin) return true;

  // 1. Se o ID do usuário bate diretamente com o memberId do evento:
  if (caller?.userId && existingEvent.memberId) {
    if (String(caller.userId) === String(existingEvent.memberId)) {
      return true;
    }
  }

  // 2. Se o almoço foi marcado com Google (tem userEmail):
  if (existingEvent.userEmail && existingEvent.userEmail.trim() !== "") {
    return Boolean(
      caller?.userEmail &&
        caller.userEmail.toLowerCase() ===
          existingEvent.userEmail.toLowerCase(),
    );
  }

  // 3. Se o almoço foi marcado como convidado/sem login (tem guestToken):
  if (existingEvent.guestToken && existingEvent.guestToken.trim() !== "") {
    return Boolean(
      caller?.guestToken && caller.guestToken === existingEvent.guestToken,
    );
  }

  // Almoços legados sem usuário associado (anteriores ao sistema de autenticação)
  return true;
}

/**
 * Retorna os dados da Ward (Ala) com seus eventos populados.
 * Suporta filtro por targetWardId ou recai na ala padrão.
 */
export async function getMonthData(targetWardId?: string) {
  try {
    let ward = null;
    if (targetWardId && ObjectId.isValid(targetWardId)) {
      const wardsCol = await getWardsCollection();
      ward = await wardsCol.findOne({ _id: new ObjectId(targetWardId) });
    }

    if (!ward) {
      ward = await CalendarService.getDefaultWard();
    }

    // const eventsCol = await getEventsCollection();

    // Verificação de auto-migração: se a collection events estiver vazia e months tiver dados
    // const eventsCount = await eventsCol.countDocuments();
    // if (eventsCount === 0) {
    //   const db = await getDb();
    //   const monthsCol = db.collection("months");
    //   const monthsCount = await monthsCol.countDocuments();
    //   if (monthsCount > 0) {
    //     console.log("Collection 'events' vazia detectada. Executando migração inicial automática...");
    //     await MigrationService.runMigration();
    //   }
    // }

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
 * Criação de novo compromisso/almoço para a Ward especificada (ou padrão)
 */
export async function BookLunch(newEvent: Events, callerAuth?: CallerAuth) {
  try {
    let ward = null;
    if (newEvent.wardId && ObjectId.isValid(newEvent.wardId)) {
      const wardsCol = await getWardsCollection();
      ward = await wardsCol.findOne({ _id: new ObjectId(newEvent.wardId) });
    }

    if (!ward) {
      ward = await CalendarService.getDefaultWard();
    }

    // Encontra ou cadastra o Membro com dados fornecidos
    const member = await CalendarService.findOrCreateMember(ward._id, {
      name: newEvent.memberName,
      address: newEvent.address,
      phone: newEvent.phone,
    });

    const userEmail = callerAuth?.userEmail || newEvent.userEmail;
    const userName = callerAuth?.userName || newEvent.userName;
    const guestToken = callerAuth?.guestToken || newEvent.guestToken;
    const authProvider: "google" | "guest" = userEmail ? "google" : "guest";

    // Criação do Event com validação de wardId e timestamps
    await CalendarService.createEvent({
      wardId: ward._id,
      memberId: member._id,
      date: newEvent.date,
      notes: newEvent.notes,
      userEmail,
      userName,
      guestToken,
      authProvider,
    });

    return [{ messsage: "Almoço agendado com sucesso" }, { status: 200 }];
  } catch (error) {
    console.error("Erro em BookLunch:", error);
    return [
      {
        messsage: `Erro ao agendar almoço: ${
          error instanceof Error ? error.message : error
        }`,
      },
      { status: 400 },
    ];
  }
}

/**
 * Atualização de compromisso/almoço com validação de propriedade
 */
export async function UpdateBookedDate(
  newEvent: Events,
  callerAuth?: CallerAuth,
) {
  try {
    let ward = null;
    if (newEvent.wardId && ObjectId.isValid(newEvent.wardId)) {
      const wardsCol = await getWardsCollection();
      ward = await wardsCol.findOne({ _id: new ObjectId(newEvent.wardId) });
    }

    if (!ward) {
      ward = await CalendarService.getDefaultWard();
    }

    // 1. Verifica se o evento existe e valida permissão de edição
    const existingEvent = await CalendarService.findEvent({
      date: newEvent.date,
      wardId: ward._id,
    });

    if (!existingEvent) {
      return [
        { messsage: `Nenhum almoço encontrado para a data: ${newEvent.date}` },
        { status: 404 },
      ];
    }

    if (!checkOwnership(existingEvent, callerAuth)) {
      return [
        {
          messsage:
            "Apenas a pessoa que agendou este almoço tem permissão para editá-lo.",
        },
        { status: 403 },
      ];
    }

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
      },
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
      {
        messsage: `Erro ao atualizar almoço: ${
          error instanceof Error ? error.message : error
        }`,
      },
      { status: 400 },
    ];
  }
}

/**
 * Exclusão de compromisso/almoço com validação de propriedade
 */
export async function DeleteBookedDate(
  dateId: string,
  callerAuth?: CallerAuth,
) {
  try {
    // 1. Localiza o evento para verificar propriedade
    const existingEvent = await CalendarService.findEvent({ date: dateId });
    if (!existingEvent) {
      return [
        { messsage: `Nenhum almoço encontrado com o identificador: ${dateId}` },
        { status: 404 },
      ];
    }

    if (!checkOwnership(existingEvent, callerAuth)) {
      return [
        {
          messsage:
            "Apenas a pessoa que agendou este almoço tem permissão para cancelá-lo.",
        },
        { status: 403 },
      ];
    }

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
      {
        messsage: `Erro ao cancelar almoço: ${
          error instanceof Error ? error.message : error
        }`,
      },
      { status: 400 },
    ];
  }
}
