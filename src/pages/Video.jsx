import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { Device } from 'mediasoup-client';
import "./Video.css";

/* ===================== CONFIGURATION ===================== */
const CONFIG = {
  BACKEND: 'https://api.omevo.online',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_your_stripe_key_here',
  DEBUG_MODE: false,
  MODERATION_INTERVAL: 2000,
};

const GIFT_COIN_COSTS = {
  rose: 10, heart: 25, star: 50, diamond: 100, crown: 200, rocket: 500
};

/* ===================== COUNTRY DATA ===================== */
export const COUNTRIES = [
  { code: "any", label: "🌍", name: "Worldwide" },
  { code: "nearby", label: "📍", name: "Nearby" },
  { code: "af", label: "🇦🇫", name: "Afghanistan" }, { code: "al", label: "🇦🇱", name: "Albania" },
  { code: "dz", label: "🇩🇿", name: "Algeria" }, { code: "ad", label: "🇦🇩", name: "Andorra" },
  { code: "ao", label: "🇦🇴", name: "Angola" }, { code: "ar", label: "🇦🇷", name: "Argentina" },
  { code: "am", label: "🇦🇲", name: "Armenia" }, { code: "au", label: "🇦🇺", name: "Australia" },
  { code: "at", label: "🇦🇹", name: "Austria" }, { code: "az", label: "🇦🇿", name: "Azerbaijan" },
  { code: "bs", label: "🇧🇸", name: "Bahamas" }, { code: "bh", label: "🇧🇭", name: "Bahrain" },
  { code: "bd", label: "🇧🇩", name: "Bangladesh" }, { code: "bb", label: "🇧🇧", name: "Barbados" },
  { code: "by", label: "🇧🇾", name: "Belarus" }, { code: "be", label: "🇧🇪", name: "Belgium" },
  { code: "bz", label: "🇧🇿", name: "Belize" }, { code: "bj", label: "🇧🇯", name: "Benin" },
  { code: "bt", label: "🇧🇹", name: "Bhutan" }, { code: "bo", label: "🇧🇴", name: "Bolivia" },
  { code: "ba", label: "🇧🇦", name: "Bosnia & Herzegovina" }, { code: "bw", label: "🇧🇼", name: "Botswana" },
  { code: "br", label: "🇧🇷", name: "Brazil" }, { code: "bn", label: "🇧🇳", name: "Brunei" },
  { code: "bg", label: "🇧🇬", name: "Bulgaria" }, { code: "bf", label: "🇧🇫", name: "Burkina Faso" },
  { code: "bi", label: "🇧🇮", name: "Burundi" }, { code: "kh", label: "🇰🇭", name: "Cambodia" },
  { code: "cm", label: "🇨🇲", name: "Cameroon" }, { code: "ca", label: "🇨🇦", name: "Canada" },
  { code: "cv", label: "🇨🇻", name: "Cape Verde" }, { code: "cf", label: "🇨🇫", name: "Central African Republic" },
  { code: "td", label: "🇹🇩", name: "Chad" }, { code: "cl", label: "🇨🇱", name: "Chile" },
  { code: "cn", label: "🇨🇳", name: "China" }, { code: "co", label: "🇨🇴", name: "Colombia" },
  { code: "km", label: "🇰🇲", name: "Comoros" }, { code: "cg", label: "🇨🇬", name: "Congo" },
  { code: "cr", label: "🇨🇷", name: "Costa Rica" }, { code: "hr", label: "🇭🇷", name: "Croatia" },
  { code: "cu", label: "🇨🇺", name: "Cuba" }, { code: "cy", label: "🇨🇾", name: "Cyprus" },
  { code: "cz", label: "🇨🇿", name: "Czechia" }, { code: "dk", label: "🇩🇰", name: "Denmark" },
  { code: "dj", label: "🇩🇯", name: "Djibouti" }, { code: "dm", label: "🇩🇲", name: "Dominica" },
  { code: "do", label: "🇩🇴", name: "Dominican Republic" }, { code: "ec", label: "🇪🇨", name: "Ecuador" },
  { code: "eg", label: "🇪🇬", name: "Egypt" }, { code: "sv", label: "🇸🇻", name: "El Salvador" },
  { code: "ee", label: "🇪🇪", name: "Estonia" }, { code: "et", label: "🇪🇹", name: "Ethiopia" },
  { code: "fj", label: "🇫🇯", name: "Fiji" }, { code: "fi", label: "🇫🇮", name: "Finland" },
  { code: "fr", label: "🇫🇷", name: "France" }, { code: "de", label: "🇩🇪", name: "Germany" },
  { code: "gh", label: "🇬🇭", name: "Ghana" }, { code: "gr", label: "🇬🇷", name: "Greece" },
  { code: "gt", label: "🇬🇹", name: "Guatemala" }, { code: "hn", label: "🇭🇳", name: "Honduras" },
  { code: "hu", label: "🇭🇺", name: "Hungary" }, { code: "in", label: "🇮🇳", name: "India" },
  { code: "id", label: "🇮🇩", name: "Indonesia" }, { code: "ir", label: "🇮🇷", name: "Iran" },
  { code: "iq", label: "🇮🇶", name: "Iraq" }, { code: "ie", label: "🇮🇪", name: "Ireland" },
  { code: "il", label: "🇮🇱", name: "Israel" }, { code: "it", label: "🇮🇹", name: "Italy" },
  { code: "jp", label: "🇯🇵", name: "Japan" }, { code: "ke", label: "🇰🇪", name: "Kenya" },
  { code: "kr", label: "🇰🇷", name: "South Korea" }, { code: "kw", label: "🇰🇼", name: "Kuwait" },
  { code: "la", label: "🇱🇦", name: "Laos" }, { code: "lv", label: "🇱🇻", name: "Latvia" },
  { code: "lb", label: "🇱🇧", name: "Lebanon" }, { code: "mx", label: "🇲🇽", name: "Mexico" },
  { code: "ma", label: "🇲🇦", name: "Morocco" }, { code: "nl", label: "🇳🇱", name: "Netherlands" },
  { code: "nz", label: "🇳🇿", name: "New Zealand" }, { code: "ng", label: "🇳🇬", name: "Nigeria" },
  { code: "no", label: "🇳🇴", name: "Norway" }, { code: "pk", label: "🇵🇰", name: "Pakistan" },
  { code: "pa", label: "🇵🇦", name: "Panama" }, { code: "pe", label: "🇵🇪", name: "Peru" },
  { code: "ph", label: "🇵🇭", name: "Philippines" }, { code: "pl", label: "🇵🇱", name: "Poland" },
  { code: "pt", label: "🇵🇹", name: "Portugal" }, { code: "qa", label: "🇶🇦", name: "Qatar" },
  { code: "ro", label: "🇷🇴", name: "Romania" }, { code: "ru", label: "🇷🇺", name: "Russia" },
  { code: "sa", label: "🇸🇦", name: "Saudi Arabia" }, { code: "sn", label: "🇸🇳", name: "Senegal" },
  { code: "rs", label: "🇷🇸", name: "Serbia" }, { code: "sg", label: "🇸🇬", name: "Singapore" },
  { code: "za", label: "🇿🇦", name: "South Africa" }, { code: "es", label: "🇪🇸", name: "Spain" },
  { code: "se", label: "🇸🇪", name: "Sweden" }, { code: "ch", label: "🇨🇭", name: "Switzerland" },
  { code: "th", label: "🇹🇭", name: "Thailand" }, { code: "tr", label: "🇹🇷", name: "Turkey" },
  { code: "ua", label: "🇺🇦", name: "Ukraine" }, { code: "ae", label: "🇦🇪", name: "United Arab Emirates" },
  { code: "gb", label: "🇬🇧", name: "United Kingdom" }, { code: "us", label: "🇺🇸", name: "United States" },
  { code: "uy", label: "🇺🇾", name: "Uruguay" }, { code: "ve", label: "🇻🇪", name: "Venezuela" },
  { code: "vn", label: "🇻🇳", name: "Vietnam" }, { code: "zw", label: "🇿🇼", name: "Zimbabwe" }
];

/* ===================== ERROR SUPPRESSION ===================== */
const suppressMediaErrors = () => {
  const originalError = console.error;
  const suppressedPatterns = ['Load failed', 'The play() request was interrupted', 'AbortError', 'insertSync'];
  console.error = function(...args) {
    const msg = args.map(a => typeof a === 'string' ? a : '').join(' ');
    if (!suppressedPatterns.some(p => msg.includes(p))) originalError.apply(console, args);
  };
  const originalWarn = console.warn;
  console.warn = function(...args) {
    const msg = args.map(a => typeof a === 'string' ? a : '').join(' ');
    if (!suppressedPatterns.some(p => msg.includes(p))) originalWarn.apply(console, args);
  };
};
suppressMediaErrors();

/* ===================== SAFE FETCH HELPER ===================== */
const safeFetch = async (url, options = {}) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Request timed out');
    if (error instanceof TypeError && (!error.message || error.message === '')) throw new Error('Network error');
    throw error;
  }
};

/* ===================== PURE HELPERS ===================== */
function getProviderInfo(provider) {
  switch (provider) {
    case 'google': return { label: 'Google', icon: 'fab fa-google', cls: 'google' };
    case 'discord': return { label: 'Discord', icon: 'fab fa-discord', cls: 'discord' };
    case 'facebook': return { label: 'Facebook', icon: 'fab fa-facebook-f', cls: 'facebook' };
    default: return { label: 'Guest', icon: 'fas fa-circle', cls: 'unknown' };
  }
}

/* ===================== COUNTRY SCROLL COMPONENT ===================== */
function CountryScroll({ value, onChange }) {
  const scrollRef = useRef(null);
  useEffect(() => {
    const el = scrollRef.current?.querySelector('.country-chip.active');
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [value]);

  return (
    <div className="country-scroll-container">
      <div className="country-scroll" ref={scrollRef}>
        {COUNTRIES.map((c) => (
          <button key={c.code} onClick={() => onChange(c.code)} className={`country-chip ${value === c.code ? 'active' : ''}`}>
            <span className="country-emoji">{c.label}</span>
            <span className="country-name">{c.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ===================== INJECTED CSS (PREMIUM UI) ===================== */
const injectPremiumStyles = () => {
  if (document.getElementById('premium-country-styles')) return;
  const css = `
    .country-scroll-container { margin-top: 8px; border-radius: 16px; background: rgba(0,0,0,0.2); padding: 4px; border: 1px solid rgba(255,255,255,0.05); }
    .country-scroll { display: flex; gap: 10px; overflow-x: auto; padding: 12px 10px; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
    .country-scroll::-webkit-scrollbar { display: none; }
    .country-scroll-container { mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); }
    .country-chip { flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px 16px; border-radius: 16px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.08); color: white; font-size: 12px; backdrop-filter: blur(12px); transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); scroll-snap-align: center; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .country-chip:hover { transform: translateY(-2px); background: rgba(255, 255, 255, 0.12); border-color: rgba(255,255,255,0.2); }
    .country-chip.active { background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; box-shadow: 0 0 20px rgba(99, 102, 241, 0.5); transform: translateY(-2px) scale(1.05); color: white; }
    .country-emoji { font-size: 20px; transition: transform 0.2s; }
    .country-chip:active .country-emoji { transform: scale(1.2); }
    .country-name { font-weight: 600; letter-spacing: 0.3px; opacity: 0.9; }
    .country-chip.active .country-name { opacity: 1; }
    .country-chip:first-child { background: rgba(255,255,255,0.08); }
    .country-chip:first-child.active { background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 0 20px rgba(16, 185, 129, 0.5); }
  `;
  const style = document.createElement('style');
  style.id = 'premium-country-styles';
  style.innerHTML = css;
  document.head.appendChild(style);
};

/* ===================== MAIN COMPONENT ===================== */
export default function Video() {
  useEffect(() => { injectPremiumStyles(); }, []);

  const [token, setToken] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get('token');
    if (t) { localStorage.setItem('token', t); window.history.replaceState({}, document.title, window.location.pathname); }
    return localStorage.getItem('token');
  });
  const tokenRef = useRef(token);

  /* ---------- UI toggles ---------- */
  const [loading, setLoading] = useState(true);
  const [showPermission, setShowPermission] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showEffects, setShowEffects] = useState(false);
  const [showBlurOverlay, setShowBlurOverlay] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showGiftPopup, setShowGiftPopup] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [giftAnimation, setGiftAnimation] = useState(null);
  const [permBtnLoading, setPermBtnLoading] = useState(false);

  /* ---------- data state ---------- */
  const [user, setUser] = useState(null);
  const [userCoins, setUserCoins] = useState(0);
  const [isInCall, setIsInCall] = useState(false);
  const [stats, setStats] = useState({ matches: 0, likes: 0, level: 1 });
  const [matchTime, setMatchTime] = useState('0:00');
  const [partnerInfo, setPartnerInfoState] = useState(null);
  const [pendingMatch, setPendingMatch] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [currentLayout, setCurrentLayout] = useState('float');
  const [activeEffect, setActiveEffect] = useState('none');
  const [toasts, setToasts] = useState([]);

  /* ---------- form state ---------- */
  const [genderSelect, setGenderSelect] = useState('male');
  const [lookingFor, setLookingFor] = useState('any');
  const [locationSelect, setLocationSelect] = useState('any');
  const [interestsInput, setInterestsInput] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportDetails, setReportDetails] = useState('');
  const [selectedCoinPackage, setSelectedCoinPackage] = useState(null);

  /* ---------- refs ---------- */
  const canvasRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localVideoDivRef = useRef(null);
  const localVideoWrapperRef = useRef(null);
  const socketRef = useRef(null);
  
  // Mediasoup & WebRTC Refs
  const deviceRef = useRef(null);
  const sendTransportRef = useRef(null);
  const recvTransportRef = useRef(null);
  const videoProducerRef = useRef(null);
  const audioProducerRef = useRef(null);
  
  const localStreamRef = useRef(null);
  const matchTimerRef = useRef(null);
  const matchSecondsRef = useRef(0);
  const moderationRef = useRef(null);
  const modCanvasRef = useRef(null);
  const permissionsRef = useRef(false);
  const currentRoomRef = useRef(null);
  const partnerIdRef = useRef(null);
  const isInCallRef = useRef(false);
  const isMatchingRef = useRef(false);
  const isScreenSharingRef = useRef(false);
  const preferencesRef = useRef({ gender: 'male', looking_for: 'any', location: 'any', interests: [] });
  const stripeRef = useRef(null);
  const userIdRef = useRef(null);
  const remoteStreamRef = useRef(null);

  /* ===================== TOAST & HELPERS ===================== */
  const addToast = useCallback((msg, type = 'info', title = '') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type, title, visible: false }]);
    requestAnimationFrame(() => setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: true } : t)));
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
    }, 3000);
  }, []);
  const addToastRef = useRef(addToast);
  useEffect(() => { addToastRef.current = addToast; }, [addToast]);
  useEffect(() => { userIdRef.current = user?.id ?? null; }, [user]);

  const addMsgToChat = useCallback((msg, isOwn, name) => {
    setChatMessages(prev => [...prev, { msg, isOwn, name, id: Date.now() + Math.random() }]);
  }, []);

  const startMatchTimer = useCallback(() => {
    if (matchTimerRef.current) clearInterval(matchTimerRef.current);
    matchSecondsRef.current = 0;
    setMatchTime('0:00');
    matchTimerRef.current = setInterval(() => {
      matchSecondsRef.current++;
      const m = Math.floor(matchSecondsRef.current / 60);
      const s = matchSecondsRef.current % 60;
      setMatchTime(`${m}:${s < 10 ? '0' : ''}${s}`);
    }, 1000);
  }, []);

  const stopMatchTimer = useCallback(() => {
    if (matchTimerRef.current) { clearInterval(matchTimerRef.current); matchTimerRef.current = null; }
    matchSecondsRef.current = 0;
    setMatchTime('0:00');
  }, []);

  const safelySetRemoteStream = useCallback((stream) => {
    const el = remoteVideoRef.current;
    if (!el) return;
    el.pause();
    if (remoteStreamRef.current) remoteStreamRef.current.getTracks().forEach(t => { try { t.stop(); } catch {} });
    remoteStreamRef.current = stream;
    el.srcObject = stream;
    el.play().catch(() => {});
  }, []);

  const emitAsync = useCallback((event, data) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current || !socketRef.current.connected) return reject(new Error('Socket not connected'));
      socketRef.current.emit(event, data, (response) => {
        if (response?.error) reject(new Error(response.error));
        else resolve(response);
      });
    });
  }, []);

  /* ===================== GIFT ANIMATION ===================== */
  const triggerGiftAnimation = useCallback((type) => {
    const giftEmojis = { rose: '🌹', heart: '❤️', star: '⭐', diamond: '💎', crown: '👑', rocket: '🚀' };
    setGiftAnimation(giftEmojis[type] || '🎁');
    setShowGiftPopup(true);
    setTimeout(() => setShowGiftPopup(false), 3000);
  }, []);

  /* ===================== MEDIASOUP & WEBRTC CORE ===================== */
  
  const doEndCall = useCallback(() => {
    isInCallRef.current = false;
    isMatchingRef.current = false;
    isScreenSharingRef.current = false;
    setIsInCall(false);
    stopMatchTimer();
    setCurrentLayout('float');
    setPartnerInfoState(null);
    setPendingMatch(null);
    setChatMessages([]);
    setShowBlurOverlay(false);
    setShowMatchModal(false);
    setShowChat(false);
    
    safelySetRemoteStream(null);
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    
    if (sendTransportRef.current) { try { sendTransportRef.current.close(); } catch {} sendTransportRef.current = null; }
    if (recvTransportRef.current) { try { recvTransportRef.current.close(); } catch {} recvTransportRef.current = null; }
    
    videoProducerRef.current = null;
    audioProducerRef.current = null;
    deviceRef.current = null;
    
    if (socketRef.current && currentRoomRef.current) {
      socketRef.current.emit('skip-user', { reason: 'Manual disconnect' });
    }
    
    currentRoomRef.current = null;
    partnerIdRef.current = null;
  }, [stopMatchTimer, safelySetRemoteStream, emitAsync]);

  const doEndCallRef = useRef(doEndCall);
  useEffect(() => { doEndCallRef.current = doEndCall; }, [doEndCall]);

  const connectToMediasoup = async (roomId) => {
    try {
      addToastRef.current('Connecting to room...', 'info');
      
      const rtpRes = await safeFetch(CONFIG.BACKEND + '/api/mediasoup/router-rtp-capabilities', {
        headers: { Authorization: 'Bearer ' + tokenRef.current }
      });
      const rtpData = await rtpRes.json();
      
      const device = new Device();
      await device.load({ rtpCapabilities: rtpData.rtpCapabilities });
      deviceRef.current = device;

      await emitAsync('mediasoup-join-room', { roomId });

      // Create Send Transport
      const sendParams = await emitAsync('mediasoup-create-send-transport', { roomId });
      const sendTransport = device.createSendTransport(sendParams);
      sendTransportRef.current = sendTransport;

      sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          await emitAsync('mediasoup-connect-send-transport', { dtlsParameters });
          callback();
        } catch (err) { errback(err); }
      });

      sendTransport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
        try {
          const response = await emitAsync('mediasoup-produce', { kind, rtpParameters, appData });
          callback({ id: response.id });
        } catch (err) { errback(err); }
      });

      // Create Recv Transport
      const recvParams = await emitAsync('mediasoup-create-recv-transport', { roomId });
      const recvTransport = device.createRecvTransport(recvParams);
      recvTransportRef.current = recvTransport;

      recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          await emitAsync('mediasoup-connect-recv-transport', { dtlsParameters });
          callback();
        } catch (err) { errback(err); }
      });

      // Publish local tracks
      if (localStreamRef.current.getVideoTracks().length > 0) {
        const producer = await sendTransport.produce({ track: localStreamRef.current.getVideoTracks()[0], kind: 'video', appData: { source: 'camera' } });
        videoProducerRef.current = producer;
      }
      if (localStreamRef.current.getAudioTracks().length > 0) {
        const producer = await sendTransport.produce({ track: localStreamRef.current.getAudioTracks()[0], kind: 'audio', appData: { source: 'mic' } });
        audioProducerRef.current = producer;
      }

      addToastRef.current('Connected!', 'success');
    } catch (e) {
      console.error('Mediasoup connection error:', e);
      addToastRef.current('Connection failed: ' + e.message, 'error');
      doEndCallRef.current();
    }
  };

  const acceptMatch = useCallback(async () => {
    if (!pendingMatch) return;
    setShowMatchModal(false);
    setShowBlurOverlay(false);
    
    partnerIdRef.current = pendingMatch.peerId;
    currentRoomRef.current = pendingMatch.roomId;
    setPartnerInfoState(pendingMatch.peerInfo || null);
    
    isInCallRef.current = true;
    isMatchingRef.current = false;
    setIsInCall(true);
    startMatchTimer();
    
    await connectToMediasoup(pendingMatch.roomId);
    startModerationLoop(pendingMatch.roomId);
    setStats(prev => ({ ...prev, matches: prev.matches + 1 }));
  }, [pendingMatch, startMatchTimer, emitAsync]);

  const declineMatch = useCallback(() => {
    setShowMatchModal(false);
    setPendingMatch(null);
    setShowBlurOverlay(false);
    if (socketRef.current) socketRef.current.emit('leave-queue');
    isMatchingRef.current = false;
    setShowBlurOverlay(false);
  }, []);

  /* ===================== PERMISSIONS & TRACKS ===================== */
  
  const requestPermissions = async () => {
    setPermBtnLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true });
      localStreamRef.current = stream;
      
      if (localVideoDivRef.current) {
        localVideoDivRef.current.innerHTML = '';
        const videoEl = document.createElement('video');
        videoEl.srcObject = stream;
        videoEl.autoplay = true;
        videoEl.muted = true;
        videoEl.playsInline = true;
        videoEl.style.width = '100%';
        videoEl.style.height = '100%';
        videoEl.style.objectFit = 'cover';
        videoEl.style.transform = 'scaleX(-1)';
        localVideoDivRef.current.appendChild(videoEl);
      }
      
      permissionsRef.current = true;
      setShowPermission(false);
      setLoading(false);
      await initializeAfterAuth();
    } catch (err) {
      console.error("Permission error:", err);
      if (err.name === 'NotAllowedError') addToast('Permission denied. Allow camera in browser settings.', 'error');
      else if (err.name === 'NotFoundError') addToast('No camera or microphone found.', 'error');
      else addToast('Camera & microphone permission required', 'error');
    }
    finally { setPermBtnLoading(false); }
  };

  const switchCamera = async () => {
    if (!localStreamRef.current || !videoProducerRef.current) return addToast('No camera', 'info');
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      if (videoDevices.length < 2) return addToast('Only one camera found', 'info');
      
      const currentTrack = localStreamRef.current.getVideoTracks()[0];
      const currentDeviceId = currentTrack.getSettings().deviceId;
      const nextDevice = videoDevices.find(d => d.deviceId !== currentDeviceId) || videoDevices[0];
      
      const newStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: nextDevice.deviceId, width: 1280, height: 720 } });
      const newTrack = newStream.getVideoTracks()[0];
      
      await videoProducerRef.current.replaceTrack({ track: newTrack });
      currentTrack.stop();
      localStreamRef.current.removeTrack(currentTrack);
      localStreamRef.current.addTrack(newTrack);
      
      const videoEl = localVideoDivRef.current?.querySelector('video');
      if (videoEl) {
         const isBack = nextDevice.label.toLowerCase().includes('back') || nextDevice.label.toLowerCase().includes('rear');
         videoEl.style.transform = isBack ? 'scaleX(1)' : 'scaleX(-1)';
         videoEl.srcObject = localStreamRef.current;
      }
      addToast('Switched camera', 'success');
    } catch { addToast('Failed to switch', 'error'); }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharingRef.current) {
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        const camTrack = camStream.getVideoTracks()[0];
        localStreamRef.current.getVideoTracks()[0].stop();
        localStreamRef.current.removeTrack(localStreamRef.current.getVideoTracks()[0]);
        localStreamRef.current.addTrack(camTrack);
        await videoProducerRef.current.replaceTrack({ track: camTrack });
        const videoEl = localVideoDivRef.current?.querySelector('video');
        if (videoEl) videoEl.srcObject = localStreamRef.current;
        isScreenSharingRef.current = false;
        addToast('Screen sharing stopped', 'info');
      } catch { addToast('Failed to stop screen share', 'error'); }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrack.onended = () => { if(isScreenSharingRef.current) toggleScreenShare(); };
        localStreamRef.current.getVideoTracks()[0].stop();
        localStreamRef.current.removeTrack(localStreamRef.current.getVideoTracks()[0]);
        localStreamRef.current.addTrack(screenTrack);
        await videoProducerRef.current.replaceTrack({ track: screenTrack });
        const videoEl = localVideoDivRef.current?.querySelector('video');
        if (videoEl) videoEl.srcObject = localStreamRef.current;
        isScreenSharingRef.current = true;
        addToast('Screen sharing started', 'success');
      } catch { addToast('Could not start screen share', 'error'); }
    }
  };

  /* ===================== MATCHMAKING (SOCKET.IO) ===================== */

  const startMatching = async () => {
    if (isMatchingRef.current || isInCallRef.current) return;
    if (!permissionsRef.current) { addToast('Grant camera permissions first', 'error'); setShowPermission(true); return; }
    if (!socketRef.current || !socketRef.current.connected) return addToast('Connecting to server...', 'error');
    
    isMatchingRef.current = true;
    setShowBlurOverlay(true);
    
    socketRef.current.emit('join-queue', {
      gender: preferencesRef.current.gender,
      looking_for: preferencesRef.current.looking_for,
      location: locationSelect,
      interests: preferencesRef.current.interests,
      nickname: (user && (user.username || user.nickname)) || 'User'
    }, (res) => {
      if (res?.error) {
        addToast(res.error, 'error');
        isMatchingRef.current = false;
        setShowBlurOverlay(false);
      } else if (res?.status === 'searching') {
        addToast('Looking for a match...', 'info');
      }
    });
  };

  const stopMatching = () => {
    isMatchingRef.current = false;
    setShowBlurOverlay(false);
    setShowMatchModal(false);
    setPendingMatch(null);
    if (socketRef.current) socketRef.current.emit('leave-queue');
  };

  /* ===================== MODERATION & MISC ===================== */
  
  const startModerationLoop = (roomId) => {
    if (moderationRef.current) clearInterval(moderationRef.current);
    if (!modCanvasRef.current) modCanvasRef.current = document.createElement('canvas');
    const mx = modCanvasRef.current.getContext('2d');
    moderationRef.current = setInterval(() => {
      if (!isInCallRef.current || !socketRef.current?.connected) return;
      try {
        const v = localVideoDivRef.current?.querySelector('video');
        if (!v || v.readyState < 2) return;
        modCanvasRef.current.width = 320; modCanvasRef.current.height = 240;
        mx.drawImage(v, 0, 0, 320, 240);
        socketRef.current.emit('video_frame', { frameBase64: modCanvasRef.current.toDataURL('image/jpeg', 0.7), roomId });
      } catch {}
    }, CONFIG.MODERATION_INTERVAL);
  };

  const applyEffect = (effect) => {
    const v = localVideoDivRef.current?.querySelector('video');
    if (v) { const filters = { none: '', blur: 'blur(5px)', grayscale: 'grayscale(100%)', sepia: 'sepia(100%)', invert: 'invert(100%)', contrast: 'contrast(150%)' }; v.style.filter = filters[effect] || ''; }
    setActiveEffect(effect);
    setShowEffects(false);
  };

  const sendMessage = () => {
    const text = messageInput.trim();
    if (!text || !socketRef.current?.connected || !currentRoomRef.current) return;
    if (text.length > 500) return addToast('Too long (max 500)', 'error');
    socketRef.current.emit('send-room-message', { text });
    addMsgToChat(text, true, user?.username || 'You');
    setMessageInput('');
  };

  const submitReport = () => {
    if (!selectedReport) return addToast('Select a reason', 'error');
    const reason = reportDetails.trim() || selectedReport;
    if (reason.length < 10) return addToast('Reason needs 10+ chars', 'error');
    if (!socketRef.current?.connected || !partnerIdRef.current) return addToast('Cannot report now', 'error');
    socketRef.current.emit('report-peer', { reportedUserId: partnerIdRef.current, reason });
    addToast('Report submitted', 'success');
    setShowReport(false); setSelectedReport(null); setReportDetails('');
    doEndCallRef.current();
  };

  const handleNext = () => { doEndCallRef.current(); };

  const toggleLayout = () => {
    if (currentLayout === 'split') { setCurrentLayout('float'); resetVideoPosition(); addToast('Float Mode', 'info'); }
    else { setCurrentLayout('split'); addToast('Split Screen', 'info'); }
  };

  const resetVideoPosition = () => {
    const w = localVideoWrapperRef.current;
    if (!w) return;
    w.style.transition = 'all 0.3s ease'; w.style.right = '30px'; w.style.bottom = '100px'; w.style.left = 'auto'; w.style.top = 'auto';
    setTimeout(() => { w.style.transition = ''; }, 300);
  };

  const togglePiP = async () => {
    try {
      const el = localVideoDivRef.current?.querySelector('video');
      if (!el) return addToast('Video stream not ready', 'error');
      if (document.pictureInPictureElement) { await document.exitPictureInPicture(); }
      else if (document.pictureInPictureEnabled && el.readyState >= 1) { await el.requestPictureInPicture(); }
      else addToast('PiP not supported', 'error');
    } catch { addToast('Could not toggle PiP', 'error'); }
  };

  /* ===================== API CALLS ===================== */
  
  const checkBanStatus = useCallback(async () => {
    const t = tokenRef.current;
    if (!t) return false;
    try {
      const r = await safeFetch(CONFIG.BACKEND + '/auth/me', { headers: { Authorization: 'Bearer ' + t } });
      const d = await r.json();
      if (d.authenticated && d.user) {
        setUser(d.user);
        setUserCoins(d.user.coins || 0);
        setStats(prev => ({ ...prev, level: d.user.level || 1 }));
        if (d.user.banned_until && new Date(d.user.banned_until) > new Date()) return true;
      }
    } catch {}
    return false;
  }, []);

  const loadSettings = async () => {
    const t = tokenRef.current;
    if (!t) return;
    try {
      const r = await safeFetch(CONFIG.BACKEND + '/api/user/preferences', { headers: { Authorization: 'Bearer ' + t } });
      if (r.ok) { const p = await r.json(); setGenderSelect(p.gender || 'male'); setLookingFor(p.looking_for || 'any'); setLocationSelect(p.location || 'any'); setInterestsInput((p.interests || []).join(', ')); preferencesRef.current = { ...preferencesRef.current, ...p }; }
    } catch {}
  };

  const saveSettings = async () => {
    const interests = interestsInput.split(',').map(i => i.trim()).filter(i => i.length > 0).slice(0, 5);
    const payload = { gender: genderSelect, looking_for: lookingFor, location: locationSelect, interests, nickname: (user && (user.username || user.nickname)) || 'User' };
    try {
      const r = await safeFetch(CONFIG.BACKEND + '/api/user/preferences', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenRef.current }, body: JSON.stringify(payload) });
      if (r.ok) { preferencesRef.current = payload; addToast('Settings saved!', 'success'); setShowSettings(false); }
      else { const d = await r.json().catch(() => ({ error: 'Failed' })); addToast(d.error || 'Failed', 'error'); }
    } catch { addToast('Error', 'error'); }
  };

  const initializeAfterAuth = async () => {
    await loadSettings();
  };

  const sendGift = async (type, costInCoins) => {
    if (!partnerIdRef.current) return addToast('No partner', 'error');
    try {
      const r = await safeFetch(CONFIG.BACKEND + '/api/create-gift-checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenRef.current },
        body: JSON.stringify({ giftType: type, recipientId: partnerIdRef.current }),
      });
      const d = await r.json();
      if (d.success) { setUserCoins(prev => Math.max(0, prev - costInCoins)); triggerGiftAnimation(type); setShowGifts(false); addToast('Gift sent!', 'success'); }
      else if (d.code === 'INSUFFICIENT_FUNDS') { addToast('Not enough coins', 'error'); setShowGifts(false); setShowPayment(true); }
      else throw new Error(d.error || 'Failed');
    } catch (e) { addToast(e.message || 'Failed', 'error'); setShowGifts(false); }
  };

  const purchaseCoins = async () => {
    if (!selectedCoinPackage) return addToast('Select a package', 'error');
    if (!stripeRef.current && window.Stripe) stripeRef.current = window.Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY);
    if (!stripeRef.current) return addToast('Stripe not loaded', 'error');
    try {
      const r = await safeFetch(CONFIG.BACKEND + '/api/create-checkout-session', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenRef.current }, body: JSON.stringify(selectedCoinPackage) });
      const d = await r.json();
      if (d.sessionId) { const err = await stripeRef.current.redirectToCheckout({ sessionId: d.sessionId }); if (err.error) addToast(err.error.message, 'error'); }
      else addToast('Failed', 'error');
    } catch { addToast('Payment error', 'error'); }
  };

  const logout = () => {
    doEndCallRef.current(); stopMatching();
    localStorage.removeItem('token'); tokenRef.current = null; setToken(null); setUser(null);
    if (socketRef.current) socketRef.current.disconnect();
    window.location.href = '/';
  };

  const handleLike = () => {
    setStats(prev => ({ ...prev, likes: prev.likes + 1 }));
    addToast('Liked!', 'success');
  };

  const providerInfo = user ? getProviderInfo(user.provider) : getProviderInfo(null);

  /* ===================== SOCKET.IO SETUP ===================== */
  useEffect(() => {
    if (!tokenRef.current) return;
    
    const socket = io(CONFIG.BACKEND, { auth: { token: tokenRef.current } });
    socketRef.current = socket;

    socket.on('connect', () => console.log('Socket connected'));
    
    socket.on('match_found', (data) => {
      isMatchingRef.current = false;
      setPendingMatch(data);
      setShowMatchModal(true);
    });

    socket.on('new-producer', async ({ producerId }) => {
      if (!deviceRef.current || !recvTransportRef.current) return;
      try {
        const params = await emitAsync('mediasoup-consume', { producerId, rtpCapabilities: deviceRef.current.rtpCapabilities });
        const consumer = await recvTransportRef.current.consume({ id: params.id, producerId: params.producerId, kind: params.kind, rtpParameters: params.rtpParameters });

        if (params.kind === 'video') safelySetRemoteStream(new MediaStream([consumer.track]));
        else if (params.kind === 'audio') {
          if (remoteAudioRef.current) { remoteAudioRef.current.srcObject = new MediaStream([consumer.track]); remoteAudioRef.current.play().catch(() => {}); }
        }
        await emitAsync('mediasoup-resume-consumer', { consumerId: consumer.id });
      } catch (err) { console.error('Failed to consume remote producer:', err); }
    });

    socket.on('new-room-message', (data) => addMsgToChat(data.text, false, data.username));
    socket.on('peer-left', () => { addToast('Partner disconnected', 'info'); doEndCallRef.current(); });
    socket.on('peer-skipped', () => { addToast('Partner skipped', 'info'); doEndCallRef.current(); });

    return () => { socket.disconnect(); };
  }, [safelySetRemoteStream, emitAsync, addMsgToChat]);

  /* ===================== INITIALIZATION ===================== */
  useEffect(() => {
    (async () => {
      if (!tokenRef.current) { setLoading(false); setShowPermission(true); return; }
      const isBanned = await checkBanStatus();
      if (isBanned) { setLoading(false); return; }
      setLoading(false);
      setShowPermission(true);
    })();
  }, [checkBanStatus]);

  /* ===================== CANVAS PARTICLES ===================== */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    class P { constructor() { this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height; this.s = Math.random() * 2 + 0.5; this.dx = Math.random() * 0.5 - 0.25; this.dy = Math.random() * 0.5 - 0.25; this.o = Math.random() * 0.5 + 0.2; } update() { this.x += this.dx; this.y += this.dy; if (this.x > canvas.width) this.x = 0; if (this.x < 0) this.x = canvas.width; if (this.y > canvas.height) this.y = 0; if (this.y < 0) this.y = canvas.height; } draw() { ctx.fillStyle = `rgba(99,102,241,${this.o})`; ctx.beginPath(); ctx.arc(this.x, this.y, this.s, 0, Math.PI * 2); ctx.fill(); } }
    const particles = Array.from({ length: 50 }, () => new P());
    let animId;
    const animate = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); particles.forEach(p => { p.update(); p.draw(); }); animId = requestAnimationFrame(animate); };
    animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  /* ===================== DRAG PIP VIDEO ===================== */
  useEffect(() => {
    const wrapper = localVideoWrapperRef.current;
    if (!wrapper) return;
    let dragging = false, sx, sy;
    const start = (cx, cy) => { if (currentLayout === 'split') return; dragging = true; sx = cx - wrapper.offsetLeft; sy = cy - wrapper.offsetTop; wrapper.style.transition = 'none'; };
    const move = (cx, cy) => { if (!dragging || currentLayout !== 'float') return; const x = Math.max(0, Math.min(cx - sx, window.innerWidth - wrapper.offsetWidth)); const y = Math.max(0, Math.min(cy - sy, window.innerHeight - wrapper.offsetHeight)); wrapper.style.left = `${x}px`; wrapper.style.top = `${y}px`; wrapper.style.right = 'auto'; wrapper.style.bottom = 'auto'; };
    const end = () => { dragging = false; };
    wrapper.addEventListener('mousedown', e => start(e.clientX, e.clientY));
    window.addEventListener('mousemove', e => move(e.clientX, e.clientY));
    window.addEventListener('mouseup', end);
    wrapper.addEventListener('touchstart', e => { const t = e.touches[0]; start(t.clientX, t.clientY); }, { passive: true });
    window.addEventListener('touchmove', e => { if (dragging) { const t = e.touches[0]; move(t.clientX, t.clientY); } }, { passive: true });
    window.addEventListener('touchend', end);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', end); window.removeEventListener('touchmove', move); window.removeEventListener('touchend', end); };
  }, [currentLayout]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') { setShowReport(false); setShowGifts(false); setShowSettings(false); setShowPayment(false); setShowEffects(false); setShowMatchModal(false); setShowProfile(false); } };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  /* ===================== RENDER ===================== */
  return (
    <div className="video-container" style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />
      <audio ref={remoteAudioRef} autoPlay />

      {/* Remote Video */}
      <video ref={remoteVideoRef} autoPlay playsInline style={{ position: 'absolute', top: 0, left: 0, width: currentLayout === 'split' ? '50%' : '100%', height: '100%', objectFit: 'cover', zIndex: 1, background: '#111', transition: 'width 0.3s ease' }} />

      {/* Local Video PIP */}
      <div ref={localVideoWrapperRef} style={{ position: 'absolute', right: currentLayout === 'split' ? 'auto' : 30, left: currentLayout === 'split' ? '50%' : 'auto', bottom: currentLayout === 'split' ? 0 : 100, width: currentLayout === 'split' ? '50%' : 200, height: currentLayout === 'split' ? '100%' : 150, borderRadius: currentLayout === 'split' ? 0 : 16, overflow: 'hidden', border: currentLayout === 'split' ? '1px solid #333' : '2px solid rgba(255,255,255,0.2)', zIndex: 10, background: '#222', boxShadow: currentLayout === 'split' ? 'none' : '0 10px 20px rgba(0,0,0,0.5)' }}>
        <div ref={localVideoDivRef} style={{ width: '100%', height: '100%' }}></div>
      </div>

      {/* Top Bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20, background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'white' }}>
          {isInCall && <span style={{ fontFamily: 'monospace', fontSize: 18, background: 'rgba(0,0,0,0.5)', padding: '5px 10px', borderRadius: 15 }}>{matchTime}</span>}
          {partnerInfo?.username && isInCall && <span style={{ fontSize: 14, opacity: 0.9, background: 'rgba(0,0,0,0.5)', padding: '5px 15px', borderRadius: 15 }}>{partnerInfo.username}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15, color: 'white' }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setShowProfile(true)}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#444', overflow: 'hidden' }}>
                {user.avatar ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fas fa-user" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></i>}
              </div>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{user.username || 'User'}</span>
            </div>
          )}
          <div style={{ background: 'rgba(0,0,0,0.5)', padding: '5px 12px', borderRadius: 15, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => setShowPayment(true)}>
            <span style={{ color: '#fbbf24' }}>🪙</span>
            <span style={{ fontSize: 14, fontWeight: 'bold' }}>{userCoins}</span>
          </div>
          {!isInCall && <button onClick={() => setShowSettings(true)} style={{...topBtnStyle}}><i className="fas fa-cog"></i></button>}
          <button onClick={logout} style={{...topBtnStyle}}><i className="fas fa-sign-out-alt"></i></button>
        </div>
      </div>

      {/* Pre-Call UI */}
      {!isInCall && !showBlurOverlay && !showMatchModal && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 20, textAlign: 'center', width: '90%', maxWidth: 500 }}>
          <button onClick={startMatching} style={{ padding: '18px 50px', fontSize: 22, borderRadius: 30, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 0 40px rgba(99,102,241,0.5)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>Start Matching</button>
          <div style={{ marginTop: 30 }}><CountryScroll value={locationSelect} onChange={setLocationSelect} /></div>
          <div style={{ marginTop: 30, color: 'white', display: 'flex', justifyContent: 'center', gap: 20 }}>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 24, fontWeight: 'bold' }}>{stats.matches}</div><div style={{ fontSize: 12, opacity: 0.7 }}>Matches</div></div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }}></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 24, fontWeight: 'bold' }}>{stats.likes}</div><div style={{ fontSize: 12, opacity: 0.7 }}>Likes</div></div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }}></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 24, fontWeight: 'bold' }}>Lvl {stats.level}</div><div style={{ fontSize: 12, opacity: 0.7 }}>Level</div></div>
          </div>
        </div>
      )}

      {/* In-Call Controls */}
      {isInCall && (
        <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 12, zIndex: 20, background: 'rgba(0,0,0,0.6)', padding: '12px 20px', borderRadius: 35, backdropFilter: 'blur(10px)' }}>
          <button onClick={handleNext} title="Next" style={{...btnStyle, background: '#ef4444'}}>⏭️</button>
          <button onClick={switchCamera} title="Switch Camera" style={btnStyle}>🔄</button>
          <button onClick={toggleScreenShare} title="Screen Share" style={isScreenSharingRef.current ? {...btnStyle, background: '#3b82f6'} : btnStyle}>🖥️</button>
          <button onClick={() => setShowChat(!showChat)} title="Chat" style={showChat ? {...btnStyle, background: '#3b82f6'} : btnStyle}>💬</button>
          <button onClick={handleLike} title="Like" style={btnStyle}>❤️</button>
          <button onClick={() => setShowGifts(true)} title="Gift" style={btnStyle}>🎁</button>
          <button onClick={() => setShowReport(true)} title="Report" style={btnStyle}>🚩</button>
          <button onClick={() => setShowEffects(!showEffects)} title="Effects" style={btnStyle}>✨</button>
          <button onClick={toggleLayout} title="Layout" style={btnStyle}>📐</button>
          <button onClick={togglePiP} title="Picture in Picture" style={btnStyle}>🖼️</button>
        </div>
      )}

      {/* Chat Sidebar */}
      {showChat && isInCall && (
        <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', maxWidth: 350, height: '100%', background: 'rgba(20, 20, 20, 0.95)', zIndex: 50, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #333', backdropFilter: 'blur(10px)' }}>
          <div style={{ padding: 15, borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
            <span style={{ fontWeight: 'bold' }}>Chat</span>
            <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: 18, cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 15, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {chatMessages.map(m => (
              <div key={m.id} style={{ alignSelf: m.isOwn ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                <div style={{ background: m.isOwn ? '#6366f1' : '#333', color: 'white', padding: '10px 14px', borderRadius: 18, borderBottomRightRadius: m.isOwn ? 4 : 18, borderBottomLeftRadius: m.isOwn ? 18 : 4, fontSize: 14 }}>
                  {!m.isOwn && <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>{m.name}</div>}
                  {m.msg}
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: 15, borderTop: '1px solid #333', display: 'flex', gap: 10 }}>
            <input type="text" value={messageInput} onChange={e => setMessageInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Type a message..." style={{ flex: 1, background: '#222', border: '1px solid #444', borderRadius: 20, padding: '10px 15px', color: 'white', outline: 'none' }} />
            <button onClick={sendMessage} style={{ background: '#6366f1', border: 'none', color: 'white', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer' }}>➤</button>
          </div>
        </div>
      )}

      {/* Effects Popup */}
      {showEffects && isInCall && (
        <div style={{ position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)', background: '#222', padding: 15, borderRadius: 15, display: 'flex', gap: 10, zIndex: 30, border: '1px solid #444' }}>
          {['none', 'blur', 'grayscale', 'sepia', 'invert', 'contrast'].map(e => (
            <button key={e} onClick={() => applyEffect(e)} style={{ padding: '8px 12px', background: activeEffect === e ? '#6366f1' : '#333', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', textTransform: 'capitalize' }}>{e}</button>
          ))}
        </div>
      )}

      {/* Searching Overlay */}
      {showBlurOverlay && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
          <div style={{ width: 60, height: 60, border: '4px solid rgba(255,255,255,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ marginTop: 20, fontSize: 18 }}>Searching for stranger...</p>
          <button onClick={stopMatching} style={{ marginTop: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '10px 20px', borderRadius: 20, cursor: 'pointer' }}>Cancel</button>
        </div>
      )}

      {/* Match Found Modal */}
      {showMatchModal && pendingMatch && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 60, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
          <h1 style={{ fontSize: 32, marginBottom: 10 }}>Stranger Found! 🎉</h1>
          <div style={{ margin: '20px 0', background: '#222', padding: 20, borderRadius: 20, textAlign: 'center', minWidth: 250 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#444', margin: '0 auto 10px', overflow: 'hidden' }}>
              {pendingMatch.peerInfo?.avatar ? <img src={pendingMatch.peerInfo.avatar} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <i className="fas fa-user" style={{fontSize: 30, marginTop: 25}}></i>}
            </div>
            <h3>{pendingMatch.peerInfo?.username || 'Stranger'}</h3>
            <p style={{ opacity: 0.6, fontSize: 14 }}>{pendingMatch.peerInfo?.location !== 'any' ? `📍 ${pendingMatch.peerInfo.location}` : '🌍 Worldwide'}</p>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <button onClick={declineMatch} style={{ padding: '12px 40px', fontSize: 18, background: '#666', color: 'white', border: 'none', borderRadius: 30, cursor: 'pointer' }}>Skip</button>
            <button onClick={acceptMatch} style={{ padding: '12px 40px', fontSize: 18, background: '#6366f1', color: 'white', border: 'none', borderRadius: 30, cursor: 'pointer', fontWeight: 'bold' }}>Accept</button>
          </div>
        </div>
      )}

      {/* Permission Modal */}
      {showPermission && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
          <i className="fas fa-video" style={{ fontSize: 60, color: '#6366f1', marginBottom: 20 }}></i>
          <h2>Camera & Microphone Required</h2>
          <p style={{ marginBottom: 30, opacity: 0.7, maxWidth: 300, textAlign: 'center' }}>To start matching with people, please allow access to your devices</p>
          <button onClick={requestPermissions} disabled={permBtnLoading} style={{ padding: '15px 50px', fontSize: 18, background: '#6366f1', color: 'white', border: 'none', borderRadius: 30, cursor: 'pointer', fontWeight: 'bold' }}>
            {permBtnLoading ? 'Loading...' : 'Allow Access'}
          </button>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
           <div style={{ background: '#1a1a1a', padding: 30, borderRadius: 20, width: 450, maxHeight: '85vh', overflow: 'auto', color: 'white', border: '1px solid #333' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
               <h3 style={{ margin: 0 }}>Settings</h3>
               <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: 20, cursor: 'pointer' }}>✕</button>
             </div>
             <div style={{ marginBottom: 20 }}>
               <label style={{ fontSize: 14, opacity: 0.7 }}>I am</label>
               <select value={genderSelect} onChange={e => setGenderSelect(e.target.value)} style={{ width: '100%', padding: 12, marginTop: 5, borderRadius: 12, background: '#222', color: 'white', border: '1px solid #444' }}>
                 <option value="male">Male</option><option value="female">Female</option><option value="any">Other</option>
               </select>
             </div>
             <div style={{ marginBottom: 20 }}>
               <label style={{ fontSize: 14, opacity: 0.7 }}>Looking for</label>
               <select value={lookingFor} onChange={e => setLookingFor(e.target.value)} style={{ width: '100%', padding: 12, marginTop: 5, borderRadius: 12, background: '#222', color: 'white', border: '1px solid #444' }}>
                 <option value="any">Any Gender</option><option value="male">Males</option><option value="female">Females</option>
               </select>
             </div>
             <div style={{ marginBottom: 20 }}>
               <label style={{ fontSize: 14, opacity: 0.7 }}>Location Preference</label>
               <CountryScroll value={locationSelect} onChange={setLocationSelect} />
             </div>
             <div style={{ marginBottom: 25 }}>
               <label style={{ fontSize: 14, opacity: 0.7 }}>Interests (comma separated)</label>
               <input type="text" value={interestsInput} onChange={e => setInterestsInput(e.target.value)} placeholder="gaming, music, tech" style={{ width: '100%', padding: 12, marginTop: 5, borderRadius: 12, background: '#222', color: 'white', border: '1px solid #444', outline: 'none' }} />
             </div>
             <button onClick={saveSettings} style={{ width: '100%', padding: 14, background: '#6366f1', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 16, fontWeight: 'bold' }}>Save Settings</button>
           </div>
        </div>
      )}

      {/* Gift Modal */}
      {showGifts && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
           <div style={{ background: '#1a1a1a', padding: 30, borderRadius: 20, width: 400, color: 'white', border: '1px solid #333' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
               <h3 style={{ margin: 0 }}>Send Gift</h3>
               <button onClick={() => setShowGifts(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: 20, cursor: 'pointer' }}>✕</button>
             </div>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15 }}>
               {Object.entries(GIFT_COIN_COSTS).map(([key, cost]) => (
                 <button key={key} onClick={() => sendGift(key, cost)} style={{ background: '#222', border: '2px solid #333', borderRadius: 15, padding: 15, color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.borderColor = '#6366f1'} onMouseOut={e => e.currentTarget.style.borderColor = '#333'}>
                   <span style={{ fontSize: 30 }}>{key === 'rose' ? '🌹' : key === 'heart' ? '❤️' : key === 'star' ? '⭐' : key === 'diamond' ? '💎' : key === 'crown' ? '👑' : '🚀'}</span>
                   <span style={{ textTransform: 'capitalize', fontSize: 14 }}>{key}</span>
                   <span style={{ fontSize: 12, color: '#fbbf24' }}>🪙 {cost}</span>
                 </button>
               ))}
             </div>
           </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
           <div style={{ background: '#1a1a1a', padding: 30, borderRadius: 20, width: 400, color: 'white', border: '1px solid #333' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
               <h3 style={{ margin: 0, color: '#ef4444' }}>Report User</h3>
               <button onClick={() => setShowReport(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: 20, cursor: 'pointer' }}>✕</button>
             </div>
             {['Inappropriate Behavior', 'Nudity / Sexual Content', 'Hate Speech', 'Spam / Advertising', 'Other'].map(r => (
               <div key={r} onClick={() => setSelectedReport(r)} style={{ padding: 12, background: selectedReport === r ? '#333' : '#222', border: '1px solid #444', borderRadius: 10, marginBottom: 10, cursor: 'pointer' }}>{r}</div>
             ))}
             <textarea value={reportDetails} onChange={e => setReportDetails(e.target.value)} placeholder="Additional details (optional)" style={{ width: '100%', height: 80, marginTop: 10, padding: 10, background: '#222', border: '1px solid #444', borderRadius: 10, color: 'white', resize: 'none', outline: 'none' }} />
             <button onClick={submitReport} style={{ width: '100%', padding: 12, marginTop: 15, background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}>Submit Report</button>
           </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
           <div style={{ background: '#1a1a1a', padding: 30, borderRadius: 20, width: 400, color: 'white', border: '1px solid #333' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
               <h3 style={{ margin: 0 }}>Buy Coins</h3>
               <button onClick={() => setShowPayment(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: 20, cursor: 'pointer' }}>✕</button>
             </div>
             {[{ id: 'pkg_100', coins: 100, price: '$0.99' }, { id: 'pkg_500', coins: 500, price: '$3.99' }, { id: 'pkg_1000', coins: 1000, price: '$6.99' }].map(pkg => (
               <div key={pkg.id} onClick={() => setSelectedCoinPackage(pkg)} style={{ padding: 15, background: selectedCoinPackage?.id === pkg.id ? '#333' : '#222', border: selectedCoinPackage?.id === pkg.id ? '1px solid #6366f1' : '1px solid #444', borderRadius: 12, marginBottom: 10, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ fontSize: 20 }}>🪙 {pkg.coins}</span>
                 <span style={{ fontWeight: 'bold', color: '#10b981' }}>{pkg.price}</span>
               </div>
             ))}
             <button onClick={purchaseCoins} style={{ width: '100%', padding: 14, marginTop: 10, background: '#6366f1', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 16, fontWeight: 'bold' }}>Checkout with Stripe</button>
           </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && user && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
           <div style={{ background: '#1a1a1a', padding: 30, borderRadius: 20, width: 350, color: 'white', border: '1px solid #333', textAlign: 'center' }}>
             <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
               <button onClick={() => setShowProfile(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: 20, cursor: 'pointer' }}>✕</button>
             </div>
             <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#333', margin: '0 auto 15px', overflow: 'hidden', border: '3px solid #6366f1' }}>
               {user.avatar ? <img src={user.avatar} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <i className="fas fa-user" style={{fontSize: 40, marginTop: 30}}></i>}
             </div>
             <h3>{user.username || 'User'}</h3>
             <p style={{ opacity: 0.6, fontSize: 13 }}><i className={providerInfo.icon}></i> {providerInfo.label}</p>
             <div style={{ display: 'flex', justifyContent: 'center', gap: 20, margin: '20px 0', background: '#222', padding: 15, borderRadius: 15 }}>
               <div><div style={{ fontWeight: 'bold' }}>{stats.matches}</div><div style={{ fontSize: 12, opacity: 0.6 }}>Matches</div></div>
               <div><div style={{ fontWeight: 'bold' }}>{stats.likes}</div><div style={{ fontSize: 12, opacity: 0.6 }}>Likes</div></div>
               <div><div style={{ fontWeight: 'bold' }}>Lvl {stats.level}</div><div style={{ fontSize: 12, opacity: 0.6 }}>Level</div></div>
             </div>
             <div style={{ background: '#222', padding: 10, borderRadius: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
               <span style={{ color: '#fbbf24' }}>🪙</span>
               <span style={{ fontWeight: 'bold' }}>{userCoins} Coins</span>
             </div>
           </div>
        </div>
      )}

      {/* Gift Animation Popup */}
      {showGiftPopup && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 80, zIndex: 200, animation: 'popIn 0.3s ease-out', pointerEvents: 'none' }}>
          {giftAnimation}
        </div>
      )}

      {/* Toasts */}
      <div style={{ position: 'absolute', top: 70, right: 20, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 350 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: t.type === 'error' ? '#dc2626' : t.type === 'success' ? '#16a34a' : '#333', color: 'white', padding: '12px 20px', borderRadius: 12, transform: t.visible ? 'translateX(0)' : 'translateX(120%)', transition: 'transform 0.3s ease', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', fontSize: 14, border: '1px solid rgba(255,255,255,0.1)' }}>
            {t.msg}
          </div>
        ))}
      </div>
      
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes popIn { 0% { transform: translate(-50%, -50%) scale(0); } 100% { transform: translate(-50%, -50%) scale(1); } }
      `}</style>
    </div>
  );
}

const btnStyle = { width: 50, height: 50, borderRadius: 25, border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: 20, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: '0.2s' };
const topBtnStyle = { background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 16 };
