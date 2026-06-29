import { NextResponse } from "next/server";
import { getContactJobAddresses } from "@/features/contacts/lib/contacts";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const addresses = await getContactJobAddresses(id);
    return NextResponse.json({ addresses });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error desconegut.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
