import { useRef, useCallback } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import useAppStore from '../store/useAppStore';

const CONFIG = {
  BACKEND: "https://term-production-bf65.up.railway.app",
  AGORA_APP_ID: "0f9094ed4a8e4dea934059b0ea8b5182",
};

export default function useAgora() {
  const clientRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localTracksRef = useRef({ videoTrack: null, audioTrack: null, screenTrack: null });
  
  const { token, startCall, endCall, addMessage, setUser } = useAppStore();

  const initClient = useCallback(() => {
    if (!clientRef.current) {
      clientRef.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    }
    return clientRef.current;
  }, []);

  const requestPermissions = useCallback(async () => {
    try {
      localTracksRef.current.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      localTracksRef.current.videoTrack = await AgoraRTC.createCameraVideoTrack({
        encoderConfig: { width: 1280, height: 720, frameRate: 30, bitrate: 1710 }
      });
      
      if (localVideoRef.current) {
        localTracksRef.current.videoTrack.play(localVideoRef.current);
      }
      useAppStore.setState({ permissionsGranted: true, showPermissionOverlay: false, showLoading: false });
      return true;
    } catch (err) {
      console.error("Permission error:", err);
      return false;
    }
  }, []);

  const joinChannel = useCallback(async (channelName, partnerId) => {
    const client = initClient();
    const uid = Math.floor(Math.random() * 100000);

    try {
      const tr = await fetch(CONFIG.BACKEND + "/generateToken", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ channelName, uid, role: "publisher", expirySeconds: 3600 })
      });
      const td = await tr.json();

      await client.join(td.appID || CONFIG.AGORA_APP_ID, channelName, td.rtcToken, uid);
      await client.publish([localTracksRef.current.audioTrack, localTracksRef.current.videoTrack]);

      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "video" && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = new MediaStream([user.videoTrack.getMediaStreamTrack()]);
          remoteVideoRef.current.play().catch(() => {});
        }
        if (mediaType === "audio") user.audioTrack.play();
      });

      client.on("user-unpublished", (u, m) => {
        if (m === "video" && remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      });

      startCall(channelName, partnerId);
    } catch (e) {
      console.error("Call error:", e);
      endCall();
    }
  }, [token, initClient, startCall, endCall]);

  const leaveChannel = useCallback(async () => {
    const client = clientRef.current;
    if (client) {
      try { await client.leave(); } catch (e) {}
    }
    if (localTracksRef.current.screenTrack) {
      localTracksRef.current.screenTrack.close();
    }
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    endCall();
  }, [endCall]);

  return {
    localVideoRef,
    remoteVideoRef,
    requestPermissions,
    joinChannel,
    leaveChannel,
    localTracksRef,
    clientRef
  };
}
