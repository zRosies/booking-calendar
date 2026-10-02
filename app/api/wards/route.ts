import { NextResponse } from "next/server";
import { getWardsCollection } from "../connect";

export async function GET() {
  try {
    const wardsCol = await getWardsCollection();
    const wards = await wardsCol.find({}).toArray();
    return NextResponse.json(wards, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Erro ao buscar wards: ${error}` },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "O campo 'name' é obrigatório." },
        { status: 400 }
      );
    }

    const wardsCol = await getWardsCollection();
    const now = new Date();
    const result = await wardsCol.insertOne({
      name: body.name.trim(),
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      { _id: result.insertedId, name: body.name.trim(), createdAt: now, updatedAt: now },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: `Erro ao criar ward: ${error}` },
      { status: 500 }
    );
  }
}
