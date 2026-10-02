import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getMembersCollection, getWardsCollection } from "../connect";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const wardId = searchParams.get("wardId") || searchParams.get("alaId");

    const membersCol = await getMembersCollection();
    const filter: Record<string, unknown> = {};

    if (wardId) {
      if (!ObjectId.isValid(wardId)) {
        return NextResponse.json({ error: "wardId inválido." }, { status: 400 });
      }
      filter.wardId = new ObjectId(wardId);
    }

    const members = await membersCol.find(filter).sort({ name: 1 }).toArray();
    return NextResponse.json(members, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Erro ao buscar membros: ${error}` },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const wardId = body.wardId || body.alaId;
    const { name, address, phone } = body;

    if (!wardId || !ObjectId.isValid(wardId)) {
      return NextResponse.json(
        { error: "O campo 'wardId' é obrigatório e deve ser um ObjectId válido." },
        { status: 400 }
      );
    }
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "O campo 'name' é obrigatório." }, { status: 400 });
    }

    const wardsCol = await getWardsCollection();
    const wardExists = await wardsCol.findOne({ _id: new ObjectId(wardId) });
    if (!wardExists) {
      return NextResponse.json({ error: "Ward não encontrada para o wardId informado." }, { status: 404 });
    }

    const membersCol = await getMembersCollection();
    const now = new Date();
    const newMember = {
      wardId: new ObjectId(wardId),
      name: name.trim(),
      address: address || "",
      phone: phone || "",
      createdAt: now,
      updatedAt: now,
    };

    const result = await membersCol.insertOne(newMember);

    return NextResponse.json(
      { _id: result.insertedId, ...newMember },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: `Erro ao criar membro: ${error}` },
      { status: 500 }
    );
  }
}
