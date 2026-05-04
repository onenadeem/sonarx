import { useCallback } from "react";
import { mediaDevices } from "react-native-webrtc";
import { useCallStore } from "@/src/store/callStore";
import { sendCallEnd } from "@/lib/p2p/data-channel";
const stopStreamTracks = (stream) => {
  stream?.getTracks().forEach((track) => track.stop());
};
const setTrackEnabled = (stream, trackAccessor, enabled) => {
  if (!stream) {
    return;
  }
  trackAccessor(stream).forEach((track) => {
    track.enabled = enabled;
  });
};
export function useCall(peerId) {
  const {
    callState,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    isSpeakerOn,
    activeCallPeerId,
    isVideoCall,
  } = useCallStore();
  const startCall = useCallback(
    async (withVideo) => {
      const mediaStream = await mediaDevices.getUserMedia({
        audio: true,
        video: withVideo,
      });
      useCallStore.getState().setLocalStream(mediaStream);
      useCallStore.getState().setActiveCall({
        peerId,
        callId: crypto.randomUUID(),
        direction: "outgoing",
        isVideo: withVideo,
      });
    },
    [peerId],
  );
  const acceptCall = useCallback(async () => {
    try {
      const mediaStream = await mediaDevices.getUserMedia({
        audio: true,
        video: isVideoCall,
      });
      useCallStore.getState().setLocalStream(mediaStream);
      useCallStore.getState().setCallState("active");
    } catch (error) {
      console.error("Failed to accept call:", error);
      throw error;
    }
  }, [isVideoCall]);
  const rejectCall = useCallback(async () => {
    useCallStore.getState().clearCall();
  }, []);
  const endCall = useCallback(() => {
    const state = useCallStore.getState();
    stopStreamTracks(state.localStream);
    stopStreamTracks(state.remoteStream);
    if (state.activeCallPeerId) {
      const duration = state.startedAt
        ? Math.floor((Date.now() - state.startedAt.getTime()) / 1000)
        : 0;
      sendCallEnd(state.activeCallPeerId, "", duration).catch(console.error);
    }
    useCallStore.getState().clearCall();
  }, []);
  const toggleMute = useCallback(() => {
    const newMutedState = !isMuted;
    setTrackEnabled(
      localStream,
      (stream) => stream.getAudioTracks(),
      !newMutedState,
    );
    useCallStore.getState().setIsMuted(newMutedState);
  }, [localStream, isMuted]);
  const toggleCamera = useCallback(() => {
    const newCameraOffState = !isCameraOff;
    setTrackEnabled(
      localStream,
      (stream) => stream.getVideoTracks(),
      !newCameraOffState,
    );
    useCallStore.getState().setIsCameraOff(newCameraOffState);
  }, [localStream, isCameraOff]);
  const toggleSpeaker = useCallback(() => {
    useCallStore.getState().setIsSpeakerOn(!isSpeakerOn);
  }, [isSpeakerOn]);
  const switchCamera = useCallback(async () => {
    const videoTrack = localStream?.getVideoTracks()[0];
    if (videoTrack) {
      await videoTrack._switchCamera();
    }
  }, [localStream]);
  return {
    callState,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    isSpeakerOn,
    activeCallPeerId,
    isVideoCall,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    toggleSpeaker,
    switchCamera,
  };
}
