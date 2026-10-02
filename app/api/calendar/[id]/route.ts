import { NextResponse } from "next/server";
import { DeleteBookedDate } from "../../controllers/calendar";
import { getCallerAuth } from "../../auth/session";

interface Context {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(req: Request, context: unknown) {
  const { id } = await (context as Context).params;
  const callerAuth = getCallerAuth(req);

  const result = await DeleteBookedDate(id, callerAuth);

  return NextResponse.json(result[0], result[1]);
}

