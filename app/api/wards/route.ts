import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getWardsCollection } from "../connect";
import { StakeService } from "../services/stake.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const stakeId = searchParams.get("stakeId");
    const stakeSlug = searchParams.get("stakeSlug");
    const wardSlug = searchParams.get("wardSlug");

    // Se forneceu slugs específicos de estaca e ala
    if (stakeSlug && wardSlug) {
      const match = await StakeService.getWardBySlugs(stakeSlug, wardSlug);
      if (!match) {
        return NextResponse.json(
          { error: "Estaca ou Ala não encontrada para os slugs informados." },
          { status: 404 }
        );
      }
      return NextResponse.json(match, { status: 200 });
    }

    const wardsCol = await getWardsCollection();
    const filter: Record<string, unknown> = {};

    if (stakeId && ObjectId.isValid(stakeId)) {
      filter.stakeId = new ObjectId(stakeId);
    }

    const wards = await wardsCol.find(filter).sort({ name: 1 }).toArray();
    return NextResponse.json(wards, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Erro ao buscar alas: ${error}` },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const created = await StakeService.createWard(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
