import { ObjectId } from "mongodb";
import {
  getWardsCollection,
  getMembersCollection,
  getEventsCollection,
  ensureIndexes,
} from "../connect";
import {
  Ward,
  Member,
  Event,
  PopulatedCalendarEvent,
  CreateEventDto,
} from "../models";

export class CalendarService {
  /**
   * Garante a Ward (Ala) padrão do sistema (ex: "Ala Galeão")
   */
  static async getDefaultWard(): Promise<Ward & { _id: ObjectId }> {
    const wardsCol = await getWardsCollection();
    let ward = await wardsCol.findOne({});

    if (!ward) {
      const now = new Date();
      const insertResult = await wardsCol.insertOne({
        name: "Ala Galeão",
        createdAt: now,
        updatedAt: now,
      });
      ward = {
        _id: insertResult.insertedId,
        name: "Ala Galeão",
        createdAt: now,
        updatedAt: now,
      };
    }

    return ward as Ward & { _id: ObjectId };
  }

  // Alias retrocompatível
  static getDefaultAla = CalendarService.getDefaultWard;

  /**
   * Validação obrigatória da regra de negócio:
   * 1. A Ward deve existir.
   * 2. O Membro deve existir.
   * 3. event.wardId === member.wardId (o membro deve pertencer à mesma ward).
   */
  static async validateEventWardAndMember(
    wardId: ObjectId,
    memberId: ObjectId
  ): Promise<{ ward: Ward; member: Member }> {
    const wardsCol = await getWardsCollection();
    const membersCol = await getMembersCollection();

    const ward = await wardsCol.findOne({ _id: wardId });
    if (!ward) {
      throw new Error(`Validação falhou: Ward com ID "${wardId}" não existe.`);
    }

    const member = await membersCol.findOne({ _id: memberId });
    if (!member) {
      throw new Error(`Validação falhou: Membro com ID "${memberId}" não existe.`);
    }

    // Regra: event.wardId === member.wardId
    if (!member.wardId.equals(wardId)) {
      throw new Error(
        `Validação falhou: O membro "${member.name}" pertence à Ward "${member.wardId}", e não à Ward informada "${wardId}".`
      );
    }

    return { ward, member };
  }

  // Alias retrocompatível
  static validateEventAlaAndMember = CalendarService.validateEventWardAndMember;

  /**
   * Encontra ou cria um Membro dentro de uma Ward, evitando duplicidades.
   */
  static async findOrCreateMember(
    wardId: ObjectId,
    data: { name: string; address?: string; phone?: string }
  ): Promise<Member & { _id: ObjectId }> {
    const membersCol = await getMembersCollection();
    const trimmedName = data.name.trim();

    // Busca insensível a maiúsculas/minúsculas para o nome dentro da mesma ward
    const existing = await membersCol.findOne({
      wardId,
      name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
    });

    const now = new Date();

    if (existing) {
      // Atualiza telefone e endereço se fornecidos
      const updateFields: Partial<Member> = { updatedAt: now };
      if (data.address && data.address !== existing.address) {
        updateFields.address = data.address;
      }
      if (data.phone && data.phone !== existing.phone) {
        updateFields.phone = data.phone;
      }

      if (Object.keys(updateFields).length > 1) {
        await membersCol.updateOne({ _id: existing._id }, { $set: updateFields });
      }

      return existing as Member & { _id: ObjectId };
    }

    // Cria novo membro com timestamps
    const newMember: Member = {
      wardId,
      name: trimmedName,
      address: data.address || "",
      phone: data.phone || "",
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await membersCol.insertOne(newMember);
    return { ...newMember, _id: insertResult.insertedId };
  }

  /**
   * Consulta otimizada por wardId e intervalo de data (utiliza o índice { wardId: 1, date: 1 })
   * e faz o $lookup com a collection members.
   */
  static async getEventsByWard(
    wardId: ObjectId,
    startDate?: Date,
    endDate?: Date
  ): Promise<PopulatedCalendarEvent[]> {
    await ensureIndexes();
    const eventsCol = await getEventsCollection();

    const matchQuery: Record<string, unknown> = { wardId };

    if (startDate && endDate) {
      matchQuery.date = { $gte: startDate, $lt: endDate };
    } else if (startDate) {
      matchQuery.date = { $gte: startDate };
    }

    const pipeline = [
      { $match: matchQuery },
      { $sort: { date: 1 } },
      {
        $lookup: {
          from: "members",
          localField: "memberId",
          foreignField: "_id",
          as: "memberDoc",
        },
      },
      {
        $unwind: {
          path: "$memberDoc",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          wardId: 1,
          memberId: 1,
          date: 1,
          notes: { $ifNull: ["$notes", ""] },
          createdAt: 1,
          updatedAt: 1,
          memberName: { $ifNull: ["$memberDoc.name", "Membro não encontrado"] },
          address: { $ifNull: ["$memberDoc.address", ""] },
          phone: { $ifNull: ["$memberDoc.phone", ""] },
        },
      },
    ];

    const results = await eventsCol.aggregate<PopulatedCalendarEvent>(pipeline).toArray();

    // Normaliza datas para ISO string para compatibilidade imediata com date-fns no frontend
    return results.map((evt) => ({
      ...evt,
      date: evt.date instanceof Date ? evt.date.toISOString() : String(evt.date),
    }));
  }

  // Alias retrocompatível
  static getEventsByAla = CalendarService.getEventsByWard;

  /**
   * Criação de Evento com validações estritas de relacionamento e existência
   */
  static async createEvent(dto: CreateEventDto): Promise<Event> {
    const wardObjectId = dto.wardId instanceof ObjectId ? dto.wardId : new ObjectId(dto.wardId);
    const memberObjectId = dto.memberId instanceof ObjectId ? dto.memberId : new ObjectId(dto.memberId);

    // Valida existência e wardId coincidente
    await this.validateEventWardAndMember(wardObjectId, memberObjectId);

    const eventsCol = await getEventsCollection();
    const now = new Date();
    const eventDate = dto.date instanceof Date ? dto.date : new Date(dto.date);

    const newEvent: Event = {
      wardId: wardObjectId,
      memberId: memberObjectId,
      date: eventDate,
      notes: dto.notes || "",
      createdAt: now,
      updatedAt: now,
    };

    const result = await eventsCol.insertOne(newEvent);
    return { ...newEvent, _id: result.insertedId };
  }

  /**
   * Atualização de Evento
   */
  static async updateEvent(
    identifier: { eventId?: ObjectId; date?: Date | string; wardId?: ObjectId },
    updates: { memberId?: ObjectId; date?: Date | string; notes?: string }
  ): Promise<boolean> {
    const eventsCol = await getEventsCollection();
    const now = new Date();

    const filter: Record<string, unknown> = {};
    if (identifier.eventId) {
      filter._id = identifier.eventId;
    } else if (identifier.date) {
      const d = identifier.date instanceof Date ? identifier.date : new Date(identifier.date);
      // Intervalo do dia para tolerância com fuso horário UTC
      const startOfDay = new Date(d);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(d);
      endOfDay.setUTCHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    if (identifier.wardId) {
      filter.wardId = identifier.wardId;
    }

    const currentEvent = await eventsCol.findOne(filter);
    if (!currentEvent) {
      return false;
    }

    // Se estiver alterando o membro, valida a nova relação
    const targetMemberId = updates.memberId || currentEvent.memberId;
    const targetWardId = currentEvent.wardId;
    await this.validateEventWardAndMember(targetWardId, targetMemberId);

    const setObj: Partial<Event> = {
      updatedAt: now,
    };

    if (updates.memberId) setObj.memberId = updates.memberId;
    if (updates.date) setObj.date = updates.date instanceof Date ? updates.date : new Date(updates.date);
    if (updates.notes !== undefined) setObj.notes = updates.notes;

    const result = await eventsCol.updateOne({ _id: currentEvent._id }, { $set: setObj });
    return result.modifiedCount > 0;
  }

  /**
   * Exclusão de Evento por ID ou Data
   */
  static async deleteEvent(identifier: { eventId?: ObjectId; date?: string }): Promise<boolean> {
    const eventsCol = await getEventsCollection();

    if (identifier.eventId) {
      const result = await eventsCol.deleteOne({ _id: identifier.eventId });
      return result.deletedCount > 0;
    }

    if (identifier.date) {
      // Tenta parsing de ObjectId ou data
      if (ObjectId.isValid(identifier.date) && identifier.date.length === 24) {
        const result = await eventsCol.deleteOne({ _id: new ObjectId(identifier.date) });
        if (result.deletedCount > 0) return true;
      }

      const d = new Date(identifier.date);
      if (!isNaN(d.getTime())) {
        const startOfDay = new Date(d);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(d);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const result = await eventsCol.deleteOne({
          date: { $gte: startOfDay, $lte: endOfDay },
        });
        return result.deletedCount > 0;
      }
    }

    return false;
  }
}
