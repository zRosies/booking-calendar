import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { CalendarService } from "../services/calendar.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const wardIdParam = searchParams.get("wardId") || searchParams.get("alaId");
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");

    let wardId: ObjectId;
    if (wardIdParam) {
      if (!ObjectId.isValid(wardIdParam)) {
        return NextResponse.json({ error: "wardId inválido." }, { status: 400 });
      }
      wardId = new ObjectId(wardIdParam);
    } else {
      const defaultWard = await CalendarService.getDefaultWard();
      wardId = defaultWard._id;
    }

    const startDate = startParam ? new Date(startParam) : undefined;
    const endDate = endParam ? new Date(endParam) : undefined;

    const events = await CalendarService.getEventsByWard(wardId, startDate, endDate);
    return NextResponse.json(events, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Erro ao buscar eventos: ${error}` },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const wardId = body.wardId || body.alaId;
    const { memberId, date, notes } = body;

    if (!wardId || !ObjectId.isValid(wardId)) {
      return NextResponse.json(
        { error: "O campo 'wardId' é obrigatório e deve ser um ObjectId válido." },
        { status: 400 }
      );
    }
    if (!memberId || !ObjectId.isValid(memberId)) {
      return NextResponse.json(
        { error: "O campo 'memberId' é obrigatório e deve ser um ObjectId válido." },
        { status: 400 }
      );
    }
    if (!date) {
      return NextResponse.json({ error: "O campo 'date' é obrigatório." }, { status: 400 });
    }

    const createdEvent = await CalendarService.createEvent({
      wardId: new ObjectId(wardId),
      memberId: new ObjectId(memberId),
      date: new Date(date),
      notes: notes || "",
    });

    return NextResponse.json(createdEvent, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes("Validação falhou") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
