async function readJson(res: Response): Promise<unknown> {
  try {
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

function errorMessage(data: unknown, fallback: string): string {
  if (typeof data === "object" && data !== null) {
    const msg = (data as { error?: unknown }).error;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return fallback;
}

export async function updateContact(
  contactId: string,
  patch: Record<string, unknown>
): Promise<void> {
  const res = await fetch(`/api/contacts/${contactId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const data = await readJson(res);
  if (!res.ok) {
    throw new Error(errorMessage(data, "No s'ha pogut actualitzar el contacte."));
  }
}

export async function deleteContact(contactId: string): Promise<void> {
  const res = await fetch(`/api/contacts/${contactId}`, {
    method: "DELETE",
  });
  const data = await readJson(res);
  if (!res.ok) {
    throw new Error(errorMessage(data, "No s'ha pogut eliminar el contacte."));
  }
}
