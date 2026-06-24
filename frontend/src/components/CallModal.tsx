import { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';

interface CallModalProps {
  currentUser: any;
  targetUser: any;
  peer: Peer;
  incomingCall: any;
  onClose: () => void;
}

export default function CallModal({ currentUser, targetUser, peer, incomingCall, onClose }: CallModalProps) {
  const [isCalling, setIsCalling] = useState(false);
  const [activeCall, setActiveCall] = useState<any>(null);
  
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const answerCall = async () => {
    if (!incomingCall) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (myVideoRef.current) myVideoRef.current.srcObject = stream;
      
      incomingCall.answer(stream);
      
      incomingCall.on('stream', (remoteStream: any) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      });
      
      setActiveCall(incomingCall);
      setIsCalling(true);
    } catch (err) {
      console.error('Failed to answer call', err);
    }
  };

  const startCall = async () => {
    if (!peer) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (myVideoRef.current) myVideoRef.current.srcObject = stream;
      
      const call = peer.call(targetUser.id, stream);
      
      call.on('stream', (remoteStream) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      });
      
      setActiveCall(call);
      setIsCalling(true);
    } catch (err) {
      console.error('Failed to start call', err);
    }
  };

  const handleEndCall = () => {
    // Stop local video/audio tracks
    if (myVideoRef.current && myVideoRef.current.srcObject) {
      const stream = myVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    // Stop remote video/audio tracks
    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      const stream = remoteVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    // Close the PeerJS connection
    if (activeCall) {
      activeCall.close();
    }
    // Tell parent to close modal
    onClose();
  };

  useEffect(() => {
    if (activeCall) {
      const handleRemoteClose = () => {
        handleEndCall();
      };
      activeCall.on('close', handleRemoteClose);
      return () => {
        activeCall.off('close', handleRemoteClose);
      };
    }
  }, [activeCall]);

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/70 to-transparent text-white">
        <div>
          <h2 className="text-2xl font-bold tracking-wide">Video Call</h2>
          <p className="text-gray-300 font-medium">with {targetUser.username}</p>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative bg-black flex items-center justify-center">
        {/* Remote Video - Takes up background */}
        <video 
          ref={remoteVideoRef} 
          autoPlay 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover" 
        />
        
        {/* Local Video - PiP in bottom right */}
        <div className="absolute bottom-24 right-6 w-32 h-48 md:w-48 md:h-72 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-600 z-10 transition-transform hover:scale-105 duration-300">
          <video 
            ref={myVideoRef} 
            autoPlay 
            muted 
            playsInline 
            className="w-full h-full object-cover" 
          />
          <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm">
            You
          </span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center items-center gap-8 z-20 bg-gradient-to-t from-black/80 to-transparent pb-10">
        {!isCalling && !incomingCall && (
          <button 
            onClick={startCall} 
            className="bg-green-500 text-white p-5 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)] hover:bg-green-600 hover:scale-110 transition-all"
            title="Start Call"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4l4-3v8l-4-3v4a2 2 0 01-2 2H4a2 2 0 01-2-2V5z"/>
            </svg>
          </button>
        )}
        
        {!isCalling && incomingCall && (
          <button 
            onClick={answerCall} 
            className="bg-blue-500 text-white p-5 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:bg-blue-600 hover:scale-110 transition-all animate-bounce"
            title="Answer Call"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4l4-3v8l-4-3v4a2 2 0 01-2 2H4a2 2 0 01-2-2V5z"/>
            </svg>
          </button>
        )}

        <button 
          onClick={handleEndCall} 
          className="bg-red-500 text-white p-5 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:bg-red-600 hover:scale-110 transition-all"
          title="End Call"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
