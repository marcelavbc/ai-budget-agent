import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const env = searchParams.get("env") || "prod";

    console.log("DEBUG: env param =", env);
    console.log(
      "DEBUG: SUPABASE_DEV_URL =",
      process.env.SUPABASE_DEV_URL ? "SET" : "MISSING"
    );
    console.log(
      "DEBUG: SUPABASE_PROD_URL =",
      process.env.SUPABASE_PROD_URL ? "SET" : "MISSING"
    );

    let supabaseUrl: string | undefined;
    let supabaseKey: string | undefined;

    if (env === "dev") {
      supabaseUrl = process.env.SUPABASE_DEV_URL;
      supabaseKey = process.env.SUPABASE_DEV_ANON_KEY;
    } else {
      supabaseUrl = process.env.SUPABASE_PROD_URL;
      supabaseKey = process.env.SUPABASE_PROD_ANON_KEY;
    }

    if (!supabaseUrl || !supabaseKey) {
      return Response.json(
        { ok: false, error: `Missing Supabase configuration for env: ${env}` },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.from("contacts").select("id").limit(1);

    if (error) {
      return Response.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return Response.json({ ok: true, env });
  } catch (error) {
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
