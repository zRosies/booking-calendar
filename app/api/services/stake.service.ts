import { ObjectId } from "mongodb";
import { getStakesCollection, getWardsCollection, ensureIndexes } from "../connect";
import { Stake, Ward, CreateStakeDto, CreateWardDto } from "../models";

/**
 * Função utilitária para gerar slugs amigáveis para URL
 * Ex: "Estaca Rio de Janeiro Ilha" -> "ilha" ou "estaca-rio-de-janeiro-ilha"
 * Ex: "Ala Galeão" -> "galeao"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9]+/g, "-")     // Substitui espaços e especiais por hífen
    .replace(/^-+|-+$/g, "");        // Remove hífens no início e fim
}

export interface StakeWithWards extends Stake {
  wards: Ward[];
}

export class StakeService {
  /**
   * Garante a existência da Estaca e Ala padrão inicial ("Estaca Ilha" / "Ala Galeão")
   */
  static async ensureDefaultStakeAndWard(): Promise<{
    stake: Stake & { _id: ObjectId };
    ward: Ward & { _id: ObjectId };
  }> {
    await ensureIndexes();
    const stakesCol = await getStakesCollection();
    const wardsCol = await getWardsCollection();
    const now = new Date();

    // 1. Busca ou cria a Estaca padrão
    let defaultStake = await stakesCol.findOne({});
    if (!defaultStake) {
      const stakeData: Stake = {
        name: "Estaca Rio de Janeiro Ilha",
        slug: "ilha",
        createdAt: now,
        updatedAt: now,
      };
      const res = await stakesCol.insertOne(stakeData);
      defaultStake = { ...stakeData, _id: res.insertedId };
    }

    // 2. Busca ou cria a Ala padrão vinculada à Estaca
    let defaultWard = await wardsCol.findOne({});
    if (!defaultWard) {
      const wardData: Ward = {
        stakeId: defaultStake._id,
        name: "Ala Galeão",
        slug: "galeao",
        createdAt: now,
        updatedAt: now,
      };
      const res = await wardsCol.insertOne(wardData);
      defaultWard = { ...wardData, _id: res.insertedId };
    } else if (!defaultWard.stakeId || !defaultWard.slug) {
      // Atualiza caso a ala já existisse sem stakeId ou slug
      const updateData: Partial<Ward> = {
        stakeId: defaultStake._id,
        slug: defaultWard.slug || slugify(defaultWard.name),
        updatedAt: now,
      };
      await wardsCol.updateOne({ _id: defaultWard._id }, { $set: updateData });
      defaultWard = { ...defaultWard, ...updateData };
    }

    return {
      stake: defaultStake as Stake & { _id: ObjectId },
      ward: defaultWard as Ward & { _id: ObjectId },
    };
  }

  /**
   * Retorna todas as Estacas com suas respectivas Alas agrupadas
   */
  static async getAllStakesWithWards(): Promise<StakeWithWards[]> {
    await ensureIndexes();
    await this.ensureDefaultStakeAndWard();

    const stakesCol = await getStakesCollection();
    const wardsCol = await getWardsCollection();

    const [stakes, wards] = await Promise.all([
      stakesCol.find({}).sort({ name: 1 }).toArray(),
      wardsCol.find({}).sort({ name: 1 }).toArray(),
    ]);

    return stakes.map((stake) => ({
      ...stake,
      wards: wards.filter(
        (w) => w.stakeId && String(w.stakeId) === String(stake._id)
      ),
    }));
  }

  /**
   * Cria uma nova Estaca
   */
  static async createStake(dto: CreateStakeDto): Promise<Stake> {
    await ensureIndexes();
    const stakesCol = await getStakesCollection();
    const now = new Date();

    const trimmedName = dto.name.trim();
    if (!trimmedName) throw new Error("O nome da estaca é obrigatório.");

    let targetSlug = (dto.slug || slugify(trimmedName)).trim();
    if (!targetSlug) targetSlug = slugify(trimmedName);

    // Evita slugs duplicados
    const existing = await stakesCol.findOne({ slug: targetSlug });
    if (existing) {
      throw new Error(`Já existe uma estaca com o identificador de URL (slug) "${targetSlug}".`);
    }

    const newStake: Stake = {
      name: trimmedName,
      slug: targetSlug,
      createdAt: now,
      updatedAt: now,
    };

    const res = await stakesCol.insertOne(newStake);
    return { ...newStake, _id: res.insertedId };
  }

  /**
   * Cria uma nova Ala vinculada a uma Estaca
   */
  static async createWard(dto: CreateWardDto): Promise<Ward> {
    await ensureIndexes();
    const stakesCol = await getStakesCollection();
    const wardsCol = await getWardsCollection();
    const now = new Date();

    const trimmedName = dto.name.trim();
    if (!trimmedName) throw new Error("O nome da ala é obrigatório.");

    if (!dto.stakeId) throw new Error("Selecione a estaca correspondente.");
    const stakeObjectId =
      dto.stakeId instanceof ObjectId ? dto.stakeId : new ObjectId(dto.stakeId);

    const stake = await stakesCol.findOne({ _id: stakeObjectId });
    if (!stake) {
      throw new Error("Estaca informada não foi encontrada.");
    }

    let targetSlug = (dto.slug || slugify(trimmedName)).trim();
    if (!targetSlug) targetSlug = slugify(trimmedName);

    // Evita slugs duplicados dentro da mesma estaca
    const existing = await wardsCol.findOne({
      stakeId: stakeObjectId,
      slug: targetSlug,
    });
    if (existing) {
      throw new Error(
        `Já existe uma ala com o slug "${targetSlug}" nesta estaca.`
      );
    }

    const newWard: Ward = {
      stakeId: stakeObjectId,
      name: trimmedName,
      slug: targetSlug,
      createdAt: now,
      updatedAt: now,
    };

    const res = await wardsCol.insertOne(newWard);
    return { ...newWard, _id: res.insertedId };
  }

  /**
   * Busca Estaca e Ala pelos seus respectivos slugs (para rota /[stake]/[ward])
   */
  static async getWardBySlugs(
    stakeSlug: string,
    wardSlug: string
  ): Promise<{ stake: Stake; ward: Ward } | null> {
    await ensureIndexes();
    await this.ensureDefaultStakeAndWard();

    const stakesCol = await getStakesCollection();
    const wardsCol = await getWardsCollection();

    const stake = await stakesCol.findOne({
      slug: { $regex: new RegExp(`^${stakeSlug.trim()}$`, "i") },
    });
    if (!stake) return null;

    const ward = await wardsCol.findOne({
      stakeId: stake._id,
      slug: { $regex: new RegExp(`^${wardSlug.trim()}$`, "i") },
    });
    if (!ward) return null;

    return { stake, ward };
  }
}
