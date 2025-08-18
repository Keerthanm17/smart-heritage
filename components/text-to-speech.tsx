"use client";

import { useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";

interface TextToSpeechProps {
  text: string;
  language?: string;
}

export function TextToSpeech({ text, language = "en" }: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<string>("Idle");
  const [useELEVENLABS, setUseELEVENLABS] = useState(true);

  useEffect(() => {
    if (audioElement) {
      audioElement.volume = isMuted ? 0 : volume;
    }
  }, [audioElement, volume, isMuted]);

  const fetchAndPlayAudio = async (textToSpeak: string, targetLanguage: string) => {
    setStatus("Fetching audio...");
    try {
      console.log("Requesting TTS for:", { text: textToSpeak.substring(0, 100), language: targetLanguage });
      
      const response = await fetch("/api/tss", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: textToSpeak,
          language: targetLanguage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("TTS API error response:", errorData);
        throw new Error(`TTS API error: ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.audio) {
        throw new Error("No audio data received from TTS API");
      }

      console.log("Received audio data, creating blob...");
      const audioBlob = new Blob([Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log("Playing audio...");
      
      if (audioElement) {
        audioElement.pause();
        audioElement.src = audioUrl;
        audioElement.load();
        audioElement.onended = () => {
          setIsPlaying(false);
          setStatus("Idle");
        };
        audioElement.onerror = () => {
          setIsPlaying(false);
          setStatus("Audio playback error");
        };
        await audioElement.play();
        setIsPlaying(true);
        setStatus("Playing...");
      } else {
        const newAudio = new Audio(audioUrl);
        newAudio.volume = isMuted ? 0 : volume;
        newAudio.onended = () => {
          setIsPlaying(false);
          setStatus("Idle");
        };
        newAudio.onerror = () => {
          setIsPlaying(false);
          setStatus("Audio playback error");
        };
        await newAudio.play();
        setAudioElement(newAudio);
        setIsPlaying(true);
        setStatus("Playing...");
      }

    } catch (error: any) {
      console.error("Text-to-speech error:", error);
      console.log("ELEVENLABS failed, falling back to browser speech synthesis");
      setUseELEVENLABS(false);
      fallbackToSpeechSynthesis(textToSpeak, targetLanguage);
    }
  };

  const fallbackToSpeechSynthesis = (textToSpeak: string, targetLanguage: string) => {
    setStatus("Using browser speech...");
    try {
      // Stop any current speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = targetLanguage;
      utterance.volume = isMuted ? 0 : volume;
      utterance.rate = 1;
      utterance.pitch = 1;

      utterance.onstart = () => {
        setIsPlaying(true);
        setStatus("Playing (browser)...");
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setStatus("Idle");
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        setStatus("Speech synthesis error");
      };

      window.speechSynthesis.speak(utterance);
    } catch (error: any) {
      console.error("Speech synthesis error:", error);
      setStatus("Speech not available");
      setIsPlaying(false);
    }
  };

  const togglePlay = async () => {
    if (isPlaying) {
      if (useELEVENLABS && audioElement) {
        audioElement.pause();
        setIsPlaying(false);
        setStatus("Paused");
      } else {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        setStatus("Stopped");
      }
    } else {
      if (useELEVENLABS) {
        await fetchAndPlayAudio(text, language);
      } else {
        fallbackToSpeechSynthesis(text, language);
      }
    }
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
  };

  // Handle mute toggle
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={togglePlay}
            disabled={!text || status === "Fetching audio..."}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          <Button variant="outline" size="icon" onClick={toggleMute} aria-label={isMuted ? "Unmute" : "Mute"}>
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>

          <div className="flex-1">
            <Slider
              value={[volume]}
              min={0}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              aria-label="Volume"
            />
          </div>

          <div className="text-xs text-muted-foreground flex flex-col items-end">
            <div>Language: {language}</div>
            <div className="text-xs opacity-70 max-w-32 truncate" title={status}>
              Status: {status}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
