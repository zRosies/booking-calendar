import { Events } from "@/app/components/calendar";
import {
  BookLunch,
  getMonthData,
  UpdateBookedDate,
} from "../controllers/calendar";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wardId = searchParams.get("wardId") || undefined;
  const data = await getMonthData(wardId);
  return NextResponse.json(data, { status: 200 });
}

export async function POST(req: Request) {
  const body: Events & { wardId?: string } = await req.json();
  const result = await BookLunch(body);
  return NextResponse.json(result[0], result[1]);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const payload = body.body;

  const result = await UpdateBookedDate(payload);

  return NextResponse.json(result[0], result[1]);
}
