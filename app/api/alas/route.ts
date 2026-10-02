import { GET as getWards, POST as postWards } from "../wards/route";

export async function GET(req: Request) {
  return getWards(req);
}

export async function POST(req: Request) {
  return postWards(req);
}
