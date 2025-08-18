"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Loader2, Sparkles, Camera, Clock, MapPin, Info, Brain, Heart, Star, Crown, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardFooter } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getCharacterForMonument, type HistoricalCharacter } from "@/lib/historical-characters"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface ChatInterfaceProps {
  monumentId: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  sentiment?: "positive" | "negative" | "neutral" | "question"
  suggestions?: string[]
}

// Update the QUICK_QUESTIONS with more NLP-driven options
const QUICK_QUESTIONS = [
  { icon: Clock, text: "Visiting hours?", query: "What are the visiting hours and entry fees?", category: "practical" },
  { icon: MapPin, text: "How to reach?", query: "How can I reach this monument?", category: "travel" },
  { icon: Camera, text: "Photo spots?", query: "What are the best photography spots?", category: "experience" },
  { icon: Info, text: "History", query: "Tell me about the history of this monument", category: "knowledge" },
  { icon: Sparkles, text: "Fun facts", query: "Share some interesting fun facts", category: "entertainment" },
  { icon: Brain, text: "Architecture", query: "Explain the architectural style and features", category: "technical" },
  { icon: Heart, text: "Why famous?", query: "Why is this monument famous and significant?", category: "cultural" },
  { icon: Star, text: "Best time", query: "When is the best time to visit?", category: "planning" },
]

// Add NLP sentiment analysis and context awareness
const analyzeMessageSentiment = (message: string): "positive" | "negative" | "neutral" | "question" => {
  const lowerMessage = message.toLowerCase()

  // Question detection
  if (
    lowerMessage.includes("?") ||
    lowerMessage.startsWith("what") ||
    lowerMessage.startsWith("how") ||
    lowerMessage.startsWith("when") ||
    lowerMessage.startsWith("where") ||
    lowerMessage.startsWith("why")
  ) {
    return "question"
  }

  // Positive sentiment
  const positiveWords = ["amazing", "beautiful", "wonderful", "great", "love", "fantastic", "awesome", "incredible"]
  if (positiveWords.some((word) => lowerMessage.includes(word))) {
    return "positive"
  }

  // Negative sentiment
  const negativeWords = ["bad", "terrible", "awful", "hate", "boring", "disappointing"]
  if (negativeWords.some((word) => lowerMessage.includes(word))) {
    return "negative"
  }

  return "neutral"
}

export function ChatInterface({ monumentId }: ChatInterfaceProps) {
  const [conversationContext, setConversationContext] = useState<{
    topics: string[]
    sentiment: string
    questionCount: number
    lastCategory: string
  }>({
    topics: [],
    sentiment: "neutral",
    questionCount: 0,
    lastCategory: "general",
  })

  const [chatMode, setChatMode] = useState<"maya" | "historical">("maya")
  const [currentCharacter, setCurrentCharacter] = useState<HistoricalCharacter | null>(null)
  const [isCharacterAvailable, setIsCharacterAvailable] = useState(false)
  const [hasGreeted, setHasGreeted] = useState(false)

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! 👋 I'm Maya, your heritage guide assistant. I can help you discover everything about this magnificent monument - from its fascinating history to practical visiting tips. You can also switch to chat with historical characters who lived here! What would you like to know? 😊",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showQuickQuestions, setShowQuickQuestions] = useState(true)
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Set character based on monument
  useEffect(() => {
    console.log(`🔍 Checking character for monument: ${monumentId}`)
    const character = getCharacterForMonument(monumentId)
    console.log(`👑 Character found: ${character ? character.name : "None"}`)

    setCurrentCharacter(character)
    setIsCharacterAvailable(!!character)

    // If no character available and currently in historical mode, switch to Maya
    if (!character && chatMode === "historical") {
      console.log(`⚠️ No character available, switching to Maya mode`)
      setChatMode("maya")
    }
  }, [monumentId, chatMode])

  // Update handleSendMessage to include NLP analysis
  const handleSendMessage = async (messageText?: string) => {
    const messageToSend = messageText || input.trim()
    if (!messageToSend) return

    console.log(`💬 Sending message: "${messageToSend}" in ${chatMode} mode`)

    // NLP Analysis
    const sentiment = analyzeMessageSentiment(messageToSend)
    const isQuestion = sentiment === "question"

    // Update conversation context
    setConversationContext((prev) => ({
      ...prev,
      sentiment,
      questionCount: isQuestion ? prev.questionCount + 1 : prev.questionCount,
      topics: [...prev.topics.slice(-4), messageToSend.toLowerCase().split(" ")[0]], // Keep last 5 topics
    }))

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageToSend,
      timestamp: new Date(),
      sentiment, // Add sentiment to message
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setShowQuickQuestions(false)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          monumentId,
          message: messageToSend,
          context: conversationContext,
          sentiment,
          chatMode, // Add this line
          characterId: currentCharacter?.id, // Add this line
          hasGreeted, // Add this line
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to get response`)
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        suggestions: data.suggestions, // Add follow-up suggestions
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Show contextual quick questions based on response
      if (data.showQuickQuestions) {
        setShowQuickQuestions(true)
      }

      console.log(`✅ Response received successfully`)
    } catch (error) {
      console.error("❌ Error sending message:", error)

      // Add fallback message instead of toast
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'm experiencing some technical difficulties right now. Please try asking your question again! 😊 You can ask me about visiting hours, entry fees, history, or how to reach this monument.",
        timestamp: new Date(),
        suggestions: ["When was it built?", "Entry fee?", "How to reach?"],
      }

      setMessages((prev) => [...prev, fallbackMessage])

      toast({
        title: "Connection Issue",
        description: "Having trouble connecting. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Add smart suggestions based on conversation
  const getSmartSuggestions = (lastMessage: string, category: string) => {
    const suggestions = {
      practical: ["Entry fees?", "Opening hours?", "Facilities available?"],
      travel: ["Parking info?", "Public transport?", "Nearby hotels?"],
      experience: ["Audio guide?", "Guided tours?", "Souvenir shops?"],
      knowledge: ["Architectural details?", "Historical timeline?", "Cultural significance?"],
      entertainment: ["Local legends?", "Movie locations?", "Festival celebrations?"],
    }

    return suggestions[category] || suggestions.knowledge
  }

  const handleModeSwitch = (newMode: "maya" | "historical") => {
    console.log(`🔄 Switching chat mode from ${chatMode} to ${newMode}`)

    if (newMode === "historical" && !isCharacterAvailable) {
      console.log(`⚠️ Cannot switch to historical mode - no character available`)
      toast({
        title: "Historical Character Not Available",
        description: "This monument doesn't have a significant historical character associated with it.",
        variant: "destructive",
      })
      return
    }

    setChatMode(newMode)
    setHasGreeted(newMode === "historical") // Mark as greeted when switching to historical

    // Add a system message about the switch
    const switchMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content:
        newMode === "maya"
          ? "👋 Maya here! I'm back to help you with practical information and modern insights about this monument. What would you like to know?"
          : `${currentCharacter?.avatar || "👑"} Greetings, noble visitor. I am ${currentCharacter?.name || "a historical figure"}, ${currentCharacter?.title || ""}. You may now speak with me directly about my time and experiences with this monument. What would you ask of me?`,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, switchMessage])
    setShowQuickQuestions(true)

    console.log(`✅ Successfully switched to ${newMode} mode`)
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-3 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <Avatar className="h-8 w-8">
                  <div
                    className={`h-full w-full flex items-center justify-center text-xs font-medium ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : chatMode === "historical"
                          ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white"
                          : "bg-gradient-to-br from-orange-500 to-yellow-500 text-white"
                    }`}
                  >
                    {message.role === "user" ? "U" : chatMode === "historical" ? currentCharacter?.avatar || "👑" : "🏛️"}
                  </div>
                </Avatar>
                <div className="space-y-2">
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted border border-orange-200"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {message.sentiment && message.role === "user" && (
                        <span className="text-xs opacity-60">
                          {message.sentiment === "positive" && "😊"}
                          {message.sentiment === "question" && "❓"}
                          {message.sentiment === "negative" && "😔"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Smart suggestions for assistant messages */}
                  {message.role === "assistant" && message.suggestions && (
                    <div className="flex flex-wrap gap-1">
                      {message.suggestions.map((suggestion, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="cursor-pointer hover:bg-orange-100 text-xs px-2 py-1"
                          onClick={() => handleSendMessage(suggestion)}
                        >
                          {suggestion}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Quick Questions */}
          {showQuickQuestions && messages.length <= 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">Quick questions to get started:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_QUESTIONS.map((question, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1"
                    onClick={() => handleQuickQuestion(question.query)}
                  >
                    <question.icon className="h-3 w-3 mr-1" />
                    {question.text}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <Avatar className="h-8 w-8">
                  <div
                    className={`h-full w-full flex items-center justify-center text-xs font-medium ${
                      chatMode === "historical"
                        ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white"
                        : "bg-gradient-to-br from-orange-500 to-yellow-500 text-white"
                    }`}
                  >
                    {chatMode === "historical" ? currentCharacter?.avatar || "👑" : "🏛️"}
                  </div>
                </Avatar>
                <div className="rounded-lg px-4 py-2 bg-muted">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p className="text-sm">{chatMode === "historical" ? "Recalling memories..." : "Thinking..."}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Mode Switcher */}
      <div className="border-t border-b bg-muted/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="chat-mode" className="text-sm font-medium">
                Maya (Modern Guide)
              </Label>
            </div>
            <Switch
              id="chat-mode"
              checked={chatMode === "historical"}
              onCheckedChange={(checked) => handleModeSwitch(checked ? "historical" : "maya")}
              disabled={!isCharacterAvailable}
            />
            <div className="flex items-center space-x-2">
              <Crown
                className={`h-4 w-4 ${!isCharacterAvailable ? "text-muted-foreground/50" : "text-muted-foreground"}`}
              />
              <Label
                htmlFor="chat-mode"
                className={`text-sm font-medium ${!isCharacterAvailable ? "text-muted-foreground/50" : ""}`}
              >
                {currentCharacter?.name || "No Historical Character"}
              </Label>
            </div>
          </div>

          {chatMode === "historical" && currentCharacter && (
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>{currentCharacter.avatar}</span>
              <span>{currentCharacter.era}</span>
            </div>
          )}
        </div>

        {!isCharacterAvailable && (
          <p className="text-xs text-muted-foreground mt-2 italic">
            No significant historical character associated with this monument
          </p>
        )}

        {chatMode === "historical" && currentCharacter && (
          <p className="text-xs text-muted-foreground mt-2 italic">"{currentCharacter.keyQuotes[0]}"</p>
        )}
      </div>

      <CardFooter className="border-t p-4">
        <div className="flex w-full items-end gap-2">
          <Textarea
            placeholder={
              chatMode === "historical" && currentCharacter
                ? `Ask ${currentCharacter.name} about their time and experiences...`
                : "Ask me anything about this monument... (try 'hi' or 'hello')"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button size="icon" onClick={() => handleSendMessage()} disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
