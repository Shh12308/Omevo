import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import "./Video.css";

/* ===================== CONFIGURATION ===================== */
const CONFIG = {
  BACKEND: 'https://api.omevo.online',
  AGORA_APP_ID: '0f9094ed4a8e4dea934059b0ea8b5182',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_your_stripe_key_here',
  DEBUG_MODE: false,
  MODERATION_INTERVAL: 2000,
  HEARTBEAT_INTERVAL: 5000,
  TRACK_RECOVERY_DELAY: 1000,
  SESSION_REFRESH_INTERVAL: 15 * 60 * 1000, // 15 minutes
  SESSION_MAX_AGE: 30 * 24 * 60 * 60 * 1000, // 30 days
  TAB_AWAY_THRESHOLD: 5 * 60 * 1000, // 5 minutes
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
    if (error instanceof TypeError && (!error.message || error.message === '')) throw new Error('Network error - please check your connection');
    throw error;
  }
};

/* ===================== PURE HELPERS ===================== */
function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
function maskEmail(email) { if (!email || !email.includes('@')) return email; const parts = email.split('@'); return parts[0].slice(0, 2) + '***@' + parts[1]; }
function formatDate(d) { if (!d) return '-'; try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; } }
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
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [value]);

  const select = (code) => {
    if (navigator.vibrate) navigator.vibrate(10);
    onChange(code);
  };

  return (
    <div className="country-scroll-container">
      <div className="country-scroll" ref={scrollRef}>
        {COUNTRIES.map((c) => (
          <button
            key={c.code}
            onClick={() => select(c.code)}
            className={`country-chip ${value === c.code ? 'active' : ''}`}
          >
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
    .country-scroll-container {
      margin-top: 8px;
      border-radius: 16px;
      background: rgba(0,0,0,0.2);
      padding: 4px;
      border: 1px solid rgba(255,255,255,0.05);
    }
    .country-scroll {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding: 12px 10px;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
    .country-scroll::-webkit-scrollbar { display: none; }
    .country-scroll-container {
      mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
      -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
    }
    .country-chip {
      flex: 0 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: white;
      font-size: 12px;
      backdrop-filter: blur(12px);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      scroll-snap-align: center;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .country-chip:hover {
      transform: translateY(-2px);
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255,255,255,0.2);
    }
    .country-chip.active {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none;
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
      transform: translateY(-2px) scale(1.05);
      color: white;
    }
    .country-emoji { font-size: 20px; transition: transform 0.2s; }
    .country-chip:active .country-emoji { transform: scale(1.2); }
    .country-name { font-weight: 600; letter-spacing: 0.3px; opacity: 0.9; }
    .country-chip.active .country-name { opacity: 1; }
    .country-chip:first-child { background: rgba(255,255,255,0.08); }
    .country-chip:first-child.active {
      background: linear-gradient(135deg, #10b981, #059669);
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
    }
  `;
  const style = document.createElement('style');
  style.id = 'premium-country-styles';
  style.innerHTML = css;
  document.head.appendChild(style);
};

/* ===================== MAIN COMPONENT ===================== */
export default function Video() {
  useEffect(() => { injectPremiumStyles(); }, []);

  /* ---------- token with persistent session ---------- */
  const [token, setTokenState] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get('token');
    if (t) {
      localStorage.setItem('token', t);
      localStorage.setItem('tokenTimestamp', Date.now().toString());
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    const storedToken = localStorage.getItem('token');
    const timestamp = localStorage.getItem('tokenTimestamp');
    if (storedToken && timestamp) {
      const age = Date.now() - parseInt(timestamp);
      if (age > CONFIG.SESSION_MAX_AGE) {
        localStorage.removeItem('token');
        localStorage.removeItem('tokenTimestamp');
        localStorage.removeItem('cachedUser');
        return null;
      }
    }
    return storedToken;
  });
  const tokenRef = useRef(token);

  /* Wrapper to always sync token to localStorage and ref */
  const setToken = useCallback((newToken) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
      localStorage.setItem('tokenTimestamp', Date.now().toString());
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('tokenTimestamp');
      localStorage.removeItem('cachedUser');
    }
    tokenRef.current = newToken;
    setTokenState(newToken);
  }, []);

  /* ---------- UI toggles ---------- */
  const [loading, setLoading] = useState(true);
  const [showPermission, setShowPermission] = useState(false);
  const [banData, setBanData] = useState(null);
  const [showAppeal, setShowAppeal] = useState(false);
  const [showAgeVerify, setShowAgeVerify] = useState(false);
  const [showUnbanSuccess, setShowUnbanSuccess] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showEditName, setShowEditName] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showEffects, setShowEffects] = useState(false);
  const [showBlurOverlay, setShowBlurOverlay] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showGiftPopup, setShowGiftPopup] = useState(false);
  const [giftAnimation, setGiftAnimation] = useState(null);
  const [permBtnLoading, setPermBtnLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

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
  const [showTyping, setShowTyping] = useState(false);
  const [networkQuality, setNetworkQuality] = useState('excellent');
  const [currentLayout, setCurrentLayout] = useState('float');
  const [activeEffect, setActiveEffect] = useState('none');
  const [toasts, setToasts] = useState([]);
  const [isRecoveringTracks, setIsRecoveringTracks] = useState(false);

  /* ---------- form state ---------- */
  const [genderSelect, setGenderSelect] = useState('male');
  const [lookingFor, setLookingFor] = useState('any');
  const [locationSelect, setLocationSelect] = useState('any');
  const [interestsInput, setInterestsInput] = useState('');
  const [editName, setEditName] = useState('');
  const [appealText, setAppealText] = useState('');
  const [ageDay, setAgeDay] = useState('');
  const [ageMonth, setAgeMonth] = useState('');
  const [ageYear, setAgeYear] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportDetails, setReportDetails] = useState('');
  const [selectedCoinPackage, setSelectedCoinPackage] = useState(null);

  /* ---------- refs ---------- */
  const canvasRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localVideoDivRef = useRef(null);
  const localVideoWrapperRef = useRef(null);
  const socketRef = useRef(null);
  const clientRef = useRef(null);
  const localTracksRef = useRef({ videoTrack: null, audioTrack: null, screenTrack: null });
  const matchTimerRef = useRef(null);
  const matchSecondsRef = useRef(0);
  const moderationRef = useRef(null);
  const modCanvasRef = useRef(null);
  const camerasRef = useRef([]);
  const cameraIdxRef = useRef(0);
  const permissionsRef = useRef(false);
  const currentRoomRef = useRef(null);
  const partnerIdRef = useRef(null);
  const isInCallRef = useRef(false);
  const isMatchingRef = useRef(false);
  const isScreenSharingRef = useRef(false);
  const preferencesRef = useRef({ gender: 'male', looking_for: 'any', location: 'any', interests: [] });
  const stripeRef = useRef(null);
  const userIdRef = useRef(null);
  const trackRecoveryTimeoutRef = useRef(null);
  const isPageVisibleRef = useRef(true);
  const pendingTrackRecoveryRef = useRef(false);
  const remoteStreamRef = useRef(null);
  const sessionRefreshRef = useRef(null);
  const isInitializedRef = useRef(false);

  /* ===================== TOAST ===================== */
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

  /* ===================== USER CACHE HELPERS ===================== */
  const restoreCachedUser = useCallback(() => {
    try {
      const cached = localStorage.getItem('cachedUser');
      if (cached) {
        const parsed = JSON.parse(cached);
        setUser(parsed);
        setUserCoins(parsed.coins || 0);
        setStats(prev => ({ ...prev, level: parsed.level || 1 }));
        return true;
      }
    } catch {}
    return false;
  }, []);

  const cacheUser = useCallback((userData) => {
    if (userData) {
      try {
        localStorage.setItem('cachedUser', JSON.stringify(userData));
      } catch {}
    }
  }, []);

  /* Cache user data whenever it updates (only if authenticated) */
  useEffect(() => {
    if (user && tokenRef.current) {
      cacheUser(user);
    }
  }, [user, cacheUser]);

  /* ===================== TOKEN VALIDATION ===================== */
  const validateToken = useCallback(async () => {
    const t = tokenRef.current;
    if (!t) return { valid: false, user: null, reason: 'no_token' };

    try {
      const r = await safeFetch(CONFIG.BACKEND + '/auth/me', {
        headers: { Authorization: 'Bearer ' + t }
      });

      if (r.status === 401 || r.status === 403) {
        setToken(null);
        setSessionExpired(true);
        return { valid: false, user: null, reason: 'token_expired' };
      }

      if (!r.ok) {
        return { valid: false, user: null, reason: 'server_error' };
      }

      const d = await r.json();
      if (d.authenticated && d.user) {
        if (d.user.banned_until && new Date(d.user.banned_until) > new Date()) {
          setBanData({ reason: d.user.ban_reason, until: d.user.banned_until, type: null });
          return { valid: true, user: d.user, banned: true };
        }
        cacheUser(d.user);
        return { valid: true, user: d.user };
      }

      setToken(null);
      setSessionExpired(true);
      return { valid: false, user: null, reason: 'not_authenticated' };
    } catch (error) {
      return { valid: null, user: null, reason: 'network_error' };
    }
  }, [setToken, cacheUser]);

  const validateTokenRef = useRef(validateToken);
  useEffect(() => { validateTokenRef.current = validateToken; }, [validateToken]);

  /* ===================== SESSION REFRESH (every 15 min) ===================== */
  useEffect(() => {
    if (!tokenRef.current) return;

    const refreshSession = async () => {
      if (!tokenRef.current) return;
      try {
        const r = await safeFetch(CONFIG.BACKEND + '/auth/me', {
          headers: { Authorization: 'Bearer ' + tokenRef.current }
        });

        if (r.status === 401 || r.status === 403) {
          setToken(null);
          setSessionExpired(true);
          addToastRef.current('Session expired, please log in again', 'info');
          return;
        }

        if (r.ok) {
          const d = await r.json();
          if (d.authenticated && d.user) {
            setUser(d.user);
            setUserCoins(d.user.coins || 0);
            cacheUser(d.user);
          }
        }
      } catch (error) {
        console.debug('Session refresh failed:', error);
      }
    };

    sessionRefreshRef.current = setInterval(refreshSession, CONFIG.SESSION_REFRESH_INTERVAL);
    return () => {
      if (sessionRefreshRef.current) clearInterval(sessionRefreshRef.current);
    };
  }, [token, addToast, setToken, cacheUser]);

  /* ===================== TAB FOCUS HANDLING ===================== */
  useEffect(() => {
    if (!tokenRef.current) return;

    const handleFocus = () => {
      const lastActive = parseInt(sessionStorage.getItem('lastActive') || '0');
      const awayTime = Date.now() - lastActive;

      if (awayTime > CONFIG.TAB_AWAY_THRESHOLD) {
        validateTokenRef.current().then(result => {
          if (result.valid === false && result.reason === 'token_expired') {
            addToastRef.current('Session expired while away, please log in again', 'info');
          }
        });
      }
    };

    const handleBlur = () => {
      sessionStorage.setItem('lastActive', Date.now().toString());
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [token]);

  /* ===================== CHAT & TIMERS ===================== */
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
    if (el._errorHandler) el.removeEventListener('error', el._errorHandler);
    el._errorHandler = (e) => { e.stopImmediatePropagation(); e.preventDefault(); };
    el.addEventListener('error', el._errorHandler, true);
    el.pause();
    if (remoteStreamRef.current) remoteStreamRef.current.getTracks().forEach(t => { try { t.stop(); } catch {} });
    remoteStreamRef.current = stream;
    el.srcObject = stream;
    el.play().catch(() => {});
  }, []);

  /* ===================== TRACK RECOVERY ===================== */
  const recoverTracks = useCallback(async () => {
    if (isRecoveringTracks) return;
    const AgoraRTC = window.AgoraRTC;
    if (!AgoraRTC || !permissionsRef.current) return;
    setIsRecoveringTracks(true);
    try {
      const audioEnded = !localTracksRef.current.audioTrack || (localTracksRef.current.audioTrack.getMediaStreamTrack && localTracksRef.current.audioTrack.getMediaStreamTrack().readyState === 'ended');
      const videoEnded = !localTracksRef.current.videoTrack || (localTracksRef.current.videoTrack.getMediaStreamTrack && localTracksRef.current.videoTrack.getMediaStreamTrack().readyState === 'ended');
      if (!audioEnded && !videoEnded) { setIsRecoveringTracks(false); return; }
      if (localTracksRef.current.audioTrack) try { localTracksRef.current.audioTrack.close(); } catch {}
      if (localTracksRef.current.videoTrack) try { localTracksRef.current.videoTrack.close(); } catch {}
      const newAudio = await AgoraRTC.createMicrophoneAudioTrack();
      const newVideo = await AgoraRTC.createCameraVideoTrack({ encoderConfig: { width: 1280, height: 720, frameRate: 30, bitrate: 1710 } });
      localTracksRef.current.audioTrack = newAudio;
      localTracksRef.current.videoTrack = newVideo;
      if (localVideoDivRef.current) newVideo.play(localVideoDivRef.current);
      if (isInCallRef.current && clientRef.current) try { await clientRef.current.publish([newAudio, newVideo]); } catch { addToastRef.current('Reconnecting...', 'info'); }
      setupTrackListeners();
      if (activeEffect !== 'none') { const v = localVideoDivRef.current?.querySelector('video'); if (v) { const filters = { none: '', blur: 'blur(5px)', grayscale: 'grayscale(100%)', sepia: 'sepia(100%)', invert: 'invert(100%)', contrast: 'contrast(150%)' }; v.style.filter = filters[activeEffect] || ''; } }
      addToastRef.current('Camera recovered', 'success');
    } catch (e) { addToastRef.current('Failed to recover camera', 'error'); }
    finally { setIsRecoveringTracks(false); pendingTrackRecoveryRef.current = false; }
  }, [activeEffect]);

  const scheduleTrackRecovery = useCallback(() => {
    if (pendingTrackRecoveryRef.current) return;
    pendingTrackRecoveryRef.current = true;
    if (trackRecoveryTimeoutRef.current) clearTimeout(trackRecoveryTimeoutRef.current);
    trackRecoveryTimeoutRef.current = setTimeout(() => recoverTracks(), CONFIG.TRACK_RECOVERY_DELAY);
  }, [recoverTracks]);

  const setupTrackListeners = useCallback(() => {
    const audioTrack = localTracksRef.current.audioTrack;
    const videoTrack = localTracksRef.current.videoTrack;
    if (audioTrack && audioTrack.getMediaStreamTrack) { const st = audioTrack.getMediaStreamTrack(); if (st && st.onended !== undefined) st.onended = () => scheduleTrackRecovery(); }
    if (videoTrack && videoTrack.getMediaStreamTrack) { const st = videoTrack.getMediaStreamTrack(); if (st && st.onended !== undefined) st.onended = () => scheduleTrackRecovery(); }
  }, [scheduleTrackRecovery]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      isPageVisibleRef.current = isVisible;
      if (isVisible && isInCallRef.current && permissionsRef.current) {
        setTimeout(() => {
          const checkTrack = (track) => { if (!track || !track.getMediaStreamTrack) return false; return track.getMediaStreamTrack().readyState === 'ended'; };
          if (checkTrack(localTracksRef.current.audioTrack) || checkTrack(localTracksRef.current.videoTrack)) scheduleTrackRecovery();
        }, 500);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [scheduleTrackRecovery]);

  /* ===================== GIFT ANIMATION ===================== */
  const triggerGiftAnimation = useCallback((type) => {
    const giftEmojis = { rose: '🌹', heart: '❤️', star: '⭐', diamond: '💎', crown: '👑', rocket: '🚀' };
    setGiftAnimation(giftEmojis[type] || '🎁');
    setShowGiftPopup(true);
    setTimeout(() => setShowGiftPopup(false), 3000);
  }, []);

  /* ===================== CORE FUNCTIONS ===================== */
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
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    remoteStreamRef.current = null;
    if (localTracksRef.current.screenTrack) { try { localTracksRef.current.screenTrack.close(); } catch {} localTracksRef.current.screenTrack = null; }
    if (clientRef.current) { try { clientRef.current.leave(); } catch {} clientRef.current = null; }
    if (socketRef.current && currentRoomRef.current) socketRef.current.emit('leave_room', { room: currentRoomRef.current });
    currentRoomRef.current = null;
    partnerIdRef.current = null;
  }, [stopMatchTimer, safelySetRemoteStream]);

  const doEndCallRef = useRef(doEndCall);
  useEffect(() => { doEndCallRef.current = doEndCall; }, [doEndCall]);

  const acceptMatch = useCallback(async () => {
    if (!pendingMatch) return;
    setShowMatchModal(false);
    setShowBlurOverlay(false);
    partnerIdRef.current = pendingMatch.peerId;
    currentRoomRef.current = pendingMatch.channel;
    setPartnerInfoState(pendingMatch.peerInfo || null);
    await doStartCall(pendingMatch.channel, pendingMatch.peerId);
  }, [pendingMatch]);

  const declineMatch = useCallback(() => {
    setShowMatchModal(false);
    setPendingMatch(null);
    setShowBlurOverlay(false);
    safeFetch(CONFIG.BACKEND + '/queue/leave', { method: 'POST', headers: { Authorization: 'Bearer ' + tokenRef.current } }).catch(() => {});
    setTimeout(() => startMatching(), 500);
  }, []);

  const doStartCall = async (channelName, peerId) => {
    const AgoraRTC = window.AgoraRTC;
    if (!AgoraRTC) { addToast('AgoraRTC not loaded', 'error'); doEndCallRef.current(); return; }
    isMatchingRef.current = false;
    isInCallRef.current = true;
    setIsInCall(true);
    startMatchTimer();
    setChatMessages([]);
    try {
      const uid = Math.floor(Math.random() * 100000);
      const tr = await safeFetch(CONFIG.BACKEND + '/generateToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenRef.current },
        body: JSON.stringify({ channelName, uid, role: 'publisher', expirySeconds: 3600 }),
      });
      if (!tr.ok) { const e = await tr.json().catch(() => ({ error: 'Token request failed' })); throw new Error(e.error || 'Token failed'); }
      const td = await tr.json();
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;
      await client.join(td.appID || CONFIG.AGORA_APP_ID, channelName, td.rtcToken, uid);
      const needNewAudio = !localTracksRef.current.audioTrack || (localTracksRef.current.audioTrack.getMediaStreamTrack && localTracksRef.current.audioTrack.getMediaStreamTrack().readyState === 'ended');
      const needNewVideo = !localTracksRef.current.videoTrack || (localTracksRef.current.videoTrack.getMediaStreamTrack && localTracksRef.current.videoTrack.getMediaStreamTrack().readyState === 'ended');
      if (needNewAudio) localTracksRef.current.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      if (needNewVideo) { localTracksRef.current.videoTrack = await AgoraRTC.createCameraVideoTrack({ encoderConfig: { width: 1280, height: 720, frameRate: 30, bitrate: 1710 } }); localTracksRef.current.videoTrack.play(localVideoDivRef.current); }
      setupTrackListeners();
      await client.publish([localTracksRef.current.audioTrack, localTracksRef.current.videoTrack]);
      client.on('user-published', async (u, mediaType) => {
        try {
          await client.subscribe(u, mediaType);
          if (mediaType === 'video') { const stream = new MediaStream([u.videoTrack.getMediaStreamTrack()]); safelySetRemoteStream(stream); }
          if (mediaType === 'audio') u.audioTrack.play().catch(() => {});
        } catch {}
      });
      client.on('user-unpublished', (u, m) => { if (m === 'video') { safelySetRemoteStream(null); if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null; } if (m === 'audio' && u.audioTrack) try { u.audioTrack.stop(); } catch {} });
      client.on('user-left', () => { addToast('Partner left the call', 'info'); doEndCallRef.current(); });
      client.on('network-quality', (s) => { const q = s.downlinkNetworkQuality; setNetworkQuality(q <= 1 ? 'excellent' : q === 2 ? 'good' : q === 3 ? 'poor' : 'bad'); });
      socketRef.current?.emit('join_room', { room: channelName });
      startModerationLoop(channelName);
      setStats(prev => ({ ...prev, matches: prev.matches + 1 }));
      addToast('Connected!', 'success');
    } catch (e) { addToast('Failed: ' + (e.message || 'Unknown error'), 'error'); doEndCallRef.current(); }
  };

  const requestPermissions = async () => {
    setPermBtnLoading(true);
    try {
      const AgoraRTC = window.AgoraRTC;
      if (!AgoraRTC) throw new Error('AgoraRTC not loaded');

      const audio = await AgoraRTC.createMicrophoneAudioTrack();
      const video = await AgoraRTC.createCameraVideoTrack({ encoderConfig: { width: 1280, height: 720, frameRate: 30, bitrate: 1710 } });

      localTracksRef.current.audioTrack = audio;
      localTracksRef.current.videoTrack = video;
      video.play(localVideoDivRef.current);
      setupTrackListeners();
      permissionsRef.current = true;
      setShowPermission(false);
      setLoading(false);
      try { const devices = await AgoraRTC.getDevices(); camerasRef.current = devices.filter(x => x.kind === 'videoinput'); } catch {}
      await initializeAfterAuth();
    } catch (err) {
      console.error("Permission error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        addToast('Permission denied. Please allow camera access in your browser settings and refresh.', 'error');
      } else if (err.name === 'NotFoundError') {
        addToast('No camera or microphone found.', 'error');
      } else if (err.name === 'NotReadableError') {
        addToast('Camera might be in use by another app.', 'error');
      } else {
        addToast('Camera & microphone permission required', 'error');
      }
    }
    finally { setPermBtnLoading(false); }
  };

  const loadSettings = async () => {
    const t = tokenRef.current;
    if (!t) return;
    try {
      const r = await safeFetch(CONFIG.BACKEND + '/api/user/preferences', { headers: { Authorization: 'Bearer ' + t } });
      if (r.ok) { const p = await r.json(); setGenderSelect(p.gender || 'male'); setLookingFor(p.looking_for || 'any'); setLocationSelect(p.location || 'any'); setInterestsInput((p.interests || []).join(', ')); preferencesRef.current = { ...preferencesRef.current, ...p }; }
    } catch {}
  };

  const loadProfile = async () => {
    const t = tokenRef.current;
    if (!t) return;
    try {
      const r = await safeFetch(CONFIG.BACKEND + '/user/profile', { headers: { Authorization: 'Bearer ' + t } });
      if (r.ok) { const u = await r.json(); setUser(u); setUserCoins(u.coins || 0); setStats(prev => ({ ...prev, level: u.level || 1 })); }
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
    await loadProfile();
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      const sid = params.get('session_id');
      if (sid && tokenRef.current) {
        try {
          const r = await safeFetch(CONFIG.BACKEND + '/api/verify-payment', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenRef.current }, body: JSON.stringify({ sessionId: sid }) });
          if (r.ok) { const d = await r.json(); if (d.success) { setUserCoins(d.coins); setUser(prev => prev ? { ...prev, coins: d.coins } : prev); addToast('Coins added! New balance: ' + d.coins, 'success'); } }
        } catch {}
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (params.get('payment') === 'cancelled') { addToast('Payment cancelled', 'info'); window.history.replaceState({}, document.title, window.location.pathname); }
    if (params.get('unban') === 'success') { setShowUnbanSuccess(true); window.history.replaceState({}, document.title, window.location.pathname); }
    if (params.get('gift') === 'success') { addToast('Gift sent successfully!', 'success'); window.history.replaceState({}, document.title, window.location.pathname); }
  };

  const initializeAfterAuthRef = useRef(initializeAfterAuth);
  useEffect(() => { initializeAfterAuthRef.current = initializeAfterAuth; }, []);

  /* ===================== INITIAL AUTH CHECK (with persistent login) ===================== */
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    (async () => {
      if (!tokenRef.current) {
        setLoading(false);
        setSessionExpired(false);
        setShowPermission(true);
        return;
      }

      // Restore cached user immediately for instant UI
      restoreCachedUser();

      // Validate token with server
      const result = await validateToken();

      if (result.valid === false) {
        setLoading(false);
        if (result.reason === 'token_expired') {
          addToast('Session expired, please log in again', 'info');
        }
        setShowPermission(true);
        return;
      }

      if (result.banned) {
        setLoading(false);
        return;
      }

      if (result.valid === true && result.user) {
        setUser(result.user);
        setUserCoins(result.user.coins || 0);
        setStats(prev => ({ ...prev, level: result.user.level || 1 }));
      }

      // If result.valid === null (network error), continue with cached data
      setLoading(false);
      setShowPermission(true);

      if (permissionsRef.current) {
        await initializeAfterAuthRef.current();
      }
    })();
  }, []); // Run once on mount

  const startMatching = async () => {
    if (isMatchingRef.current || isInCallRef.current) return;
    if (!permissionsRef.current) { addToast('Grant camera permissions first', 'error'); setShowPermission(true); return; }
    if (!tokenRef.current) { addToast('Please log in', 'error'); setSessionExpired(true); return; }
    if (!socketRef.current || !socketRef.current.connected) return;
    const checkTrack = (track) => { if (!track || !track.getMediaStreamTrack) return true; return track.getMediaStreamTrack().readyState === 'ended'; };
    if (checkTrack(localTracksRef.current.audioTrack) || checkTrack(localTracksRef.current.videoTrack)) { addToast('Recovering camera...', 'info'); await recoverTracks(); return; }
    isMatchingRef.current = true;
    setShowBlurOverlay(true);
    try {
      const payload = { gender: preferencesRef.current.gender, looking_for: preferencesRef.current.looking_for, location: locationSelect, interests: preferencesRef.current.interests, nickname: (user && (user.username || user.nickname)) || 'User' };
      const r = await safeFetch(CONFIG.BACKEND + '/queue/enqueue', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenRef.current }, body: JSON.stringify(payload) });
      if (!r.ok) {
        if (r.status === 401 || r.status === 403) {
          setToken(null);
          setSessionExpired(true);
          throw new Error('Session expired, please log in again');
        }
        const e = await r.json().catch(() => ({ error: 'Enqueue failed' }));
        throw new Error(e.error || 'Enqueue failed');
      }
      const d = await r.json();
      if (d.matched) { setPendingMatch({ peerId: d.peerId, channel: d.channel, peerInfo: d.peerInfo }); setShowMatchModal(true); }
      else { addToast('Looking for a match...', 'info'); setTimeout(() => { if (isMatchingRef.current) checkForMatch(); }, 3000); }
    } catch (e) { addToast(e.message || 'Matching failed', 'error'); stopMatching(); }
  };

  const checkForMatch = async () => {
    if (!isMatchingRef.current || isInCallRef.current) return;
    try {
      const r = await safeFetch(CONFIG.BACKEND + '/queue/check', { headers: { Authorization: 'Bearer ' + tokenRef.current } });
      if (!r.ok) return;
      const d = await r.json();
      if (d.matched) { setPendingMatch({ peerId: d.peerId, channel: d.channel, peerInfo: d.peerInfo }); setShowMatchModal(true); }
      else setTimeout(checkForMatch, 3000);
    } catch { setTimeout(checkForMatch, 5000); }
  };

  const stopMatching = () => {
    isMatchingRef.current = false;
    setShowBlurOverlay(false);
    setShowMatchModal(false);
    setPendingMatch(null);
    safeFetch(CONFIG.BACKEND + '/queue/leave', { method: 'POST', headers: { Authorization: 'Bearer ' + tokenRef.current } }).catch(() => {});
  };

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

  const switchCamera = async () => {
    if (!localTracksRef.current.videoTrack) { addToast('No camera', 'info'); return; }
    try {
      if (camerasRef.current.length > 1) {
        cameraIdxRef.current = (cameraIdxRef.current + 1) % camerasRef.current.length;
        const dev = camerasRef.current[cameraIdxRef.current];
        await localTracksRef.current.videoTrack.setDevice(dev.deviceId);
        addToast('Switched to ' + (dev.label || 'Camera'), 'success');
        const el = localVideoDivRef.current?.querySelector('video');
        if (el) { const isBack = dev.label.toLowerCase().includes('back') || dev.label.toLowerCase().includes('rear'); el.style.transform = isBack ? 'scaleX(1)' : 'scaleX(-1)'; }
      } else {
        await localTracksRef.current.videoTrack.switchDevice();
        addToast('Switched camera', 'success');
      }
    } catch { addToast('Failed to switch', 'error'); }
  };

  const toggleScreenShare = async () => {
    const AgoraRTC = window.AgoraRTC;
    if (!AgoraRTC) return;
    if (isScreenSharingRef.current) {
      try { if (localTracksRef.current.screenTrack && clientRef.current) { await clientRef.current.unpublish(localTracksRef.current.screenTrack); localTracksRef.current.screenTrack.close(); localTracksRef.current.screenTrack = null; } isScreenSharingRef.current = false; addToast('Screen sharing stopped', 'info'); } catch {}
    } else {
      if (!clientRef.current || !isInCallRef.current) { addToast('Start a call first', 'error'); return; }
      try {
        const screenTrack = await AgoraRTC.createScreenVideoTrack({ encoderConfig: '1080p_2' }, 'disable');
        localTracksRef.current.screenTrack = screenTrack;
        screenTrack.on('track-ended', () => { isScreenSharingRef.current = false; addToast('Screen sharing ended', 'info'); });
        await clientRef.current.publish(screenTrack);
        isScreenSharingRef.current = true;
        addToast('Screen sharing started', 'success');
      } catch { addToast('Could not start screen share', 'error'); }
    }
  };

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
      if (!el) { addToast('Video stream not ready', 'error'); return; }
      if (document.pictureInPictureElement) { await document.exitPictureInPicture(); addToast('Exited PiP', 'info'); }
      else if (document.pictureInPictureEnabled) { if (el.readyState >= 1) { await el.requestPictureInPicture(); addToast('PiP mode', 'success'); } else addToast('Video initializing...', 'info'); }
      else addToast('PiP not supported', 'error');
    } catch { addToast('Could not toggle PiP', 'error'); }
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
    if (text.length > 500) { addToast('Too long (max 500)', 'error'); return; }
    socketRef.current.emit('message', { room: currentRoomRef.current, text });
    setMessageInput('');
  };

  const submitReport = () => {
    if (!selectedReport) { addToast('Select a reason', 'error'); return; }
    const reason = reportDetails.trim() || selectedReport;
    if (reason.length < 10) { addToast('Reason needs 10+ chars', 'error'); return; }
    if (!socketRef.current?.connected || !partnerIdRef.current || !currentRoomRef.current) { addToast('Cannot report now', 'error'); return; }
    socketRef.current.emit('report_user', { reportedUserId: partnerIdRef.current, reason, roomId: currentRoomRef.current });
    addToast('Report submitted', 'success');
    setShowReport(false); setSelectedReport(null); setReportDetails('');
    doEndCallRef.current();
  };

  const sendGift = async (type, costInCoins) => {
    if (!partnerIdRef.current) { addToast('No partner', 'error'); setShowGifts(false); return; }
    try {
      const r = await safeFetch(CONFIG.BACKEND + '/api/create-gift-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenRef.current },
        body: JSON.stringify({ giftType: type, recipientId: partnerIdRef.current }),
      });
      const d = await r.json();

      if (d.success) {
        setUserCoins(prev => Math.max(0, prev - costInCoins));
        triggerGiftAnimation(type);
        setShowGifts(false);
        addToast('Gift sent!', 'success');
      } else {
        if (d.code === 'INSUFFICIENT_FUNDS') {
          addToast('Not enough coins', 'error');
          setShowGifts(false);
          setShowPayment(true);
        } else {
          throw new Error(d.error || 'Failed to send gift');
        }
      }
    } catch (e) {
      addToast(e.message || 'Failed', 'error');
      setShowGifts(false);
    }
  };

  const initiateUnbanPayment = async () => {
    if (!user?.id) { addToast('User not identified', 'error'); return; }
    try {
      const r = await safeFetch(CONFIG.BACKEND + '/api/pay-unban', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: String(user.id) }) });
      const d = await r.json();
      if (d.url) window.location.href = d.url;
      else throw new Error(d.error || 'Failed');
    } catch (e) { addToast(e.message || 'Payment failed', 'error'); }
  };

  const submitAppeal = async () => {
    if (appealText.trim().length < 10) { addToast('Minimum 10 characters', 'error'); return; }
    try {
      const r = await safeFetch(CONFIG.BACKEND + '/api/moderation/appeal', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenRef.current }, body: JSON.stringify({ message: appealText.trim() }) });
      if (r.ok) { addToast('Appeal submitted', 'success'); setShowAppeal(false); setAppealText(''); }
      else { const d = await r.json().catch(() => ({ error: 'Failed' })); addToast(d.error || 'Failed', 'error'); }
    } catch { addToast('Failed', 'error'); }
  };

  const verifyAge = async () => {
    const day = parseInt(ageDay), month = parseInt(ageMonth), year = parseInt(ageYear);
    if (!day || !month || !year || year < 1920 || year > 2010 || day < 1 || day > 31 || month < 1 || month > 12) { addToast('Please enter a valid date of birth', 'error'); return; }
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const mDiff = today.getMonth() - birthDate.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    if (age < 18) { addToast('You must be 18 or older. You are ' + age + '.', 'error'); setShowAgeVerify(false); return; }
    try {
      const r = await safeFetch(CONFIG.BACKEND + '/api/user/verify-age', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenRef.current }, body: JSON.stringify({ age }) });
      if (r.ok) { setUser(prev => prev ? { ...prev, age_verified: true } : prev); addToast('Age verified!', 'success'); setShowAgeVerify(false); }
      else { const d = await r.json().catch(() => ({ error: 'Failed' })); addToast(d.error || 'Verification failed', 'error'); }
    } catch { addToast('Error', 'error'); }
  };

  const saveProfileName = async () => {
    const name = editName.trim();
    if (!name) { addToast('Name cannot be empty', 'error'); return; }
    try {
      const r = await safeFetch(CONFIG.BACKEND + '/user/display-name', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenRef.current }, body: JSON.stringify({ display_name: name }) });
      if (r.ok) { setUser(prev => prev ? { ...prev, username: name, display_name: name } : prev); addToast('Name updated!', 'success'); setShowEditName(false); }
      else { const d = await r.json().catch(() => ({ error: 'Failed' })); addToast(d.error || 'Failed', 'error'); }
    } catch { addToast('Error saving', 'error'); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { addToast('Image must be under 5MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const r = await safeFetch(CONFIG.BACKEND + '/api/user/avatar', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenRef.current }, body: JSON.stringify({ avatarBase64: ev.target.result }) });
        const d = await r.json();
        if (r.ok) { setUser(prev => prev ? { ...prev, avatar: d.avatar } : prev); addToast('Avatar updated!', 'success'); }
        else addToast(d.error || 'Failed to upload avatar', 'error');
      } catch { addToast('Failed to upload avatar', 'error'); }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const purchaseCoins = async () => {
    if (!selectedCoinPackage) { addToast('Select a package', 'error'); return; }
    if (!stripeRef.current && window.Stripe) stripeRef.current = window.Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY);
    if (!stripeRef.current) { addToast('Stripe not loaded', 'error'); return; }
    try {
      const r = await safeFetch(CONFIG.BACKEND + '/api/create-checkout-session', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenRef.current }, body: JSON.stringify(selectedCoinPackage) });
      const d = await r.json();
      if (d.sessionId) { const err = await stripeRef.current.redirectToCheckout({ sessionId: d.sessionId }); if (err.error) addToast(err.error.message, 'error'); }
      else addToast('Failed', 'error');
    } catch { addToast('Payment error', 'error'); }
  };

  /* ===================== LOGOUT (full session cleanup) ===================== */
  const logout = useCallback(() => {
    doEndCallRef.current();
    stopMatching();

    // Clear all persistent session data
    localStorage.removeItem('token');
    localStorage.removeItem('tokenTimestamp');
    localStorage.removeItem('cachedUser');
    sessionStorage.removeItem('lastActive');

    tokenRef.current = null;
    setTokenState(null);
    setUser(null);
    setUserCoins(0);
    setStats({ matches: 0, likes: 0, level: 1 });
    setSessionExpired(false);

    if (sessionRefreshRef.current) clearInterval(sessionRefreshRef.current);

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    window.location.href = '/';
  }, [doEndCall]);

  const handleLike = () => {
    setStats(prev => ({ ...prev, likes: prev.likes + 1 }));
    addToast('Liked!', 'success');
    if (socketRef.current && currentRoomRef.current) socketRef.current.emit('reaction', { type: 'like', room: currentRoomRef.current });
  };

  const handleNext = () => { doEndCallRef.current(); setTimeout(startMatching, 500); };

  const providerInfo = user ? getProviderInfo(user.provider) : getProviderInfo(null);

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

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') { setShowReport(false); setShowGifts(false); setShowEditName(false); setShowAgeVerify(false); setShowAppeal(false); setShowPayment(false); setShowEffects(false); setShowMatchModal(false); } };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const wrapper = localVideoWrapperRef.current;
    if (!wrapper) return;
    let dragging = false, sx, sy;
    const start = (cx, cy) => { if (currentLayout === 'split') return; dragging = true; sx = cx - wrapper.offsetLeft; sy = cy - wrapper.offsetTop; wrapper.style.transition = 'none'; };
    const move = (cx, cy) => { if (!dragging || currentLayout !== 'float') return; const x = Math.max(0, Math.min(cx - sx, window.innerWidth - wrapper.offsetWidth)); const y = Math.max(0, Math.min(cy - sy, window.innerHeight - wrapper.offsetHeight)); wrapper.style.left = x + 'px'; wrapper.style.top = y + 'px'; wrapper.style.right = 'auto'; wrapper.style.bottom = 'auto'; };
    const end = () => { dragging = false; wrapper.style.transition = ''; };
    wrapper.addEventListener('mousedown', (e) => start(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => move(e.clientX, e.clientY));
    window.addEventListener('mouseup', end);
    wrapper.addEventListener('touchstart', (e) => { const t = e.touches[0]; start(t.clientX, t.clientY); }, { passive: true });
    window.addEventListener('touchmove', (e) => { if (!dragging) return; const t = e.touches[0]; move(t.clientX, t.clientY); }, { passive: true });
    window.addEventListener('touchend', end);
    return () => { window.removeEventListener('mousemove', (e) => move(e.clientX, e.clientY)); window.removeEventListener('mouseup', end); window.removeEventListener('touchmove', (e) => { if (!dragging) return; const t = e.touches[0]; move(t.clientX, t.clientY); }); window.removeEventListener('touchend', end); };
  }, [currentLayout]);

  /* ===================== RENDER ===================== */
  if (loading) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <div style={{ width: 50, height: 50, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#0a0a1a' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />

      {/* ===== SESSION EXPIRED OVERLAY ===== */}
      {sessionExpired && !token && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 48 }}>🔒</div>
          <h2 style={{ color: 'white', margin: 0, fontSize: 24 }}>Session Expired</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, textAlign: 'center', maxWidth: 300, lineHeight: 1.5 }}>Your session has expired. Please log in again to continue.</p>
          <button onClick={() => window.location.href = '/'} style={{ padding: '12px 32px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
            Log In Again
          </button>
        </div>
      )}

      {/* ===== BAN OVERLAY ===== */}
      {banData && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32, maxWidth: 400, width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
            <h2 style={{ color: '#ef4444', margin: '0 0 8px' }}>Account Banned</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 8px', fontSize: 14 }}>{banData.reason || 'Violation of community guidelines'}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 20px', fontSize: 12 }}>Until: {formatDate(banData.until)}</p>
            {!showAppeal ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={() => setShowAppeal(true)} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, cursor: 'pointer', fontSize: 14 }}>Submit Appeal</button>
                <button onClick={initiateUnbanPayment} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Pay to Unban</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <textarea value={appealText} onChange={(e) => setAppealText(e.target.value)} placeholder="Explain why you should be unbanned..." style={{ padding: 12, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: 'white', fontSize: 14, minHeight: 80, resize: 'none', outline: 'none' }} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={submitAppeal} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14 }}>Submit</button>
                  <button onClick={() => { setShowAppeal(false); setAppealText(''); }} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== UNBAN SUCCESS ===== */}
      {showUnbanSuccess && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: '#10b981', margin: '0 0 8px' }}>Unbanned!</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 20px' }}>Your account has been successfully unbanned.</p>
            <button onClick={() => { setShowUnbanSuccess(false); setBanData(null); window.location.reload(); }} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Continue</button>
          </div>
        </div>
      )}

      {/* ===== PERMISSION REQUEST ===== */}
      {showPermission && !banData && !sessionExpired && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 40, maxWidth: 420, width: '90%', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 36 }}>📹</div>
            <h2 style={{ color: 'white', margin: '0 0 8px', fontSize: 22 }}>Camera & Microphone</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 24px', fontSize: 14, lineHeight: 1.5 }}>We need access to your camera and microphone to connect you with others.</p>
            <button onClick={requestPermissions} disabled={permBtnLoading} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 600, cursor: permBtnLoading ? 'not-allowed' : 'pointer', opacity: permBtnLoading ? 0.7 : 1 }}>
              {permBtnLoading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
                  Requesting...
                </span>
              ) : 'Allow Access'}
            </button>
          </div>
        </div>
      )}

      {/* ===== BLUR MATCHING OVERLAY ===== */}
      {showBlurOverlay && !showMatchModal && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
          <div style={{ width: 60, height: 60, border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>Finding your match...</p>
          <button onClick={stopMatching} style={{ padding: '8px 20px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
        </div>
      )}

      {/* ===== MATCH FOUND MODAL ===== */}
      {showMatchModal && pendingMatch && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 45, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 24, padding: 40, maxWidth: 380, width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12, animation: 'pulse 1s ease-in-out infinite' }}>💕</div>
            <h2 style={{ color: 'white', margin: '0 0 8px', fontSize: 24 }}>Match Found!</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 24px', fontSize: 14 }}>
              {pendingMatch.peerInfo?.username || pendingMatch.peerInfo?.nickname || 'Someone'} wants to chat
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={declineMatch} style={{ flex: 1, padding: '12px', background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>Skip</button>
              <button onClick={acceptMatch} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>Accept</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== REMOTE VIDEO ===== */}
      <video ref={remoteVideoRef} autoPlay playsInline muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1, backgroundColor: '#1a1a2e' }} />

      {/* ===== NO CALL CENTER PROMPT ===== */}
      {!isInCall && !showBlurOverlay && !showMatchModal && !banData && !sessionExpired && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, pointerEvents: 'none' }}>
          <div style={{ fontSize: 64, opacity: 0.3 }}>🌐</div>
          <h2 style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: 20, fontWeight: 400 }}>Ready to meet someone new?</h2>
          <p style={{ color: 'rgba(255,255,255,0.3)', margin: 0, fontSize: 14 }}>Tap Start below to begin</p>
        </div>
      )}

      {/* ===== LOCAL VIDEO (FLOAT) ===== */}
      {currentLayout === 'float' && (
        <div ref={localVideoWrapperRef} style={{ position: 'absolute', right: 30, bottom: 100, width: 160, height: 220, borderRadius: 16, overflow: 'hidden', zIndex: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', border: '2px solid rgba(255,255,255,0.15)', cursor: 'grab' }}>
          <div ref={localVideoDivRef} style={{ width: '100%', height: '100%', background: '#1a1a2e' }} />
        </div>
      )}

      {/* ===== LOCAL VIDEO (SPLIT) ===== */}
      {currentLayout === 'split' && (
        <div style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', zIndex: 10, borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
          <div ref={localVideoDivRef} style={{ width: '100%', height: '100%', background: '#1a1a2e' }} />
        </div>
      )}

      {/* ===== TOP BAR ===== */}
      {!banData && !sessionExpired && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user?.avatar ? (
              <img src={user.avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(99,102,241,0.5)' }} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 600 }}>
                {(user?.username || user?.nickname || 'U')[0].toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>{user?.username || user?.nickname || 'Guest'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Lvl {stats.level}</span>
                <span style={{ color: '#f59e0b', fontSize: 11 }}>🪙 {userCoins}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowSettings(true)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', fontSize: 14, backdropFilter: 'blur(10px)' }}>⚙️</button>
            <button onClick={() => setShowProfile(true)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', fontSize: 14, backdropFilter: 'blur(10px)' }}>👤</button>
            <button onClick={logout} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(239,68,68,0.2)', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14, backdropFilter: 'blur(10px)' }}>🚪</button>
          </div>
        </div>
      )}

      {/* ===== PARTNER INFO (during call) ===== */}
      {isInCall && partnerInfo && (
        <div style={{ position: 'absolute', top: 70, left: 20, zIndex: 20, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', padding: '8px 14px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
          {partnerInfo.avatar ? (
            <img src={partnerInfo.avatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11 }}>?</div>
          )}
          <span style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>{partnerInfo.username || partnerInfo.nickname || ' Stranger'}</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>⏱ {matchTime}</span>
        </div>
      )}

      {/* ===== NETWORK QUALITY ===== */}
      {isInCall && (
        <div style={{ position: 'absolute', top: 70, right: 20, zIndex: 20, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 12, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: networkQuality === 'excellent' ? '#10b981' : networkQuality === 'good' ? '#f59e0b' : '#ef4444' }} />
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, textTransform: 'capitalize' }}>{networkQuality}</span>
        </div>
      )}

      {/* ===== BOTTOM CONTROLS ===== */}
      {!banData && !sessionExpired && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20, padding: '20px', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
          {!isInCall ? (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={startMatching} disabled={!token} style={{ padding: '14px 48px', background: !token ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: 16, fontSize: 18, fontWeight: 700, cursor: !token ? 'not-allowed' : 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.4)', letterSpacing: 0.5 }}>
                {!token ? 'Log in to Start' : 'Start'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={handleNext} title="Next" style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', fontSize: 18, backdropFilter: 'blur(10px)' }}>⏭</button>
              <button onClick={handleLike} title="Like" style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.2)', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18, backdropFilter: 'blur(10px)' }}>❤️</button>
              <button onClick={() => setShowGifts(true)} title="Send Gift" style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(245,158,11,0.2)', border: 'none', color: '#f59e0b', cursor: 'pointer', fontSize: 18, backdropFilter: 'blur(10px)' }}>🎁</button>
              <button onClick={() => setShowChat(!showChat)} title="Chat" style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: 18, backdropFilter: 'blur(10px)' }}>💬</button>
              <button onClick={switchCamera} title="Switch Camera" style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', fontSize: 18, backdropFilter: 'blur(10px)' }}>🔄</button>
              <button onClick={() => setShowEffects(true)} title="Effects" style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', fontSize: 18, backdropFilter: 'blur(10px)' }}>✨</button>
              <button onClick={toggleLayout} title="Layout" style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', fontSize: 18, backdropFilter: 'blur(10px)' }}>📐</button>
              <button onClick={toggleScreenShare} title="Screen Share" style={{ width: 48, height: 48, borderRadius: '50%', background: isScreenSharingRef.current ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)', border: 'none', color: isScreenSharingRef.current ? '#10b981' : 'white', cursor: 'pointer', fontSize: 18, backdropFilter: 'blur(10px)' }}>🖥</button>
              <button onClick={togglePiP} title="Picture in Picture" style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', fontSize: 18, backdropFilter: 'blur(10px)' }}>📌</button>
              <button onClick={() => setShowReport(true)} title="Report" style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18, backdropFilter: 'blur(10px)' }}>🚩</button>
              <button onClick={doEndCallRef.current} title="End Call" style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', color: 'white', cursor: 'pointer', fontSize: 22, boxShadow: '0 4px 15px rgba(239,68,68,0.4)' }}>✕</button>
            </div>
          )}
        </div>
      )}

      {/* ===== CHAT PANEL ===== */}
      {showChat && isInCall && (
        <div style={{ position: 'absolute', left: 20, bottom: 100, width: 300, maxHeight: 400, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', zIndex: 30, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>Chat</span>
            <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {chatMessages.map((m) => (
              <div key={m.id} style={{ alignSelf: m.isOwn ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                {!m.isOwn && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginBottom: 2 }}>{m.name}</div>}
                <div style={{ padding: '8px 12px', borderRadius: 12, background: m.isOwn ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.1)', color: 'white', fontSize: 13, lineHeight: 1.4, wordBreak: 'break-word' }}>{escapeHtml(m.msg)}</div>
              </div>
            ))}
            {showTyping && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontStyle: 'italic' }}>typing...</div>}
          </div>
          <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 8 }}>
            <input value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Type a message..." style={{ flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: 'white', fontSize: 13, outline: 'none' }} />
            <button onClick={sendMessage} style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13 }}>➤</button>
          </div>
        </div>
      )}

      {/* ===== SETTINGS MODAL ===== */}
      {showSettings && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(30,30,50,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, maxWidth: 440, width: '90%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: 'white', margin: 0, fontSize: 18 }}>Settings</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>I am</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['male', 'female', 'other'].map(g => (
                  <button key={g} onClick={() => setGenderSelect(g)} style={{ flex: 1, padding: '10px', background: genderSelect === g ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.08)', color: 'white', border: genderSelect === g ? 'none' : '1px solid rgba(255,255,255,0.12)', borderRadius: 10, cursor: 'pointer', fontSize: 13, textTransform: 'capitalize' }}>{g}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Looking for</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['any', 'male', 'female'].map(g => (
                  <button key={g} onClick={() => setLookingFor(g)} style={{ flex: 1, padding: '10px', background: lookingFor === g ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.08)', color: 'white', border: lookingFor === g ? 'none' : '1px solid rgba(255,255,255,0.12)', borderRadius: 10, cursor: 'pointer', fontSize: 13, textTransform: 'capitalize' }}>{g}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Location</label>
              <CountryScroll value={locationSelect} onChange={setLocationSelect} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Interests (comma separated, max 5)</label>
              <input value={interestsInput} onChange={(e) => setInterestsInput(e.target.value)} placeholder="music, gaming, travel..." style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: 'white', fontSize: 13, outline: 'none' }} />
            </div>

            <button onClick={saveSettings} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>Save Settings</button>
          </div>
        </div>
      )}

      {/* ===== PROFILE MODAL ===== */}
      {showProfile && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(30,30,50,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, maxWidth: 400, width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: 'white', margin: 0, fontSize: 18 }}>Profile</h3>
              <button onClick={() => setShowProfile(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {user?.avatar ? (
                  <img src={user.avatar} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(99,102,241,0.5)' }} />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 28, fontWeight: 600 }}>
                    {(user?.username || user?.nickname || 'U')[0].toUpperCase()}
                  </div>
                )}
                <label style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12, border: '2px solid #1e1e32' }}>
                  📷
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                </label>
              </div>
              {!showEditName ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 }}>
                  <span style={{ color: 'white', fontSize: 16, fontWeight: 600 }}>{user?.username || user?.nickname || 'Guest'}</span>
                  <button onClick={() => { setEditName(user?.username || user?.nickname || ''); setShowEditName(true); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 12 }}>✏️</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'center' }}>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveProfileName()} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: 'white', fontSize: 14, outline: 'none', width: 150 }} autoFocus />
                  <button onClick={saveProfileName} style={{ padding: '6px 12px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>✓</button>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 8 }}>
                <span className={`provider-badge ${providerInfo.cls}`} style={{ padding: '3px 10px', borderRadius: 8, fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <i className={providerInfo.icon} /> {providerInfo.label}
                </span>
                {user?.email && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{maskEmail(user.email)}</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                <div style={{ color: '#6366f1', fontSize: 20, fontWeight: 700 }}>{stats.matches}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Matches</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                <div style={{ color: '#ef4444', fontSize: 20, fontWeight: 700 }}>{stats.likes}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Likes</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                <div style={{ color: '#f59e0b', fontSize: 20, fontWeight: 700 }}>{stats.level}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Level</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Coins</span>
                <span style={{ color: '#f59e0b', fontSize: 13, fontWeight: 600 }}>🪙 {userCoins}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Joined</span>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{formatDate(user?.created_at)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Age Verified</span>
                <span style={{ color: user?.age_verified ? '#10b981' : 'rgba(255,255,255,0.4)', fontSize: 13 }}>{user?.age_verified ? '✅ Yes' : '❌ No'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {!user?.age_verified && (
                <button onClick={() => { setShowAgeVerify(true); setShowProfile(false); }} style={{ flex: 1, padding: '10px', background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, cursor: 'pointer', fontSize: 13 }}>Verify Age</button>
              )}
              <button onClick={() => { setShowPayment(true); setShowProfile(false); }} style={{ flex: 1, padding: '10px', background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, cursor: 'pointer', fontSize: 13 }}>Buy Coins</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== GIFT MODAL ===== */}
      {showGifts && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(30,30,50,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, maxWidth: 380, width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: 'white', margin: 0, fontSize: 18 }}>Send a Gift 🎁</h3>
              <button onClick={() => setShowGifts(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { type: 'rose', emoji: '🌹', name: 'Rose', cost: 10 },
                { type: 'heart', emoji: '❤️', name: 'Heart', cost: 25 },
                { type: 'star', emoji: '⭐', name: 'Star', cost: 50 },
                { type: 'diamond', emoji: '💎', name: 'Diamond', cost: 100 },
                { type: 'crown', emoji: '👑', name: 'Crown', cost: 250 },
                { type: 'rocket', emoji: '🚀', name: 'Rocket', cost: 500 },
              ].map(g => (
                <button key={g.type} onClick={() => sendGift(g.type, g.cost)} style={{ padding: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
                  <span style={{ fontSize: 28 }}>{g.emoji}</span>
                  <span style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>{g.name}</span>
                  <span style={{ color: '#f59e0b', fontSize: 11 }}>🪙 {g.cost}</span>
                </button>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 16, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Your balance: 🪙 {userCoins}</div>
          </div>
        </div>
      )}

      {/* ===== PAYMENT / BUY COINS MODAL ===== */}
      {showPayment && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(30,30,50,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, maxWidth: 400, width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: 'white', margin: 0, fontSize: 18 }}>Buy Coins 🪙</h3>
              <button onClick={() => setShowPayment(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { coins: 100, price: '$0.99', id: 'coins_100' },
                { coins: 500, price: '$3.99', id: 'coins_500', popular: true },
                { coins: 1000, price: '$6.99', id: 'coins_1000' },
                { coins: 5000, price: '$29.99', id: 'coins_5000', best: true },
              ].map(p => (
                <button key={p.id} onClick={() => setSelectedCoinPackage({ priceId: p.id, quantity: p.coins })} style={{ padding: 14, background: selectedCoinPackage?.priceId === p.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)', border: selectedCoinPackage?.priceId === p.id ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: 12, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>🪙</span>
                    <span style={{ color: 'white', fontSize: 15, fontWeight: 600 }}>{p.coins} Coins</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {p.popular && <span style={{ padding: '2px 8px', background: 'rgba(99,102,241,0.3)', borderRadius: 6, color: '#a5b4fc', fontSize: 10, fontWeight: 600 }}>POPULAR</span>}
                    {p.best && <span style={{ padding: '2px 8px', background: 'rgba(245,158,11,0.3)', borderRadius: 6, color: '#fcd34d', fontSize: 10, fontWeight: 600 }}>BEST VALUE</span>}
                    <span style={{ color: '#f59e0b', fontSize: 15, fontWeight: 700 }}>{p.price}</span>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={purchaseCoins} disabled={!selectedCoinPackage} style={{ width: '100%', padding: '12px', marginTop: 16, background: selectedCoinPackage ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: 12, cursor: selectedCoinPackage ? 'pointer' : 'not-allowed', fontSize: 15, fontWeight: 600, opacity: selectedCoinPackage ? 1 : 0.5 }}>Purchase</button>
          </div>
        </div>
      )}

      {/* ===== REPORT MODAL ===== */}
      {showReport && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(30,30,50,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, maxWidth: 400, width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: '#ef4444', margin: 0, fontSize: 18 }}>Report User 🚩</h3>
              <button onClick={() => setShowReport(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {['Inappropriate content', 'Harassment', 'Spam', 'Underage user', 'Other'].map(r => (
                <button key={r} onClick={() => setSelectedReport(r)} style={{ padding: '10px 14px', background: selectedReport === r ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)', border: selectedReport === r ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'white', cursor: 'pointer', fontSize: 13, textAlign: 'left' }}>{r}</button>
              ))}
            </div>
            <textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} placeholder="Additional details (optional)..." style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: 'white', fontSize: 13, minHeight: 60, resize: 'none', outline: 'none', marginBottom: 12 }} />
            <button onClick={submitReport} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>Submit Report</button>
          </div>
        </div>
      )}

      {/* ===== EFFECTS MODAL ===== */}
      {showEffects && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(30,30,50,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, maxWidth: 340, width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: 'white', margin: 0, fontSize: 18 }}>Effects ✨</h3>
              <button onClick={() => setShowEffects(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { id: 'none', label: 'None', preview: '🎬' },
                { id: 'blur', label: 'Blur', preview: '🌫️' },
                { id: 'grayscale', label: 'B&W', preview: '⬛' },
                { id: 'sepia', label: 'Sepia', preview: '🟤' },
                { id: 'invert', label: 'Invert', preview: '🔄' },
                { id: 'contrast', label: 'Contrast', preview: '🔆' },
              ].map(e => (
                <button key={e.id} onClick={() => applyEffect(e.id)} style={{ padding: 16, background: activeEffect === e.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)', border: activeEffect === e.id ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 24 }}>{e.preview}</span>
                  <span style={{ color: 'white', fontSize: 12 }}>{e.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== AGE VERIFY MODAL ===== */}
      {showAgeVerify && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(30,30,50,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, maxWidth: 380, width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🎂</div>
            <h3 style={{ color: 'white', margin: '0 0 8px', fontSize: 18 }}>Age Verification</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 20px', fontSize: 13 }}>Please enter your date of birth. You must be 18 or older.</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input value={ageDay} onChange={(e) => setAgeDay(e.target.value)} placeholder="DD" maxLength={2} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: 'white', fontSize: 14, textAlign: 'center', outline: 'none' }} />
              <input value={ageMonth} onChange={(e) => setAgeMonth(e.target.value)} placeholder="MM" maxLength={2} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: 'white', fontSize: 14, textAlign: 'center', outline: 'none' }} />
              <input value={ageYear} onChange={(e) => setAgeYear(e.target.value)} placeholder="YYYY" maxLength={4} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: 'white', fontSize: 14, textAlign: 'center', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowAgeVerify(false)} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
              <button onClick={verifyAge} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Verify</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== GIFT ANIMATION POPUP ===== */}
      {showGiftPopup && giftAnimation && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 200, fontSize: 80, animation: 'giftPop 0.5s ease-out', pointerEvents: 'none' }}>
          {giftAnimation}
          <style>{`@keyframes giftPop { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.3); } 100% { transform: scale(1); opacity: 1; } }`}</style>
        </div>
      )}

      {/* ===== TOAST CONTAINER ===== */}
      <div style={{ position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 500, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{ padding: '10px 20px', borderRadius: 12, background: t.type === 'error' ? 'rgba(239,68,68,0.9)' : t.type === 'success' ? 'rgba(16,185,129,0.9)' : 'rgba(99,102,241,0.9)', color: 'white', fontSize: 13, fontWeight: 500, backdropFilter: 'blur(10px)', transition: 'all 0.3s ease', opacity: t.visible ? 1 : 0, transform: t.visible ? 'translateY(0)' : 'translateY(-10px)', whiteSpace: 'nowrap', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
            {t.title && <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>{t.title}</div>}
            {t.msg}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        .provider-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 8px; font-size: 11px; }
        .provider-badge.google { background: rgba(234,67,53,0.15); color: #ea4335; }
        .provider-badge.discord { background: rgba(88,101,242,0.15); color: #5865f2; }
        .provider-badge.facebook { background: rgba(24,119,242,0.15); color: #1877f2; }
        .provider-badge.unknown { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); }
      `}</style>
    </div>
  );
}
