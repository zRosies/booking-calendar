import { Events } from "@/app/components/calendar";
import {
  BookLunch,
  getMonthData,
  UpdateBookedDate,
} from "../controllers/calendar";
import { getCallerAuth } from "../auth/session";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wardId = searchParams.get("wardId") || undefined;
  const data = await getMonthData(wardId);
  return NextResponse.json(data, { status: 200 });
}

export async function POST(req: Request) {
  const body: Events & { wardId?: string } = await req.json();
  const callerAuth = getCallerAuth(req, body.guestToken);
  const result = await BookLunch(body, callerAuth);
  return NextResponse.json(result[0], result[1]);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const payload = body.body || body;
  const callerAuth = getCallerAuth(req, payload.guestToken);

  const result = await UpdateBookedDate(payload, callerAuth);

  return NextResponse.json(result[0], result[1]);
}

