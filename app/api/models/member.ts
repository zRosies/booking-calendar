import { ObjectId } from "mongodb";

/**
 * Model da Entidade Member (Membro da Ward / Ala)
 * Collection: members
 */
export interface Member {
  _id?: ObjectId;
  wardId: ObjectId; // Referência para wards._id
  name: string;
  address?: string;
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateMemberDto {
  wardId: ObjectId;
  name: string;
  address?: string;
  phone?: string;
}

export interface UpdateMemberDto {
  wardId?: ObjectId;
  name?: string;
  address?: string;
  phone?: string;
}
