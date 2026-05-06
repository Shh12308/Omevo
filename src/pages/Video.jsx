import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import './Video.css';
import { BACKEND } from "../utils/api";

/* =====================CONFIGURATION ===================== */
const CONFIG = {
  AGORA_APP_ID: '0f9094ed4a8e4dea934059b0ea8b5182',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_your_stripe_key_here',
  DEBUG_MODE: false,
  MODERATION_INTERVAL: 2000,
  HEARTBEAT_INTERVAL: 5000,
  TRACK_RECOVERY_DELAY: 1000,
};

/* ===================== ERROR SUPPRESSION ===================== */
const suppressMediaErrors = () => {
  const originalError = console.error;
  const suppressedPatterns = ['Load failed', 'The play() request was interrupted', 'AbortError', 'NotAllowedError', 'insertSync'];
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

/* ===================== COMPONENT ===================== */
export default function Video() {
  /* ---------- token ---------- */
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

  const checkBanStatus = useCallback(async () => {
    const t = tokenRef.current;
    if (!t) return false;
    try {
      const r = await safeFetch(CONFIG.BACKEND + '/auth/me', { headers: { Authorization: 'Bearer ' + t } });
      const d = await r.json();
      if (d.authenticated && d.user) {
        setUser(d.user);
        setStats(prev => ({ ...prev, level: d.user.level || 1 }));
        if (d.user.banned_until && new Date(d.user.banned_until) > new Date()) { setBanData({ reason: d.user.ban_reason, until: d.user.banned_until, type: null }); return true; }
      }
    } catch {}
    return false;
  }, []);

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
    } catch (err) { addToast('Camera & microphone permission required', 'error'); }
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

  useEffect(() => {
    (async () => {
      if (!tokenRef.current) { setLoading(false); setShowPermission(true); return; }
      const isBanned = await checkBanStatus();
      if (isBanned) { setLoading(false); return; }
      setLoading(false);
      setShowPermission(true);
    })();
  }, [checkBanStatus]);

  const startMatching = async () => {
    if (isMatchingRef.current || isInCallRef.current) return;
    if (!permissionsRef.current) { addToast('Grant camera permissions first', 'error'); setShowPermission(true); return; }
    if (!tokenRef.current) { addToast('Please log in', 'error'); return; }
    if (!socketRef.current || !socketRef.current.connected) return;
    const checkTrack = (track) => { if (!track || !track.getMediaStreamTrack) return true; return track.getMediaStreamTrack().readyState === 'ended'; };
    if (checkTrack(localTracksRef.current.audioTrack) || checkTrack(localTracksRef.current.videoTrack)) { addToast('Recovering camera...', 'info'); await recoverTracks(); return; }
    isMatchingRef.current = true;
    setShowBlurOverlay(true);
    try {
      const payload = { gender: preferencesRef.current.gender, looking_for: preferencesRef.current.looking_for, location: preferencesRef.current.location, interests: preferencesRef.current.interests, nickname: (user && (user.username || user.nickname)) || 'User' };
      const r = await safeFetch(CONFIG.BACKEND + '/queue/enqueue', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenRef.current }, body: JSON.stringify(payload) });
      if (!r.ok) { const e = await r.json().catch(() => ({ error: 'Enqueue failed' })); throw new Error(e.error || 'Enqueue failed'); }
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

  const sendGift = async (type, cost) => {
    if (!partnerIdRef.current) { addToast('No partner', 'error'); setShowGifts(false); return; }
    
    // Use Stripe direct checkout instead of coins
    try {
      const r = await safeFetch(CONFIG.BACKEND + '/api/create-gift-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenRef.current },
        body: JSON.stringify({ giftType: type, recipientId: partnerIdRef.current }),
      });
      const d = await r.json();
      if (d.url) {
        window.open(d.url, '_blank');
        triggerGiftAnimation(type);
        setShowGifts(false);
        addToast('Opening payment...', 'info');
      } else throw new Error(d.error || 'Failed');
    } catch (e) { addToast(e.message || 'Failed', 'error'); setShowGifts(false); }
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

  const logout = () => {
    doEndCallRef.current(); stopMatching();
    localStorage.removeItem('token'); tokenRef.current = null; setToken(null); setUser(null);
    if (socketRef.current) socketRef.current.disconnect();
    socketRef.current = null;
    window.location.href = '/';
  };

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
    const move = (cx, cy) => { if (!dragging || currentLayout !== 'float') return; const x = Math.max(0, Math.min(cx - sx, window.innerWidth - wrapper.offsetWidth)); const y = Math.max(0, Math.min(cy - sy, window.innerHeight - wrapper.offsetHeight)); wrapper.style.right = 'auto'; wrapper.style.bottom = 'auto'; wrapper.style.left = x + 'px'; wrapper.style.top = y + 'px'; };
    const end = () => { if (dragging) { dragging = false; wrapper.style.transition = ''; } };
    const md = (e) => { if (e.target.closest('button')) return; start(e.clientX, e.clientY); };
    const ts = (e) => { if (e.target.closest('button')) return; start(e.touches[0].clientX, e.touches[0].clientY); };
    const mm = (e) => move(e.clientX, e.clientY);
    const tm = (e) => { if (dragging) { e.preventDefault(); move(e.touches[0].clientX, e.touches[0].clientY); } };
    wrapper.addEventListener('mousedown', md); wrapper.addEventListener('touchstart', ts, { passive: true });
    document.addEventListener('mousemove', mm); document.addEventListener('touchmove', tm, { passive: false });
    document.addEventListener('mouseup', end); document.addEventListener('touchend', end);
    return () => { wrapper.removeEventListener('mousedown', md); wrapper.removeEventListener('touchstart', ts); document.removeEventListener('mousemove', mm); document.removeEventListener('touchmove', tm); document.removeEventListener('mouseup', end); document.removeEventListener('touchend', end); };
  }, [currentLayout]);

  /* ===================== SOCKET ===================== */
  useEffect(() => {
    if (!tokenRef.current) return;
    const socket = io(CONFIG.BACKEND);
    socketRef.current = socket;
    socket.on('connect', () => { if (tokenRef.current) socket.emit('auth', { token: tokenRef.current }); });
    socket.on('disconnect', () => {});
    socket.on('authenticated', () => {});
    socket.on('match_found', (d) => {
      if (isMatchingRef.current && !isInCallRef.current) {
        isMatchingRef.current = false;
        setPendingMatch({ peerId: d.peerId, channel: d.channel, peerInfo: d.peerInfo });
        setShowMatchModal(true);
      }
    });
    socket.on('peer_left', () => { addToastRef.current('Partner disconnected', 'info'); doEndCallRef.current(); });
    socket.on('banned', (d) => { doEndCallRef.current(); setBanData({ reason: d.reason, until: d.until, type: null }); });
    socket.on('moderation_action', (d) => { if (d.banned) { doEndCallRef.current(); setBanData({ reason: d.reason, until: null, type: d.type, text: d.text, offendingFrame: d.offendingFrame }); } });
    socket.on('gift_received', (d) => { triggerGiftAnimation(d.giftType); addToastRef.current('You received a gift!', 'success'); });
    socket.on('message', (d) => { const txt = d.text || d.message || ''; const own = d.uid && userIdRef.current && String(d.uid) === String(userIdRef.current); addMsgToChat(txt, own, own ? 'You' : (d.username || 'Stranger')); });
    socket.on('room_history', (d) => { if (d.messages) d.messages.forEach(m => { const own = m.uid && userIdRef.current && String(m.uid) === String(userIdRef.current); addMsgToChat(m.message || m.text, own, own ? 'You' : 'Stranger'); }); });
    socket.on('report_submitted', (d) => addToastRef.current(d.message || 'Report submitted', 'success'));
    socket.on('typing', (d) => { if (d.uid && userIdRef.current && String(d.uid) !== String(userIdRef.current)) { setShowTyping(true); setTimeout(() => setShowTyping(false), 3000); } });
    socket.on('error', (d) => { if (d.message) addToastRef.current(d.message, 'error'); });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [addMsgToChat, triggerGiftAnimation]);

  useEffect(() => {
    return () => {
      if (matchTimerRef.current) clearInterval(matchTimerRef.current);
      if (moderationRef.current) clearInterval(moderationRef.current);
      if (trackRecoveryTimeoutRef.current) clearTimeout(trackRecoveryTimeoutRef.current);
      if (socketRef.current) socketRef.current.disconnect();
      if (clientRef.current) try { clientRef.current.leave(); } catch {}
      Object.values(localTracksRef.current).forEach(t => { if (t) try { t.close(); } catch {} });
      if (remoteStreamRef.current) remoteStreamRef.current.getTracks().forEach(t => { try { t.stop(); } catch {} });
    };
  }, []);

  /* ===================== RENDER ===================== */
  return (
    <>
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type} ${t.visible ? 'show' : ''}`} role="alert" aria-live="assertive">
            <div className="toast-icon"><i className={`fas ${t.type === 'success' ? 'fa-check' : t.type === 'error' ? 'fa-times' : 'fa-info'}`} /></div>
            <div className="toast-content">{t.title && <div className="toast-title">{t.title}</div>}<div className="toast-message">{t.msg}</div></div>
          </div>
        ))}
      </div>

      {loading && (
        <div id="loadingScreen" role="status" aria-live="polite">
          <div className="loading-spinner" />
          <div className="loading-text">Loading Omevo...</div>
        </div>
      )}

      {/* BAN OVERLAY WITH OFFENDING CONTENT */}
      {banData && (
        <div className="ban-overlay active" role="alertdialog" aria-labelledby="banTitle" aria-describedby="banDesc">
          <div className="ban-bg-noise" />
          <div className="ban-scanline" />
          <div className="ban-container">
            <div className="ban-stamp" id="banTitle">BANNED</div>
            
            {/* Show offending frame if video ban */}
            {banData.type === 'video' && banData.offendingFrame && (
              <div className="ban-evidence-frame">
                <div className="ban-evidence-label">Flagged Content</div>
                <img src={banData.offendingFrame} alt="Flagged content" className="ban-evidence-img" />
              </div>
            )}
            
            {/* Show offending text if chat ban */}
            {banData.type === 'chat' && banData.text && (
              <div className="ban-evidence-frame">
                <div className="ban-evidence-label">Flagged Message</div>
                <div className="ban-evidence-text">"{banData.text}"</div>
              </div>
            )}
            
            <div className="ban-reason-frame">
              <div className="ban-reason-label">Reason for Suspension</div>
              <div className="ban-reason-icon"><i className="fas fa-exclamation-triangle" style={{ color: 'var(--danger)' }} /></div>
              <div className="ban-reason-text" id="banDesc">{banData.reason || 'Your account has been suspended due to a violation of our community guidelines.'}</div>
              {banData.until && (
                <div className="ban-duration">
                  <i className="fas fa-clock" />
                  <span>{(() => {
                    const diff = Math.ceil((new Date(banData.until) - new Date()) / (1000 * 60 * 60 * 24));
                    return diff > 0 ? `Suspension ends in ~${diff} day${diff > 1 ? 's' : ''} (${new Date(banData.until).toLocaleDateString()})` : 'Suspension ends: ' + new Date(banData.until).toLocaleString();
                  })()}</span>
                </div>
              )}
            </div>
            <div className="ban-price-card">
              <div className="ban-price-label">Removal Fee</div>
              <div className="ban-price-amount">$5.99</div>
              <div className="ban-price-sub">One-time payment · Instant removal</div>
            </div>
            <div className="crypto-icons" aria-label="Accepted Cryptocurrencies">
              <div className="crypto-icon btc" title="Bitcoin">BTC</div>
              <div className="crypto-icon eth" title="Ethereum">ETH</div>
              <div className="crypto-icon ltc" title="Litecoin">LTC</div>
              <div className="crypto-icon usdc" title="USDC">USDC</div>
              <div className="crypto-icon dai" title="DAI">DAI</div>
              <div className="crypto-icon more" title="More">+5</div>
            </div>
            <div className="crypto-label">Pay securely via Coinbase Commerce</div>
            <button className="ban-pay-btn" onClick={initiateUnbanPayment}>
              <i className="fas fa-shield-alt btn-icon" /> Pay $5.99 to Unban
            </button>
            <div className="ban-appeal">
              <button className="ban-appeal-btn" onClick={() => setShowAppeal(true)}><i className="fas fa-gavel" /> Submit an Appeal Instead</button>
            </div>
          </div>
        </div>
      )}

      {/* PRE-CONNECT MATCH MODAL (OmeTV Style) */}
      {showMatchModal && pendingMatch && (
        <div className="match-modal-overlay active">
          <div className="match-modal-container">
            <div className="match-modal-header">
              <div className="match-pulse-ring" />
              <i className="fas fa-user-check" style={{ fontSize: '2rem', color: 'var(--success)' }} />
            </div>
            <div className="match-modal-avatar">
              {pendingMatch.peerInfo?.avatar?.startsWith('http') || pendingMatch.peerInfo?.avatar?.startsWith('data:') ? (
                <img src={pendingMatch.peerInfo.avatar} alt="Partner" />
              ) : (
                <div className="avatar-fallback-large">
                  {(pendingMatch.peerInfo?.username || pendingMatch.peerInfo?.nickname || 'U').substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <h2 className="match-modal-name">
              {pendingMatch.peerInfo?.display_name || pendingMatch.peerInfo?.username || pendingMatch.peerInfo?.nickname || 'Stranger'}
            </h2>
            <div className="match-modal-info-grid">
              <div className="match-info-item">
                <i className="fas fa-map-marker-alt" />
                <span>{pendingMatch.peerInfo?.location || 'Unknown'}</span>
              </div>
              <div className="match-info-item">
                <i className="fas fa-venus-mars" />
                <span>{pendingMatch.peerInfo?.gender ? pendingMatch.peerInfo.gender.charAt(0).toUpperCase() + pendingMatch.peerInfo.gender.slice(1) : 'Unknown'}</span>
              </div>
              <div className="match-info-item">
                <i className="fas fa-star" />
                <span>Level {(() => { if (pendingMatch.peerInfo?.created_at) { const hours = Math.floor((Date.now() - new Date(pendingMatch.peerInfo.created_at).getTime()) / 3600000); return Math.max(1, hours); } return 1; })()}</span>
              </div>
            </div>
            {pendingMatch.peerInfo?.interests?.length > 0 && (
              <div className="match-modal-interests">
                {pendingMatch.peerInfo.interests.map((i, idx) => <span key={idx} className="interest-tag">{i}</span>)}
              </div>
            )}
            <div className="match-modal-actions">
              <button className="match-btn decline" onClick={declineMatch}>
                <i className="fas fa-times" /> Skip
              </button>
              <button className="match-btn accept" onClick={acceptMatch}>
                <i className="fas fa-video" /> Start Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GIFT ANIMATION POPUP */}
      {showGiftPopup && giftAnimation && (
        <div className="gift-popup-overlay">
          <div className="gift-popup-content">
            <div className="gift-emoji">{giftAnimation}</div>
            <div className="gift-sparkles">
              {[...Array(8)].map((_, i) => <div key={i} className="sparkle" style={{ '--delay': `${i * 0.1}s`, '--angle': `${i * 45}deg` }} />)}
            </div>
          </div>
        </div>
      )}

      {showAppeal && (
        <div className="modal-overlay active" role="dialog" aria-labelledby="appealTitle" onClick={() => setShowAppeal(false)}>
          <div className="appeal-content" onClick={e => e.stopPropagation()}>
            <h3 id="appealTitle">Submit Appeal</h3>
            <p>Explain why you believe this ban was issued in error. Appeals are reviewed within 48 hours.</p>
            <textarea className="appeal-textarea" value={appealText} onChange={e => setAppealText(e.target.value)} placeholder="Describe your situation... (min 10 characters)" maxLength={500} />
            <div style={{ textAlign: 'right', marginTop: 4 }}><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{appealText.length} / 500</span></div>
            <div className="appeal-actions">
              <button className="btn" style={{ background: 'var(--dark)', color: 'var(--text)' }} onClick={() => setShowAppeal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitAppeal}>Submit Appeal</button>
            </div>
          </div>
        </div>
      )}

      {showAgeVerify && (
        <div className="modal-overlay active" role="dialog" aria-labelledby="ageVerifyTitle" onClick={() => setShowAgeVerify(false)}>
          <div className="age-verify-content" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}><i className="fas fa-id-card" style={{ color: 'var(--success)' }} /></div>
            <h3 id="ageVerifyTitle">Age Verification</h3>
            <p>You must be at least 18 years old to use video chat features.</p>
            <div className="age-input-group">
              <input type="number" className="age-input" value={ageDay} onChange={e => setAgeDay(e.target.value)} placeholder="DD" min={1} max={31} aria-label="Day" />
              <input type="number" className="age-input" value={ageMonth} onChange={e => setAgeMonth(e.target.value)} placeholder="MM" min={1} max={12} aria-label="Month" />
              <input type="number" className="age-input" value={ageYear} onChange={e => setAgeYear(e.target.value)} placeholder="YYYY" min={1920} max={2010} aria-label="Year" />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn" style={{ background: 'var(--dark)', color: 'var(--text)' }} onClick={() => setShowAgeVerify(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={verifyAge}>Verify Age</button>
            </div>
          </div>
        </div>
      )}

      {showUnbanSuccess && (
        <div className="unban-success-overlay active" role="status">
          <div className="success-check"><i className="fas fa-check" /></div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 10 }}>Account Restored</h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: 30, fontSize: '1.1rem' }}>Your suspension has been lifted. Welcome back!</p>
          <button className="btn btn-primary" onClick={() => { setShowUnbanSuccess(false); setBanData(null); initializeAfterAuth(); }} style={{ padding: '14px 40px', fontSize: '1.1rem' }}>Continue to Omevo</button>
        </div>
      )}

      {showPermission && !banData && (
        <div className="permission-overlay" role="dialog" aria-labelledby="permTitle">
          <div className="permission-card">
            <div className="permission-icon"><i className="fas fa-video" /></div>
            <h2 className="permission-title" id="permTitle">Camera &amp; Microphone Required</h2>
            <p className="permission-description">Omevo needs access to your camera and microphone to connect you with others through video chat.</p>
            <div className="permission-features">
              <div className="permission-feature"><i className="fas fa-check-circle" /><div className="permission-feature-text">HD Video Quality</div></div>
              <div className="permission-feature"><i className="fas fa-check-circle" /><div className="permission-feature-text">Clear Audio</div></div>
              <div className="permission-feature"><i className="fas fa-check-circle" /><div className="permission-feature-text">Privacy Protected</div></div>
              <div className="permission-feature"><i className="fas fa-check-circle" /><div className="permission-feature-text">Safe &amp; Secure</div></div>
            </div>
            <div className="permission-buttons">
              <button className="permission-btn secondary" onClick={() => addToast('Camera and microphone access is required.', 'info')}>Maybe Later</button>
              <button className="permission-btn primary" onClick={requestPermissions} disabled={permBtnLoading}>
                {permBtnLoading ? <><i className="fas fa-spinner fa-spin" /> Requesting...</> : 'Allow Access'}
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} aria-hidden="true" />

      <div id="app">
        <div className={`video-container ${currentLayout === 'split' ? 'split-mode' : ''}`}>
          <div id="remoteVideoWrapper">
            <video ref={remoteVideoRef} autoPlay playsInline />
          </div>

          {showBlurOverlay && (
            <div className="blur-overlay active">
              <div className="matching-content" style={{ textAlign: 'center' }}>
                <div className="pulse-animation"><i className="fas fa-search" style={{ fontSize: '3rem', color: 'white' }} /></div>
                <div className="matching-text">Finding someone to chat with...</div>
                <div className="matching-subtext">This usually takes less than 10 seconds</div>
                <div className="spinner" />
                <button className="cancel-btn" onClick={stopMatching}>Cancel Search</button>
              </div>
            </div>
          )}

          <div ref={localVideoWrapperRef} id="localVideoWrapper" style={{ opacity: isRecoveringTracks ? 0.5 : 1 }}>
            <div ref={localVideoDivRef} id="localVideo" style={{ width: '100%', height: '100%' }} />
            {isRecoveringTracks && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', textAlign: 'center' }}>
                <i className="fas fa-sync fa-spin" style={{ fontSize: '1.5rem', marginBottom: 8 }} />
                <div style={{ fontSize: '0.8rem' }}>Recovering...</div>
              </div>
            )}
            <button id="pipBtn" title="Picture in Picture" aria-label="Toggle Picture in Picture" onClick={togglePiP}><i className="fas fa-external-link-alt" /></button>
            <button id="resetPositionBtn" title="Reset Position" aria-label="Reset Video Position" onClick={resetVideoPosition}><i className="fas fa-compress" /></button>
          </div>

          {partnerInfo && isInCall && (
            <div className="partner-info">
              <div className="name">
                <span>{partnerInfo.display_name || partnerInfo.username || partnerInfo.nickname || 'Stranger'}</span>
                <span className="badge"><i className="fas fa-check-circle" /> Verified</span>
              </div>
              <div className="details">
                <div><i className="fas fa-map-marker-alt" /> <span>{partnerInfo.location || 'Unknown'}</span></div>
                <div><i className="fas fa-venus-mars" /> <span>{partnerInfo.gender || 'Unknown'}</span></div>
                <div><i className="fas fa-star" /> <span>Level {(() => { if (partnerInfo.created_at) { const hours = Math.floor((Date.now() - new Date(partnerInfo.created_at).getTime()) / 3600000); return Math.max(1, hours); } return 1; })()}</span></div>
              </div>
              {partnerInfo.interests?.length > 0 && (
                <div className="interests">{partnerInfo.interests.map((i, idx) => <span key={idx} className="interest-tag">{i}</span>)}</div>
              )}
            </div>
          )}

          <div className="stats-bar">
            <div className="stat-item"><div className="stat-value">{stats.matches}</div><div className="stat-label">Matches</div></div>
            <div className="stat-item"><div className="stat-value">{matchTime}</div><div className="stat-label">Time</div></div>
            <div className="stat-item"><div className="stat-value">{stats.level}</div><div className="stat-label">Level</div></div>
            <div className="stat-item" style={{ position: 'relative' }}>
              <div className="stat-label">Signal</div>
              <div className={`network-quality ${networkQuality}`} title="Network Quality">
                <div className="network-bar" /><div className="network-bar" /><div className="network-bar" />
              </div>
            </div>
          </div>

          <div className="controls" role="toolbar" aria-label="Video Call Controls">
            {!isInCall && !partnerInfo ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="control-btn primary" title="Start Chatting" aria-label="Start Chatting" onClick={startMatching} disabled={isRecoveringTracks}>
                  <i className={`fas ${isRecoveringTracks ? 'fa-spinner fa-spin' : 'fa-play'}`} />
                </button>
                <button className="control-btn" title="Send Gift" aria-label="Send Gift" onClick={() => setShowGifts(true)}><i className="fas fa-gift" /></button>
                <button className="control-btn" title="Video Effects" aria-label="Video Effects" onClick={() => setShowEffects(v => !v)}><i className="fas fa-magic" /></button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button className="control-btn" title="Next (Skip)" aria-label="Next Partner" onClick={handleNext}><i className="fas fa-forward" /></button>
                <button className="control-btn" title="Chat" aria-label="Open Chat" onClick={() => setShowChat(v => !v)}><i className="fas fa-comment" /></button>
                <button className="control-btn" title="Send Gift" aria-label="Send Gift" onClick={() => setShowGifts(true)}><i className="fas fa-gift" /></button>
                <button className={`control-btn ${isScreenSharingRef.current ? 'active' : ''}`} title={isScreenSharingRef.current ? 'Stop Sharing' : 'Share Screen'} aria-label="Share Screen" onClick={toggleScreenShare}><i className="fas fa-desktop" /></button>
                <button className="control-btn" title="Switch Camera" aria-label="Switch Camera" onClick={switchCamera}><i className="fas fa-sync-alt" /></button>
                <button className="control-btn" title="Report" aria-label="Report User" onClick={() => setShowReport(true)}><i className="fas fa-flag" /></button>
                <button className="control-btn" title="Like" aria-label="Like User" onClick={handleLike}><i className="fas fa-heart" /></button>
                <button className="control-btn" title="Change Layout" aria-label="Change Layout" onClick={toggleLayout}><i className="fas fa-columns" /></button>
                <button className="control-btn danger" title="Stop" aria-label="Stop Call" onClick={doEndCall}><i className="fas fa-stop" /></button>
              </div>
            )}
          </div>

          {showEffects && (
            <div className="effects-panel active" role="menu">
              {[['none', 'fa-ban', 'No Effect'], ['blur', 'fa-eye-slash', 'Blur'], ['grayscale', 'fa-adjust', 'B&W'], ['sepia', 'fa-image', 'Sepia'], ['invert', 'fa-exchange-alt', 'Invert'], ['contrast', 'fa-sun', 'High Contrast']].map(([eff, icon, title]) => (
                <button key={eff} className={`effect-btn ${activeEffect === eff ? 'active' : ''}`} onClick={() => applyEffect(eff)} title={title}><i className={`fas ${icon}`} /></button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SETTINGS PANEL */}
      <div className={`side-panel left ${showSettings ? 'open' : ''}`} role="dialog" aria-label="Settings">
        <div className="panel-header">
          <h2>Settings</h2>
          <button className="control-btn" onClick={() => setShowSettings(false)} aria-label="Close Settings"><i className="fas fa-times" /></button>
        </div>
        <div className="panel-content">
          <div className="form-group"><label>I am</label><select className="form-control" value={genderSelect} onChange={e => setGenderSelect(e.target.value)}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
          <div className="form-group"><label>Looking for</label><select className="form-control" value={lookingFor} onChange={e => setLookingFor(e.target.value)}><option value="any">Anyone</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
          <div className="form-group"><label>Location</label><select className="form-control" value={locationSelect} onChange={e => setLocationSelect(e.target.value)}><option value="any">Anywhere</option><option value="nearby">Nearby</option><option value="us">United States</option><option value="europe">Europe</option><option value="asia">Asia</option><option value="uk">United Kingdom</option></select></div>
          <div className="form-group"><label>Interests (comma separated, max 5)</label><input type="text" className="form-control" value={interestsInput} onChange={e => setInterestsInput(e.target.value)} placeholder="Music, Gaming, Sports..." /></div>
          <button className="btn btn-primary" onClick={saveSettings} style={{ width: '100%' }}>Save Settings</button>
        </div>
      </div>

      {/* PROFILE PANEL - Scrollable */}
      <div className={`side-panel right ${showProfile ? 'open' : ''}`} role="dialog" aria-label="Profile">
        <div className="panel-header"><h2>Profile</h2><button className="control-btn" onClick={() => setShowProfile(false)} aria-label="Close Profile"><i className="fas fa-times" /></button></div>
        <div className="panel-content panel-content-scrollable">
          <div className="profile-hero">
            <div className="profile-avatar-ring">
              <div className="avatar-fallback" id="profileAvatarInner">
                {user?.avatar?.startsWith('http') || user?.avatar?.startsWith('data:') ? (
                  <img src={user.avatar} alt="Avatar" onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<i className="fas fa-user"></i>'; }} />
                ) : (<span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-dim)' }}>{(user?.username || user?.nickname || 'U').substring(0, 2).toUpperCase()}</span>)}
              </div>
              <div className="profile-avatar-edit" onClick={() => document.getElementById('avatarFileInput')?.click()} title="Change Avatar" role="button" tabIndex={0}><i className="fas fa-camera" /></div>
              <input type="file" id="avatarFileInput" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
            </div>
            <div className="profile-name-row"><span className="profile-display-name">{user?.display_name || user?.username || 'User'}</span><span className={`profile-provider-badge ${providerInfo.cls}`}><i className={providerInfo.icon} /> {providerInfo.label}</span></div>
            {user?.email && (<div className="profile-email"><i className="fas fa-envelope" style={{ fontSize: '0.75rem' }} /><span>{maskEmail(user.email)}</span></div>)}
            <div className="profile-coins-row"><i className="fas fa-coins" /><span>{userCoins}</span></div>
          </div>
          <div className="profile-stats-grid">
            <div className="profile-stat-cell"><div className="val">{stats.matches}</div><div className="lbl">Matches</div></div>
            <div className="profile-stat-cell"><div className="val">{stats.level}</div><div className="lbl">Level</div></div>
            <div className="profile-stat-cell"><div className="val">{stats.likes}</div><div className="lbl">Likes</div></div>
          </div>
          <div className="profile-info-list">
            <ProfileInfoRow icon="fa-shield-alt" label="Age Verified" value={user?.age_verified ? 'Verified' : 'Not Verified'} cls={user?.age_verified ? 'verified' : 'unverified'} />
            <ProfileInfoRow icon="fa-venus-mars" label="Gender" value={user?.gender && user.gender !== 'any' ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not Set'} cls={user?.gender && user.gender !== 'any' ? '' : 'none'} />
            <ProfileInfoRow icon="fa-map-marker-alt" label="Location" value={user?.location && user.location !== 'any' ? user.location.charAt(0).toUpperCase() + user.location.slice(1) : 'Not Set'} cls={user?.location && user.location !== 'any' ? '' : 'none'} />
            <ProfileInfoRow icon="fa-calendar-alt" label="Member Since" value={formatDate(user?.created_at)} cls="" />
            <ProfileInfoRow icon="fa-fingerprint" label="User ID" value={user?.id ? String(user.id).substring(0, 12) + '...' : '-'} cls="none" monospace />
          </div>
          <div className="profile-actions">
            <button className="profile-action-btn edit" onClick={() => { setEditName(user?.display_name || user?.username || ''); setShowEditName(true); }}><i className="fas fa-pen" /> Edit Display Name</button>
            <button className="profile-action-btn coins" onClick={() => setShowPayment(true)}><i className="fas fa-coins" /> Get Coins</button>
            {!user?.age_verified && (<button className="profile-action-btn verify" onClick={() => setShowAgeVerify(true)}><i className="fas fa-id-card" /> Verify Your Age</button>)}
            <button className="profile-action-btn logout" onClick={logout}><i className="fas fa-sign-out-alt" /> Logout</button>
          </div>
        </div>
      </div>

      {showEditName && (
        <div className="modal-overlay active" onClick={() => setShowEditName(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Edit Display Name</h3><button className="control-btn" onClick={() => setShowEditName(false)} aria-label="Close"><i className="fas fa-times" /></button></div>
            <div className="form-group"><label>Display Name (max 20 characters)</label><input type="text" className="form-control" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Enter new name" maxLength={20} /></div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}><button className="btn" style={{ background: 'var(--dark)', color: 'var(--text)' }} onClick={() => setShowEditName(false)}>Cancel</button><button className="btn btn-primary" onClick={saveProfileName}>Save</button></div>
          </div>
        </div>
      )}

      {showChat && (
        <div className="side-panel right open" style={{ display: 'flex', flexDirection: 'column' }} role="dialog" aria-label="Chat">
          <div className="panel-header"><h3>Chat</h3><button className="control-btn" onClick={() => setShowChat(false)} aria-label="Close Chat"><i className="fas fa-times" /></button></div>
          <div className="chat-messages" aria-live="polite">
            {chatMessages.map(m => (
              <div key={m.id} style={{ marginBottom: 10, textAlign: m.isOwn ? 'right' : 'left' }}>
                <div style={{ fontSize: '0.72rem', color: m.isOwn ? 'var(--primary)' : 'var(--secondary)', marginBottom: 3, fontWeight: 600 }}>{m.name}</div>
                <span style={{ background: m.isOwn ? 'var(--primary)' : 'var(--dark-card)', padding: '8px 14px', borderRadius: m.isOwn ? '14px 14px 4px 14px' : '14px 14px 14px 4px', display: 'inline-block', maxWidth: '80%', wordBreak: 'break-word' }}>{escapeHtml(m.msg)}</span>
              </div>
            ))}
          </div>
          {showTyping && <div style={{ padding: '0 20px 5px', fontSize: '0.8rem', color: 'var(--text-muted)', height: 18 }}>Stranger is typing...</div>}
          <div style={{ padding: 15, borderTop: '1px solid var(--glass-border)', display: 'flex', gap: 10 }}>
            <input type="text" value={messageInput} onChange={e => setMessageInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendMessage(); if (socketRef.current?.connected && currentRoomRef.current) socketRef.current.emit('typing', { room: currentRoomRef.current }); }} placeholder="Type a message..." style={{ flex: 1, padding: '10px 15px', background: 'var(--dark)', border: '1px solid var(--glass-border)', borderRadius: 25, color: 'var(--text)', fontFamily: 'inherit', outline: 'none' }} maxLength={500} />
            <button onClick={sendMessage} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', flexShrink: 0 }} aria-label="Send Message"><i className="fas fa-paper-plane" /></button>
          </div>
        </div>
      )}

      {showReport && (
        <div className="modal-overlay active" onClick={() => { setShowReport(false); setSelectedReport(null); setReportDetails(''); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Report User</h3></div>
            <div className="report-reasons" role="listbox">
              {[['Inappropriate behavior during video chat', 'fa-user-times', 'var(--danger)'], ['Spamming links or scam attempts', 'fa-ban', 'var(--warning)'], ['Appears to be under 18 years old', 'fa-child', 'var(--primary)'], ['Threats or violent behavior', 'fa-fist-raised', 'var(--danger)'], ['Exposing nudity or sexual content', 'fa-eye-slash', 'var(--danger)'], ['Other rule violation', 'fa-exclamation-triangle', 'var(--warning)']].map(([reason, icon, color]) => (
                <div key={reason} className={`report-option ${selectedReport === reason ? 'selected' : ''}`} role="option" onClick={() => setSelectedReport(reason)}><i className={`fas ${icon}`} style={{ color }} /> {reason.replace(/ during video chat| attempts| years old| behavior| content| violation/, '')}</div>
              ))}
            </div>
            <div className="form-group"><label>Additional details (optional)</label><textarea className="form-control" value={reportDetails} onChange={e => setReportDetails(e.target.value)} rows={3} placeholder="Provide more information..." maxLength={200} /></div>
            <div style={{ display: 'flex', gap: 10 }}><button className="btn btn-primary" onClick={submitReport}>Submit Report</button><button className="btn" style={{ background: 'var(--dark)', color: 'var(--text)' }} onClick={() => { setShowReport(false); setSelectedReport(null); setReportDetails(''); }}>Cancel</button></div>
          </div>
        </div>
      )}

      {showGifts && (
        <div className="modal-overlay active" onClick={() => setShowGifts(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Send a Gift</h3><button className="control-btn" onClick={() => setShowGifts(false)} aria-label="Close"><i className="fas fa-times" /></button></div>
            <div className="gift-info-note"><i className="fas fa-info-circle" /> Gifts are paid via Stripe. Your partner will see a special animation!</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 15, padding: 20 }}>
              {[['rose', 2.99, '🌹', 'Rose'], ['heart', 3.99, '❤️', 'Heart'], ['star', 4.99, '⭐', 'Star'], ['diamond', 9.99, '💎', 'Diamond'], ['crown', 14.99, '👑', 'Crown'], ['rocket', 19.99, '🚀', 'Rocket']].map(([type, price, emoji, label]) => (
                <button key={type} className="gift-btn" onClick={() => sendGift(type, price)} style={{ padding: 20, background: 'var(--dark)', border: '2px solid transparent', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 5 }}>{emoji}</div>
                  <div style={{ fontWeight: 600 }}>{label}</div>
                  <div style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 700 }}>${price}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showPayment && (
        <div className="modal-overlay active" onClick={() => setShowPayment(false)}>
          <div className="payment-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Get Coins</h3></div>
            <div className="coins-display"><i className="fas fa-coins" /> <span>{userCoins}</span></div>
            <div className="coin-packages">
              {[100, 250, 500, 1000].map((coins) => {
                const prices = { 100: '4.99', 250: '9.99', 500: '19.99', 1000: '39.99' };
                return (
                  <div key={coins} className={`coin-package ${selectedCoinPackage?.coins === coins ? 'selected' : ''}`} onClick={() => setSelectedCoinPackage({ coins, price: parseFloat(prices[coins]) })} role="button" tabIndex={0}><div className="coin-amount">{coins}</div><div className="coin-price">${prices[coins]}</div></div>
                );
              })}
            </div>
            <button className="btn btn-primary" onClick={purchaseCoins} style={{ width: '100%', marginTop: 20 }}>Purchase Coins</button>
          </div>
        </div>
      )}

      <button className="fab" onClick={() => setShowSettings(v => !v)} title="Settings" aria-label="Open Settings"><i className="fas fa-cog" /></button>
      <button className="fab" style={{ bottom: 90 }} onClick={() => { setShowProfile(v => !v); if (!showProfile) loadProfile(); }} title="Profile" aria-label="Open Profile"><i className="fas fa-user" /></button>
      <a href="/chat" className="fab" style={{ bottom: 150, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Text Chat" aria-label="Switch to Text Chat"><i className="fas fa-comment-dots" /></a>
    </>
  );
}

function ProfileInfoRow({ icon, label, value, cls = '', monospace = false }) {
  return (
    <div className="profile-info-row">
      <div className="profile-info-left">
        <div className="profile-info-icon"><i className={`fas ${icon}`} /></div>
        <div>
          <div className="profile-info-label">{label}</div>
          <div className={`profile-info-value ${cls}`} style={monospace ? { fontSize: '0.8rem', fontFamily: 'monospace' } : {}}>{value}</div>
        </div>
      </div>
    </div>
  );
}
