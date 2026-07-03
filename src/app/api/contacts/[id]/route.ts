import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  deleteContactById,
  updateContactById,
  getContactById,
} from "@/features/contacts/lib/contacts";

type PatchBody = Parameters<typeof updateContactById>[1];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const patch = (await request.json()) as PatchBody;
    if (!patch || typeof patch !== "object") {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    await updateContactById(id, patch);
    revalidatePath("/contacts");
    revalidatePath(`/contacts/${id}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    return NextResponse.json(
      { error: msg || "No s'ha pogut actualitzar el contacte." },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const contact = await getContactById(id);
    return NextResponse.json(contact);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    return NextResponse.json(
      { error: msg || "No s'ha pogut recuperar el contacte." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await deleteContactById(id);
    revalidatePath("/contacts");
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    return NextResponse.json(
      { error: msg || "No s'ha pogut eliminar el contacte." },
      { status: 500 }
    );
  }
}
