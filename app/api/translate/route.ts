import { type NextRequest, NextResponse } from "next/server"
import { getMonumentById } from "@/lib/monument-data"
import { translateMultiple, getSupportedLanguages, isLanguageSupported } from "@/lib/libretranslate"

// Language configurations
const languageConfig = {
  en: { name: "English", voice: "en-US" },
  hi: { name: "Hindi", voice: "hi-IN" },
  kn: { name: "Kannada", voice: "kn-IN" },
  te: { name: "Telugu", voice: "te-IN" },
  ta: { name: "Tamil", voice: "ta-IN" },
}

// Complete manual translations for monuments
const completeTranslations = {
  "qutub-minar": {
    hi: {
      name: "कुतुब मीनार",
      description:
        "कुतुब मीनार दिल्ली में स्थित एक प्रसिद्ध ऐतिहासिक स्मारक है। यह 73 मीटर ऊंची मीनार है जो लाल बलुआ पत्थर और संगमरमर से बनी है। इसका निर्माण 1193 में कुतुब-उद-दीन ऐबक द्वारा शुरू किया गया था। यह यूनेस्को विश्व धरोहर स्थल है और भारत की सबसे ऊंची ईंट की मीनार है। इस मीनार में पांच मंजिलें हैं और यह इस्लामी वास्तुकला का एक उत्कृष्ट उदाहरण है।",
      location: "दिल्ली, भारत",
    },
    kn: {
      name: "ಕುತುಬ್ ಮಿನಾರ್",
      description:
        "ಕುತುಬ್ ಮಿನಾರ್ ದೆಹಲಿಯಲ್ಲಿರುವ ಒಂದು ಪ್ರಸಿದ್ಧ ಐತಿಹಾಸಿಕ ಸ್ಮಾರಕವಾಗಿದೆ. ಇದು 73 ಮೀಟರ್ ಎತ್ತರದ ಗೋಪುರವಾಗಿದ್ದು, ಕೆಂಪು ಮರಳುಗಲ್ಲು ಮತ್ತು ಅಮೃತಶಿಲೆಯಿಂದ ನಿರ್ಮಿಸಲಾಗಿದೆ. ಇದರ ನಿರ್ಮಾಣವನ್ನು 1193 ರಲ್ಲಿ ಕುತುಬ್-ಉದ್-ದೀನ್ ಐಬಕ್ ಪ್ರಾರಂಭಿಸಿದರು. ಇದು ಯುನೆಸ್ಕೋ ವಿಶ್ವ ಪರಂಪರೆಯ ತಾಣವಾಗಿದೆ ಮತ್ತು ಭಾರತದ ಅತ್ಯಂತ ಎತ್ತರದ ಇಟ್ಟಿಗೆ ಗೋಪುರವಾಗಿದೆ. ಈ ಗೋಪುರವು ಐದು ಮಹಡಿಗಳನ್ನು ಹೊಂದಿದೆ ಮತ್ತು ಇಸ್ಲಾಮಿಕ್ ವಾಸ್ತುಶಿಲ್ಪದ ಅತ್ಯುತ್ತಮ ಉದಾಹರಣೆಯಾಗಿದೆ.",
      location: "ದೆಹಲಿ, ಭಾರತ",
    },
    te: {
      name: "కుతుబ్ మినార్",
      description:
        "కుతుబ్ మినార్ ఢిల్లీలో ఉన్న ఒక ప్రసిద్ధ చారిత్రక స్మారకం. ఇది 73 మీటర్ల ఎత్తైన గోపురం, ఎరుపు ఇసుకరాయి మరియు పాలరాయితో నిర్మించబడింది. దీని నిర్మాణాన్ని 1193లో కుతుబ్-ఉద్-దీన్ ఐబక్ ప్రారంభించారు. ఇది యునెస్కో ప్రపంచ వారసత్వ ప్రదేశం మరియు భారతదేశంలోని అత్యంత ఎత్తైన ఇటుక గోపురం. ఈ గోపురంలో ఐదు అంతస్తులు ఉన్నాయి మరియు ఇది ఇస్లామిక్ వాస్తుశిల్పానికి అద్భుతమైన ఉదాహరణ.",
      location: "ఢిల్లీ, భారతదేశం",
    },
    ta: {
      name: "குதுப் மினார்",
      description:
        "குதுப் மினார் டெல்லியில் அமைந்துள்ள ஒரு புகழ்பெற்ற வரலாற்று நினைவுச்சின்னம். இது 73 மீட்டர் உயரமான கோபுரம், சிவப்பு மணற்கல் மற்றும் பளிங்குக் கல்லால் கட்டப்பட்டது. இதன் கட்டுமானம் 1193ல் குதுப்-உத்-தீன் ஐபக்கால் தொடங்கப்பட்டது. இது யுனெஸ்கோ உலக பாரம்பரிய தளம் மற்றும் இந்தியாவின் மிக உயரமான செங்கல் கோபுரம். இந்த கோபுரத்தில் ஐந்து மாடிகள் உள்ளன மற்றும் இது இஸ்லாமிய கட்டிடக்கலைக்கு சிறந்த எடுத்துக்காட்டு.",
      location: "டெல்லி, இந்தியா",
    },
  },
  "chitradurga-fort": {
    hi: {
      name: "चित्रदुर्ग किला",
      description:
        "चित्रदुर्ग किला कर्नाटक के चित्रदुर्ग जिले में स्थित एक ऐतिहासिक किला है। यह किला अपनी अनूठी वास्तुकला और रक्षात्मक संरचना के लिए प्रसिद्ध है। इसे 'कल्लिना कोटे' भी कहा जाता है, जिसका अर्थ है 'पत्थर का किला'। यह किला सात परकोटों से घिरा हुआ है और इसमें 19 प्रवेश द्वार हैं। मदकरी नायडू इस किले के अंतिम शासक थे जिन्होंने हैदर अली और टीपू सुल्तान के खिलाफ वीरतापूर्वक लड़ाई लड़ी।",
      location: "चित्रदुर्ग, कर्नाटक, भारत",
    },
    kn: {
      name: "ಚಿತ್ರದುರ್ಗ ಕೋಟೆ",
      description:
        "ಚಿತ್ರದುರ್ಗ ಕೋಟೆ ಕರ್ನಾಟಕದ ಚಿತ್ರದುರ್ಗ ಜಿಲ್ಲೆಯಲ್ಲಿರುವ ಒಂದು ಐತಿಹಾಸಿಕ ಕೋಟೆಯಾಗಿದೆ. ಈ ಕೋಟೆಯು ತನ್ನ ವಿಶಿಷ್ಟ ವಾಸ್ತುಶಿಲ್ಪ ಮತ್ತು ರಕ್ಷಣಾತ್ಮಕ ರಚನೆಗೆ ಪ್ರಸಿದ್ಧವಾಗಿದೆ. ಇದನ್ನು 'ಕಲ್ಲಿನ ಕೋಟೆ' ಎಂದೂ ಕರೆಯಲಾಗುತ್ತದೆ. ಈ ಕೋಟೆಯು ಏಳು ಸುತ್ತಳತೆಗಳಿಂದ ಸುತ್ತುವರಿದಿದೆ ಮತ್ತು 19 ಪ್ರವೇಶ ದ್ವಾರಗಳನ್ನು ಹೊಂದಿದೆ. ಮದಕರಿ ನಾಯಡು ಈ ಕೋಟೆಯ ಕೊನೆಯ ಆಡಳಿತಗಾರರಾಗಿದ್ದರು, ಅವರು ಹೈದರ್ ಅಲಿ ಮತ್ತು ಟಿಪ್ಪು ಸುಲ್ತಾನ್ ವಿರುದ್ಧ ವೀರೋಚಿತವಾಗಿ ಹೋರಾಡಿದರು.",
      location: "ಚಿತ್ರದುರ್ಗ, ಕರ್ನಾಟಕ, ಭಾರತ",
    },
    te: {
      name: "చిత్రదుర్గ కోట",
      description:
        "చిత్రదుర్గ కోట కర్ణాటక రాష్ట్రంలోని చిత్రదుర్గ జిల్లాలో ఉన్న ఒక చారిత్రక కోట. ఈ కోట దాని ప్రత్యేకమైన వాస్తుశిల్పం మరియు రక్షణాత్మక నిర్మాణానికి ప్రసిద్ధి చెందింది. దీనిని 'కల్లిన కోటె' అని కూడా అంటారు, దీని అర్థం 'రాతి కోట'. ఈ కోట ఏడు ప్రాకారాలతో చుట్టుముట్టబడి ఉంది మరియు 19 ప్రవేశ ద్వారాలను కలిగి ఉంది. మదకరి నాయుడు ఈ కోట చివరి పాలకుడు, అతను హైదర్ అలీ మరియు టిప్పు సుల్తాన్‌లకు వ్యతిరేకంగా వీరోచితంగా పోరాడాడు.",
      location: "చిత్రదుర్గ, కర్ణాటక, భారతదేశం",
    },
    ta: {
      name: "சித்திரதுர்கா கோட்டை",
      description:
        "சித்திரதுர்கா கோட்டை கர்நாடக மாநிலத்தின் சித்திரதுர்கா மாவட்டத்தில் அமைந்துள்ள ஒரு வரலாற்று கோட்டையாகும். இந்த கோட்டை அதன் தனித்துவமான கட்டிடக்கலை மற்றும் பாதுகாப்பு அமைப்புக்காக புகழ்பெற்றது. இது 'கல்லின கோட்டே' என்றும் அழைக்கப்படுகிறது, இதன் பொருள் 'கல் கோட்டை'. இந்த கோட்டை ஏழு சுவர்களால் சூழப்பட்டுள்ளது மற்றும் 19 நுழைவு வாயில்களைக் கொண்டுள்ளது. மதகரி நாயுடு இந்த கோட்டையின் கடைசி ஆட்சியாளர் ஆவார், அவர் ஹைதர் அலி மற்றும் டிப்பு சுல்தானுக்கு எதிராக வீரமாகப் போராடினார்.",
      location: "சித்திரதுர்கா, கர்நாடகா, இந்தியா",
    },
  },
}

export async function GET(request: NextRequest) {
  try {
    console.log("=== TRANSLATE API CALLED ===")

    const searchParams = request.nextUrl.searchParams
    const monumentId = searchParams.get("monumentId")
    const language = searchParams.get("language")

    console.log("Monument ID:", monumentId)
    console.log("Language:", language)

    // Validate parameters
    if (!monumentId || !language) {
      console.log("Missing parameters")
      return NextResponse.json({
        success: false,
        error: "Missing parameters",
        name: "Error",
        description: "Missing monumentId or language parameter",
        location: "Unknown",
        voiceLanguage: "en-US",
      })
    }

    // Get monument data
    const monument = await getMonumentById(monumentId)
    if (!monument) {
      console.log("Monument not found:", monumentId)
      return NextResponse.json({
        success: false,
        error: "Monument not found",
        name: "Monument Not Found",
        description: "The requested monument could not be found.",
        location: "Unknown",
        voiceLanguage: "en-US",
      })
    }

    console.log("Found monument:", monument.name)

    // English - return original
    if (language === "en") {
      console.log("Returning English version")
      return NextResponse.json({
        success: true,
        ...monument,
        voiceLanguage: "en-US",
      })
    }

    // Check for manual translation first (highest quality)
    const manualTranslation = completeTranslations[monumentId]?.[language]
    if (manualTranslation) {
      console.log("Found manual translation for", monumentId, "in", language)
      return NextResponse.json({
        success: true,
        ...monument,
        name: manualTranslation.name,
        description: manualTranslation.description,
        location: manualTranslation.location,
        voiceLanguage: languageConfig[language]?.voice || "en-US",
        method: "manual",
      })
    }

    // Try LibreTranslate API for dynamic translation
    if (isLanguageSupported(language)) {
      console.log("Attempting LibreTranslate translation for", monumentId, "to", language)
      
      try {
        // Translate the monument's text fields
        const textsToTranslate = [
          monument.name,
          monument.description,
          monument.location
        ]

        const translationResults = await translateMultiple(textsToTranslate, language, 'en')
        
        // Check if all translations were successful
        const hasErrors = translationResults.some(result => result.error)
        
        if (!hasErrors) {
          console.log("LibreTranslate translation successful for", monumentId)
          return NextResponse.json({
            success: true,
            ...monument,
            name: translationResults[0].translatedText,
            description: translationResults[1].translatedText,
            location: translationResults[2].translatedText,
            voiceLanguage: languageConfig[language]?.voice || "en-US",
            method: "libretranslate",
          })
        } else {
          // Some translations failed, log errors but continue to fallback
          console.warn("LibreTranslate partial failure:", translationResults.filter(r => r.error).map(r => r.error))
        }
      } catch (error) {
        console.error("LibreTranslate API error:", error)
        // Continue to fallback
      }
    }

    // Fallback: Language not supported or translation failed
    console.log("Using fallback for", monumentId, "in", language)
    const supportedLanguages = getSupportedLanguages()
    const languageName = supportedLanguages[language] || languageConfig[language]?.name || language
    
    return NextResponse.json({
      success: false,
      error: "Translation not available",
      ...monument,
      name: `[${languageName}] ${monument.name}`,
      description: `[${languageName}] Translation for this content is not available. ${monument.description}`,
      location: `[${languageName}] ${monument.location}`,
      voiceLanguage: languageConfig[language]?.voice || "en-US",
      method: "fallback",
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      name: "Error",
      description: "An error occurred while processing the request.",
      location: "Unknown",
      voiceLanguage: "en-US",
    })
  }
}
