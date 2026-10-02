import { ObjectId } from "mongodb";

/**
 * Model da Entidade Ward (Ala)
 * Collection: wards
 */
export interface Ward {
  _id?: ObjectId;
  stakeId?: ObjectId;  // Referência para stakes._id
  name: string;        // Ex: "Ala Galeão"
  slug?: string;       // Ex: "galeao" (amigável para rotas /[stake]/[ward])
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateWardDto {
  stakeId?: ObjectId | string;
  name: string;
  slug?: string;
}

export interface UpdateWardDto {
  stakeId?: ObjectId | string;
  name?: string;
  slug?: string;
}

// Alias para compatibilidade semântica
export type Ala = Ward;
export type CreateAlaDto = CreateWardDto;
export type UpdateAlaDto = UpdateWardDto;
