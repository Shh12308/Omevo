import { create } from 'zustand';

const useAppStore = create((set, get) => ({
  // Config & Auth
  token: localStorage.getItem('token'),
  user: null,
  banData: null,
  
  // Agora & Call
  isMatching: false,
  isInCall: false,
  currentRoom: null,
  partnerId: null,
  matchSeconds: 0,
  isScreenSharing: false,
  permissionsGranted: false,
  
  // UI State
  showBanOverlay: false,
  showPermissionOverlay: true,
  showLoading: true,
  activeModal: null, // 'report', 'gifts', 'payment', 'appeal', 'ageVerify', 'editName'
  activePanel: null, // 'settings', 'profile', 'chat'
  currentLayout: 'float',
  
  // Preferences & Stats
  preferences: { gender: "male", lookingFor: "any", location: "any", interests: [] },
  stats: { matches: 0, likes: 0, time: 0, level: 1 },
  messages: [],
  
  // Actions
  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },
  setUser: (user) => set({ user }),
  startMatching: () => set({ isMatching: true }),
  stopMatching: () => set({ isMatching: false }),
  startCall: (room, partnerId) => set({ isInCall: true, isMatching: false, currentRoom: room, partnerId }),
  endCall: () => set({ 
    isInCall: false, isMatching: false, isScreenSharing: false, 
    currentRoom: null, partnerId: null, matchSeconds: 0, messages: [] 
  }),
  updateStats: (newStats) => set((state) => ({ stats: { ...state.stats, ...newStats } })),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  togglePanel: (panel) => set((state) => ({ activePanel: state.activePanel === panel ? null : panel })),
  toggleModal: (modal) => set((state) => ({ activeModal: state.activeModal === modal ? null : modal })),
  showBan: (data) => set({ showBanOverlay: true, banData: data, showLoading: false }),
  hideBan: () => set({ showBanOverlay: false, banData: null }),
}));

export default useAppStore;
