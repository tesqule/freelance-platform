import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const IcoSearch = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>;
const IcoSend   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IcoBack   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>;
const IcoMsg    = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;

export default function ChatPage() {
  const { user } = useAuth();
  const [searchParams]  = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [messages,      setMessages]      = useState([]);
  const [currentRoom,   setCurrentRoom]   = useState(null);
  const [currentOther,  setCurrentOther]  = useState(null);
  const [msgText,       setMsgText]       = useState('');
  const [convSearch,    setConvSearch]    = useState('');
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [unreadCounts,  setUnreadCounts]  = useState({});
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const socketRef      = useRef(null);
  const currentRoomRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const s = io(SOCKET_URL);
    socketRef.current = s;

    s.on('receive_message', msg => {
      if (msg.room === currentRoomRef.current) {
        setMessages(prev => [...prev, msg]);
      } else {
        setUnreadCounts(prev => ({ ...prev, [msg.room]: (prev[msg.room] || 0) + 1 }));
      }
    });

    loadConversations().then(() => {
      const targetUser    = searchParams.get('user');
      const targetService = searchParams.get('service');
      const targetTask    = searchParams.get('task');
      if (targetUser) openChatWithContext(targetUser, s, targetService, targetTask);
    });

    return () => s.disconnect();
  }, [user]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  async function loadConversations() {
    try {
      const { data }   = await API.get('/chat/conversations/list');
      const counts     = await API.get('/chat/unread/counts').then(r => r.data).catch(() => ({}));
      setUnreadCounts(counts);
      const withUsers  = await Promise.all(data.map(async conv => {
        const parts   = conv._id.split('_');
        const otherId = parts.find(p => p !== user.id);
        if (!otherId) return null;
        try { const { data: other } = await API.get(`/users/${otherId}`); return { ...conv, other }; }
        catch { return null; }
      }));
      setConversations(withUsers.filter(Boolean));
    } catch {}
  }

  async function openChatWithContext(userId, s, serviceId, taskId) {
    if (!userId || userId === user.id) return;
    const room = [user.id, userId].sort().join('_');
    setUnreadCounts(prev => ({ ...prev, [room]:0 }));
    setCurrentRoom(room);
    currentRoomRef.current = room;
    setMobileOpen(true);

    const sock = s || socketRef.current;
    try {
      const { data: other } = await API.get(`/users/${userId}`);
      setCurrentOther(other);
      if (sock) sock.emit('join_room', room);
      const { data: msgs } = await API.get(`/chat/${room}`);
      setMessages(msgs);
      setConversations(prev => prev.find(c => c.other?._id === userId) ? prev : [{ _id:room, lastMessage:'', other }, ...prev]);

      if (serviceId && sock) {
        try {
          const { data: svcs } = await API.get('/services');
          const svc = svcs.find(s => s._id === serviceId);
          if (svc) sock.emit('send_message', { room, senderId:user.id, text:`Здравствуйте! Хочу заказать услугу:\n"${svc.title}"\nСтоимость: ₽${svc.price?.toLocaleString()} · Срок ${svc.deliveryDays} дн.\nКогда можно начать?` });
        } catch {}
      }
      if (taskId && sock) {
        try {
          const { data: task } = await API.get(`/tasks/${taskId}`);
          if (task) sock.emit('send_message', { room, senderId:user.id, text:`Здравствуйте! Хочу откликнуться на задание:\n"${task.title}"\nБюджет: ₽${task.budget?.toLocaleString()}\nГотов обсудить детали.` });
        } catch {}
      }
    } catch {}
  }

  async function openChat(userId) { await openChatWithContext(userId, socketRef.current, null, null); }

  function sendMessage() {
    const text = msgText.trim();
    if (!text || !currentRoom || !socketRef.current) return;
    socketRef.current.emit('send_message', { room:currentRoom, senderId:user.id, text });
    setMsgText('');
    inputRef.current?.focus();
  }

  function handleKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }

  const filteredConvs = conversations.filter(c => c.other?.name?.toLowerCase().includes(convSearch.toLowerCase()));

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <div className={`chat-sidebar${mobileOpen ? ' hide-mobile' : ''}`}>
        <div className="chat-sidebar-header">Сообщения</div>

        {/* Search conversations */}
        <div style={{ padding:'.6rem .85rem', borderBottom:'1px solid var(--b1)' }}>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:'.6rem', top:'50%', transform:'translateY(-50%)', color:'var(--t3)', display:'flex' }}><IcoSearch/></span>
            <input value={convSearch} onChange={e => setConvSearch(e.target.value)} placeholder="Поиск по переписке..."
              style={{ width:'100%', background:'var(--s1)', border:'1px solid var(--b1)', borderRadius:'var(--r)', padding:'.4rem .75rem .4rem 2rem', fontFamily:'var(--font)', fontSize:'.78rem', color:'var(--t1)', outline:'none', boxSizing:'border-box' }}/>
          </div>
        </div>

        {/* Conversation list */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {filteredConvs.length === 0 ? (
            <div style={{ padding:'2rem 1rem', textAlign:'center', color:'var(--t3)', fontSize:'.8rem' }}>
              {convSearch ? 'Не найдено' : 'Нет переписок'}
            </div>
          ) : filteredConvs.map(conv => {
            const room    = [user.id, conv.other._id].sort().join('_');
            const unread  = unreadCounts[room] || 0;
            const isActive = room === currentRoom;
            return (
              <div key={conv.other._id} className={`conv-item${isActive ? ' active' : ''}`}
                onClick={() => openChat(conv.other._id)}>
                <div className="avatar" style={{ width:38, height:38, fontSize:'.9rem', flexShrink:0 }}>
                  {conv.other.avatar
                    ? <img src={conv.other.avatar} style={{ width:38, height:38, borderRadius:'50%', objectFit:'cover' }} alt=""/>
                    : conv.other.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="conv-name" style={unread > 0 ? { color:'var(--t1)', fontWeight:700 } : {}}>{conv.other.name}</div>
                  <div className="conv-preview">{conv.lastMessage || '—'}</div>
                </div>
                {unread > 0 && (
                  <span style={{ background:'var(--t1)', color:'var(--bg)', borderRadius:99, fontSize:'.6rem', fontWeight:700, minWidth:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 5px', flexShrink:0 }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main chat area */}
      <div className={`chat-main${mobileOpen && currentOther ? ' show-mobile' : ''}`}>
        {!currentOther ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:'.75rem' }}>
            <div style={{ color:'var(--t4)' }}><IcoMsg/></div>
            <div style={{ fontSize:'.875rem', color:'var(--t3)', fontWeight:500 }}>Выберите диалог</div>
            <div style={{ fontSize:'.78rem', color:'var(--t4)' }}>или начните из карточки задания / профиля</div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="chat-header">
              <button className="icon-btn" onClick={() => { setMobileOpen(false); setCurrentOther(null); }} style={{ flexShrink:0 }}><IcoBack/></button>
              <div className="avatar" style={{ width:36, height:36, fontSize:'.85rem', flexShrink:0 }}>
                {currentOther.avatar
                  ? <img src={currentOther.avatar} style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover' }} alt=""/>
                  : currentOther.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:'.875rem' }}>{currentOther.name}</div>
                <div style={{ fontSize:'.7rem', color:'var(--t3)' }}>
                  {currentOther.role === 'client' ? 'Заказчик' : 'Фрилансер'}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div style={{ textAlign:'center', color:'var(--t3)', fontSize:'.82rem', margin:'auto' }}>
                  Начните общение
                </div>
              ) : messages.map((msg, i) => {
                const isOwn = msg.sender?._id === user.id || msg.sender === user.id;
                const showName = !isOwn && (i === 0 || messages[i-1]?.sender?._id !== msg.sender?._id);
                return (
                  <div key={i} className={`msg-bubble ${isOwn ? 'own' : 'other'}`}>
                    {showName && (
                      <div style={{ fontSize:'.68rem', color:'var(--t3)', padding:'0 .2rem .08rem' }}>{msg.sender?.name}</div>
                    )}
                    <div className="bubble-text" style={{ whiteSpace:'pre-wrap' }}>{msg.text}</div>
                    <div className="bubble-time">
                      {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour:'2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef}/>
            </div>

            {/* Input */}
            <div className="chat-input-bar">
              <textarea ref={inputRef} className="chat-input" placeholder="Написать сообщение..." rows={1}
                value={msgText} onChange={e => setMsgText(e.target.value)} onKeyDown={handleKey}/>
              <button className="btn btn-primary" onClick={sendMessage}
                style={{ width:38, height:38, padding:0, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <IcoSend/>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
