import React, { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { BACKEND } from "../utils/api";
import "./OmevoChat.css";

const MAX_MESSAGE_LENGTH = 500;

export default function OmevoChat() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [room, setRoom] = useState(null);
  const [status, setStatus] = useState("Idle");
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [toasts, setToasts] = useState([]);
  const socketRef = useRef(null);
  const inputRef = useRef(null);
  const chatEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const toastTimersRef = useRef(new Map());
  const tokenRef = useRef(null);
  const userIdRef = useRef(null);
  const roomRef = useRef(null);
  const searchingRef = useRef(false);

  useEffect(() => {
    tokenRef.current = window.localStorage.getItem("token");
  }, []);

  const toast = useCallback((message, type = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((old) => [...old, { id, message, type }]);
    const timer = window.setTimeout(() => {
      setToasts((old) => old.filter((item) => item.id !== id));
      toastTimersRef.current.delete(id);
    }, 3200);
    toastTimersRef.current.set(id, timer);
  }, []);

  const addSystemMessage = useCallback((text) => {
    setMessages((old) => [
      ...old,
      { id: `${Date.now()}-${Math.random()}`, type: "system", text },
    ]);
  }, []);

  const addChatMessage = useCallback((text, type, sender) => {
    setMessages((old) => [
      ...old,
      {
        id: `${Date.now()}-${Math.random()}`,
        type,
        sender,
        text,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  }, []);

  const leaveQueue = useCallback(async () => {
    if (!tokenRef.current) return;
    try {
      await fetch(`${BACKEND}/queue/leave`, {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
    } catch {
      // Local state is still reset if the queue endpoint is temporarily offline.
    }
  }, []);

  const resetChat = useCallback(({ clearMessages = false } = {}) => {
    roomRef.current = null;
    searchingRef.current = false;
    setRoom(null);
    setIsConnected(false);
    setIsSearching(false);
    setStatus("Idle");
    setShowTyping(false);
    setInputValue("");
    if (clearMessages) setMessages([]);
  }, []);

  const handleMatchFound = useCallback((data) => {
    if (!data?.channel) return;
    roomRef.current = data.channel;
    searchingRef.current = false;
    setRoom(data.channel);
    setIsConnected(true);
    setIsSearching(false);
    setStatus("Connected");
    setShowTyping(false);
    setInputValue("");
    setMessages([]);
    socketRef.current?.emit("join_room", { room: data.channel });
    setMessages([
      {
        id: `${Date.now()}-system`,
        type: "system",
        text: "You're connected to a random stranger. Say hi!",
      },
    ]);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    const socket = io(BACKEND, {
      transports: ["websocket"],
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus((current) => current === "Connected" ? current : "Idle");
      if (tokenRef.current) socket.emit("auth", { token: tokenRef.current });
    });

    socket.on("authenticated", (data) => {
      if (data?.userId != null) userIdRef.current = data.userId;
    });

    socket.on("match_found", handleMatchFound);

    socket.on("message", (msg = {}) => {
      const text = msg.text ?? msg.message ?? "";
      if (!text) return;
      const own = msg.uid != null &&
        userIdRef.current != null &&
        String(msg.uid) === String(userIdRef.current);
      addChatMessage(String(text), own ? "sent" : "received", own ? "You" : (msg.username || "Stranger"));
    });

    socket.on("typing", (data) => {
      if (data?.uid != null && String(data.uid) !== String(userIdRef.current)) {
        setShowTyping(true);
        window.clearTimeout(typingTimerRef.current);
        typingTimerRef.current = window.setTimeout(() => setShowTyping(false), 1800);
      }
    });

    socket.on("peer_left", () => {
      roomRef.current = null;
      setRoom(null);
      setIsConnected(false);
      setIsSearching(false);
      setStatus("Idle");
      setShowTyping(false);
      addSystemMessage("Stranger disconnected. Start a new chat to meet someone else.");
      toast("Stranger disconnected", "error");
    });

    socket.on("banned", (data = {}) => {
      resetChat();
      addSystemMessage(`Your account has been restricted. ${data.reason ? `Reason: ${data.reason}` : ""}`);
      toast("Account restricted", "error");
    });

    socket.on("moderation_action", (data = {}) => {
      if (data.banned) {
        resetChat();
        addSystemMessage("Your chat access was restricted by moderation.");
        toast("Chat access restricted", "error");
      }
    });

    socket.on("connect_error", () => {
      setStatus("Offline");
      toast("Can't connect to chat server. Check your connection.", "error");
    });

    socket.on("error", (error) => {
      toast(error?.message || "A chat error occurred.", "error");
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      window.clearTimeout(typingTimerRef.current);
      toastTimersRef.current.forEach(window.clearTimeout);
      toastTimersRef.current.clear();
    };
  }, [addChatMessage, addSystemMessage, handleMatchFound, resetChat, toast]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, showTyping]);

  const startChat = async () => {
    if (searchingRef.current || roomRef.current) return;
    if (!tokenRef.current) {
      toast("Please log in before starting a chat.", "error");
      return;
    }

    searchingRef.current = true;
    setIsSearching(true);
    setIsConnected(false);
    setStatus("Searching");
    setShowTyping(false);
    setMessages([]);
    setInputValue("");

    try {
      const response = await fetch(`${BACKEND}/queue/enqueue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenRef.current}`,
        },
        body: JSON.stringify({
          gender: "any",
          looking_for: "any",
          location: "any",
          interests: [],
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.error) {
        searchingRef.current = false;
        setIsSearching(false);
        setStatus("Idle");
        toast(data.error || "Couldn't join the matchmaking queue.", "error");
        return;
      }

      // A socket match can arrive before or after this HTTP response.
      if (data.matched && data.channel && searchingRef.current) {
        handleMatchFound(data);
      } else if (searchingRef.current) {
        addSystemMessage("Looking for someone to chat with…");
      }
    } catch {
      searchingRef.current = false;
      setIsSearching(false);
      setStatus("Idle");
      toast("Network error. Please try again.", "error");
    }
  };

  const cancelSearch = async () => {
    searchingRef.current = false;
    setIsSearching(false);
    setStatus("Idle");
    await leaveQueue();
    addSystemMessage("Matchmaking cancelled.");
  };

  const sendMessage = () => {
    const text = inputValue.trim();
    if (!text || !roomRef.current || !socketRef.current?.connected) return;
    socketRef.current.emit("message", { room: roomRef.current, text });
    // The server should echo the sender's message back with the sender uid.
    setInputValue("");
  };

  const skipChat = async () => {
    const currentRoom = roomRef.current;
    if (currentRoom) socketRef.current?.emit("leave_room", { room: currentRoom });
    resetChat();
    await leaveQueue();
    setMessages([]);
    toast("Chat ended.", "info");
  };

  const startNewChat = async () => {
    const currentRoom = roomRef.current;
    if (currentRoom) socketRef.current?.emit("leave_room", { room: currentRoom });
    resetChat({ clearMessages: true });
    await leaveQueue();
    // Give React/state refs a clean room before joining the queue again.
    window.setTimeout(() => startChat(), 0);
  };

  const handleInputChange = (event) => {
    const value = event.target.value.slice(0, MAX_MESSAGE_LENGTH);
    setInputValue(value);
    if (roomRef.current) {
      socketRef.current?.emit("typing", { room: roomRef.current });
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape" && roomRef.current) skipChat();
      if (event.key === "/" && roomRef.current && document.activeElement !== inputRef.current) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [skipChat]);

  return (
    <div className="omevo-app">
      <div className="omevo-ambient" aria-hidden="true">
        <span /><span /><span />
      </div>

      <header className="omevo-header">
        <a className="omevo-brand" href="/" aria-label="Omevo home">
          <span className="omevo-brand-mark"><i /></span>
          <span>omevo<span className="omevo-brand-light">.</span></span>
          <span className="omevo-tag">TEXT CHAT</span>
        </a>
        <div className="omevo-header-status">
          <span className={`omevo-status-dot ${status.toLowerCase()}`} />
          <span>{status === "Connected" ? "Stranger connected" : status === "Searching" ? "Finding a stranger" : status}</span>
        </div>
      </header>

      <main className="omevo-main">
        <section className="omevo-chat-panel" aria-label="Random text chat">
          <div className="omevo-panel-top">
            <div>
              <p className="omevo-eyebrow">RANDOM CONVERSATIONS</p>
              <h1>{isConnected ? "You're chatting" : isSearching ? "Finding your stranger" : "Talk to someone new"}</h1>
              <p className="omevo-subheading">
                {isConnected ? "You're talking anonymously. Keep it kind." : "Meet someone new, one message at a time."}
              </p>
            </div>
            <div className={`omevo-peer-badge ${isConnected ? "is-online" : ""}`}>
              <span className="omevo-peer-avatar">{isConnected ? "S" : "?"}</span>
              <span><strong>{isConnected ? "Stranger" : "Random chat"}</strong><small>{isConnected ? "Connected" : "Anonymous"}</small></span>
            </div>
          </div>

          <div className="omevo-chat-log" role="log" aria-live="polite" aria-relevant="additions text">
            {!messages.length && !isConnected && !isSearching && (
              <div className="omevo-empty">
                <div className="omevo-empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /></svg>
                </div>
                <h2>Your next conversation starts here</h2>
                <p>Tap <b>Start chatting</b> to get paired with a random person.</p>
              </div>
            )}

            {isSearching && (
              <div className="omevo-searching-card">
                <span className="omevo-spinner" />
                <div><strong>Looking for a stranger</strong><p>This usually only takes a moment.</p></div>
              </div>
            )}

            {messages.map((message) => (
              <div className={`omevo-message ${message.type}`} key={message.id}>
                {message.type === "system" ? (
                  <span className="omevo-system-text">{message.text}</span>
                ) : (
                  <>
                    <div className="omevo-message-meta"><strong>{message.sender}</strong><time>{message.time}</time></div>
                    <p>{message.text}</p>
                  </>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className={`omevo-typing ${showTyping ? "visible" : ""}`} aria-live="polite">
            <span className="omevo-typing-dots"><i /><i /><i /></span>
            Stranger is typing…
          </div>

          <form className="omevo-composer" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}>
            <div className="omevo-input-wrap">
              <input
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={isConnected ? "Write a message…" : "Start a chat to send messages"}
                maxLength={MAX_MESSAGE_LENGTH}
                disabled={!isConnected}
                aria-label="Message"
              />
              <span className="omevo-char-count">{inputValue.length}/{MAX_MESSAGE_LENGTH}</span>
            </div>
            <button className="omevo-send" type="submit" disabled={!isConnected || !inputValue.trim()}>
              Send <span aria-hidden="true">↗</span>
            </button>
          </form>

          <div className="omevo-actions">
            {!isConnected ? (
              <button className="omevo-primary" onClick={isSearching ? cancelSearch : startChat} disabled={status === "Offline"}>
                {isSearching ? "Cancel search" : "Start chatting"} <span aria-hidden="true">→</span>
              </button>
            ) : (
              <>
                <p><span className="omevo-live-dot" /> You're connected with a stranger</p>
                <button className="omevo-stop" onClick={skipChat}>Stop chat</button>
                <button className="omevo-primary" onClick={startNewChat}>New chat <span aria-hidden="true">→</span></button>
              </>
            )}
          </div>
        </section>
        <p className="omevo-safety-note"><span aria-hidden="true">◇</span> Stay anonymous. Never share passwords, financial details, or private information.</p>
      </main>

      <div className="omevo-toasts" aria-live="polite">
        {toasts.map((item) => <div className={`omevo-toast ${item.type}`} key={item.id}>{item.type === "error" ? "!" : "•"} <span>{item.message}</span></div>)}
      </div>
    </div>
  );
}
