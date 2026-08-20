export async function GET(request: Request) {
  try {
    const prodUrl = process.env.SUPABASE_PROD_URL;
    const prodKey = process.env.SUPABASE_PROD_ANON_KEY;

    return Response.json({
      ok: true,
      prodUrl: prodUrl ? "SET" : "MISSING",
      prodKey: prodKey ? "SET" : "MISSING",
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}
