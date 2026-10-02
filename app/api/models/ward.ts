import { ObjectId } from "mongodb";

/**
 * Model da Entidade Ward (Ala)
 * Collection: wards
 */
export interface Ward {
  _id?: ObjectId;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateWardDto {
  name: string;
}

export interface UpdateWardDto {
  name?: string;
}

// Alias para compatibilidade semântica
export type Ala = Ward;
export type CreateAlaDto = CreateWardDto;
export type UpdateAlaDto = UpdateWardDto;
