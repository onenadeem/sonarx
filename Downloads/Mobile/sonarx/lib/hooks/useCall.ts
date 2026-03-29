import { useCallback } from "react";
import {
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
} from "react-native-webrtc";
import { useCallStore } from "@/stores/call.store";
import { peerManager } from "@/lib/p2p/peer-manager";
import {
  sendCallRequest,
  sendCallAccept,
  sendCallReject,
  sendCallEnd,
} from "@/lib/p2p/data-channel";
import type { Identity } from "@/db/schema";

export function useCall(peerId: string) {
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
    async (withVideo: boolean): Promise<void> => {
      try {
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
      } catch (error) {
        throw error;
      }
    },
    [peerId],
  );

  const acceptCall = useCallback(
    async (callId: string): Promise<void> => {
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
    },
    [isVideoCall],
  );

  const rejectCall = useCallback(
    async (callId: string, reason: string = "rejected"): Promise<void> => {
      useCallStore.getState().clearCall();
    },
    [],
  );

  const endCall = useCallback((): void => {
    localStream?.getTracks().forEach((track) => track.stop());
    remoteStream?.getTracks().forEach((track) => track.stop());

    if (activeCallPeerId) {
      const duration = useCallStore.getState().startedAt
        ? Math.floor(
            (Date.now() - useCallStore.getState().startedAt!.getTime()) / 1000,
          )
        : 0;

      sendCallEnd(activeCallPeerId, "", duration).catch(console.error);
    }

    useCallStore.getState().clearCall();
  }, [localStream, remoteStream, activeCallPeerId]);

  const toggleMute = useCallback((): void => {
    const newMutedState = !isMuted;
    localStream?.getAudioTracks().forEach((track) => {
      track.enabled = !newMutedState;
    });
    useCallStore.getState().setIsMuted(newMutedState);
  }, [localStream, isMuted]);

  const toggleCamera = useCallback((): void => {
    const newCameraOffState = !isCameraOff;
    localStream?.getVideoTracks().forEach((track) => {
      track.enabled = !newCameraOffState;
    });
    useCallStore.getState().setIsCameraOff(newCameraOffState);
  }, [localStream, isCameraOff]);

  const toggleSpeaker = useCallback((): void => {
    useCallStore.getState().setIsSpeakerOn(!isSpeakerOn);
  }, [isSpeakerOn]);

  const switchCamera = useCallback(async (): Promise<void> => {
    const videoTrack = localStream?.getVideoTracks()[0];
    if (videoTrack) {
      await (videoTrack as any)._switchCamera();
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
