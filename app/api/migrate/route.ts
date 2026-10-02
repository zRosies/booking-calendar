import { NextResponse } from "next/server";
import { MigrationService } from "../services/migration.service";

export async function POST() {
  try {
    const result = await MigrationService.runMigration();
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Envie um POST para /api/migrate para iniciar a migração de dados do modelo antigo.",
  });
}
