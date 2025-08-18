import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { text, language } = await request.json();

    if (!text || !language) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
    if (!ELEVEN_LABS_API_KEY) {
      return NextResponse.json({ error: "Eleven Labs API key not configured" }, { status: 500 });
    }

    // Use the correct English voice ID
    const voiceId = "XPqjYvTqfyUQr09yCpCY";
    const ELEVENLABSAPIURL = `https://api.ELEVENLABS.io/v1/text-to-speech/${voiceId}`;

    const elevenResponse = await fetch(ELEVENLABSAPIURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVEN_LABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!elevenResponse.ok) {
      const errorText = await elevenResponse.text();
      return NextResponse.json({ error: errorText }, { status: 500 });
    }

    const arrayBuffer = await elevenResponse.arrayBuffer();
    const audioBase64 = Buffer.from(arrayBuffer).toString("base64");
    return NextResponse.json({ audio: audioBase64 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
