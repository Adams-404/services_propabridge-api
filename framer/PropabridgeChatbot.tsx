import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"

type Message = {
    role: "user" | "bot"
    content: string
}

export default function PropabridgeChatbot() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "bot",
            content:
                "Hi there! I'm the Propabridge AI assistant. How can I help you find your dream home today?",
        },
    ])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [isListening, setIsListening] = useState(false)

    const [mounted, setMounted] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement | null>(null)

    const API_URL =
        "http://localhost:8080/api/agent/chat"

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages, isOpen])

    async function handleSendMessage() {
        if (!input.trim() || isLoading) return

        const userText = input.trim()

        setMessages((prev) => [...prev, { role: "user", content: userText }])
        setInput("")
        setIsLoading(true)

        try {
            const requestBody: any = { message: userText }
            if (sessionId) {
                requestBody.session_id = sessionId
            }

            const res = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            })

            if (!res.ok) throw new Error("API error")

            const data = await res.json()

            if (data.session_id) {
                setSessionId(data.session_id)
            }

            const reply =
                data.reply ||
                data.response ||
                data.message ||
                "I'm having trouble responding right now."

            setMessages((prev) => [...prev, { role: "bot", content: reply }])
        } catch (err) {
            console.error(err)

            setMessages((prev) => [
                ...prev,
                {
                    role: "bot",
                    content:
                        "Sorry, I encountered an error while trying to respond.",
                },
            ])
        } finally {
            setIsLoading(false)
        }
    }

    const handleVoiceClick = () => {
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition

        if (!SpeechRecognition) {
            alert("Sorry, your browser doesn't support speech recognition.")
            return
        }

        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = "en-US"

        recognition.onstart = () => {
            setIsListening(true)
        }

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript
            setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
        }

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error)
            setIsListening(false)
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        // If it's already listening, we don't start it again. 
        // The user can stop speaking and it automatically ends.
        if (!isListening) {
            recognition.start()
        }
    }

    if (!mounted || typeof document === "undefined") return null

    return createPortal(
        <div
            style={{
                position: "fixed",
                top: 23, // NUDGED DOWN: Moved from 24 to 28 so it vertically centers with the header
                right: 24,
                zIndex: 999999,
                fontFamily: "Inter, sans-serif",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
            }}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: "#FFFFF2",
                    color: "#081A33",
                    border: "none",
                    borderRadius: "12px", // PERFECT MATCH: Same curves as the main header
                    height: 54,
                    padding: "12px 18px",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 6px 12px rgba(0,0,0,0.1)",
                    transition: "all 0.25s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                }}
            >
                {isOpen ? "Close Chat ✕" : "Chat  Propa"}
            </button>

            {/* Chat Window */}
            <div
                style={{
                    position: "absolute",
                    top: 60,
                    right: 0,
                    width: 340,
                    height: 500,
                    background: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(20px)",
                    borderRadius: 12, // (I left the chat window nicely curved so it's friendly, but only the button is 5px)
                    boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    transformOrigin: "top right",
                    transform: isOpen
                        ? "translateY(0) scale(1)"
                        : "translateY(-15px) scale(0.95)",
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? "auto" : "none",
                    transition:
                        "opacity 0.2s cubic-bezier(0.16,1,0.3,1), transform 0.35s cubic-bezier(0.16,1,0.3,1)",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: "16px 20px",
                        borderBottom: "1px solid rgba(0,0,0,0.05)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontWeight: 600,
                        backgroundColor: "#fff",
                        color: "#081A33",
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <span>Propabridge AI</span>
                        {/* Session ID display! Visually subtle. */}
                        {sessionId && (
                            <span style={{ fontSize: 10, color: "#888", fontWeight: 400, marginTop: 2 }}>
                                Session: {sessionId}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        style={{
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            fontSize: 22,
                            lineHeight: 1,
                            color: "#081A33",
                            padding: "0 4px",
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Messages */}
                <div
                    style={{
                        flex: 1,
                        padding: 16,
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                    }}
                >
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            style={{
                                alignSelf:
                                    msg.role === "user"
                                        ? "flex-end"
                                        : "flex-start",
                                background:
                                    msg.role === "user" ? "#081A33" : "#f0f2f5",
                                color: msg.role === "user" ? "#fff" : "#111",
                                padding: "12px 16px",
                                borderRadius:
                                    msg.role === "user"
                                        ? "16px 16px 4px 16px"
                                        : "16px 16px 16px 4px",
                                maxWidth: "85%",
                                fontSize: 13,
                                lineHeight: 1.5,
                            }}
                        >
                            {msg.content}
                        </div>
                    ))}

                    {isLoading && (
                        <div
                            style={{
                                fontSize: 12,
                                color: "#777",
                                paddingLeft: 4,
                            }}
                        >
                            Propabridge AI is typing...
                        </div>
                    )}

                    {/* Visual feedback when the mic is active */}
                    {isListening && !isLoading && (
                        <div
                            style={{
                                fontSize: 12,
                                color: "#ff4444",
                                paddingLeft: 4,
                            }}
                        >
                            Listening for voice...
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div
                    style={{
                        padding: 16,
                        borderTop: "1px solid rgba(0,0,0,0.05)",
                        display: "flex",
                        gap: 8,
                        backgroundColor: "#fff",
                        alignItems: "center"
                    }}
                >
                    {/* Microphone button for Voice-to-Text */}
                    <button
                        onClick={handleVoiceClick}
                        title="Voice Input"
                        style={{
                            background: isListening ? "#ffebeb" : "#f0f2f5",
                            color: isListening ? "#ff4444" : "#081A33",
                            border: "none",
                            borderRadius: "50%",
                            width: 32,
                            height: 32,
                            minWidth: 32,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            fontSize: 16
                        }}
                    >
                        🎤
                    </button>

                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) =>
                            e.key === "Enter" && handleSendMessage()
                        }
                        placeholder="Ask about homes..."
                        style={{
                            flex: 1,
                            border: "1px solid rgba(0,0,0,0.1)",
                            borderRadius: 8,
                            padding: "10px 14px",
                            fontSize: 13,
                            outline: "none",
                        }}
                        onFocus={(e) =>
                            (e.target.style.borderColor = "#081A33")
                        }
                        onBlur={(e) =>
                            (e.target.style.borderColor = "rgba(0,0,0,0.1)")
                        }
                    />

                    <button
                        onClick={handleSendMessage}
                        disabled={!input.trim()}
                        style={{
                            background: "#081A33",
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            padding: "0 18px",
                            cursor: "pointer",
                            fontWeight: 600,
                            height: 38,
                            opacity: !input.trim() ? 0.6 : 1,
                        }}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
