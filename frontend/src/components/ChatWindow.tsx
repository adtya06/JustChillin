import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { getSocket } from '../lib/socket';
import { db } from '../lib/dexie';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

interface ChatWindowProps {
  currentUser: any;
  targetUser: any;
  onBack?: () => void;
  onCall?: () => void;
  onMessageSent?: () => void;
}

export default function ChatWindow({ currentUser, targetUser, onBack, onCall, onMessageSent }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchOrCreateConversation = async () => {
      try {
        const res = await axios.post('http://localhost:5000/api/messages/conversation', {
          currentUserId: currentUser.id,
          targetUserId: targetUser.id
        });
        setConversationId(res.data.id);
        
        // Fetch historical messages from API or Dexie
        const apiMessages = await axios.get(`http://localhost:5000/api/messages/${res.data.id}`);
        setMessages(apiMessages.data);
        
        // Cache them in Dexie
        apiMessages.data.forEach((m: any) => {
          db.messages.put({
            messageId: m.id,
            conversationId: m.conversationId,
            senderId: m.senderId,
            text: m.text,
            createdAt: m.createdAt
          });
        });
        
      } catch (error) {
        console.error('Error fetching conversation', error);
      }
    };

    fetchOrCreateConversation();
  }, [targetUser, currentUser]);

  useEffect(() => {
    const socket = getSocket();
    
    const handleNewMessage = (msg: any) => {
      if (msg.conversationId === conversationId) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.find(m => m.id === msg.id || (m.createdAt === msg.createdAt && m.text === msg.text))) return prev;
          return [...prev, msg];
        });
        db.messages.put({
          messageId: msg.id || Date.now().toString(),
          conversationId: msg.conversationId,
          senderId: msg.senderId,
          text: msg.text,
          createdAt: msg.createdAt
        });
      }
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [conversationId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !conversationId) return;

    const text = input.trim();
    setInput('');
    
    // Optimistic UI update
    const tempMsg = {
      id: Date.now().toString(),
      conversationId,
      senderId: currentUser.id,
      text,
      createdAt: new Date().toISOString()
    };
    
    try {
      const res = await axios.post('http://localhost:5000/api/messages', {
        conversationId,
        senderId: currentUser.id,
        text
      });
      
      const socket = getSocket();
      socket.emit('sendMessage', {
        message: res.data,
        receiverIds: [targetUser.id]
      });

      if (onMessageSent) {
        onMessageSent();
      }

    } catch (err) {
      console.error('Error sending message', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 shadow-sm sm:rounded-lg border-x sm:border border-gray-800">
      <div className="p-4 border-b border-gray-800 bg-gray-900 flex justify-between items-center min-h-[72px] shadow-sm z-10">
        <div className="flex items-center">
          {onBack && (
            <button 
              onClick={onBack} 
              className="mr-3 md:hidden text-gray-400 hover:text-white transition p-2 rounded-full hover:bg-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 font-bold">
              {targetUser.username.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-lg font-bold text-gray-100">{targetUser.username}</h3>
          </div>
        </div>
        
        {onCall && (
          <button 
            onClick={onCall}
            className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 font-bold flex items-center gap-2 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/></svg>
            <span className="hidden sm:inline">Video Call</span>
          </button>
        )}
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto bg-gray-950">
        <div className="space-y-6">
          {messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUser.id;
            return (
              <div 
                key={idx} 
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`px-5 py-3.5 max-w-xs md:max-w-md shadow-sm ${
                    isMe 
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl rounded-tr-sm' 
                      : 'bg-gray-800 text-gray-100 border border-gray-700/50 rounded-2xl rounded-tl-sm'
                  }`}
                >
                  <p className="leading-relaxed">{msg.text}</p>
                  <span className={`text-[10px] mt-1 block opacity-70 ${isMe ? 'text-right text-blue-100' : 'text-left text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <form onSubmit={handleSend} className="relative flex items-center max-w-4xl mx-auto">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Message..."
            className="flex-1 bg-gray-800 text-white placeholder-gray-400 border-transparent focus:bg-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 p-4 pr-16 rounded-full transition-all outline-none"
          />
          <button 
            type="submit" 
            disabled={!input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2.5 rounded-full shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-5 h-5 ml-0.5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
