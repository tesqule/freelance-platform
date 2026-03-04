const SOCKET_URL = 'https://freelance-platform-production-2360.up.railway.app';

let socket = null;
let currentRoom = null;
let currentChatUser = null;
const loadedUsers = {};

function initChat() {
  const user = getCurrentUser();
  socket = io(SOCKET_URL);

  socket.on('receive_message', (msg) => {
    if (msg.room === currentRoom) {
      appendMessage(msg, user.id);
      scrollToBottom();
    } else {
      const senderName = msg.sender?.name || 'Кто-то';
      const preview = msg.text?.length > 40 ? msg.text.slice(0, 40) + '…' : msg.text;
      addNotification(`💬 ${senderName}: ${preview}`, '💬', 'chat.html');
      showToast(`Новое сообщение от ${senderName}`, 'info');
    }
  });

  loadConversations();
}

async function loadConversations() {
  try {
    const convs = await apiAuth('/chat/conversations/list');
    const user = getCurrentUser();
    const container = document.getElementById('conversationsList');

    if (!convs.length) {
      container.innerHTML = `<div style="padding:1.5rem; text-align:center; color:var(--text3); font-size:0.85rem;">Нет переписок</div>`;
      return;
    }

    const items = await Promise.all(convs.map(async (conv) => {
      const parts = conv._id.split('_');
      const otherId = parts.find(p => p !== user.id);
      if (!otherId) return null;
      try {
        const other = loadedUsers[otherId] || await api(`/users/${otherId}`);
        loadedUsers[otherId] = other;
        return { ...conv, other };
      } catch(e) { return null; }
    }));

    container.innerHTML = items.filter(Boolean).map(item => `
      <div class="conversation-item" id="conv-${item.other._id}" onclick="openChatWith('${item.other._id}')">
        <div class="avatar" style="width:42px;height:42px;font-size:1rem;flex-shrink:0;background:linear-gradient(135deg,var(--blue),var(--purple));">
          ${item.other.avatar ? `<img src="${item.other.avatar}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;">` : item.other.name.charAt(0)}
        </div>
        <div class="conv-info">
          <div class="conv-name">${item.other.name}</div>
          <div class="conv-preview">${item.lastMessage || '...'}</div>
        </div>
      </div>`).join('');
  } catch(e) {}
}

async function openChatWith(userId) {
  const user = getCurrentUser();
  if (!userId || userId === user.id) return;

  document.querySelectorAll('.conversation-item').forEach(el => el.classList.remove('active'));
  document.getElementById(`conv-${userId}`)?.classList.add('active');

  try {
    const other = loadedUsers[userId] || await api(`/users/${userId}`);
    loadedUsers[userId] = other;
    currentChatUser = other;

    const ids = [user.id, userId].sort();
    currentRoom = ids.join('_');

    document.getElementById('chatMain').innerHTML = `
      <div class="chat-header">
        <div class="avatar" style="width:40px;height:40px;font-size:1rem;background:linear-gradient(135deg,var(--blue),var(--purple));">
          ${other.avatar ? `<img src="${other.avatar}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">` : other.name.charAt(0)}
        </div>
        <div>
          <div style="font-weight:600;">${other.name}</div>
          <div class="text-xs text-muted">${other.role === 'client' ? '📋 Заказчик' : '💼 Фрилансер'}</div>
        </div>
      </div>
      <div class="chat-messages" id="chatMessages"></div>
      <div class="chat-input-area">
        <textarea class="chat-input" id="msgInput" placeholder="Написать сообщение..." rows="1"
          onkeydown="handleMsgKey(event)"></textarea>
        <button class="btn btn-primary" onclick="sendMessage()" style="border-radius:50%;width:44px;height:44px;padding:0;flex-shrink:0;">➤</button>
      </div>`;

    socket.emit('join_room', currentRoom);
    loadMessages();

    if (!document.getElementById(`conv-${userId}`)) {
      const container = document.getElementById('conversationsList');
      const div = document.createElement('div');
      div.id = `conv-${userId}`;
      div.className = 'conversation-item active';
      div.onclick = () => openChatWith(userId);
      div.innerHTML = `
        <div class="avatar" style="width:42px;height:42px;font-size:1rem;flex-shrink:0;background:linear-gradient(135deg,var(--blue),var(--purple));">
          ${other.avatar ? `<img src="${other.avatar}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;">` : other.name.charAt(0)}
        </div>
        <div class="conv-info">
          <div class="conv-name">${other.name}</div>
          <div class="conv-preview">Начните общение...</div>
        </div>`;
      container.prepend(div);
    }
  } catch(e) {
    showToast('Ошибка загрузки чата', 'error');
  }
}

async function loadMessages() {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:0.65rem;">
      ${Array.from({length:4}, (_, i) => `
        <div style="display:flex;flex-direction:column;align-items:${i%2===0?'flex-start':'flex-end'};gap:0.2rem;">
          <div class="skeleton" style="height:40px;width:${150+Math.random()*100|0}px;border-radius:16px;"></div>
        </div>
      `).join('')}
    </div>`;

  try {
    const messages = await apiAuth(`/chat/${currentRoom}`);
    const user = getCurrentUser();

    if (!messages.length) {
      container.innerHTML = `<div style="text-align:center; color:var(--text3); font-size:0.85rem; margin:auto;">Начните общение 👋</div>`;
      return;
    }

    container.innerHTML = messages.map(msg => buildBubble(msg, user.id)).join('');
    scrollToBottom();
  } catch(e) {}
}

function buildBubble(msg, myId) {
  const isOwn = msg.sender._id === myId || msg.sender === myId;
  const name = msg.sender.name || '';
  const time = formatTime(msg.createdAt);
  return `
    <div class="message-bubble ${isOwn ? 'own' : 'other'}">
      ${!isOwn ? `<div class="text-xs text-muted" style="padding:0 0.25rem 0.1rem;">${name}</div>` : ''}
      <div class="bubble-text">${escapeHtml(msg.text)}</div>
      <div class="bubble-meta">${time}</div>
    </div>`;
}

function appendMessage(msg, myId) {
  const container = document.getElementById('chatMessages');
  if (!container) return;
  const placeholder = container.querySelector('[style*="Начните общение"]');
  if (placeholder) placeholder.remove();
  container.insertAdjacentHTML('beforeend', buildBubble(msg, myId));
}

function sendMessage() {
  const input = document.getElementById('msgInput');
  const text = input?.value?.trim();
  if (!text || !currentRoom) return;

  const user = getCurrentUser();
  socket.emit('send_message', {
    room: currentRoom,
    senderId: user.id,
    text
  });

  input.value = '';
  input.style.height = 'auto';
}

function handleMsgKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
  const ta = e.target;
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
}

function scrollToBottom() {
  const el = document.getElementById('chatMessages');
  if (el) el.scrollTop = el.scrollHeight;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}