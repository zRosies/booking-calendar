import { ObjectId } from "mongodb";

/**
 * Níveis de Segurança RBAC (Role-Based Access Control)
 */
export enum SecurityLevel {
  USER = 1,     // Membro comum (visualização e agendamento)
  LEADER = 2,   // Líder da Missão / Presidência da Ala (gestão da ala)
  ADMIN = 3,    // Administrador geral (acesso total ao sistema)
}

export type MemberRole = "user" | "leader" | "admin";

/**
 * Model da Entidade Member (Membro / Usuário da Ward) com conceito RBAC
 * Collection: members
 */
export interface Member {
  _id?: ObjectId;
  wardId: ObjectId;                 // Referência para wards._id
  name: string;                     // Nome do membro
  email?: string;                   // E-mail para identificação/login
  picture?: string;                 // URL do avatar / foto de perfil
  secLevel?: SecurityLevel | number; // Nível de segurança RBAC (1: User, 2: Leader, 3: Admin)
  role?: MemberRole;                // Papel / cargo correspondente
  address?: string;                 // Endereço do almoço
  phone?: string;                   // Telefone / WhatsApp de contato
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateMemberDto {
  wardId: ObjectId;
  name: string;
  email?: string;
  picture?: string;
  secLevel?: SecurityLevel | number;
  role?: MemberRole;
  address?: string;
  phone?: string;
}

export interface UpdateMemberDto {
  wardId?: ObjectId;
  name?: string;
  email?: string;
  picture?: string;
  secLevel?: SecurityLevel | number;
  role?: MemberRole;
  address?: string;
  phone?: string;
}
