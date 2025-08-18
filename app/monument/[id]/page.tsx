"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { MonumentDetails } from "@/components/monument-details"
import { TextToSpeech } from "@/components/text-to-speech"
import { LanguageSelector } from "@/components/language-selector"
import { ChatInterface } from "@/components/chat-interface"
import { getMonumentById } from "@/lib/monument-data"
import { useToast } from "@/hooks/use-toast"
import type { Monument } from "@/lib/types"
import { translateMonumentFieldsWithAPI } from "@/lib/translation"

// Complete offline translations - no API calls needed!
const OFFLINE_TRANSLATIONS: Record<string, Record<string, { name: string; description: string; location: string }>> = {
  "qutub-minar": {
    hi: {
      name: "कुतुब मीनार",
      description:
        "कुतुब मीनार दिल्ली में स्थित एक प्रसिद्ध ऐतिहासिक स्मारक है। यह 73 मीटर ऊंची मीनार है जो लाल बलुआ पत्थर और संगमरमर से बनी है। इसका निर्माण 1193 में कुतुब-उद-दीन ऐबक द्वारा शुरू किया गया था। यह यूनेस्को विश्व धरोहर स्थल है और भारत की सबसे ऊंची ईंट की मीनार है।",
      location: "दिल्ली, भारत",
    },
    kn: {
      name: "ಕುತುಬ್ ಮಿನಾರ್",
      description:
        "ಕುತುಬ್ ಮಿನಾರ್ ದೆಹಲಿಯಲ್ಲಿರುವ ಒಂದು ಪ್ರಸಿದ್ಧ ಐತಿಹಾಸಿಕ ಸ್ಮಾರಕವಾಗಿದೆ. ಇದು 73 ಮೀಟರ್ ಎತ್ತರದ ಗೋಪುರವಾಗಿದ್ದು, ಕೆಂಪು ಮರಳುಗಲ್ಲು ಮತ್ತು ಅಮೃತಶಿಲೆಯಿಂದ ನಿರ್ಮಿಸಲಾಗಿದೆ. ಇದರ ನಿರ್ಮಾಣವನ್ನು 1193 ರಲ್ಲಿ ಕುತುಬ್-ಉದ್-ದೀನ್ ಐಬಕ್ ಪ್ರಾರಂಭಿಸಿದರು।",
      location: "ದೆಹಲಿ, ಭಾರತ",
    },
    te: {
      name: "కుతుబ్ మినార్",
      description:
        "కుతుబ్ మినార్ ఢిల్లీలో ఉన్న ఒక ప్రసిద్ధ చారిత్రక స్మారకం. ఇది 73 మీటర్ల ఎత్తైన గోపురం, ఎరుపు ఇసుకరాయి మరియు పాలరాయితో నిర్మించబడింది. దీని నిర్మాణాన్ని 1193లో కుతుబ్-ఉద్-దీన్ ఐబక్ ప్రారంభించారు।",
      location: "ఢిల్లీ, భారతదేశం",
    },
    ta: {
      name: "குதுப் மினார்",
      description:
        "குதுப் மினார் டெல்லியில் அமைந்துள்ள ஒரு புகழ்பெற்ற வரலாற்று நினைவுச்சின்னம். இது 73 மீட்டர் உயரமான கோபுரம், சிவப்பு மணற்கல் மற்றும் பளிங்குக் கல்லால் கட்டப்பட்டது। இதன் கட்டுமானம் 1193ல் குதுப்-உத்-தீன் ஐபக்கால் தொடங்கப்பட்டது।",
      location: "டெல்லி, இந்தியா",
    },
  },
  "chitradurga-fort": {
    hi: {
      name: "चित्रदुर्ग किला",
      description:
        "चित्रदुर्ग किला कर्नाटक के चित्रदुर्ग जिले में स्थित एक ऐतिहासिक किला है। यह किला अपनी अनूठी वास्तुकला और रक्षात्मक संरचना के लिए प्रसिद्ध है। इसे 'कल्लिना कोटे' भी कहा जाता है, जिसका अर्थ है 'पत्थर का किला'।",
      location: "चित्रदुर्ग, कर्नाटक, भारत",
    },
    kn: {
      name: "ಚಿತ್ರದುರ್ಗ ಕೋಟೆ",
      description:
        "ಚಿತ್ರದುರ್ಗ ಕೋಟೆ ಕರ್ನಾಟಕದ ಚಿತ್ರದುರ್ಗ ಜಿಲ್ಲೆಯಲ್ಲಿರುವ ಒಂದು ಐತಿಹಾಸಿಕ ಕೋಟೆಯಾಗಿದೆ. ಈ ಕೋಟೆಯು ತನ್ನ ವಿಶಿಷ್ಟ ವಾಸ್ತುಶಿಲ್ಪ ಮತ್ತು ರಕ್ಷಣಾತ್ಮಕ ರಚನೆಗೆ ಪ್ರಸಿದ್ಧವಾಗಿದೆ। ಇದನ್ನು 'ಕಲ್ಲಿನ ಕೋಟೆ' ಎಂದೂ ಕರೆಯಲಾಗುತ್ತದೆ।",
      location: "ಚಿತ್ರದುರ್ಗ, ಕರ್ನಾಟಕ, ಭಾರತ",
    },
    te: {
      name: "చిత్రదుర్గ కోట",
      description:
        "చిత్రదుర్గ కోట కర్ణాటక రాష్ట్రంలోని చిత్రదుర్గ జిల్లాలో ఉన్న ఒక చారిత్రక కోట. ఈ కోట దాని ప్రత్యేకమైన వాస్తుశిల్పం మరియు రక్షణాత్మక నిర్మాణానికి ప్రసిద్ధి చెందింది। దీనిని 'ಕಲ್ಲಿನ కోಟೆ' అని కూడా అంటారు।",
      location: "చిత్రదుర్గ, కర్ణాటక, భారతదేశం",
    },
    ta: {
      name: "சித்திரதுர்கா கோட்டை",
      description:
        "சித்திரதுர்கா கோட்டை கர்நாடக மாநிலத்தின் சித்திரதுர்கா மாவட்டத்தில் அமைந்துள்ள ஒரு வரலாற்று கோட்டையாகும். இந்த கோட்டை அதன் தனித்துவமான கட்டிடக்கலை மற்றும் பாதுகாப்பு அமைப்புக்காக புகழ்பெற்றது। இது 'கல்லின கோட்டே' என்றும் அழைக்கப்படுகிறது।",
      location: "சித்திரதுர்கா, கர்நாடகா, இந்தியா",
    },
  },
}

const VOICE_LANGUAGES = {
  en: "en-US",
  hi: "hi-IN",
  kn: "kn-IN",
  te: "te-IN",
  ta: "ta-IN",
}

export default function MonumentPage({ params }: { params: Promise<{ id: string }> }) {
  const [currentLanguage, setCurrentLanguage] = useState<string>("en")
  const [monument, setMonument] = useState<Monument | null>(null)
  const [translatedMonument, setTranslatedMonument] = useState<Monument & { voiceLanguage?: string } | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const { toast } = useToast()

  const resolvedParams = React.use(params);

  // Load monument data
  useEffect(() => {
    const loadMonument = async () => {
      try {
        const monumentData = await getMonumentById(resolvedParams.id)
        if (!monumentData) {
          notFound()
        }
        setMonument(monumentData)
        setTranslatedMonument(monumentData)
      } catch (error) {
        console.error("Error loading monument:", error)
        notFound()
      }
    }
    loadMonument()
  }, [resolvedParams.id])

  const handleLanguageChange = async (language: string) => {
    if (!monument) return

    setCurrentLanguage(language)
    setIsTranslating(true)

    try {
      // English - return original
      if (language === "en") {
        setTranslatedMonument({
          ...(monument as Monument),
          voiceLanguage: "en-US",
        })
        toast({
          title: "Language changed",
          description: "Now displaying in English.",
        })
        setIsTranslating(false)
        return
      }

      // Check for offline translation first
      const translation = OFFLINE_TRANSLATIONS[(monument as Monument).id]?.[language as keyof typeof VOICE_LANGUAGES]

      if (translation) {
        // We have a manual translation for basic fields
        const baseTranslatedMonument = {
          ...(monument as Monument),
          name: translation.name,
          description: translation.description,
          location: translation.location,
          voiceLanguage: VOICE_LANGUAGES[language as keyof typeof VOICE_LANGUAGES] || "en-US",
        }

        // Use LibreTranslate API to translate remaining fields
        const fullyTranslatedMonument = await translateMonumentFieldsWithAPI(
          baseTranslatedMonument,
          language
        )

        setTranslatedMonument(fullyTranslatedMonument)

        const languageNames: Record<string, string> = {
          hi: "Hindi",
          kn: "Kannada",
          te: "Telugu",
          ta: "Tamil",
        }

        toast({
          title: "Language changed successfully",
          description: `Content is now displayed in ${languageNames[language]}.`,
        })
      } else {
        // No manual translation available, use LibreTranslate for all fields
        const fullyTranslatedMonument = await translateMonumentFieldsWithAPI(
          monument as Monument,
          language
        )

        setTranslatedMonument({
          ...fullyTranslatedMonument,
          voiceLanguage: VOICE_LANGUAGES[language as keyof typeof VOICE_LANGUAGES] || "en-US",
        })

        toast({
          title: "Translation completed",
          description: "Content has been translated using AI translation.",
        })
      }
    } catch (error) {
      console.error("Translation error:", error)
      // Always fall back to original
      setTranslatedMonument({
        ...(monument as Monument),
        voiceLanguage: "en-US",
      })

      toast({
        title: "Translation failed",
        description: "Showing content in English instead.",
        variant: "destructive",
      })
    } finally {
      setIsTranslating(false)
    }
  }

  const getLanguageName = (code: string) => {
    const names: Record<string, string> = {
      en: "English",
      hi: "Hindi",
      kn: "Kannada",
      te: "Telugu",
      ta: "Tamil",
    }
    return names[code] || code
  }

  if (!monument || !translatedMonument) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Suspense fallback={<div className="h-64 animate-pulse bg-gray-200 rounded-lg"></div>}>
            <MonumentDetails monument={translatedMonument} />
          </Suspense>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 items-start">
            <LanguageSelector
              monumentId={monument.id}
              onLanguageChange={handleLanguageChange}
              isLoading={isTranslating}
            />
          </div>

          {isTranslating && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">🔄 Translating content to {getLanguageName(currentLanguage)}...</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <h2 className="text-2xl font-bold mb-4">Ask Maya about this monument</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Maya is your AI heritage guide with advanced natural language understanding. She adapts to your
              conversation style and provides contextual responses! 🤖✨
            </p>
            <Suspense fallback={<div className="h-96 animate-pulse bg-gray-200 rounded-lg"></div>}>
              <ChatInterface monumentId={monument.id} />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  )
}
