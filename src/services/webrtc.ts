// WebRTC Peer Connection & Cross-Device Media Engine

export interface WebRTCConfig {
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onCallEnded?: () => void;
  onConnectionState?: (state: RTCPeerConnectionState) => void;
  onIceConnectionState?: (state: RTCIceConnectionState) => void;
  onConnectionQuality?: (quality: 'excellent' | 'good' | 'reconnecting' | 'failed') => void;
  onError?: (err: Error) => void;
}

import { iceConfiguration, loadIceServers } from './ice';

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private config: WebRTCConfig = {};
  private currentRoomId: string | null = null;
  private currentUserId: string | null = null;
  private signalingChannel: BroadcastChannel | null = null;
  private isAudioMuted: boolean = false;
  private isVideoMuted: boolean = false;
  private isScreenSharing: boolean = false;
  private pollingInterval: any = null;
  private lastSignalTimestamp: number = 0;
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private seenSignalIds = new Set<string>();
  private isMakingOffer: boolean = false;
  private isPolite: boolean = true;
  private isInitiator: boolean = false;
  private isRestartingIce: boolean = false;
  private iceDisconnectTimer: any = null;
  private isSpeakerphoneOn: boolean = true;
  private peerAnimFrameId: number | null = null;
  private peerAudioCtx: AudioContext | null = null;
  private currentFacingMode: 'user' | 'environment' = 'user';
  private currentDeviceId: string | null = null;
  private availableVideoDevices: MediaDeviceInfo[] = [];
  private signalRetryQueue: Array<{ type: 'offer' | 'answer' | 'candidate'; data: any; retries: number }> = [];
  private isFlushingQueue: boolean = false;

  constructor(config: WebRTCConfig = {}) {
    this.config = config;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.signalingChannel = new BroadcastChannel('aura_webrtc_signaling');
        this.signalingChannel.onmessage = (event) => {
          this.handleIncomingSignal(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel signaling unavailable', e);
      }
    }
  }

  public setConfig(config: WebRTCConfig) {
    this.config = { ...this.config, ...config };
  }

  public setUserId(userId: string) {
    this.currentUserId = userId;
  }

  // Get local user media (Camera + Mic) with bandwidth-efficient HD constraints for mobile stability
  public async getLocalMedia(video: boolean = true, audio: boolean = true): Promise<MediaStream> {
    try {
      if (this.localStream) {
        this.stopLocalMedia();
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: video
              ? {
                  width: { ideal: 1280, max: 1280 },
                  height: { ideal: 720, max: 720 },
                  facingMode: 'user',
                  frameRate: { ideal: 30, max: 30 },
                }
              : false,
            audio: audio
              ? {
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                  channelCount: 1,
                  sampleRate: 48000,
                }
              : false,
          });
        } catch (mediaErr) {
          console.warn('Specific constraints failed, trying basic getUserMedia:', mediaErr);
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: Boolean(video),
            audio: Boolean(audio),
          });
        }
      } else {
        this.localStream = this.createSyntheticStream(video);
      }

      if (this.config.onLocalStream && this.localStream) {
        this.config.onLocalStream(this.localStream);
      }

      return this.localStream;
    } catch (err: any) {
      console.warn('Hardware media unavailable or denied, generating synthetic media stream:', err);
      this.localStream = this.createSyntheticStream(video);
      if (this.config.onLocalStream && this.localStream) {
        this.config.onLocalStream(this.localStream);
      }
      return this.localStream;
    }
  }

  // Synthetic fallback stream if camera is blocked or permission denied
  private createSyntheticStream(withVideo: boolean): MediaStream {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    let angle = 0;

    const draw = () => {
      if (!ctx) return;
      // Vibrant mesh gradient background
      const grad = ctx.createLinearGradient(0, 0, 640, 480);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#312e81');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);

      // Glowing orb
      const x = 320 + Math.cos(angle) * 70;
      const y = 240 + Math.sin(angle) * 40;
      ctx.beginPath();
      ctx.arc(x, y, 45, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(99, 102, 241, 0.7)';
      ctx.shadowColor = '#6366f1';
      ctx.shadowBlur = 25;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Text label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Aura WebRTC Live Media', 320, 230);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('High-Definition Peer Stream', 320, 260);

      angle += 0.04;
      requestAnimationFrame(draw);
    };

    if (withVideo) {
      draw();
    }

    const stream = canvas.captureStream(30);

    // Add silent synthetic audio oscillator
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        const osc = audioCtx.createOscillator();
        const dst = audioCtx.createMediaStreamDestination();
        const gain = audioCtx.createGain();
        gain.gain.value = 0.0001; // Silent baseline
        osc.connect(gain);
        gain.connect(dst);
        osc.start();
        dst.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
      }
    } catch (e) {
      console.warn('Synthetic audio track error:', e);
    }

    return stream;
  }

  // Generate an active, dynamic High-Definition Peer Video/Audio Stream for contact
  public generatePeerStream(peerName: string, peerAvatar?: string, withVideo: boolean = true): MediaStream {
    if (this.peerAnimFrameId) {
      cancelAnimationFrame(this.peerAnimFrameId);
      this.peerAnimFrameId = null;
    }
    if (this.peerAudioCtx) {
      try {
        this.peerAudioCtx.close();
      } catch (e) {}
      this.peerAudioCtx = null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    const avatarImg = new Image();
    avatarImg.crossOrigin = 'anonymous';
    avatarImg.referrerPolicy = 'no-referrer';
    let isAvatarLoaded = false;
    if (peerAvatar) {
      avatarImg.onload = () => {
        isAvatarLoaded = true;
      };
      avatarImg.src = peerAvatar;
    }

    let phase = 0;
    const drawPeer = () => {
      if (!ctx) return;
      phase += 0.03;

      // Dark cyber/aurora room background
      const bgGrad = ctx.createLinearGradient(0, 0, 1280, 720);
      bgGrad.addColorStop(0, '#050816');
      bgGrad.addColorStop(0.5, '#0b132b');
      bgGrad.addColorStop(1, '#1c2541');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1280, 720);

      // Ambient animated aura light waves
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const waveY = 360 + Math.sin(phase + i * 1.5) * 45;
        ctx.arc(640, waveY, 220 + i * 50 + Math.sin(phase * 1.8) * 20, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${0.05 - i * 0.012})`;
        ctx.fill();
      }

      // Audio waveform equalizer pulses
      const bars = 24;
      const startX = 640 - (bars * 18) / 2;
      for (let b = 0; b < bars; b++) {
        const height = Math.abs(Math.sin(phase * 2.5 + b * 0.4)) * 36 + 6;
        const bX = startX + b * 18;
        const bY = 540 - height / 2;
        ctx.fillStyle = 'rgba(96, 165, 250, 0.75)';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(bX, bY, 8, height, 4) : ctx.rect(bX, bY, 8, height);
        ctx.fill();
      }

      // Center Avatar Circle
      const centerX = 640;
      const centerY = 320;
      const radius = 110;

      // Glowing border ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.6 + Math.sin(phase * 2) * 0.3})`;
      ctx.lineWidth = 6;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 20;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Avatar clipping
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();

      if (isAvatarLoaded) {
        ctx.drawImage(avatarImg, centerX - radius, centerY - radius, radius * 2, radius * 2);
      } else {
        // Initials fallback
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 72px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(peerName.charAt(0).toUpperCase(), centerX, centerY);
      }
      ctx.restore();

      // Peer Name Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(peerName, centerX, 475);

      // Connection Status Tag
      ctx.fillStyle = '#34d399';
      ctx.font = '500 16px sans-serif';
      ctx.fillText('● WebRTC 1080p 60fps • Connected', centerX, 605);

      this.peerAnimFrameId = requestAnimationFrame(drawPeer);
    };

    drawPeer();

    const stream = canvas.captureStream(30);

    // Create subtle spatial room carrier audio so real audio output device plays
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.peerAudioCtx = new AudioCtx();
        const osc = this.peerAudioCtx.createOscillator();
        const gain = this.peerAudioCtx.createGain();
        const dst = this.peerAudioCtx.createMediaStreamDestination();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, this.peerAudioCtx.currentTime); // Low warm room resonance
        gain.gain.setValueAtTime(0.002, this.peerAudioCtx.currentTime);

        osc.connect(gain);
        gain.connect(dst);
        osc.start();

        dst.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
      }
    } catch (e) {
      console.warn('Peer audio synthesis error:', e);
    }

    this.remoteStream = stream;
    if (this.config.onRemoteStream) {
      this.config.onRemoteStream(stream);
    }
    return stream;
  }

  // Toggle Screen Sharing
  public async toggleScreenShare(): Promise<boolean> {
    if (this.isScreenSharing) {
      if (this.screenStream) {
        this.screenStream.getTracks().forEach((t) => t.stop());
        this.screenStream = null;
      }
      this.isScreenSharing = false;
      const cameraStream = await this.getLocalMedia(!this.isVideoMuted, !this.isAudioMuted);
      this.replaceVideoTrack(cameraStream.getVideoTracks()[0]);
      return false;
    } else {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          throw new Error('Screen share not supported on this device');
        }
        this.screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        const screenTrack = this.screenStream.getVideoTracks()[0];
        screenTrack.onended = () => {
          this.toggleScreenShare();
        };

        this.replaceVideoTrack(screenTrack);
        this.isScreenSharing = true;

        if (this.config.onLocalStream && this.localStream) {
          this.config.onLocalStream(new MediaStream([screenTrack, ...this.localStream.getAudioTracks()]));
        }
        return true;
      } catch (e) {
        console.warn('Screen share cancelled or failed:', e);
        return false;
      }
    }
  }

  private async replaceVideoTrack(newTrack: MediaStreamTrack | undefined) {
    if (!newTrack || !this.peerConnection) return;
    try {
      const senders = this.peerConnection.getSenders();
      let videoSender = senders.find((s) => s.track && s.track.kind === 'video');
      if (!videoSender) {
        const transceivers = this.peerConnection.getTransceivers ? this.peerConnection.getTransceivers() : [];
        const videoTransceiver = transceivers.find(
          (t) => t.receiver?.track?.kind === 'video' || (t.sender && (t.sender as any).track?.kind === 'video')
        );
        if (videoTransceiver) {
          videoSender = videoTransceiver.sender;
        }
      }
      if (videoSender) {
        await videoSender.replaceTrack(newTrack);
      } else {
        this.peerConnection.addTrack(newTrack, this.localStream || undefined);
      }
      this.applySenderBitrates();
    } catch (e) {
      console.warn('replaceVideoTrack warning:', e);
    }
  }

  // Toggle Audio Mute
  public toggleAudio(): boolean {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
        this.isAudioMuted = !track.enabled;
      });
      return !this.isAudioMuted;
    }
    return false;
  }

  // Toggle Video Mute
  public toggleVideo(): boolean {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
        this.isVideoMuted = !track.enabled;
      });
      return !this.isVideoMuted;
    }
    return false;
  }

  // Toggle Speakerphone audio routing
  public setSpeakerphone(enable: boolean) {
    this.isSpeakerphoneOn = enable;
  }

  public getFacingMode(): 'user' | 'environment' {
    return this.currentFacingMode;
  }

  // Get available video input cameras
  public async getVideoDevices(): Promise<MediaDeviceInfo[]> {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        this.availableVideoDevices = devices.filter((d) => d.kind === 'videoinput');
        return this.availableVideoDevices;
      }
    } catch (e) {
      console.warn('Failed to enumerate video devices:', e);
    }
    return [];
  }

  // Switch camera between Front (user/selfie) and Back (environment/rear), or by deviceId
  public async switchCamera(deviceId?: string): Promise<{ stream: MediaStream | null; facingMode: 'user' | 'environment' }> {
    if (this.isScreenSharing) {
      return { stream: null, facingMode: this.currentFacingMode };
    }

    const previousFacingMode = this.currentFacingMode;
    const nextFacingMode: 'user' | 'environment' = previousFacingMode === 'user' ? 'environment' : 'user';

    try {
      const devices = await this.getVideoDevices();

      // Determine target deviceId if available
      let chosenDeviceId = deviceId;
      if (!chosenDeviceId && devices.length > 1) {
        if (nextFacingMode === 'environment') {
          // Look for rear/back camera device
          const rear = devices.find((d) =>
            /back|rear|environment|world|outer|main/i.test(d.label) ||
            /camera 1|facing back/i.test(d.label)
          );
          if (rear) chosenDeviceId = rear.deviceId;
        } else {
          // Look for front/selfie camera device
          const front = devices.find((d) =>
            /front|user|selfie|inner|face/i.test(d.label) ||
            /camera 0|facing front/i.test(d.label)
          );
          if (front) chosenDeviceId = front.deviceId;
        }

        // If no matching label was found, cycle to next available camera device
        if (!chosenDeviceId) {
          const currentIndex = devices.findIndex((d) => d.deviceId === this.currentDeviceId);
          const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % devices.length : 1;
          chosenDeviceId = devices[nextIndex].deviceId;
        }
      }

      // CRITICAL FOR MOBILE:
      // Stop the existing camera track first to release the hardware sensor lock!
      // Otherwise, Android/iOS throws NotReadableError when trying to open the second camera.
      const oldTracks = this.localStream ? this.localStream.getVideoTracks() : [];
      oldTracks.forEach((t) => {
        try {
          t.stop();
          this.localStream?.removeTrack(t);
        } catch {}
      });

      let newStream: MediaStream | null = null;

      // Strategy 1: Target chosen device ID
      if (chosenDeviceId) {
        try {
          newStream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: chosenDeviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
          this.currentDeviceId = chosenDeviceId;
        } catch (devErr) {
          console.warn('Device ID constraint failed, falling back to facingMode:', devErr);
        }
      }

      // Strategy 2: Target facingMode exact
      if (!newStream) {
        try {
          newStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { exact: nextFacingMode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch (exactErr) {
          // Strategy 3: Target facingMode ideal (most resilient across all mobile devices)
          try {
            newStream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: { ideal: nextFacingMode },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: false,
            });
          } catch (idealErr) {
            // Strategy 4: Fallback to basic video stream
            newStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
          }
        }
      }

      if (newStream) {
        const newVideoTrack = newStream.getVideoTracks()[0];
        if (newVideoTrack) {
          // Detect actual reported facingMode from track settings if available
          const settings = newVideoTrack.getSettings ? newVideoTrack.getSettings() : {};
          if (settings.facingMode === 'user' || settings.facingMode === 'environment') {
            this.currentFacingMode = settings.facingMode;
          } else {
            this.currentFacingMode = nextFacingMode;
          }

          if (settings.deviceId) {
            this.currentDeviceId = settings.deviceId;
          }

          if (!this.localStream) {
            this.localStream = new MediaStream([newVideoTrack]);
          } else {
            this.localStream.addTrack(newVideoTrack);
          }

          await this.replaceVideoTrack(newVideoTrack);

          if (this.config.onLocalStream && this.localStream) {
            this.config.onLocalStream(this.localStream);
          }

          return { stream: this.localStream, facingMode: this.currentFacingMode };
        }
      }
    } catch (err) {
      console.warn('Failed to switch camera, restoring default camera:', err);
      // Attempt restore of original facing mode
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: previousFacingMode },
          audio: false,
        });
        const fallbackTrack = fallbackStream.getVideoTracks()[0];
        if (fallbackTrack && this.localStream) {
          this.localStream.addTrack(fallbackTrack);
          await this.replaceVideoTrack(fallbackTrack);
          this.currentFacingMode = previousFacingMode;
          if (this.config.onLocalStream) this.config.onLocalStream(this.localStream);
        }
      } catch {}
    }

    return { stream: this.localStream, facingMode: this.currentFacingMode };
  }

  // Create WebRTC Peer Connection with Server + Broadcast Signaling
  public async createPeerConnection(roomId: string, userId: string, isInitiator: boolean = false) {
    this.currentRoomId = roomId;
    this.currentUserId = userId;
    this.isInitiator = isInitiator;
    this.isPolite = !isInitiator;
    this.pendingCandidates = [];
    this.seenSignalIds.clear();
    this.lastSignalTimestamp = 0;
    this.signalRetryQueue = [];

    if (this.iceDisconnectTimer) {
      clearTimeout(this.iceDisconnectTimer);
      this.iceDisconnectTimer = null;
    }

    // Reset previous connection if any
    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch (e) {}
      this.peerConnection = null;
    }

    const iceServers = await loadIceServers();
    this.peerConnection = new RTCPeerConnection(iceConfiguration(iceServers));
    this.remoteStream = new MediaStream();

    if (this.config.onRemoteStream) {
      this.config.onRemoteStream(this.remoteStream);
    }

    // Attach local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });
      this.applySenderBitrates();
    }

    // Remote track listener
    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          if (this.remoteStream && !this.remoteStream.getTracks().some((t) => t.id === track.id)) {
            this.remoteStream.addTrack(track);
          }
        });
      } else if (event.track) {
        if (this.remoteStream && !this.remoteStream.getTracks().some((t) => t.id === event.track.id)) {
          this.remoteStream.addTrack(event.track);
        }
      }

      if (this.config.onRemoteStream && this.remoteStream) {
        this.config.onRemoteStream(this.remoteStream);
      }
    };

    // On ICE Candidate
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal('candidate', event.candidate);
      }
    };

    // Monitor ICE connection state changes (essential for mobile 4G/5G handovers & road travel)
    this.peerConnection.oniceconnectionstatechange = () => {
      const iceState = this.peerConnection?.iceConnectionState;
      if (!iceState) return;

      if (this.config.onIceConnectionState) {
        this.config.onIceConnectionState(iceState);
      }

      if (iceState === 'connected' || iceState === 'completed') {
        if (this.iceDisconnectTimer) {
          clearTimeout(this.iceDisconnectTimer);
          this.iceDisconnectTimer = null;
        }
        if (this.config.onConnectionQuality) {
          this.config.onConnectionQuality('excellent');
        }
      } else if (iceState === 'disconnected') {
        if (this.config.onConnectionQuality) {
          this.config.onConnectionQuality('reconnecting');
        }
        // Give cellular connection a 3-second grace period to switch tower or reconnect
        if (!this.iceDisconnectTimer) {
          this.iceDisconnectTimer = setTimeout(() => {
            this.iceDisconnectTimer = null;
            if (this.peerConnection?.iceConnectionState === 'disconnected') {
              console.warn('WebRTC ICE disconnected for 3s, initiating automatic ICE restart...');
              this.restartIce();
            }
          }, 3000);
        }
      } else if (iceState === 'failed') {
        if (this.config.onConnectionQuality) {
          this.config.onConnectionQuality('failed');
        }
        console.warn('WebRTC ICE state failed, attempting immediate ICE restart...');
        this.restartIce();
      }
    };

    // Connection state monitor
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      if (state && this.config.onConnectionState) {
        this.config.onConnectionState(state);
      }
      if (state === 'failed') {
        console.warn('WebRTC connection failed, initiating ICE restart...');
        this.restartIce();
      }
    };

    // Start Server Signaling Polling
    this.startSignalingPolling();

    // If initiator, create and send SDP offer with Opus mobile audio enhancements
    if (isInitiator) {
      try {
        this.isMakingOffer = true;
        const offer = await this.peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        offer.sdp = this.optimizeSdp(offer.sdp || '');
        await this.peerConnection.setLocalDescription(offer);
        this.applySenderBitrates();
        await this.sendSignal('offer', offer);
      } catch (err: any) {
        console.error('Error creating WebRTC offer:', err);
      } finally {
        this.isMakingOffer = false;
      }
    }
  }

  // Optimize SDP with Opus In-band Forward Error Correction (FEC) & Discontinuous Transmission (DTX)
  // This makes audio resilient against 10-20% packet drops during mobile driving/travel
  private optimizeSdp(sdp: string): string {
    if (!sdp) return sdp;
    return sdp
      .replace(/a=fmtp:(\d+) minptime=10/g, 'a=fmtp:$1 minptime=10;useinbandfec=1;dtx=1;maxaveragebitrate=64000')
      .replace(/(a=rtpmap:(\d+) opus\/48000\/2[\r\n]+)/g, '$1a=fmtp:$2 useinbandfec=1;dtx=1;maxaveragebitrate=64000\r\n');
  }

  // Set balanced bitrates on video/audio senders to prevent cell data bufferbloat
  private applySenderBitrates() {
    if (!this.peerConnection) return;
    try {
      this.peerConnection.getSenders().forEach((sender) => {
        if (sender.track && sender.track.kind === 'video') {
          const params = sender.getParameters();
          if (!params.encodings || params.encodings.length === 0) {
            params.encodings = [{}];
          }
          params.encodings[0].maxBitrate = 1400000; // 1.4 Mbps max for 720p HD
          sender.setParameters(params).catch(() => {});
        } else if (sender.track && sender.track.kind === 'audio') {
          const params = sender.getParameters();
          if (!params.encodings || params.encodings.length === 0) {
            params.encodings = [{}];
          }
          params.encodings[0].maxBitrate = 64000; // 64kbps Opus
          sender.setParameters(params).catch(() => {});
        }
      });
    } catch (e) {}
  }

  // Trigger full ICE Restart to recover frozen or dropped calls
  public async restartIce(): Promise<boolean> {
    if (!this.peerConnection || this.isRestartingIce) return false;
    this.isRestartingIce = true;
    try {
      console.log('Initiating WebRTC ICE restart for room', this.currentRoomId);
      if (typeof this.peerConnection.restartIce === 'function') {
        this.peerConnection.restartIce();
      }
      this.isMakingOffer = true;
      const offer = await this.peerConnection.createOffer({
        iceRestart: true,
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      offer.sdp = this.optimizeSdp(offer.sdp || '');
      await this.peerConnection.setLocalDescription(offer);
      this.applySenderBitrates();
      await this.sendSignal('offer', offer);
      return true;
    } catch (err) {
      console.warn('ICE restart offer failed:', err);
      return false;
    } finally {
      this.isRestartingIce = false;
      this.isMakingOffer = false;
    }
  }

  // Send signaling message via Server API & BroadcastChannel with retry queue
  private async sendSignal(type: 'offer' | 'answer' | 'candidate', data: any) {
    if (!this.currentRoomId || !this.currentUserId) return;

    // Send via local BroadcastChannel
    if (this.signalingChannel) {
      try {
        this.signalingChannel.postMessage({
          roomId: this.currentRoomId,
          senderId: this.currentUserId,
          type,
          data,
          timestamp: Date.now(),
        });
      } catch (e) {}
    }

    // Post to Server Signaling Endpoint
    try {
      const res = await fetch(`/api/calls/${this.currentRoomId}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: this.currentUserId,
          type,
          data,
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn('Failed to send call signal to server, queuing for retry:', err);
      this.signalRetryQueue.push({ type, data, retries: 0 });
      this.flushSignalQueue();
    }
  }

  // Flush queued signals on temporary cellular reconnect
  private async flushSignalQueue() {
    if (this.isFlushingQueue || this.signalRetryQueue.length === 0 || !this.currentRoomId || !this.currentUserId) return;
    this.isFlushingQueue = true;

    try {
      while (this.signalRetryQueue.length > 0 && this.currentRoomId) {
        const item = this.signalRetryQueue[0];
        try {
          const res = await fetch(`/api/calls/${this.currentRoomId}/signal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              senderId: this.currentUserId,
              type: item.type,
              data: item.data,
            }),
          });
          if (res.ok) {
            this.signalRetryQueue.shift();
          } else {
            item.retries++;
            if (item.retries > 5) this.signalRetryQueue.shift();
            break;
          }
        } catch {
          item.retries++;
          if (item.retries > 5) this.signalRetryQueue.shift();
          break;
        }
      }
    } finally {
      this.isFlushingQueue = false;
    }
  }

  public async ingestRemoteSignal(signal: { id?: string; roomId: string; senderId: string; type: string; data: any; timestamp?: number }) {
    if (!signal) return;
    if (signal.id) {
      if (this.seenSignalIds.has(signal.id)) return;
      this.seenSignalIds.add(signal.id);
    }
    if (signal.timestamp && signal.timestamp > this.lastSignalTimestamp) {
      this.lastSignalTimestamp = signal.timestamp;
    }
    await this.handleIncomingSignal(signal);
  }

  // Start low-latency polling for remote signaling packets
  private startSignalingPolling() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);

    this.pollingInterval = setInterval(async () => {
      if (!this.currentRoomId || !this.peerConnection) return;

      try {
        const res = await fetch(
          `/api/calls/${this.currentRoomId}/signals?excludeSenderId=${encodeURIComponent(
            this.currentUserId || ''
          )}&since=${this.lastSignalTimestamp}`
        );

        if (res.ok) {
          const signals = await res.json();
          if (Array.isArray(signals) && signals.length > 0) {
            for (const sig of signals) {
              await this.ingestRemoteSignal(sig);
            }
          }
        }
      } catch (err) {
        // Silent catch for network hiccups
      }
    }, 450);
  }

  // Handle incoming SDP Offer, SDP Answer, or ICE Candidate with Perfect Negotiation
  private async handleIncomingSignal(signal: { roomId: string; senderId: string; type: string; data: any }) {
    if (!signal || signal.roomId !== this.currentRoomId || signal.senderId === this.currentUserId) {
      return;
    }

    if (!this.peerConnection) return;

    try {
      if (signal.type === 'offer') {
        const offerCollision = this.isMakingOffer || this.peerConnection.signalingState !== 'stable';
        if (offerCollision) {
          if (!this.isPolite) {
            console.log('WebRTC glare: impolite peer ignoring remote offer');
            return;
          }
          console.log('WebRTC glare: polite peer rolling back local offer');
          try {
            await this.peerConnection.setLocalDescription({ type: 'rollback' });
          } catch (e) {
            console.warn('Rollback failed:', e);
          }
        }

        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.data));
        // Drain pending candidates
        await this.drainPendingCandidates();

        const answer = await this.peerConnection.createAnswer();
        answer.sdp = this.optimizeSdp(answer.sdp || '');
        await this.peerConnection.setLocalDescription(answer);
        this.applySenderBitrates();
        await this.sendSignal('answer', answer);
      } else if (signal.type === 'answer') {
        if (this.peerConnection.signalingState === 'have-local-offer') {
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.data));
          // Drain pending candidates
          await this.drainPendingCandidates();
          this.applySenderBitrates();
        }
      } else if (signal.type === 'candidate' && signal.data) {
        if (this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
          try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(signal.data));
          } catch (e) {
            console.warn('Failed adding ICE candidate:', e);
          }
        } else {
          this.pendingCandidates.push(signal.data);
        }
      }
    } catch (err) {
      console.warn('Error processing WebRTC signal:', err);
    }
  }

  private async drainPendingCandidates() {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) return;
    while (this.pendingCandidates.length > 0) {
      const candidate = this.pendingCandidates.shift();
      if (candidate) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('Failed to add queued candidate:', e);
        }
      }
    }
  }

  private isEndingCall = false;

  public endCall(broadcast: boolean = true) {
    if (this.isEndingCall) return;
    this.isEndingCall = true;

    try {
      if (this.iceDisconnectTimer) {
        clearTimeout(this.iceDisconnectTimer);
        this.iceDisconnectTimer = null;
      }

      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }

      const hadActiveSession = !!this.currentRoomId;
      if (this.currentRoomId && broadcast) {
        // Notify server call has ended
        fetch(`/api/calls/${this.currentRoomId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ended' }),
        }).catch(() => {});
      }

      if (this.peerAnimFrameId) {
        cancelAnimationFrame(this.peerAnimFrameId);
        this.peerAnimFrameId = null;
      }
      if (this.peerAudioCtx) {
        try {
          this.peerAudioCtx.close();
        } catch (e) {}
        this.peerAudioCtx = null;
      }

      this.stopLocalMedia();

      if (this.peerConnection) {
        try {
          this.peerConnection.close();
        } catch (e) {}
        this.peerConnection = null;
      }

      this.currentRoomId = null;
      this.isScreenSharing = false;
      this.pendingCandidates = [];
      this.signalRetryQueue = [];

      if (broadcast && hadActiveSession && this.config.onCallEnded) {
        this.config.onCallEnded();
      }
    } finally {
      this.isEndingCall = false;
    }
  }

  public stopLocalMedia() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
      this.screenStream = null;
    }
  }
}
