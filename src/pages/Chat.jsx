import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const CONFIG = {
  BACKEND: 'https://term-production-bf65.up.railway.app',
};

// --- STYLES ---
const CSS_STYLES = `
  :root {
    --bg-primary: #0a0a0f;
    --bg-secondary: #12121a;
    --bg-card: rgba(18, 18, 26, 0.85);
    --fg-primary: #f0f0f5;
    --fg-secondary: #8888a0;
    --fg-muted: #55556a;
    --accent: #00d4aa;
    --accent-dim: rgba(0, 212, 170, 0.15);
    --accent-glow: rgba(0, 212, 170, 0.4);
    --danger: #ff4757;
    --danger-dim: rgba(255, 71, 87, 0.15);
    --sent-bg: linear-gradient(135deg, #00d4aa 0%, #00b894 100%);
    --received-bg: rgba(255, 255, 255, 0.06);
    --border: rgba(255, 255, 255, 0.08);
    --border-focus: rgba(0, 212, 170, 0.5);
    --glass: rgba(18, 18, 26, 0.7);
    --shadow-lg: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
    --radius-sm: 8px;
    --radius-md: 14px;
    --radius-lg: 24px;
    --radius-full: 9999px;
    --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-smooth: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-bounce: 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Space Grotesk', sans-serif;
    background: var(--bg-primary);
    color: var(--fg-primary);
    overflow: hidden;
  }

  .app-wrapper {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    position: relative;
    overflow: hidden;
  }

  /* ANIMATED BACKGROUND */
  .bg-layer {
    position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden;
  }
  .bg-gradient {
    position: absolute; width: 150%; height: 150%; top: -25%; left: -25%;
    background: 
      radial-gradient(ellipse 80% 50% at 20% 40%, rgba(0, 212, 170, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse 60% 40% at 80% 60%, rgba(0, 100, 200, 0.06) 0%, transparent 50%),
      radial-gradient(ellipse 50% 30% at 50% 90%, rgba(100, 0, 150, 0.05) 0%, transparent 50%);
    animation: bgPulse 20s ease-in-out infinite;
  }
  @keyframes bgPulse {
    0%, 100% { transform: translate(0, 0) scale(1); opacity: 1; }
    33% { transform: translate(2%, -2%) scale(1.02); opacity: 0.9; }
    66% { transform: translate(-1%, 1%) scale(0.98); opacity: 1.1; }
  }
  .grid-overlay {
    position: absolute; inset: 0;
    background-image: linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 70%);
  }
  .floating-orbs { position: absolute; inset: 0; }
  .orb {
    position: absolute; border-radius: 50%; filter: blur(60px);
    animation: floatOrb 25s ease-in-out infinite;
  }
  .orb:nth-child(1) { width: 300px; height: 300px; background: rgba(0, 212, 170, 0.1); top: 10%; left: 10%; animation-delay: 0s; }
  .orb:nth-child(2) { width: 200px; height: 200px; background: rgba(0, 150, 255, 0.08); top: 60%; right: 15%; animation-delay: -8s; }
  .orb:nth-child(3) { width: 250px; height: 250px; background: rgba(150, 0, 200, 0.06); bottom: 10%; left: 30%; animation-delay: -16s; }
  @keyframes floatOrb {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(30px, -30px) scale(1.1); }
    50% { transform: translate(-20px, 20px) scale(0.95); }
    75% { transform: translate(25px, 15px) scale(1.05); }
  }

  /* HEADER */
  header {
    padding: 16px 20px;
    background: var(--glass);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px; z-index: 10; position: relative;
  }
  .logo { display: flex; align-items: center; gap: 12px; }
  .logo-icon {
    width: 36px; height: 36px; background: var(--accent-dim); border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center; position: relative;
  }
  .logo-icon::before {
    content: ''; width: 12px; height: 12px; background: var(--accent); border-radius: 50%;
    animation: logoPulse 2s ease-in-out infinite;
  }
  @keyframes logoPulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 var(--accent-glow); }
    50% { transform: scale(1.1); box-shadow: 0 0 20px 5px var(--accent-glow); }
  }
  .logo h1 {
    font-size: 20px; font-weight: 600; letter-spacing: -0.02em;
    background: linear-gradient(135deg, var(--fg-primary) 0%, var(--accent) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .header-actions { display: flex; align-items: center; gap: 8px; }
  .icon-btn {
    width: 40px; height: 40px; border-radius: var(--radius-md); border: 1px solid var(--border);
    background: transparent; color: var(--fg-secondary); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all var(--transition-fast); position: relative; overflow: hidden;
  }
  .icon-btn::before {
    content: ''; position: absolute; inset: 0; background: var(--accent); opacity: 0;
    transition: opacity var(--transition-fast);
  }
  .icon-btn:hover { border-color: var(--accent); color: var(--accent); }
  .icon-btn:hover::before { opacity: 0.1; }
  .icon-btn:active { transform: scale(0.95); }
  .icon-btn svg { width: 18px; height: 18px; position: relative; z-index: 1; }

  /* STATUS BAR */
  .status-bar {
    display: flex; justify-content: space-between; align-items: center; padding: 12px 20px;
    background: var(--bg-secondary); border-bottom: 1px solid var(--border); font-size: 13px; z-index: 10; position: relative;
  }
  .status-item { display: flex; align-items: center; gap: 8px; }
  .status-dot {
    width: 8px; height: 8px; border-radius: 50%; background: var(--fg-muted);
    transition: all var(--transition-smooth); position: relative;
  }
  .status-dot.connected { background: var(--accent); box-shadow: 0 0 12px var(--accent-glow); }
  .status-dot.connected::before {
    content: ''; position: absolute; inset: -4px; border: 2px solid var(--accent);
    border-radius: 50%; animation: statusPing 1.5s ease-out infinite;
  }
  @keyframes statusPing { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(2); opacity: 0; } }
  .status-dot.searching { background: #f59e0b; animation: searchPulse 1s ease-in-out infinite; }
  @keyframes searchPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  .status-label { color: var(--fg-secondary); }
  .status-value { color: var(--fg-primary); font-weight: 500; font-family: 'JetBrains Mono', monospace; font-size: 12px; }
  .partner-info {
    display: flex; align-items: center; gap: 10px; padding: 6px 12px;
    background: var(--accent-dim); border-radius: var(--radius-full);
    border: 1px solid rgba(0, 212, 170, 0.2);
    opacity: 0; transform: translateX(10px); transition: all var(--transition-smooth);
  }
  .partner-info.visible { opacity: 1; transform: translateX(0); }
  .partner-avatar {
    width: 24px; height: 24px; border-radius: 50%;
    background: linear-gradient(135deg, var(--accent) 0%, #00b894 100%);
    display: flex; align-items: center; justify-content: center; font-size: 11px;
    font-weight: 600; color: var(--bg-primary);
  }
  .partner-name { font-size: 12px; font-weight: 500; }

  /* CHAT AREA */
  .chat-wrapper { flex: 1; overflow: hidden; position: relative; z-index: 5; }
  .chat {
    height: 100%; overflow-y: auto; padding: 20px; display: flex; flex-direction: column;
    gap: 12px; scroll-behavior: smooth;
  }
  .chat::-webkit-scrollbar { width: 6px; }
  .chat::-webkit-scrollbar-track { background: transparent; }
  .chat::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  .chat::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.15); }

  /* MESSAGES */
  .msg {
    padding: 12px 16px; border-radius: var(--radius-lg); max-width: 75%; position: relative;
    animation: msgSlideIn 0.4s var(--transition-bounce);
  }
  @keyframes msgSlideIn {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .msg.sent {
    background: var(--sent-bg); color: var(--bg-primary); align-self: flex-end;
    border-bottom-right-radius: 6px; box-shadow: 0 4px 20px rgba(0, 212, 170, 0.25);
  }
  .msg.received {
    background: var(--received-bg); backdrop-filter: blur(10px); border: 1px solid var(--border);
    align-self: flex-start; border-bottom-left-radius: 6px;
  }
  .msg-sender {
    font-size: 11px; font-weight: 600; margin-bottom: 4px; opacity: 0.7;
    font-family: 'JetBrains Mono', monospace; letter-spacing: 0.02em;
  }
  .msg.sent .msg-sender { color: rgba(0, 0, 0, 0.5); }
  .msg.received .msg-sender { color: var(--accent); }
  .msg-text { font-size: 14px; line-height: 1.5; word-wrap: break-word; }
  .msg-time {
    font-size: 10px; margin-top: 6px; opacity: 0.5; font-family: 'JetBrains Mono', monospace; text-align: right;
  }
  .msg.sent .msg-time { color: rgba(0, 0, 0, 0.4); }
  .msg.system {
    background: transparent; border: 1px dashed var(--border); align-self: center;
    max-width: 90%; text-align: center; padding: 10px 20px; font-size: 12px;
    color: var(--fg-secondary);
  }

  /* EMPTY STATE */
  .empty-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    flex: 1; color: var(--fg-muted); gap: 15px; text-align: center; padding: 40px;
  }
  .empty-state svg { width: 48px; height: 48px; opacity: 0.5; }
  .empty-state p { font-size: 14px; }

  /* TYPING INDICATOR */
  .typing-wrapper { padding: 0 20px 10px; min-height: 30px; }
  .typing-indicator {
    display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px;
    background: var(--received-bg); border: 1px solid var(--border); border-radius: var(--radius-lg);
    font-size: 12px; color: var(--fg-secondary);
    opacity: 0; transform: translateY(10px); transition: all var(--transition-smooth);
  }
  .typing-indicator.visible { opacity: 1; transform: translateY(0); }
  .typing-dots { display: flex; gap: 4px; }
  .typing-dots span { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; animation: typingBounce 1.4s ease-in-out infinite; }
  .typing-dots span:nth-child(1) { animation-delay: 0s; }
  .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
  .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes typingBounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }

  /* INPUT AREA */
  .footer {
    display: flex; align-items: flex-end; gap: 12px; padding: 16px 20px;
    background: var(--glass); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid var(--border); z-index: 10; position: relative;
  }
  .input-wrapper { flex: 1; position: relative; }
  .input-wrapper input {
    width: 100%; padding: 14px 18px; border-radius: var(--radius-lg);
    border: 1px solid var(--border); background: var(--bg-card); color: var(--fg-primary);
    font-size: 14px; font-family: 'Space Grotesk', sans-serif; outline: none;
    transition: all var(--transition-fast);
  }
  .input-wrapper input:focus { border-color: var(--border-focus); box-shadow: 0 0 0 3px var(--accent-dim); }
  .input-wrapper input:disabled { opacity: 0.5; cursor: not-allowed; }
  .char-counter {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    font-size: 11px; color: var(--fg-muted); font-family: 'JetBrains Mono', monospace;
    opacity: 0; transition: opacity var(--transition-fast);
  }
  .input-wrapper input:focus ~ .char-counter { opacity: 1; }

  /* BUTTONS */
  .btn {
    padding: 14px 24px; border-radius: var(--radius-lg); border: none; cursor: pointer;
    font-size: 14px; font-weight: 600; font-family: 'Space Grotesk', sans-serif;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: all var(--transition-fast); position: relative; overflow: hidden;
  }
  .btn::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%); opacity: 0;
    transition: opacity var(--transition-fast);
  }
  .btn:hover::before { opacity: 1; }
  .btn:active { transform: scale(0.96); }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .btn:disabled:hover::before { opacity: 0; }
  .btn-send {
    background: var(--sent-bg); color: var(--bg-primary); min-width: 100px;
    box-shadow: 0 4px 15px rgba(0, 212, 170, 0.3);
  }
  .btn-send:hover:not(:disabled) { box-shadow: 0 6px 25px rgba(0, 212, 170, 0.4); transform: translateY(-1px); }
  .btn-skip {
    background: var(--danger-dim); color: var(--danger); border: 1px solid rgba(255, 71, 87, 0.3); min-width: 100px;
  }
  .btn-skip:hover:not(:disabled) { background: rgba(255, 71, 87, 0.25); border-color: var(--danger); }

  /* SEARCH SCREEN */
  .search-screen {
    position: fixed; inset: 0; background: var(--bg-primary); display: flex;
    flex-direction: column; align-items: center; justify-content: center;
    z-index: 100; transition: all 0.5s ease;
  }
  .search-screen.hidden { opacity: 0; pointer-events: none; transform: scale(1.05); }
  .search-content { text-align: center; max-width: 400px; padding: 40px; }
  .search-icon {
    width: 100px; height: 100px; margin: 0 auto 30px; background: var(--accent-dim);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    position: relative; animation: searchIconPulse 3s ease-in-out infinite;
  }
  @keyframes searchIconPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  .search-icon::before, .search-icon::after {
    content: ''; position: absolute; border-radius: 50%; border: 2px solid var(--accent);
    animation: searchRing 2s ease-out infinite;
  }
  .search-icon::before { width: 130%; height: 130%; animation-delay: 0s; }
  .search-icon::after { width: 160%; height: 160%; animation-delay: 0.5s; }
  @keyframes searchRing { 0% { transform: scale(0.8); opacity: 0.8; } 100% { transform: scale(1.1); opacity: 0; } }
  .search-icon svg { width: 40px; height: 40px; color: var(--accent); }
  .search-title {
    font-size: 28px; font-weight: 700; margin-bottom: 12px;
    background: linear-gradient(135deg, var(--fg-primary) 0%, var(--accent) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .search-subtitle { font-size: 15px; color: var(--fg-secondary); margin-bottom: 40px; line-height: 1.6; }
  .btn-start {
    background: var(--sent-bg); color: var(--bg-primary); padding: 16px 40px; font-size: 16px;
    border-radius: var(--radius-full); box-shadow: 0 8px 30px rgba(0, 212, 170, 0.35); border: none;
    cursor: pointer; font-family: 'Space Grotesk', sans-serif; font-weight: 600;
    transition: all var(--transition-smooth);
  }
  .btn-start:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0, 212, 170, 0.45); }
  .btn-start:active { transform: translateY(0); }

  /* SEARCHING STATE */
  .searching-state { display: none; flex-direction: column; align-items: center; gap: 20px; }
  .searching-state.visible { display: flex; }
  .search-spinner {
    width: 60px; height: 60px; border: 3px solid var(--border); border-top-color: var(--accent);
    border-radius: 50%; animation: spin 1s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .searching-text { font-size: 14px; color: var(--fg-secondary); }
  .searching-dots { display: inline-flex; gap: 3px; margin-left: 4px; }
  .searching-dots span { animation: dotFade 1.4s ease-in-out infinite; }
  .searching-dots span:nth-child(1) { animation-delay: 0s; }
  .searching-dots span:nth-child(2) { animation-delay: 0.2s; }
  .searching-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes dotFade { 0%, 60%, 100% { opacity: 0.3; } 30% { opacity: 1; } }

  /* TOASTS */
  .toast-container {
    position: fixed; top: 80px; right: 20px; z-index: 200;
    display: flex; flex-direction: column; gap: 10px;
  }
  .toast {
    padding: 14px 20px; background: var(--glass); backdrop-filter: blur(20px);
    border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 13px;
    display: flex; align-items: center; gap: 10px;
    animation: toastSlide 0.4s var(--transition-bounce); box-shadow: var(--shadow-lg); color: var(--fg-primary);
  }
  @keyframes toastSlide { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
  .toast.success { border-color: rgba(0, 212, 170, 0.3); }
  .toast.success .toast-icon { color: var(--accent); }
  .toast.error { border-color: rgba(255, 71, 87, 0.3); }
  .toast.error .toast-icon { color: var(--danger); }
  .toast-icon { width: 18px; height: 18px; flex-shrink: 0; }

  /* RESPONSIVE */
  @media (max-width: 480px) {
    header { padding: 12px 16px; }
    .logo h1 { font-size: 18px; }
    .status-bar { flex-direction: column; gap: 10px; align-items: flex-start; }
    .partner-info { align-self: flex-end; }
    .chat { padding: 16px; }
    .msg { max-width: 85%; }
    .footer { padding: 12px 16px; gap: 10px; }
    .btn { padding: 12px 18px; min-width: auto; }
    .btn-send span { display: none; }
    .btn-send { min-width: 48px; padding: 12px; }
    .search-content { padding: 30px; }
    .search-title { font-size: 24px; }
  }
`;

const OmevoChat = () => {
  // -- STATE --
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [room, setRoom] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [showTyping, setShowTyping] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef(null);
  const inputRef = useRef(null);
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const tokenRef = useRef(localStorage.getItem('token'));
  const userIdRef = useRef(null);

  // -- HELPERS --
  const addMessage = (text, type, sender = null) => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), text, type, sender, time }]);
  };

  const addSystemMessage = (text) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), text, type: 'system' }]);
  };

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // -- SOCKET SETUP --
  useEffect(() => {
    socketRef.current = io(CONFIG.BACKEND, {
      transports: ["websocket"]
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      if (tokenRef.current) {
        socket.emit("auth", { token: tokenRef.current });
      }
    });

    socket.on("authenticated", (data) => {
      if (data?.userId) {
        userIdRef.current = data.userId;
      }
    });

    socket.on("match_found", (data) => {
      handleMatchFound(data);
    });

    socket.on("message", (msg) => {
      const txt = msg.text || msg.message || '';
      const isOwn = msg.uid && userIdRef.current && String(msg.uid) === String(userIdRef.current);
      const sender = isOwn ? "You" : (msg.username || "Stranger");
      addMessage(txt, isOwn ? "sent" : "received", sender);
    });

    socket.on("typing", (data) => {
      if (data?.uid && String(data.uid) !== String(userIdRef.current)) {
        setShowTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setShowTyping(false);
        }, 2000);
      }
    });

    socket.on("peer_left", () => {
      addSystemMessage("Stranger has disconnected");
      setIsConnected(false);
      setStatus('Idle');
      setRoom(null);
      showToast("Stranger disconnected", "error");
    });

    socket.on("banned", (d) => { 
      addSystemMessage("You have been banned. Reason: " + (d.reason || 'Violation'));
      setIsConnected(false);
      setIsSearching(false);
      setStatus('Idle');
      setRoom(null);
      showToast("You have been banned", "error");
    });

    socket.on("moderation_action", (d) => { 
      if (d.banned) {
        addSystemMessage("Banned for inappropriate content.");
        setIsConnected(false);
        setIsSearching(false);
        setStatus('Idle');
        setRoom(null);
        showToast("Banned for inappropriate content", "error");
      }
    });

    socket.on("error", (err) => {
      showToast(err.message || "Socket error", "error");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showTyping]);

  // -- MATCHING LOGIC --
  const handleMatchFound = (data) => {
    if (!data?.channel) return;
    setRoom(data.channel);
    setIsConnected(true);
    setIsSearching(false);
    setStatus('Connected');
    setInputValue('');
    setMessages([]); // Clear old messages for new chat
    
    socketRef.current.emit("join_room", { room: data.channel });

    addSystemMessage("Connected to a stranger. Say hello!");
    showToast("Connected to a stranger!", "success");
    inputRef.current?.focus();
  };

  const startChat = async () => {
    if (!tokenRef.current) {
      showToast("Authentication required. Please log in.", "error");
      return;
    }

    setIsSearching(true);
    setStatus('Searching');
    setMessages([]);

    try {
      const r = await fetch(CONFIG.BACKEND + '/queue/enqueue', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': 'Bearer ' + tokenRef.current 
        },
        body: JSON.stringify({
          gender: 'any',
          looking_for: 'any',
          location: 'any',
          interests: []
        })
      });

      const d = await r.json();
      
      if (!r.ok || d.error) {
        showToast(d.error || "Failed to join queue", "error");
        setIsSearching(false);
        setStatus('Idle');
        return;
      }

      if (d.matched) {
        handleMatchFound({ channel: d.channel, peerId: d.peerId, peerInfo: d.peerInfo });
      } else {
        addSystemMessage("Looking for someone to chat with...");
        showToast("Searching for a match...", "success");
      }
    } catch (e) {
      showToast("Network error. Please try again.", "error");
      setIsSearching(false);
      setStatus('Idle');
    }
  };

  // -- CHAT LOGIC --
  const sendMsg = () => {
    const text = inputValue.trim();
    if (!text || !room) return;

    socketRef.current.emit("message", { room, text });
    setInputValue('');
  };

  const skip = () => {
    if (!room) return;

    socketRef.current.emit("leave_room", { room });
    setRoom(null);
    setIsConnected(false);
    setStatus('Idle');
    setMessages([]);
    showToast("Skipped to next stranger", "success");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMsg();
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (room) {
      socketRef.current.emit("typing", { room });
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if (e.key === "Escape" && room) {
        skip();
      }
      if (e.key === "/" && isConnected && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [room, isConnected]);

  // Focus input when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isConnected) {
        inputRef.current?.focus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isConnected]);

  // -- RENDER --
  return (
    <>
      <style>{CSS_STYLES}</style>

      <div className="app-wrapper">
        
        {/* ANIMATED BACKGROUND */}
        <div className="bg-layer">
          <div className="bg-gradient"></div>
          <div className="grid-overlay"></div>
          <div className="floating-orbs">
            <div className="orb"></div>
            <div className="orb"></div>
            <div className="orb"></div>
          </div>
        </div>

        {/* SEARCH SCREEN */}
        <div className={`search-screen ${isConnected ? 'hidden' : ''}`}>
          <div className="bg-layer">
            <div className="bg-gradient"></div>
            <div className="floating-orbs">
              <div className="orb"></div>
              <div className="orb"></div>
              <div className="orb"></div>
            </div>
          </div>
          
          {!isSearching ? (
            <div className="search-content">
              <div className="search-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h2 className="search-title">Ready to connect?</h2>
              <p className="search-subtitle">Meet new people from around the world. Be respectful and have fun conversations.</p>
              <button className="btn-start" onClick={startChat}>Start Text Chat</button>
            </div>
          ) : (
            <div className="searching-state visible">
              <div className="search-spinner"></div>
              <div className="searching-text">
                Finding someone for you<span className="searching-dots"><span>.</span><span>.</span><span>.</span></span>
              </div>
              <button className="btn btn-skip" style={{ marginTop: '20px' }} onClick={() => { setIsSearching(false); setStatus('Idle'); fetch(CONFIG.BACKEND + '/queue/leave', { method: 'POST', headers: { 'Authorization': 'Bearer ' + tokenRef.current } }).catch(()=>{}); }}>
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* MAIN CHAT INTERFACE */}
        <div className="main-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', opacity: isConnected ? 1 : 0, pointerEvents: isConnected ? 'auto' : 'none', transition: 'opacity 0.3s ease' }}>
          <header>
            <div className="logo">
              <div className="logo-icon"></div>
              <h1>Omevo Text</h1>
            </div>
            <div className="header-actions">
              <button className="icon-btn" onClick={() => showToast("Theme toggle coming soon!", "success")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              </button>
              <button className="icon-btn" onClick={() => showToast("Settings panel coming soon!", "success")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </button>
            </div>
          </header>

          <div className="status-bar">
            <div className="status-item">
              <div className={`status-dot ${status === 'Connected' ? 'connected' : status === 'Searching' ? 'searching' : ''}`}></div>
              <span className="status-label">Status:</span>
              <span className="status-value">{status}</span>
            </div>
            <div className={`partner-info ${isConnected ? 'visible' : ''}`}>
              <div className="partner-avatar">S</div>
              <span className="partner-name">Stranger</span>
            </div>
          </div>

          <div className="chat-wrapper">
            <div className="chat">
              {messages.length === 0 && (
                <div className="empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <p>Connect with someone to start chatting</p>
                </div>
              )}
              
              {messages.map((msg) => (
                <div key={msg.id} className={`msg ${msg.type}`}>
                  {msg.type !== 'system' && (
                    <div className="msg-sender">{msg.sender}</div>
                  )}
                  <div className="msg-text">{msg.text}</div>
                  {msg.type !== 'system' && (
                    <div className="msg-time">{msg.time}</div>
                  )}
                </div>
              ))}
              
              <div ref={chatEndRef} />
            </div>
          </div>

          <div className="typing-wrapper">
            <div className={`typing-indicator ${showTyping ? 'visible' : ''}`}>
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span>Stranger is typing</span>
            </div>
          </div>

          <div className="footer">
            <div className="input-wrapper">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                maxLength={500}
                disabled={!isConnected}
              />
              <span className="char-counter">{inputValue.length}/500</span>
            </div>
            <button 
              className="btn btn-send" 
              onClick={sendMsg} 
              disabled={!isConnected || !inputValue.trim()}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
              <span>Send</span>
            </button>
            <button 
              className="btn btn-skip" 
              onClick={skip} 
              disabled={!isConnected}
            >
              Skip
            </button>
          </div>
        </div>

        {/* TOAST NOTIFICATIONS */}
        <div className="toast-container">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast ${toast.type}`}>
              <svg className="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {toast.type === 'success' 
                  ? <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></>
                  : <><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></>
                }
              </svg>
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default OmevoChat;
