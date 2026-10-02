import { ObjectId } from "mongodb";

/**
 * Model da Entidade Stake (Estaca)
 * Collection: stakes
 */
export interface Stake {
  _id?: ObjectId;
  name: string;        // Ex: "Estaca Rio de Janeiro Ilha"
  slug: string;        // Ex: "ilha" (amigável para rotas /[stake]/[ward])
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateStakeDto {
  name: string;
  slug?: string;
}

export interface UpdateStakeDto {
  name?: string;
  slug?: string;
}
