import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { loadStripe } from '@stripe/stripe-js';

// Ensure you link your CSS file (e.g., import './index.css';)
// This component relies on the class names from the original HTML.

/* ===================== CONFIGURATION ===================== */
const CONFIG = {
  BACKEND: "https://term-production-bf65.up.railway.app",
  AGORA_APP_ID: "0f9094ed4a8e4dea934059b0ea8b5182",
  STRIPE_PUBLISHABLE_KEY: "pk_test_your_stripe_key_here",
  DEBUG_MODE: true,
  MODERATION_INTERVAL: 2000,
  MAX_RETRIES: 3,
  HEARTBEAT_INTERVAL: 5000
};

/* ===================== HELPERS ===================== */
const log = (msg, type = 'info') => {
  if (!CONFIG.DEBUG_MODE) return;
  const prefix = '[Omevo]';
  if (type === 'error') console.error(prefix, msg);
  else if (type === 'warn') console.warn(prefix, msg);
  else console.log(prefix, msg);
};

const escapeHtml = (text) => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try { return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch (e) { return dateStr; }
};

const getProviderInfo = (provider) => {
  switch (provider) {
    case "google": return { label: "Google", icon: "fab fa-google", cls: "google" };
    case "discord": return { label: "Discord", icon: "fab fa-discord", cls: "discord" };
    case "facebook": return { label: "Facebook", icon: "fab fa-facebook-f", cls: "facebook" };
    default: return { label: "Guest", icon: "fas fa-circle", cls: "unknown" };
  }
};

const maskEmail = (email) => {
  if (!email || !email.includes("@")) return email;
  const parts = email.split("@");
  return parts[0].slice(0, 2) + "***@" + parts[1];
};

/* ===================== MAIN COMPONENT ===================== */
export default function VideoChat() {
  // --- State ---
  const [loading, setLoading] = useState(true);
  const [banData, setBanData] = useState(null);
  const [showUnbanSuccess, setShowUnbanSuccess] = useState(false);
  const [showPermission, setShowPermission] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [matchSeconds, setMatchSeconds] = useState(0);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ matches: 0, likes: 0, time: 0, level: 1 });
  const [preferences, setPreferences] = useState({ gender: "male", lookingFor: "any", location: "any", interests: [] });
  const [messages, setMessages] = useState([]);
  const [partnerInfo, setPartnerInfoState] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [networkQuality, setNetworkQuality] = useState('excellent');
  
  // Panel States
  const [panels, setPanels] = useState({ settings: false, profile: false, chat: false });
  
  // Modal States
  const [modals, setModals] = useState({ report: false, gifts: false, payment: false, editName: false, appeal: false, ageVerify: false });
  
  // Input States
  const [inputValues, setInputValues] = useState({
    message: "", reportDetails: "", appealText: "", editName: "", 
    interests: "", ageDay: "", ageMonth: "", ageYear: "", 
    gender: "male", lookingFor: "any", location: "any"
  });

  // Toasts
  const [toasts, setToasts] = useState([]);

  // Video/Effect States
  const [currentLayout, setCurrentLayout] = useState("float");
  const [localVideoStyle, setLocalVideoStyle] = useState({ transform: 'scaleX(-1)' }); // Default mirror
  const [localVideoPos, setLocalVideoPos] = useState({ x: 0, y: 0, dragging: false });
  const [selectedEffect, setSelectedEffect] = useState("none");
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // --- Refs ---
  const socketRef = useRef(null);
  const clientRef = useRef(null);
  const localTracksRef = useRef({ videoTrack: null, audioTrack: null, screenTrack: null });
  const canvasRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const matchTimerRef = useRef(null);
  const moderationIntervalRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const stripePromise = loadStripe(CONFIG.STRIPE_PUBLISHABLE_KEY);

  // --- Helpers (Toast) ---
  const showToast = useCallback((msg, type = "info", title = "") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type, title }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  // --- Effects ---

  // 1. Initialization & Auth Check
  useEffect(() => {
    const init = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get("token");
      
      if (urlToken) {
        localStorage.setItem("token", urlToken);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const token = localStorage.getItem("token");

      // Handle URL Query States (Success/Cancel)
      if (urlParams.get("payment") === "success") {
         // Verify payment logic would go here
         window.history.replaceState({}, document.title, window.location.pathname);
      }
      if (urlParams.get("unban") === "success") {
        setShowUnbanSuccess(true);
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      if (!token) {
        setLoading(false);
        setShowPermission(true);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`${CONFIG.BACKEND}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          if (data.user.banned_until && new Date(data.user.banned_until) > new Date()) {
            setBanData({ reason: data.user.ban_reason, bannedUntil: data.user.banned_until });
            setLoading(false);
            return;
          }
          loadSettings(token);
          loadProfile(token);
        }
      } catch (e) {
        log("Auth check error", e);
      }
      setLoading(false);
      setShowPermission(true);
    };

    init();
  }, []);

  // 2. Canvas Background Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let particles = [];
    let animationId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.2;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }
      draw() {
        ctx.fillStyle = `rgba(99, 102, 241, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < 50; i++) particles.push(new Particle());

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // 3. Socket Connection & Events
  useEffect(() => {
    if (!permissionsGranted) return;
    
    const token = localStorage.getItem("token");
    socketRef.current = io(CONFIG.BACKEND);

    socketRef.current.on("connect", () => {
      if (token) socketRef.current.emit("auth", { token });
    });

    socketRef.current.on("authenticated", (d) => log("Socket Authenticated: " + d.userId));
    
    socketRef.current.on("match_found", async (d) => {
      if (isMatching && !isInCall) {
        startCall(d.channel, d.peerId);
        setPartnerInfoState(d.peerInfo);
      }
    });

    socketRef.current.on("peer_left", () => {
      showToast("Partner disconnected", "info");
      endCall();
    });

    socketRef.current.on("banned", (d) => {
      endCall();
      setBanData({ reason: d.reason, bannedUntil: d.until });
    });

    socketRef.current.on("moderation_action", (d) => {
      if (d.banned) {
        endCall();
        setBanData({ reason: d.reason, bannedUntil: null });
      }
    });

    socketRef.current.on("message", (d) => {
      const txt = d.text || d.message || "";
      const own = d.uid && user && String(d.uid) === String(user.id);
      addMessageToChat(txt, own, own ? "You" : (d.username || "Stranger"));
    });

    socketRef.current.on("room_history", (d) => {
      if (d.messages) d.messages.forEach(m => {
        const own = m.uid && user && String(m.uid) === String(user.id);
        addMessageToChat(m.message || m.text, own, own ? "You" : "Stranger");
      });
    });

    socketRef.current.on("typing", (d) => {
      if (d.uid && user && String(d.uid) !== String(user.id)) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    socketRef.current.on("error", (d) => { if (d.message) showToast(d.message, "error"); });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [permissionsGranted, isMatching, isInCall, user]);

  // 4. Match Timer
  useEffect(() => {
    if (isInCall) {
      matchTimerRef.current = setInterval(() => {
        setMatchSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(matchTimerRef.current);
      setMatchSeconds(0);
    }
    return () => clearInterval(matchTimerRef.current);
  }, [isInCall]);

  // --- Handlers ---

  const requestPermissions = async () => {
    try {
      localTracksRef.current.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      localTracksRef.current.videoTrack = await AgoraRTC.createCameraVideoTrack({ encoderConfig: { width: 1280, height: 720, frameRate: 30, bitrate: 1710 } });
      
      if (localVideoRef.current) {
        localTracksRef.current.videoTrack.play(localVideoRef.current);
      }
      
      setPermissionsGranted(true);
      setShowPermission(false);
    } catch (err) {
      console.error("Permission error:", err);
      showToast("Camera & microphone permission required", "error");
    }
  };

  const startMatching = async () => {
    if (isMatching || isInCall) return;
    if (!permissionsGranted) { setShowPermission(true); return; }
    
    const token = localStorage.getItem("token");
    setIsMatching(true);

    try {
      const payload = {
        gender: preferences.gender,
        location: preferences.location,
        interests: preferences.interests,
        nickname: user?.username || user?.nickname || "User"
      };
      
      const res = await fetch(`${CONFIG.BACKEND}/queue/enqueue`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Enqueue failed");
      
      if (d.matched) {
        startCall(d.channel, d.peerId);
        setPartnerInfoState(d.peerInfo);
      } else {
        showToast("Looking for a match...", "info");
        setTimeout(() => { if (isMatching) checkForMatch(); }, 3000);
      }
    } catch (e) {
      console.error(e);
      showToast(e.message || "Matching failed", "error");
      setIsMatching(false);
    }
  };

  const checkForMatch = async () => {
    if (!isMatching || isInCall) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${CONFIG.BACKEND}/queue/check`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const d = await res.json();
      if (d.matched) {
        startCall(d.channel, d.peerId);
        setPartnerInfoState(d.peerInfo);
      } else {
        setTimeout(checkForMatch, 3000);
      }
    } catch (e) {
      setTimeout(checkForMatch, 5000);
    }
  };

  const startCall = async (channelName, peerId) => {
    setIsMatching(false);
    setIsInCall(true);
    const token = localStorage.getItem("token");
    
    try {
      const uid = Math.floor(Math.random() * 100000);
      const tr = await fetch(`${CONFIG.BACKEND}/generateToken`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ channelName, uid, role: "publisher", expirySeconds: 3600 })
      });
      const td = await tr.json();
      if (!tr.ok) throw new Error(td.error || "Token failed");

      clientRef.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      await clientRef.current.join(td.appID || CONFIG.AGORA_APP_ID, channelName, td.rtcToken, uid);

      if (!localTracksRef.current.audioTrack) localTracksRef.current.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      if (!localTracksRef.current.videoTrack) localTracksRef.current.videoTrack = await AgoraRTC.createCameraVideoTrack();
      
      await clientRef.current.publish([localTracksRef.current.audioTrack, localTracksRef.current.videoTrack]);

      clientRef.current.on("user-published", async (user, mediaType) => {
        await clientRef.current.subscribe(user, mediaType);
        if (mediaType === "video") {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = new MediaStream([user.videoTrack.getMediaStreamTrack()]);
            remoteVideoRef.current.play().catch(() => {});
          }
        }
        if (mediaType === "audio") user.audioTrack.play();
      });

      clientRef.current.on("user-unpublished", (u, m) => { 
        if (m === "video" && remoteVideoRef.current) remoteVideoRef.current.srcObject = null; 
      });

      clientRef.current.on("network-quality", (stats) => {
        const q = stats.downlinkNetworkQuality;
        let quality = 'poor';
        if (q <= 1) quality = 'excellent';
        else if (q === 2) quality = 'good';
        else if (q === 3) quality = 'poor';
        else if (q >= 4) quality = 'bad';
        setNetworkQuality(quality);
      });

      socketRef.current.emit("join_room", { room: channelName });
      startModerationLoop(channelName);
      
      setStats(prev => ({ ...prev, matches: prev.matches + 1 }));
      showToast("Connected!", "success");
    } catch (e) {
      console.error("Call error:", e);
      showToast("Failed: " + e.message, "error");
      endCall();
    }
  };

  const endCall = () => {
    setIsInCall(false);
    setIsMatching(false);
    setIsScreenSharing(false);
    clearInterval(matchTimerRef.current);
    clearInterval(moderationIntervalRef.current);
    setCurrentLayout("float");
    
    if (clientRef.current) {
      try { clientRef.current.leave(); } catch (e) {}
      clientRef.current = null;
    }
    
    if (socketRef.current) socketRef.current.emit("leave_room", { room: "current" });
    setMessages([]);
  };

  const startModerationLoop = (roomId) => {
    if (moderationIntervalRef.current) clearInterval(moderationIntervalRef.current);
    
    // We need a canvas to capture the frame, but we can't see the canvas in DOM for this usually
    // For brevity in React conversion, we assume a canvas is created in memory or logic is adapted
    // Here is the logic equivalent:
    moderationIntervalRef.current = setInterval(() => {
      if (!isInCall || !socketRef.current?.connected) return;
      try {
        // Logic to capture frame from video element
        // const v = document.querySelector("#localVideo video"); // In React, use ref
        // This part needs integration with the actual video DOM element
        // socketRef.current.emit("video_frame", { frameBase64: ..., roomId });
      } catch (e) {}
    }, CONFIG.MODERATION_INTERVAL);
  };

  const sendMessage = () => {
    const text = inputValues.message.trim();
    if (!text || !socketRef.current?.connected) return;
    
    const currentRoom = "current"; // Logic to derive room name needed
    socketRef.current.emit("message", { room: currentRoom, text });
    addMessageToChat(text, true, "You");
    setInputValues(prev => ({ ...prev, message: "" }));
  };

  const addMessageToChat = (msg, isOwn, name) => {
    setMessages(prev => [...prev, { msg, isOwn, name }]);
  };

  const toggleLayout = () => {
    const newLayout = currentLayout === "float" ? "split" : "float";
    setCurrentLayout(newLayout);
  };

  const applyEffect = (effect) => {
    setSelectedEffect(effect);
    const filters = { none: "", blur: "blur(5px)", grayscale: "grayscale(100%)", sepia: "sepia(100%)", invert: "invert(100%)", contrast: "contrast(150%)" };
    setLocalVideoStyle(prev => ({ ...prev, filter: filters[effect] || "" }));
  };

  const loadSettings = async (token) => {
    try {
      const res = await fetch(`${CONFIG.BACKEND}/api/user/preferences`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const p = await res.json();
        setPreferences(p);
        setInputValues(prev => ({ 
            ...prev, 
            gender: p.gender || "male", 
            location: p.location || "any", 
            interests: (p.interests || []).join(", ") 
        }));
      }
    } catch (e) {}
  };

  const saveSettings = async () => {
    const interests = inputValues.interests.split(",").map(i => i.trim()).filter(i => i.length > 0).slice(0, 5);
    const payload = {
      gender: inputValues.gender,
      location: inputValues.location,
      interests: interests,
      nickname: user?.username || user?.nickname || "User"
    };
    
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${CONFIG.BACKEND}/api/user/preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast("Settings saved!", "success");
        setPreferences(payload);
        setPanels(prev => ({ ...prev, settings: false }));
      }
    } catch (e) { showToast("Error", "error"); }
  };

  const loadProfile = async (token) => {
    try {
      const res = await fetch(`${CONFIG.BACKEND}/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const u = await res.json();
        setUser(u);
      }
    } catch (e) {}
  };

  // --- Drag Logic for Local Video ---
  const handleMouseDown = (e) => {
    if (currentLayout === "split") return;
    if (e.target.tagName === "BUTTON" || e.target.closest('button')) return;
    
    const clientX = e.clientX || e.touches?.[0].clientX;
    const clientY = e.clientY || e.touches?.[0].clientY;
    
    setLocalVideoPos(prev => ({ 
        ...prev, 
        dragging: true, 
        offsetX: clientX - (prev.x || 0), 
        offsetY: clientY - (prev.y || 0) 
    }));
  };

  const handleMouseMove = (e) => {
    if (!localVideoPos.dragging || currentLayout !== "float") return;
    e.preventDefault(); 
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    if (clientX !== undefined) {
        setLocalVideoPos(prev => {
            const newX = clientX - prev.offsetX;
            const newY = clientY - prev.offsetY;
            return { ...prev, x: newX, y: newY };
        });
    }
  };

  useEffect(() => {
    if (localVideoPos.dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', () => setLocalVideoPos(prev => ({ ...prev, dragging: false })));
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('touchend', () => setLocalVideoPos(prev => ({ ...prev, dragging: false })));
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleMouseMove);
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleMouseMove);
    };
  }, [localVideoPos.dragging]);


  // --- Render Helpers ---
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <>
      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t => (
            <div key={t.id} className={`toast show ${t.type}`}>
                <div className="toast-icon"><i className={`fas fa-${t.type === 'success' ? 'check' : t.type === 'error' ? 'times' : 'info'}`}></i></div>
                <div className="toast-content">
                    {t.title && <div className="toast-title">{t.title}</div>}
                    <div className="toast-message">{t.msg}</div>
                </div>
            </div>
        ))}
      </div>

      {/* Loading Screen */}
      {loading && (
        <div id="loadingScreen" role="status" aria-live="polite">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading Omevo...</div>
        </div>
      )}

      {/* Ban Overlay */}
      {banData && (
        <div id="banOverlay" className="active" role="alertdialog">
          <div className="ban-bg-noise"></div>
          <div className="ban-scanline"></div>
          <div className="ban-container">
            <div className="ban-stamp">BANNED</div>
            <div className="ban-reason-frame">
              <div className="ban-reason-label">Reason for Suspension</div>
              <div className="ban-reason-icon"><i className="fas fa-exclamation-triangle" style={{color:'var(--danger)'}}></i></div>
              <div className="ban-reason-text">{banData.reason}</div>
              {banData.bannedUntil && (
                <div className="ban-duration">
                  <i className="fas fa-clock"></i>
                  <span>{new Date(banData.bannedUntil).toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="ban-price-card">
              <div className="ban-price-label">Removal Fee</div>
              <div className="ban-price-amount">&pound;4.99</div>
              <div className="ban-price-sub">One-time payment &middot; Instant removal</div>
            </div>
            <button className="ban-pay-btn" onClick={() => window.location.href = "#payment-logic-placeholder"}>
              <i className="fas fa-shield-alt btn-icon"></i> Pay &pound;4.99 to Unban
            </button>
            <div className="ban-appeal">
              <button className="ban-appeal-btn" onClick={() => setModals(prev => ({...prev, appeal: true}))}><i className="fas fa-gavel"></i> Submit an Appeal Instead</button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Overlay */}
      {showPermission && !banData && (
        <div id="permissionOverlay" role="dialog">
          <div className="permission-card">
            <div className="permission-icon"><i className="fas fa-video"></i></div>
            <h2 className="permission-title">Camera &amp; Microphone Required</h2>
            <p className="permission-description">Omevo needs access to your camera and microphone to connect you with others through video chat.</p>
            <div className="permission-buttons">
              <button className="permission-btn secondary" onClick={() => window.location.href = "/"}>Exit</button>
              <button className="permission-btn primary" onClick={requestPermissions}>Allow Access</button>
            </div>
          </div>
        </div>
      )}

      {/* Unban Success Overlay */}
      {showUnbanSuccess && (
        <div id="unbanSuccessOverlay" role="status">
          <div className="success-check"><i className="fas fa-check"></i></div>
          <h2>Account Restored</h2>
          <p>Your suspension has been lifted. Welcome back!</p>
          <button className="btn btn-primary" onClick={() => setShowUnbanSuccess(false)}>Continue to Omevo</button>
        </div>
      )}

      {/* Background Canvas */}
      <canvas id="bgCanvas" ref={canvasRef} aria-hidden="true" style={{position:'fixed', top:0, left:0, zIndex:-1}}></canvas>

      {/* Main App */}
      <div id="app" className={currentLayout === "split" ? "split-mode" : ""}>
        <div className="video-container">
          
          {/* Remote Video */}
          <div id="remoteVideoWrapper">
            <video id="remoteVideo" ref={remoteVideoRef} autoPlay playsInline></video>
          </div>

          {/* Blur / Matching Overlay */}
          {isMatching && (
            <div id="blurOverlay" className="active">
              <div className="matching-content" style={{textAlign:'center'}}>
                <div className="pulse-animation"><i className="fas fa-search" style={{fontSize:'3rem',color:'white'}}></i></div>
                <div className="matching-text">Finding someone to chat with...</div>
                <div className="spinner"></div>
                <button className="cancel-btn" onClick={() => setIsMatching(false)}>Cancel Search</button>
              </div>
            </div>
          )}

          {/* Local Video (Draggable) */}
          <div 
            id="localVideoWrapper" 
            ref={localVideoRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            style={{
                position: currentLayout === 'float' ? 'absolute' : 'relative',
                right: currentLayout === 'float' && localVideoPos.x === 0 ? '30px' : 'auto',
                bottom: currentLayout === 'float' && localVideoPos.y === 0 ? '100px' : 'auto',
                left: localVideoPos.x !== 0 ? localVideoPos.x : 'auto',
                top: localVideoPos.y !== 0 ? localVideoPos.y : 'auto',
                transform: localVideoStyle.transform,
                filter: localVideoStyle.filter
            }}
          >
            <div id="localVideo"></div>
            <button id="pipBtn" title="Picture in Picture"><i className="fas fa-external-link-alt"></i></button>
            <button id="resetPositionBtn" title="Reset Position" onClick={() => setLocalVideoPos({x:0, y:0})}><i className="fas fa-compress"></i></button>
          </div>

          {/* Partner Info */}
          {isInCall && (
            <div id="partnerInfo" style={{display:'block'}}>
              <div className="name">
                <span>{partnerInfo.username || "Stranger"}</span>
                <span className="badge"><i className="fas fa-check-circle"></i> Verified</span>
              </div>
              <div className="details">
                <div><i className="fas fa-map-marker-alt"></i> {partnerInfo.location || "Unknown"}</div>
                <div><i className="fas fa-venus-mars"></i> {partnerInfo.gender || "Unknown"}</div>
              </div>
              <div className="interests">
                {partnerInfo.interests?.map((int, i) => <span key={i} className="interest-tag">{int}</span>)}
              </div>
            </div>
          )}

          {/* Stats Bar */}
          <div id="statsBar">
            <div className="stat-item"><div className="stat-value">{stats.matches}</div><div className="stat-label">Matches</div></div>
            <div className="stat-item"><div className="stat-value">{formatTime(matchSeconds)}</div><div className="stat-label">Time</div></div>
            <div className="stat-item"><div className="stat-value">{stats.level}</div><div className="stat-label">Level</div></div>
            <div className="stat-item" style={{position:'relative'}}>
              <div className="stat-label">Signal</div>
              <div className={`network-quality ${networkQuality}`}>
                <div className="network-bar"></div><div className="network-bar"></div><div className="network-bar"></div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div id="controls" role="toolbar">
            {!isInCall ? (
              <div id="startControls" style={{display:'flex', gap:'8px'}}>
                <button className="control-btn primary" onClick={startMatching}><i className="fas fa-play"></i></button>
                <button className="control-btn" onClick={() => setModals(prev => ({...prev, gifts: true}))}><i className="fas fa-gift"></i></button>
                <button className="control-btn" onClick={() => document.getElementById('effectsPanel').classList.toggle('active')}><i className="fas fa-magic"></i></button>
              </div>
            ) : (
              <div id="activeControls" style={{display:'flex', gap:'8px'}}>
                <button className="control-btn" onClick={() => { endCall(); setTimeout(startMatching, 500); }}><i className="fas fa-forward"></i></button>
                <button className="control-btn" onClick={() => setPanels(prev => ({...prev, chat: true}))}><i className="fas fa-comment"></i></button>
                <button className="control-btn" onClick={() => setModals(prev => ({...prev, report: true}))}><i className="fas fa-flag"></i></button>
                <button className="control-btn" onClick={() => setStats(prev => ({...prev, likes: prev.likes + 1}))}><i className="fas fa-heart"></i></button>
                <button className="control-btn danger" onClick={endCall}><i className="fas fa-stop"></i></button>
                <button className="control-btn" onClick={toggleLayout}><i className="fas fa-columns"></i></button>
              </div>
            )}
          </div>
          
          {/* Effects Panel */}
          <div className="effects-panel" id="effectsPanel" role="menu">
            {['none', 'blur', 'grayscale', 'sepia', 'invert', 'contrast'].map(eff => (
              <button key={eff} className={`effect-btn ${selectedEffect === eff ? 'active' : ''}`} onClick={() => applyEffect(eff)} title={eff}>
                <i className={`fas fa-${eff === 'none' ? 'ban' : eff === 'blur' ? 'eye-slash' : eff === 'grayscale' ? 'adjust' : eff === 'sepia' ? 'image' : eff === 'invert' ? 'exchange-alt' : 'sun'}`}></i>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {panels.settings && (
        <div className="side-panel left open" id="settingsPanel">
          <div className="panel-header">
            <h2>Settings</h2>
            <button className="control-btn" onClick={() => setPanels(prev => ({...prev, settings: false}))}><i className="fas fa-times"></i></button>
          </div>
          <div className="panel-content">
            <div className="form-group">
              <label>I am</label>
              <select className="form-control" value={inputValues.gender} onChange={e => setInputValues(prev => ({...prev, gender: e.target.value}))}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Location</label>
              <select className="form-control" value={inputValues.location} onChange={e => setInputValues(prev => ({...prev, location: e.target.value}))}>
                <option value="any">Anywhere</option>
                <option value="nearby">Nearby</option>
                <option value="us">United States</option>
                <option value="europe">Europe</option>
                <option value="asia">Asia</option>
              </select>
            </div>
            <div className="form-group">
              <label>Interests (comma separated)</label>
              <input type="text" className="form-control" value={inputValues.interests} onChange={e => setInputValues(prev => ({...prev, interests: e.target.value}))} placeholder="Music, Gaming..." />
            </div>
            <button className="btn btn-primary" onClick={saveSettings} style={{width:'100%'}}>Save Settings</button>
          </div>
        </div>
      )}

      {/* Profile Panel */}
      {panels.profile && (
        <div className="side-panel right open" id="profilePanel">
          <div className="panel-header">
            <h2>Profile</h2>
            <button className="control-btn" onClick={() => setPanels(prev => ({...prev, profile: false}))}><i className="fas fa-times"></i></button>
          </div>
          <div className="panel-content">
             <div className="profile-hero">
                <div className="profile-avatar-ring">
                    <div className="avatar-fallback">
                        {user?.avatar ? <img src={user.avatar} alt="Avatar"/> : <span style={{fontSize:'2rem'}}>{user?.username?.substring(0,2).toUpperCase()}</span>}
                    </div>
                </div>
                <div className="profile-name-row">
                    <span className="profile-display-name">{user?.display_name || user?.username}</span>
                    <span className="profile-provider-badge unknown"><i className="fas fa-circle"></i> {getProviderInfo(user?.provider).label}</span>
                </div>
                <div className="profile-coins-row">
                    <i className="fas fa-coins"></i>
                    <span>{user?.coins || 0}</span>
                </div>
             </div>
             <div className="profile-actions" style={{marginTop:'20px'}}>
                <button className="profile-action-btn logout" onClick={() => { localStorage.removeItem('token'); window.location.reload(); }}>Logout</button>
             </div>
          </div>
        </div>
      )}

      {/* Chat Panel */}
      {panels.chat && (
        <div id="chatPanel" className="side-panel right open" style={{display:'flex', flexDirection:'column'}}>
          <div className="panel-header">
            <h3>Chat</h3>
            <button className="control-btn" onClick={() => setPanels(prev => ({...prev, chat: false}))}><i className="fas fa-times"></i></button>
          </div>
          <div className="chat-messages" style={{padding:'20px', flex:1, overflowY:'auto'}}>
            {messages.map((m, i) => (
              <div key={i} style={{marginBottom:'10px', textAlign: m.isOwn ? 'right' : 'left'}}>
                <div style={{fontSize:'0.72rem', color:'var(--primary)', marginBottom:'3px', fontWeight:'600'}}>{m.name}</div>
                <span style={{
                    background: m.isOwn ? 'var(--primary)' : 'var(--dark-card)',
                    padding: '8px 14px',
                    borderRadius: m.isOwn ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    display: 'inline-block',
                    maxWidth: '80%',
                    wordBreak: 'break-word'
                }}>{escapeHtml(m.msg)}</span>
              </div>
            ))}
            {isTyping && <div style={{padding:'0 20px 5px', fontSize:'0.8rem', color:'var(--text-muted)'}}>Stranger is typing...</div>}
          </div>
          <div style={{padding:'15px', borderTop:'1px solid var(--glass-border)', display:'flex', gap:'10px'}}>
            <input type="text" value={inputValues.message} onChange={e => setInputValues(prev => ({...prev, message: e.target.value}))} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Type a message..." style={{flex:1, padding:'10px 15px', background:'var(--dark)', border:'1px solid var(--glass-border)', borderRadius:'25px', color:'var(--text)'}} />
            <button onClick={sendMessage} style={{width:'40px', height:'40px', borderRadius:'50%', border:'none', background:'var(--primary)', color:'white', cursor:'pointer'}}><i className="fas fa-paper-plane"></i></button>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {modals.report && (
        <div className="modal active" id="reportModal">
          <div className="modal-content">
            <div className="modal-header"><h3>Report User</h3></div>
            <div className="report-reasons">
              {['Inappropriate behavior', 'Spam or Scam', 'Underage User', 'Violence', 'Nudity'].map(r => (
                <div key={r} className="report-option" onClick={(e) => { document.querySelectorAll('.report-option').forEach(el => el.classList.remove('selected')); e.currentTarget.classList.add('selected'); }}>
                   <i className="fas fa-exclamation-triangle" style={{color:'var(--danger)'}}></i> {r}
                </div>
              ))}
            </div>
            <div className="form-group">
                <textarea className="form-control" rows="3" placeholder="Details..." value={inputValues.reportDetails} onChange={e => setInputValues(prev => ({...prev, reportDetails: e.target.value}))}></textarea>
            </div>
            <div style={{display:'flex', gap:'10px'}}>
                <button className="btn btn-primary" onClick={() => { setModals(prev => ({...prev, report: false})); showToast("Report submitted", "success"); endCall(); }}>Submit</button>
                <button className="btn" onClick={() => setModals(prev => ({...prev, report: false}))}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* FABs */}
      <button className="fab" id="settingsFab" onClick={() => setPanels(prev => ({...prev, settings: !prev.settings}))} style={{bottom: '20px', left: '20px'}}><i className="fas fa-cog"></i></button>
      <button className="fab" id="profileFab" onClick={() => setPanels(prev => ({...prev, profile: !prev.profile}))} style={{bottom: '20px', left: '70px'}}><i className="fas fa-user"></i></button>
    </>
  );
}
