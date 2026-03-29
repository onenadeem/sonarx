import { create } from "zustand";
import type { MediaStream } from "react-native-webrtc";

export type CallStateEnum =
  | "idle"
  | "calling"
  | "ringing"
  | "connecting"
  | "active"
  | "ended";

export type CallDirection = "incoming" | "outgoing" | null;

interface CallState {
  activeCallPeerId: string | null;
  callId: string | null;
  callDirection: CallDirection;
  callState: CallStateEnum;
  isVideoCall: boolean;
  startedAt: Date | null;
  endedAt: Date | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeakerOn: boolean;
  setActiveCall: (params: {
    peerId: string;
    callId: string;
    direction: CallDirection;
    isVideo: boolean;
  }) => void;
  setCallState: (state: CallStateEnum) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setIsMuted: (value: boolean) => void;
  setIsCameraOff: (value: boolean) => void;
  setIsSpeakerOn: (value: boolean) => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleSpeaker: () => void;
  endCall: () => void;
  clearCall: () => void;
}

export const useCallStore = create<CallState>()((set, get) => ({
  activeCallPeerId: null,
  callId: null,
  callDirection: null,
  callState: "idle",
  isVideoCall: false,
  startedAt: null,
  endedAt: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isCameraOff: false,
  isSpeakerOn: false,

  setActiveCall: ({ peerId, callId, direction, isVideo }) =>
    set({
      activeCallPeerId: peerId,
      callId,
      callDirection: direction,
      callState: direction === "outgoing" ? "calling" : "ringing",
      isVideoCall: isVideo,
      startedAt: new Date(),
      endedAt: null,
    }),

  setCallState: (state) => set({ callState: state }),

  setLocalStream: (stream) => set({ localStream: stream }),

  setRemoteStream: (stream) => set({ remoteStream: stream }),

  setIsMuted: (value) => set({ isMuted: value }),

  setIsCameraOff: (value) => set({ isCameraOff: value }),

  setIsSpeakerOn: (value) => set({ isSpeakerOn: value }),

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
    }
    set({ isMuted: !isMuted });
  },

  toggleCamera: () => {
    const { localStream, isCameraOff } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isCameraOff;
      });
    }
    set({ isCameraOff: !isCameraOff });
  },

  toggleSpeaker: () => set({ isSpeakerOn: !get().isSpeakerOn }),

  endCall: () =>
    set({
      callState: "ended",
      endedAt: new Date(),
    }),

  clearCall: () =>
    set({
      activeCallPeerId: null,
      callId: null,
      callDirection: null,
      callState: "idle",
      isVideoCall: false,
      startedAt: null,
      endedAt: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isCameraOff: false,
      isSpeakerOn: false,
    }),
}));
