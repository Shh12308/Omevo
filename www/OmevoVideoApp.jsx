import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
// Note: AgoraRTC is assumed to be on window from the CDN script in index.html

const OmevoVideoApp = () => {
  // --- CONFIGURATION ---
  const CONFIG = {
    BACKEND: "https://term-production-bf65.up.railway.app",
    AGORA_APP_ID: "0f9094ed4a8e4dea934059b0ea8b5182",
    STRIPE_PUBLISHABLE_KEY: "pk_test_your_stripe_key_here",
    DEBUG_MODE: true,
    MODERATION_INTERVAL: 2000,
  };

  // --- REFS ---
  const socketRef = useRef(null);
  const clientRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const localTracks = useRef({ videoTrack: null, audioTrack: null, screenTrack: null });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 });
  const moderationIntervalRef = useRef(null);
  const stripeRef = useRef(null);

  // --- STATE ---
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // App State
  const [isMatching, setIsMatching] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  
  // Stats & Data
  const [matchStats, setMatchStats] = useState({ matches: 0, time: 0, level: 1, likes: 0 });
  const [partnerInfo, setPartnerInfo] = useState({ name: "Stranger", location: "Unknown", gender: "Unknown" });
  const [messages, setMessages] = useState([]);
  const [toasts, setToasts] = useState([]);
  
  // UI Visibility (Modals/Panels)
  const [showBan, setShowBan] = useState(false);
  const [banData, setBanData] = useState({});
  const [showAppeal, setShowAppeal] = useState(false);
  const [showAgeVerify, setShowAgeVerify] = useState(false);
  const [showPermission, setShowPermission] = useState(true); // Default to show in this version
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showEffects, setShowEffects] = useState(false);

  // Form Inputs
  const [inputMessage, setInputMessage] = useState("");
  const [settings, setSettings] = useState({ gender: "male", lookingFor: "any", location: "any", interests: [] });
  const [appealText, setAppealText] = useState("");

  // --- EFFECTS ---

  // 1. Initialization & Auth
  useEffect(() => {
    const init = async () => {
      // Handle URL Params
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get("token");
      if (urlToken) {
        localStorage.setItem("token", urlToken);
        setToken(urlToken);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Stripe Init
      if (window.Stripe) {
        stripeRef.current = window.Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY);
      }

      if (token) {
        await checkBanStatus();
        await loadProfile();
      } else {
        setLoading(false);
      }
    };

    init();
  }, [token]);

  // 2. Socket Connection
  useEffect(() => {
    if (!token) return;
    
    socketRef.current = io(CONFIG.BACKEND);

    const socket = socketRef.current;

    socket.on("connect", () => {
      if (token) socket.emit("auth", { token });
    });

    socket.on("authenticated", (d) => console.log("Socket Authenticated:", d.userId));

    socket.on("match_found", (d) => {
      if (isMatching && !isInCall) {
        setPartnerInfo({
          name: d.peerInfo?.username || "Stranger",
          location: d.peerInfo?.location || "Unknown",
          gender: d.peerInfo?.gender || "Unknown"
        });
        startCall(d.channel, d.peerId);
      }
    });

    socket.on("peer_left", () => {
      showToast("Partner disconnected", "info");
      endCall();
    });

    socket.on("banned", (d) => {
      endCall();
      setBanData({ reason: d.reason, until: d.until });
      setShowBan(true);
    });

    socket.on("message", (d) => {
      const isOwn = d.uid && user && String(d.uid) === String(user.id);
      addMessageToChat(d.text || d.message, isOwn, isOwn ? "You" : (d.username || "Stranger"));
    });

    socket.on("typing", () => {
        // Logic to show typing indicator if needed
    });

    return () => {
      socket.disconnect();
    };
  }, [token, isMatching, isInCall, user]);

  // 3. Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let particles = [];
    let animationFrameId;

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
        ctx.fillStyle = "rgba(99, 102, 241, " + this.opacity + ")";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < 50; i++) particles.push(new Particle());

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // --- HANDLERS & LOGIC ---

  const showToast = (msg, type = 'info', title = "") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type, title }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const checkBanStatus = async () => {
    try {
      const r = await fetch(CONFIG.BACKEND + "/auth/me", { headers: { Authorization: "Bearer " + token } });
      const d = await r.json();
      if (d.authenticated && d.user) {
        setUser(d.user);
        if (d.user.banned_until && new Date(d.user.banned_until) > new Date()) {
          setBanData({ reason: d.user.ban_reason, until: d.user.banned_until });
          setShowBan(true);
        } else {
          setLoading(false);
          setShowPermission(true); // Show permission screen if not banned
        }
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      // Assumes AgoraRTC is global
      if (!window.AgoraRTC) throw new Error("Agora SDK not loaded");
      
      localTracks.current.audioTrack = await window.AgoraRTC.createMicrophoneAudioTrack();
      localTracks.current.videoTrack = await window.AgoraRTC.createCameraVideoTrack({ 
        encoderConfig: { width: 1280, height: 720, frameRate: 30, bitrate: 1710 } 
      });
      
      localTracks.current.videoTrack.play(localVideoRef.current);
      setPermissionsGranted(true);
      setShowPermission(false);
    } catch (err) {
      showToast("Camera & microphone permission required", "error");
    }
  };

  const startMatching = async () => {
    if (!permissionsGranted) {
      setShowPermission(true);
      return;
    }
    setIsMatching(true);
    try {
      const r = await fetch(CONFIG.BACKEND + "/queue/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify(settings)
      });
      if (!r.ok) throw new Error("Enqueue failed");
      const d = await r.json();
      if (d.matched) {
        setPartnerInfo({ name: d.peerInfo?.username || "Stranger", ...d.peerInfo });
        startCall(d.channel, d.peerId);
      } else {
        setTimeout(() => { if (isMatching) checkForMatch(); }, 3000);
      }
    } catch (e) {
      showToast(e.message, "error");
      setIsMatching(false);
    }
  };

  const checkForMatch = async () => {
    if (!isMatching || isInCall) return;
    try {
      const r = await fetch(CONFIG.BACKEND + "/queue/check", { headers: { Authorization: "Bearer " + token } });
      if (!r.ok) return;
      const d = await r.json();
      if (d.matched) {
        setPartnerInfo({ name: d.peerInfo?.username || "Stranger", ...d.peerInfo });
        startCall(d.channel, d.peerId);
      } else {
        setTimeout(checkForMatch, 3000);
      }
    } catch (e) { setTimeout(checkForMatch, 5000); }
  };

  const startCall = async (channelName, peerId) => {
    setIsMatching(false);
    setIsInCall(true);
    try {
      const uid = Math.floor(Math.random() * 100000);
      const tr = await fetch(CONFIG.BACKEND + "/generateToken", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ channelName, uid, role: "publisher", expirySeconds: 3600 })
      });
      const td = await tr.json();
      
      clientRef.current = window.AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      await clientRef.current.join(td.appID || CONFIG.AGORA_APP_ID, channelName, td.rtcToken, uid);

      if (!localTracks.current.audioTrack) localTracks.current.audioTrack = await window.AgoraRTC.createMicrophoneAudioTrack();
      if (!localTracks.current.videoTrack) localTracks.current.videoTrack = await window.AgoraRTC.createCameraVideoTrack();
      
      await clientRef.current.publish([localTracks.current.audioTrack, localTracks.current.videoTrack]);

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

      clientRef.current.on("user-unpublished", (u) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      });
      
      setMatchStats(prev => ({ ...prev, matches: prev.matches + 1 }));
      showToast("Connected!", "success");
      
      // Start moderation loop (simplified)
      startModerationLoop(channelName);

    } catch (e) {
      console.error(e);
      showToast("Failed: " + e.message, "error");
      endCall();
    }
  };

  const endCall = () => {
    setIsInCall(false);
    setIsMatching(false);
    setIsScreenSharing(false);
    if (clientRef.current) {
      try { clientRef.current.leave(); } catch (e) {}
      clientRef.current = null;
    }
    if (moderationIntervalRef.current) clearInterval(moderationIntervalRef.current);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (localTracks.current.screenTrack) {
        localTracks.current.screenTrack.close();
        localTracks.current.screenTrack = null;
    }
  };

  const startModerationLoop = (roomId) => {
    if (moderationIntervalRef.current) clearInterval(moderationIntervalRef.current);
    moderationIntervalRef.current = setInterval(() => {
      if (!isInCall || !socketRef.current?.connected) return;
      try {
        const videoEl = localVideoRef.current?.querySelector("video");
        if (!videoEl || videoEl.readyState < 2) return;
        
        const canvas = document.createElement("canvas");
        canvas.width = 320; canvas.height = 240;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(videoEl, 0, 0, 320, 240);
        
        socketRef.current.emit("video_frame", { 
          frameBase64: canvas.toDataURL("image/jpeg", 0.7), 
          roomId 
        });
      } catch (e) { /* Silent */ }
    }, CONFIG.MODERATION_INTERVAL);
  };

  const sendMessage = () => {
    const text = inputMessage.trim();
    if (!text || !socketRef.current?.connected) return;
    socketRef.current.emit("message", { room: clientRef.current?.channelName, text });
    addMessageToChat(text, true, "You");
    setInputMessage("");
  };

  const addMessageToChat = (msg, isOwn, name) => {
    setMessages(prev => [...prev, { id: Date.now(), text: msg, isOwn, name }]);
  };

  // Drag and Drop Logic
  const handleDragStart = (e) => {
    if (e.target.closest('button')) return;
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    dragRef.current = {
      dragging: true,
      startX: clientX,
      startY: clientY,
      initialLeft: e.currentTarget.offsetLeft,
      initialTop: e.currentTarget.offsetTop
    };
    e.currentTarget.style.transition = 'none';
  };

  const handleDragMove = (e) => {
    if (!dragRef.current.dragging) return;
    const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
    
    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;
    
    // Basic boundary logic
    const el = document.getElementById("localVideoWrapper");
    if(el) {
        el.style.left = (dragRef.current.initialLeft + dx) + "px";
        el.style.top = (dragRef.current.initialTop + dy) + "px";
    }
  };

  const handleDragEnd = () => {
    if(dragRef.current.dragging) {
        dragRef.current.dragging = false;
        const el = document.getElementById("localVideoWrapper");
        if(el) el.style.transition = '';
    }
  };

  // Attach global mouse events for drag
  useEffect(() => {
    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchmove", handleDragMove, { passive: false });
    window.addEventListener("touchend", handleDragEnd);
    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, []);

  // --- RENDER HELPERS ---
  
  if (loading) {
    return <div id="loadingScreen" className="active"><div className="loading-spinner"></div><div className="loading-text">Loading Omevo...</div></div>;
  }

  return (
    <>
      <canvas ref={canvasRef} id="bgCanvas" aria-hidden="true"></canvas>

      {/* TOASTS */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type} show`}>
            <div className="toast-icon"><i className={`fas fa-${t.type === 'success' ? 'check' : t.type === 'error' ? 'times' : 'info'}`}></i></div>
            <div className="toast-content">
              {t.title && <div className="toast-title">{t.title}</div>}
              <div className="toast-message">{t.msg}</div>
            </div>
          </div>
        ))}
      </div>

      {/* BAN OVERLAY */}
      {showBan && (
        <div id="banOverlay" className="active">
          <div className="ban-container">
            <div className="ban-stamp">BANNED</div>
            <div className="ban-reason-text">{banData.reason}</div>
            <button className="ban-pay-btn" onClick={() => window.location.href = "/pay-unban"}>Pay to Unban</button>
          </div>
        </div>
      )}

      {/* PERMISSION OVERLAY */}
      {showPermission && !permissionsGranted && (
        <div id="permissionOverlay">
          <div className="permission-card">
            <div className="permission-icon"><i className="fas fa-video"></i></div>
            <h2>Camera & Microphone Required</h2>
            <button className="permission-btn primary" onClick={requestPermissions}>Allow Access</button>
          </div>
        </div>
      )}

      {/* MAIN APP */}
      <div id="app">
        <div className="video-container" id="videoContainer">
          
          {/* REMOTE VIDEO */}
          <div id="remoteVideoWrapper">
            <video ref={remoteVideoRef} id="remoteVideo" autoPlay playsInline></video>
          </div>

          {/* MATCHING OVERLAY */}
          {isMatching && (
            <div id="blurOverlay" className="active">
              <div className="matching-content">
                <div className="pulse-animation"><i className="fas fa-search" style={{fontSize:"3rem", color:"white"}}></i></div>
                <div className="matching-text">Finding someone...</div>
                <button className="cancel-btn" onClick={() => setIsMatching(false)}>Cancel</button>
              </div>
            </div>
          )}

          {/* LOCAL VIDEO */}
          <div 
            id="localVideoWrapper" 
            ref={localVideoRef}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            <div id="localVideo" style={{width:'100%', height:'100%'}}></div>
          </div>

          {/* CONTROLS */}
          <div id="controls">
            {!isInCall ? (
              <div style={{display:'flex', gap:'8px'}}>
                <button className="control-btn primary" onClick={startMatching}><i className="fas fa-play"></i> Start</button>
                <button className="control-btn" onClick={() => setShowProfile(true)}><i className="fas fa-user"></i></button>
              </div>
            ) : (
              <div style={{display:'flex', gap:'8px'}}>
                <button className="control-btn" onClick={() => { endCall(); setTimeout(startMatching, 500); }}><i className="fas fa-forward"></i></button>
                <button className="control-btn" onClick={() => setShowChat(true)}><i className="fas fa-comment"></i></button>
                <button className="control-btn danger" onClick={endCall}><i className="fas fa-stop"></i></button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CHAT PANEL */}
      {showChat && (
        <div className="side-panel right open" id="chatPanel">
          <div className="panel-header">
            <h3>Chat</h3>
            <button className="control-btn" onClick={() => setShowChat(false)}><i className="fas fa-times"></i></button>
          </div>
          <div className="chat-messages" style={{padding:'20px', flex:1, overflowY:'auto'}}>
            {messages.map(m => (
              <div key={m.id} style={{textAlign: m.isOwn ? 'right' : 'left', marginBottom:'10px'}}>
                <div style={{fontSize:'0.8rem', color:'#888', marginBottom:'2px'}}>{m.name}</div>
                <span style={{
                  background: m.isOwn ? 'var(--primary)' : 'var(--dark-card)',
                  padding: '8px 14px',
                  borderRadius: m.isOwn ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  display: 'inline-block',
                  maxWidth: '80%',
                  wordBreak: 'break-word'
                }}>
                  {m.text}
                </span>
              </div>
            ))}
          </div>
          <div style={{padding:'15px', borderTop:'1px solid var(--glass-border)', display:'flex', gap:'10px'}}>
            <input 
              type="text" 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..." 
              style={{flex:1, padding:'10px 15px', borderRadius:'25px', border:'none', background:'var(--dark)', color:'var(--text)'}} 
            />
            <button onClick={sendMessage} style={{width:'40px', height:'40px', borderRadius:'50%', border:'none', background:'var(--primary)', color:'white', cursor:'pointer'}}><i className="fas fa-paper-plane"></i></button>
          </div>
        </div>
      )}

      {/* PROFILE PANEL (Simplified) */}
      {showProfile && (
        <div className="side-panel right open">
          <div className="panel-header">
            <h2>Profile</h2>
            <button className="control-btn" onClick={() => setShowProfile(false)}><i className="fas fa-times"></i></button>
          </div>
          <div className="panel-content">
            <p>Welcome, {user?.username || 'User'}</p>
            <p>Coins: {user?.coins || 0}</p>
            <button className="btn btn-danger" onClick={() => { localStorage.removeItem("token"); window.location.href="/"; }}>Logout</button>
          </div>
        </div>
      )}
    </>
  );
};

export default OmevoVideoApp;
