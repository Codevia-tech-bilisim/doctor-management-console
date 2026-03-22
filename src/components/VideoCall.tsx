// src/components/VideoCall.tsx
import React, { useEffect, useRef, useState } from 'react';
import { X, Maximize2, Minimize2, Mic, MicOff, Video, VideoOff, Phone } from 'lucide-react';

interface VideoCallProps {
  roomName: string;
  displayName: string;
  onClose: () => void;
  domain?: string;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

/* HealthVia brand palette */
const BRAND = {
  orange: '#EE7436',
  darkBg: '#0B1120',
  cardBg: '#111827',
  text: '#F0F4FF',
  muted: '#8A9BC4',
  accent: '#17264A',
} as const;

export default function VideoCall({ roomName, displayName, onClose, domain = 'meet.jit.si' }: VideoCallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  // Load Jitsi IFrame API script
  useEffect(() => {
    if (window.JitsiMeetExternalAPI) { setReady(true); return; }
    const script = document.createElement('script');
    script.src = `https://${domain}/external_api.js`;
    script.async = true;
    script.onload = () => setReady(true);
    script.onerror = () => console.error('Video API yüklenemedi');
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [domain]);

  // Initialize meeting
  useEffect(() => {
    if (!ready || !containerRef.current) return;

    const api = new window.JitsiMeetExternalAPI(domain, {
      roomName: `healthvia-${roomName}`,
      parentNode: containerRef.current,
      width: '100%',
      height: '100%',
      userInfo: { displayName },
      lang: 'tr',
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        disableDeepLinking: true,
        prejoinPageEnabled: false,
        enableWelcomePage: false,
        enableClosePage: false,
        disableThirdPartyRequests: true,
        disableModeratorIndicator: true,
        disableProfile: true,
        hideConferenceSubject: true,
        hideConferenceTimer: false,
        hideParticipantsStats: true,
        disableInviteFunctions: true,
        enableInsecureRoomNameWarning: false,
        requireDisplayName: false,
        enableLobbyChat: false,
        hideLobbyButton: true,
        readOnlyName: true,
        notifications: [],
        disablePolls: true,
        toolbarButtons: [
          'microphone', 'camera', 'desktop', 'chat',
          'raisehand', 'tileview', 'fullscreen',
        ],
        enableAutomaticUrlCopy: false,
        remoteVideoMenu: { disableKick: true, disableGrantModerator: true },
        disableRemoteMute: true,
        breakoutRooms: { hideAddRoomButton: true, hideAutoAssignButton: true, hideJoinRoomButton: true },
      },
      interfaceConfigOverwrite: {
        APP_NAME: 'HealthVia',
        NATIVE_APP_NAME: 'HealthVia',
        PROVIDER_NAME: 'HealthVia',
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        BRAND_WATERMARK_LINK: '',
        SHOW_POWERED_BY: false,
        SHOW_PROMOTIONAL_CLOSE_PAGE: false,
        SHOW_CHROME_EXTENSION_BANNER: false,
        TOOLBAR_ALWAYS_VISIBLE: true,
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        HIDE_INVITE_MORE_HEADER: true,
        MOBILE_APP_PROMO: false,
        GENERATE_ROOMNAMES_ON_WELCOME_PAGE: false,
        DISPLAY_WELCOME_FOOTER: false,
        DISPLAY_WELCOME_PAGE_ADDITIONAL_CARD: false,
        DISPLAY_WELCOME_PAGE_CONTENT: false,
        DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
        DEFAULT_LOGO_URL: '',
        DEFAULT_WELCOME_PAGE_LOGO_URL: '',
        JITSI_WATERMARK_LINK: '',
        DISABLE_FOCUS_INDICATOR: true,
        DISABLE_DOMINANT_SPEAKER_INDICATOR: false,
        DISABLE_TRANSCRIPTION_SUBTITLES: true,
        DISABLE_VIDEO_BACKGROUND: false,
        FILM_STRIP_MAX_HEIGHT: 120,
        TOOLBAR_BUTTONS: [],
        VIDEO_QUALITY_LABEL_DISABLED: true,
      },
    });

    api.addEventListener('readyToClose', onClose);
    apiRef.current = api;

    return () => {
      api.dispose();
      apiRef.current = null;
    };
  }, [ready, roomName, displayName, domain]);

  const toggleMute = () => { apiRef.current?.executeCommand('toggleAudio'); setMuted(m => !m); };
  const toggleVideo = () => { apiRef.current?.executeCommand('toggleVideo'); setVideoOff(v => !v); };

  // Minimized pip mode
  if (minimized) {
    return (
      <div className="fixed bottom-6 right-6 z-[9999] w-[320px] h-[200px] rounded-2xl overflow-hidden shadow-2xl bg-[#0B1120]"
        style={{ border: `2px solid ${BRAND.orange}40` }}>
        <div ref={containerRef} className="w-full h-full" />
        <div className="absolute top-2 right-2 flex gap-1">
          <button onClick={() => setMinimized(false)}
            className="p-1.5 rounded-lg bg-black/70 text-white hover:bg-black/80 transition-colors">
            <Maximize2 size={14} />
          </button>
          <button onClick={onClose}
            className="p-1.5 rounded-lg bg-red-500/85 text-white hover:bg-red-500 transition-colors">
            <X size={14} />
          </button>
        </div>
        <div className="absolute bottom-1.5 left-2 text-[10px] font-bold opacity-80" style={{ color: BRAND.orange }}>
          HealthVia
        </div>
      </div>
    );
  }

  // Full overlay
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#0B1120]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-[#111827]"
        style={{ borderBottom: `1px solid ${BRAND.orange}20` }}>
        <div className="flex items-center gap-3">
          <span className="text-lg font-extrabold tracking-tight" style={{ color: BRAND.orange }}>HealthVia</span>
          <div className="w-px h-5 bg-white/12" />
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[13px] font-semibold text-[#F0F4FF]">Görüntülü Görüşme</span>
          <span className="text-[11px] text-[#8A9BC4] font-mono bg-white/[.06] px-2 py-0.5 rounded-md">#{roomName.slice(-8)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={toggleMute} title={muted ? 'Mikrofonu aç' : 'Mikrofonu kapat'}
            className={`p-2.5 rounded-xl transition-colors ${muted ? 'bg-red-500/20 text-red-400' : 'bg-white/8 text-[#F0F4FF] hover:bg-white/12'}`}>
            {muted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button onClick={toggleVideo} title={videoOff ? 'Kamerayı aç' : 'Kamerayı kapat'}
            className={`p-2.5 rounded-xl transition-colors ${videoOff ? 'bg-red-500/20 text-red-400' : 'bg-white/8 text-[#F0F4FF] hover:bg-white/12'}`}>
            {videoOff ? <VideoOff size={18} /> : <Video size={18} />}
          </button>
          <button onClick={() => setMinimized(true)} title="Küçült"
            className="p-2.5 rounded-xl bg-white/8 text-[#F0F4FF] hover:bg-white/12 transition-colors">
            <Minimize2 size={18} />
          </button>
          <div className="w-px h-6 bg-white/10 mx-0.5" />
          <button onClick={onClose} title="Görüşmeyi bitir"
            className="p-2.5 w-[52px] rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center">
            <Phone size={18} style={{ transform: 'rotate(135deg)' }} />
          </button>
        </div>
      </div>

      {/* Video area */}
      <div ref={containerRef} className="flex-1" />

      {/* Loading state */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0B1120]">
          <div className="flex flex-col items-center gap-5">
            <span className="text-[28px] font-extrabold" style={{ color: BRAND.orange }}>HealthVia</span>
            <div className="w-11 h-11 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${BRAND.orange}`, borderTopColor: 'transparent' }} />
            <p className="text-sm text-[#8A9BC4]">Görüntülü görüşme başlatılıyor...</p>
          </div>
        </div>
      )}
    </div>
  );
}
