import React, { useState } from "react";

const GEMINI_API_KEY = "AIzaSyBum9ti_ZDn6VKhMCmSHbsdlG6JQsJtaKI";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// Helper function with retry logic
// Helper function with retry logic
async function fetchWithRetry(url, options, retries = 3, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, options);

    // Success
    if (res.ok) {
      return res.json();
    }

    // Retry on overload / rate limit
    if (res.status === 429 || res.status === 503) {
      console.warn(`Model overloaded. Retrying... attempt ${i + 1}`);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    // Other errors
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText}`);
  }

  throw new Error("Max retries reached. Please try again later.");
}

export default function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const data = await fetchWithRetry(
        `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: userMessage.content }],
              },
            ],
          }),
        }
      );

      const replyText =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        data.error?.message ||
        "No response from Gemini.";

      const botMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: replyText,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: "Error: " + err.message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={{ margin: 0 }}>💬 ChatBot</h2>
      </div>

      <div style={styles.chatBox}>
        {messages.length === 0 && (
          <div style={styles.welcome}>
            <h3>Welcome!</h3>
            <p>Start chatting with the bot by typing below.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              ...styles.message,
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              backgroundColor: msg.role === "user" ? "#4caf50" : "#e0e0e0",
              color: msg.role === "user" ? "#fff" : "#000",
            }}
          >
            {msg.content}
          </div>
        ))}
      </div>

      <div style={styles.inputRow}>
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          style={styles.input}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} disabled={loading} style={styles.sendBtn}>
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

// Styles
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    width: "100vw",   // Full width
    height: "100vh",  // Full height
    border: "1px solid #ddd",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    background: "#f5f5f5",
    padding: "15px",
    borderBottom: "1px solid #ddd",
    textAlign: "center",
    color: "#333",
  },
  chatBox: {
    flex: 1,
    padding: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    overflowY: "auto",
    background: "#fafafa",
  },
  welcome: {
    textAlign: "center",
    color: "#666",
  },
  message: {
    padding: "12px 16px",
    borderRadius: "15px",
    maxWidth: "75%",
    wordWrap: "break-word",
  },
  inputRow: {
    display: "flex",
    borderTop: "1px solid #ddd",
    padding: "10px",
    background: "#fff",
  },
  input: {
    flex: 1,
    padding: "10px 15px",
    borderRadius: "20px",
    border: "1px solid #ccc",
    marginRight: "10px",
    fontSize: "16px",
  },
  sendBtn: {
    background: "#4caf50",
    border: "none",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "20px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
