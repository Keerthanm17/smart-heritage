import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;

    if (!ELEVEN_LABS_API_KEY) {
      return NextResponse.json({ error: "ELEVENLABS API key not configured" }, { status: 500 });
    }

    // Test with a simple request to get voices
    const response = await fetch("https://api.ELEVENLABS.io/v1/voices", {
      method: "GET",
      headers: {
        "xi-api-key": ELEVEN_LABS_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ELEVENLABS API error:", response.status, errorText);
      return NextResponse.json({ 
        error: "ELEVENLABS API error", 
        status: response.status,
        details: errorText 
      }, { status: response.status });
    }

    const voices = await response.json();
    console.log("Available voices:", voices.voices?.length || 0);
    
    return NextResponse.json({ 
      success: true, 
      voiceCount: voices.voices?.length || 0,
      firstVoice: voices.voices?.[0] || null
    });

  } catch (error) {
    console.error("Test TTS API error:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
