import { ObjectId } from "mongodb";

/**
 * Model da Entidade Event (Almoço / Compromisso)
 * Collection: events
 */
export interface Event {
  _id?: ObjectId;
  wardId: ObjectId;   // Referência direta para wards._id
  memberId: ObjectId; // Referência direta para members._id
  date: Date;         // Data do almoço
  notes?: string;     // Observações opcionais
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateEventDto {
  wardId: ObjectId;
  memberId: ObjectId;
  date: Date | string;
  notes?: string;
}

export interface UpdateEventDto {
  wardId?: ObjectId;
  memberId?: ObjectId;
  date?: Date | string;
  notes?: string;
}

/**
 * Evento populado com dados do Membro (e Ward) para retorno nas APIs / Frontend
 */
export interface PopulatedCalendarEvent {
  _id?: string | ObjectId;
  wardId: string | ObjectId;
  memberId: string | ObjectId;
  date: string | Date;
  memberName: string;
  address?: string;
  phone?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
