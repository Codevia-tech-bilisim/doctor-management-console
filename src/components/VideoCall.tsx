// src/components/VideoCall.tsx
import React, { useEffect, useRef, useState } from 'react';
import { X, Maximize2, Minimize2, Mic, MicOff, Video, VideoOff } from 'lucide-react';

interface VideoCallProps {
  roomName: string;
  displayName: string;
  onClose: () => void;
  /** Jitsi domain – defaults to public meet.jit.si */
  domain?: string;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

/**
 * Embeds a Jitsi Meet video call inside a full-screen overlay.
 * Uses the Jitsi IFrame API loaded from meet.jit.si.
 */
export default function VideoCall({ roomName, displayName, onClose, domain = 'meet.jit.si' }: VideoCallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  // Load Jitsi IFrame API script
  useEffect(() => {
    if (window.JitsiMeetExternalAPI) {
      setReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://${domain}/external_api.js`;
    script.async = true;
    script.onload = () => setReady(true);
    script.onerror = () => console.error('Jitsi API yüklenemedi');
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [domain]);

  // Initialize Jitsi meeting
  useEffect(() => {
    if (!ready || !containerRef.current) return;

    const api = new window.JitsiMeetExternalAPI(domain, {
      roomName: `healthvia-${roomName}`,
      parentNode: containerRef.current,
      width: '100%',
      height: '100%',
      userInfo: { displayName },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        disableDeepLinking: true,
        prejoinPageEnabled: false,
        toolbarButtons: [
          'microphone', 'camera', 'desktop', 'chat',
          'raisehand', 'tileview', 'fullscreen',
        ],
        disableThirdPartyRequests: true,
        enableWelcomePage: false,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        TOOLBAR_ALWAYS_VISIBLE: true,
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        HIDE_INVITE_MORE_HEADER: true,
        MOBILE_APP_PROMO: false,
      },
    });

    api.addEventListener('readyToClose', onClose);
    apiRef.current = api;

    return () => {
      api.dispose();
      apiRef.current = null;
    };
  }, [ready, roomName, displayName, domain]);

  const toggleMute = () => {
    apiRef.current?.executeCommand('toggleAudio');
    setMuted(m => !m);
  };
  const toggleVideo = () => {
    apiRef.current?.executeCommand('toggleVideo');
    setVideoOff(v => !v);
  };

  // Minimized pip mode
  if (minimized) {
    return (
      <div className="fixed bottom-6 right-6 z-[9999] w-[320px] h-[200px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#0B1120]">
        <div ref={containerRef} className="w-full h-full" />
        <div className="absolute top-2 right-2 flex gap-1">
          <button onClick={() => setMinimized(false)}
            className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors">
            <Maximize2 size={14} />
          </button>
          <button onClick={onClose}
            className="p-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-500 transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  // Full overlay
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#0B1120]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#0B1120]/90 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-600 text-[#F0F4FF]">Video Görüşme</span>
          <span className="text-xs text-[#8A9BC4] font-mono">#{roomName.slice(-8)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleMute}
            className={`p-2 rounded-xl transition-colors ${muted ? 'bg-red-500/20 text-red-400' : 'bg-white/8 text-[#F0F4FF] hover:bg-white/12'}`}>
            {muted ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button onClick={toggleVideo}
            className={`p-2 rounded-xl transition-colors ${videoOff ? 'bg-red-500/20 text-red-400' : 'bg-white/8 text-[#F0F4FF] hover:bg-white/12'}`}>
            {videoOff ? <VideoOff size={16} /> : <Video size={16} />}
          </button>
          <button onClick={() => setMinimized(true)}
            className="p-2 rounded-xl bg-white/8 text-[#F0F4FF] hover:bg-white/12 transition-colors">
            <Minimize2 size={16} />
          </button>
          <button onClick={onClose}
            className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Video area */}
      <div ref={containerRef} className="flex-1" />

      {/* Loading state */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0B1120]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-[#EE7436] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#8A9BC4]">Video görüşme yükleniyor...</p>
          </div>
        </div>
      )}
    </div>
  );
}
