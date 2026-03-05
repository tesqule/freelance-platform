async function sendTelegramMessage(chatId, text) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
    const data = await res.json();
    if (!data.ok) console.error('❌ Telegram send error:', data.description);
  } catch(e) {
    console.error('❌ Telegram send error:', e.message);
  }
}

let lastUpdateId = 0;
let isPolling = false;

async function pollTelegram() {
  if (isPolling) return;
  isPolling = true;
  
  if (!process.env.TELEGRAM_BOT_TOKEN) { isPolling = false; return; }
  
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=25`,
      { signal: AbortSignal.timeout(30000) }
    );
    const data = await res.json();

    if (!data.ok) {
      // Если конфликт — ждём дольше перед следующей попыткой
      if (data.error_code === 409) {
        await new Promise(r => setTimeout(r, 10000));
      }
      isPolling = false;
      return;
    }

    for (const update of data.result || []) {
      lastUpdateId = update.update_id;
      const msg = update.message;
      if (!msg) continue;
      const chatId = msg.chat.id;
      const text = msg.text?.trim();
      const name = msg.from?.first_name || 'пользователь';
      console.log(`📩 chatId=${chatId}, text="${text}"`);

      if (text === '/start') {
        await sendTelegramMessage(chatId,
          `👋 Привет, <b>${name}</b>!\n\n` +
          `Твой <b>Chat ID</b>:\n<code>${chatId}</code>\n\n` +
          `Вставь его в профиле → Уведомления → Telegram`
        );
      }
    }
  } catch(e) {
    if (!e.message.includes('abort')) console.error('❌ poll error:', e.message);
  }
  
  isPolling = false;
  // Сразу следующий запрос (long polling)
  setTimeout(pollTelegram, 1000);
}

function startTelegramBot() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log('⚠️  TELEGRAM_BOT_TOKEN не задан');
    return;
  }
  console.log('📱 Telegram бот запущен');
  // Небольшая задержка при старте чтобы старый инстанс успел умереть
  setTimeout(pollTelegram, 5000);
}

module.exports = { startTelegramBot, sendTelegramMessage };