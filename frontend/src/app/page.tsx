'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { initSocket } from '../lib/socket';
import ChatWindow from '../components/ChatWindow';
import CallModal from '../components/CallModal';
import Peer from 'peerjs';

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [activeUser, setActiveUser] = useState<any>(null);
  const activeUserIdRef = useRef<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [showCallModal, setShowCallModal] = useState(false);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [callTargetUser, setCallTargetUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userStr);
    setCurrentUser(user);

    // Init socket
    const socket = initSocket();
    socket.connect();
    socket.emit('join', user.id);

    // Fetch other users
    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/auth/users');
        setUsers(res.data.filter((u: any) => u.id !== user.id));
      } catch (err) {
        console.error('Failed to fetch users', err);
      }
    };

    fetchUsers();

    const handleGlobalMessage = (msg: any) => {
      setUsers(currentUsers => {
        const index = currentUsers.findIndex(u => u.id === msg.senderId);
        if (index > 0) {
          const newUsers = [...currentUsers];
          const [u] = newUsers.splice(index, 1);
          newUsers.unshift(u);
          return newUsers;
        }
        return currentUsers;
      });

      if (msg.senderId !== user.id && msg.senderId !== activeUserIdRef.current) {
        setUnreadCounts(prev => ({
          ...prev,
          [msg.senderId]: (prev[msg.senderId] || 0) + 1
        }));
      }
    };
    socket.on('newMessage', handleGlobalMessage);

    // Init global PeerJS connection
    const newPeer = new Peer(user.id);
    
    newPeer.on('call', (call) => {
      setIncomingCall(call);
      setShowCallModal(true);
      
      setUsers(currentUsers => {
        const caller = currentUsers.find(u => u.id === call.peer);
        if (caller) {
          setCallTargetUser(caller);
        } else {
          setCallTargetUser({ id: call.peer, username: 'Incoming Caller' });
        }
        return currentUsers;
      });
    });

    setPeer(newPeer);

    return () => {
      socket.off('newMessage', handleGlobalMessage);
      socket.disconnect();
      newPeer.destroy();
    };
  }, [router]);

  if (!currentUser) return <div className="p-10 text-center">Loading...</div>;

  const handleMessageSent = (targetId: string) => {
    setUsers(currentUsers => {
      const index = currentUsers.findIndex(u => u.id === targetId);
      if (index > 0) {
        const newUsers = [...currentUsers];
        const [u] = newUsers.splice(index, 1);
        newUsers.unshift(u);
        return newUsers;
      }
      return currentUsers;
    });
  };

  return (
    <div className="h-screen flex bg-gray-900 overflow-hidden text-gray-100">
      {/* Sidebar */}
      <div className={`${activeUser ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 md:max-w-sm bg-gray-900 border-r border-gray-800 flex-col h-full`}>
        <div className="p-6 border-b border-gray-800 bg-gray-900 flex justify-between items-center min-h-[72px]">
          <h1 className="font-extrabold text-2xl text-white tracking-tight">Messages</h1>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Available Users</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {users.map(u => (
            <div 
              key={u.id}
              onClick={() => {
                setActiveUser(u);
                activeUserIdRef.current = u.id;
                setUnreadCounts(prev => ({ ...prev, [u.id]: 0 }));
              }}
              className={`mx-3 mb-1 p-3 rounded-xl cursor-pointer transition-all flex justify-between items-center ${activeUser?.id === u.id ? 'bg-indigo-500/15 shadow-sm ring-1 ring-indigo-500/30' : 'hover:bg-gray-800/50'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${activeUser?.id === u.id ? 'bg-indigo-500' : 'bg-gray-700'}`}>
                  {u.username.charAt(0).toUpperCase()}
                </div>
                <div className={`font-semibold ${activeUser?.id === u.id ? 'text-indigo-200' : 'text-gray-300'}`}>{u.username}</div>
              </div>
              {unreadCounts[u.id] > 0 && (
                <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                  {unreadCounts[u.id]}
                </div>
              )}
            </div>
          ))}
          {users.length === 0 && (
            <div className="p-4 text-gray-500 text-center text-sm">No other users found. Register another account in an incognito window!</div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-800 bg-gray-900">
          <button 
            onClick={() => {
              localStorage.clear();
              router.push('/login');
            }}
            className="w-full text-red-400 py-2.5 rounded-lg font-bold hover:bg-red-500/10 hover:text-red-300 transition-colors flex justify-center items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Logout
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`${!activeUser ? 'hidden md:flex' : 'flex'} flex-1 flex-col h-full bg-gray-950`}>
        {activeUser ? (
          <div className="flex-1 flex flex-col relative h-full">
            <ChatWindow 
              currentUser={currentUser} 
              targetUser={activeUser} 
              onBack={() => {
                setActiveUser(null);
                activeUserIdRef.current = null;
              }}
              onCall={() => {
                setCallTargetUser(activeUser);
                setIncomingCall(null);
                setShowCallModal(true);
              }}
              onMessageSent={() => handleMessageSent(activeUser.id)}
            />
            
            {showCallModal && peer && callTargetUser && (
              <CallModal 
                currentUser={currentUser} 
                targetUser={callTargetUser} 
                peer={peer}
                incomingCall={incomingCall}
                onClose={() => {
                  setShowCallModal(false);
                  setIncomingCall(null);
                  setCallTargetUser(null);
                }} 
              />
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 flex-col gap-4">
            <h2 className="text-2xl font-bold text-gray-600">Welcome to JustChillin</h2>
            <p>Select a user from the sidebar to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
