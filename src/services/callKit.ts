// Interface for PWA Incoming Call Kit
export interface CallKitContact {
  id: string;
  name: string;
  avatar?: string;
}

export interface CallKitCall {
  id: string;
  contact: CallKitContact;
  isVideo: boolean;
}

class CallKitService {
  private isInitialized = false;

  public async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    console.log('PWA CallKit initialized');
  }

  public async displayIncomingCall(call: CallKitCall) {
    if (typeof window !== 'undefined') {
      console.log('Simulating incoming call UI for PWA:', call);
      // In a PWA, we rely on the React IncomingCallBanner 
      // combined with the Service Worker push event (for background wake).
    }
  }

  public async showIncomingCall(callId: string, callerName: string, callerAvatar?: string, isVideo: boolean = false) {
    return this.displayIncomingCall({
      id: callId,
      contact: { id: callId, name: callerName, avatar: callerAvatar },
      isVideo,
    });
  }

  public async endCall(callId: string) {
    console.log('Call ended:', callId);
  }

  public async acceptCall(callId: string) {
    console.log('Call accepted natively (if supported):', callId);
  }
}

export const callKitService = new CallKitService();
