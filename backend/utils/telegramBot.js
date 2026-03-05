async function sendTelegramMessage(chatId, text) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  try {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
    const data = await res.json();
    console.log('📤 Telegram send result:', JSON.stringify(data));
  } catch(e) {
    console.error('❌ Telegram send error:', e.message);
  }
}

let lastUpdateId = 0;

async function pollTelegram() {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  try {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=10`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.ok) {
      console.error('❌ Telegram getUpdates error:', JSON.stringify(data));
      return;
    }
    
    if (!data.result?.length) return;

    for (const update of data.result) {
      lastUpdateId = update.update_id;
      const msg = update.message;
      if (!msg) continue;
      const chatId = msg.chat.id;
      const text = msg.text?.trim();
      const name = msg.from?.first_name || 'пользователь';
      console.log(`📩 Получено: chatId=${chatId}, text="${text}"`);

      if (text === '/start') {
        console.log(`📱 Отправляю Chat ID пользователю ${chatId}`);
        await sendTelegramMessage(chatId,
          `👋 Привет, <b>${name}</b>!\n\n` +
          `Твой <b>Chat ID</b>:\n<code>${chatId}</code>\n\n` +
          `Вставь его в профиле → Уведомления → Telegram`
        );
      }
    }
  } catch(e) {
    console.error('❌ pollTelegram error:', e.message);
  }
}

function startTelegramBot() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log('⚠️  TELEGRAM_BOT_TOKEN не задан');
    return;
  }
  console.log('📱 Telegram бот запущен');
  setInterval(pollTelegram, 3000);
  pollTelegram();
}

module.exports = { startTelegramBot, sendTelegramMessage };