import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { mediaId, invitationId, ownerId, purpose, mimeType } = await req.json();

    if (!mediaId || !invitationId || !ownerId || !purpose || !mimeType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const headers = {
      Authorization: `Bearer ${supabaseServiceKey}`,
      apikey: supabaseServiceKey,
    };

    const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    const quarantinePath = `${ownerId}/${invitationId}/${purpose}/${mediaId}.${ext}`;

    const downloadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/invitation_upload_quarantine/${quarantinePath}`,
      { headers },
    );

    if (!downloadResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to download from quarantine." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const fileBuffer = await downloadResponse.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);

    if (mimeType.startsWith("image/")) {
      const results = await processImage(fileBytes, ext, ownerId, invitationId, mediaId, purpose, supabaseUrl, headers);

      await fetch(`${supabaseUrl}/rest/v1/media_assets`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json", "Prefer": "return=minimal" },
        body: JSON.stringify({
          status: "ready",
          final_path: results.finalPath,
          detected_mime: mimeType,
          updated_at: new Date().toISOString(),
        }).replace(/"id":.*?,/, `"id":"eq.${mediaId}",`),
      });

      await fetch(
        `${supabaseUrl}/storage/v1/object/invitation_upload_quarantine/${quarantinePath}`,
        { method: "DELETE", headers },
      );

      return new Response(
        JSON.stringify({ success: true, finalPath: results.finalPath }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const finalPath = `${ownerId}/${invitationId}/${purpose}/${mediaId}.${ext}`;
    await fetch(
      `${supabaseUrl}/storage/v1/object/invitation_media/${finalPath}`,
      {
        method: "POST",
        headers: { ...headers, "Content-Type": mimeType, "x-upsert": "true" },
        body: fileBuffer,
      },
    );

    await fetch(`${supabaseUrl}/rest/v1/media_assets`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json", "Prefer": "return=minimal" },
      body: JSON.stringify({
        status: "ready",
        final_path: finalPath,
        detected_mime: mimeType,
        updated_at: new Date().toISOString(),
      }).replace(/"id":.*?,/, `"id":"eq.${mediaId}",`),
    });

    await fetch(
      `${supabaseUrl}/storage/v1/object/invitation_upload_quarantine/${quarantinePath}`,
      { method: "DELETE", headers },
    );

    return new Response(
      JSON.stringify({ success: true, finalPath }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Media processing error:", error);
    return new Response(
      JSON.stringify({ error: "Processing failed." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

async function processImage(
  fileBytes: Uint8Array,
  ext: string,
  ownerId: string,
  invitationId: string,
  mediaId: string,
  purpose: string,
  supabaseUrl: string,
  headers: Record<string, string>,
): Promise<{ finalPath: string }> {
  const finalPath = `${ownerId}/${invitationId}/${purpose}/${mediaId}.${ext}`;
  const contentType = `image/${ext === "jpg" ? "jpeg" : ext}`;

  await fetch(`${supabaseUrl}/storage/v1/object/invitation_media/${finalPath}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": contentType, "x-upsert": "true" },
    body: fileBytes,
  });

  const sizes = [
    { suffix: "_thumbnail", maxDim: 150 },
    { suffix: "_medium", maxDim: 600 },
    { suffix: "_large", maxDim: 1200 },
  ];

  for (const size of sizes) {
    const variantPath = `${ownerId}/${invitationId}/${purpose}/${mediaId}${size.suffix}.${ext}`;
    await fetch(`${supabaseUrl}/storage/v1/object/invitation_media/${variantPath}`, {
      method: "POST",
      headers: { ...headers, "Content-Type": contentType, "x-upsert": "true" },
      body: fileBytes,
    });
  }

  return { finalPath };
}
