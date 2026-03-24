import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function ChatPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [socket, setSocket]             = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages]         = useState([]);
  const [currentRoom, setCurrentRoom]   = useState(null);
  const [currentOther, setCurrentOther] = useState(null);
  const [msgText, setMsgText]           = useState('');
  const [convSearch, setConvSearch]     = useState('');
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const socketRef      = useRef(null);
  const currentRoomRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const s = io(SOCKET_URL);
    socketRef.current = s;
    setSocket(s);

    s.on('receive_message', (msg) => {
      if (msg.room === currentRoomRef.current) {
        setMessages(prev => [...prev, msg]);
      } else {
        setUnreadCounts(prev => ({ ...prev, [msg.room]: (prev[msg.room] || 0) + 1 }));
      }
    });

    loadConversations().then(() => {
      // Открываем чат с нужным юзером после загрузки
      const targetUser    = searchParams.get('user');
      const targetService = searchParams.get('service');
      const targetTask    = searchParams.get('task');
      if (targetUser) openChatWithContext(targetUser, s, targetService, targetTask);
    });

    return () => s.disconnect();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadConversations() {
    try {
      const { data } = await API.get('/chat/conversations/list');
      const counts   = await API.get('/chat/unread/counts').then(r => r.data).catch(() => ({}));
      setUnreadCounts(counts);
      const withUsers = await Promise.all(data.map(async conv => {
        const parts   = conv._id.split('_');
        const otherId = parts.find(p => p !== user.id);
        if (!otherId) return null;
        try {
          const { data: other } = await API.get(`/users/${otherId}`);
          return { ...conv, other };
        } catch { return null; }
      }));
      setConversations(withUsers.filter(Boolean));
    } catch {}
  }

  // Открыть чат с контекстом (услуга или задание)
  async function openChatWithContext(userId, s, serviceId, taskId) {
    if (!userId || userId === user.id) return;
    const room = [user.id, userId].sort().join('_');
    setUnreadCounts(prev => ({ ...prev, [room]: 0 }));
    setCurrentRoom(room);
    currentRoomRef.current = room;
    setMobileOpen(true);

    const sock = s || socketRef.current;

    try {
      const { data: other } = await API.get(`/users/${userId}`);
      setCurrentOther(other);

      if (sock) {
        sock.emit('join_room', room);
      }

      const { data: msgs } = await API.get(`/chat/${room}`);
      setMessages(msgs);

      setConversations(prev => {
        if (prev.find(c => c.other?._id === userId)) return prev;
        return [{ _id: room, lastMessage: '', other }, ...prev];
      });

      // Отправляем контекстное сообщение если передан serviceId или taskId
      if (serviceId && sock) {
        try {
          const { data: svc } = await API.get(`/services`).then(r => ({
            data: r.data.find(s => s._id === serviceId)
          }));
          if (svc) {
            const text = `Здравствуйте! Хочу заказать вашу услугу:\n🛠 "${svc.title}"\n💰 Стоимость: ₽${svc.price?.toLocaleString()} · ⏱ ${svc.deliveryDays} дн.\nКогда сможете начать?`;
            sock.emit('send_message', { room, senderId: user.id, text });
          }
        } catch {}
      }

      if (taskId && sock) {
        try {
          const { data: task } = await API.get(`/tasks/${taskId}`);
          if (task) {
            const text = `Здравствуйте! Хочу откликнуться на ваше задание:\n📋 "${task.title}"\n💰 Бюджет: ₽${task.budget?.toLocaleString()}\nГотов обсудить детали.`;
            sock.emit('send_message', { room, senderId: user.id, text });
          }
        } catch {}
      }

    } catch {}
  }

  async function openChat(userId) {
    await openChatWithContext(userId, socketRef.current, null, null);
  }

  function sendMessage() {
    const text = msgText.trim();
    if (!text || !currentRoom || !socketRef.current) return;
    socketRef.current.emit('send_message', { room: currentRoom, senderId: user.id, text });
    setMsgText('');
    inputRef.current?.focus();
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const filteredConvs = conversations.filter(c =>
    c.other?.name?.toLowerCase().includes(convSearch.toLowerCase())
  );

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <div className={`chat-sidebar${mobileOpen ? ' hide-mobile' : ''}`}>
        <div className="chat-sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <span style={{ fontSize: '1.1rem' }}>💬</span>
            <span>Сообщения</span>
          </div>
        </div>
        <div style={{ padding: '.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative' }}>
            <input value={convSearch} onChange={e => setConvSearch(e.target.value)} placeholder="Поиск..."
              style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 99, padding: '.42rem .9rem .42rem 2rem', fontFamily: 'var(--font-body)', fontSize: '.8rem', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} />
            <span style={{ position: 'absolute', left: '.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: '.85rem', pointerEvents: 'none' }}>⌕</span>
          </div>
        </div>
        <div>
          {filteredConvs.length === 0
            ? <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text3)', fontSize: '.85rem' }}>Нет переписок</div>
            : filteredConvs.map(conv => {
              const room    = [user.id, conv.other._id].sort().join('_');
              const unread  = unreadCounts[room] || 0;
              const isActive = room === currentRoom;
              return (
                <div key={conv.other._id} className={`conversation-item${isActive ? ' active' : ''}`} onClick={() => openChat(conv.other._id)}>
                  <div className="avatar" style={{ width: 42, height: 42, fontSize: '1rem', flexShrink: 0, background: 'linear-gradient(135deg,var(--blue),var(--purple))' }}>
                    {conv.other.avatar
                      ? <img src={conv.other.avatar} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} />
                      : conv.other.name?.charAt(0)}
                  </div>
                  <div className="conv-info" style={{ flex: 1, minWidth: 0 }}>
                    <div className="conv-name" style={unread > 0 ? { fontWeight: 700 } : {}}>{conv.other.name}</div>
                    <div className="conv-preview" style={unread > 0 ? { color: 'var(--text2)' } : {}}>{conv.lastMessage || '...'}</div>
                  </div>
                  {unread > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--blue)', color: '#fff', borderRadius: 99, fontSize: '.65rem', fontWeight: 700, minWidth: 18, height: 18, padding: '0 5px', flexShrink: 0 }}>
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </div>
              );
            })
          }
        </div>
      </div>

      {/* Main */}
      <div className={`chat-main${mobileOpen && currentOther ? ' show-mobile' : ''}`}>
        {!currentOther ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '.75rem', opacity: .4 }}>💬</div>
            <div style={{ fontSize: '.95rem', color: 'var(--text3)', fontWeight: 500 }}>Выберите диалог</div>
            <div style={{ fontSize: '.8rem', color: 'var(--text3)', marginTop: '.3rem' }}>или начните новый из карточки задания</div>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <button className="btn btn-ghost btn-sm" onClick={() => { setMobileOpen(false); setCurrentOther(null); }}>← Назад</button>
              <div className="avatar" style={{ width: 40, height: 40, fontSize: '1rem', background: 'linear-gradient(135deg,var(--blue),var(--purple))' }}>
                {currentOther.avatar
                  ? <img src={currentOther.avatar} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                  : currentOther.name?.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{currentOther.name}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>
                  {currentOther.role === 'client' ? '📋 Заказчик' : '💼 Фрилансер'}
                </div>
              </div>
            </div>

            <div className="chat-messages">
              {messages.length === 0
                ? <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '.85rem', margin: 'auto' }}>Начните общение 👋</div>
                : messages.map((msg, i) => {
                  const isOwn = msg.sender?._id === user.id || msg.sender === user.id;
                  return (
                    <div key={i} className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
                      {!isOwn && (
                        <div style={{ fontSize: '.75rem', color: 'var(--text3)', padding: '0 .25rem .1rem' }}>
                          {msg.sender?.name}
                        </div>
                      )}
                      <div className="bubble-text" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                      <div className="bubble-meta">
                        {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              }
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <textarea ref={inputRef} className="chat-input" placeholder="Написать сообщение..." rows={1}
                value={msgText} onChange={e => setMsgText(e.target.value)} onKeyDown={handleKey}
                style={{ resize: 'none' }} />
              <button className="btn btn-primary" onClick={sendMessage}
                style={{ borderRadius: '50%', width: 44, height: 44, padding: 0, flexShrink: 0 }}>➤</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}