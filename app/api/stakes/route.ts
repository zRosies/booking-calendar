import { NextResponse } from "next/server";
import { StakeService } from "../services/stake.service";

export async function GET() {
  try {
    const data = await StakeService.getAllStakesWithWards();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Erro ao buscar estacas: ${error}` },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const created = await StakeService.createStake(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
