// backend/utils/telegramBot.js
// Простой polling-бот который отвечает на /start и отдаёт Chat ID
// Запускается автоматически вместе с сервером

async function sendTelegramMessage(chatId, text) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
  } catch(e) {
    console.error('Telegram send error:', e.message);
  }
}

let lastUpdateId = 0;

async function pollTelegram() {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  try {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`;
    const res  = await fetch(url);
    const data = await res.json();
    if (!data.ok || !data.result?.length) return;

    for (const update of data.result) {
      lastUpdateId = update.update_id;
      const msg = update.message;
      if (!msg) continue;

      const chatId = msg.chat.id;
      const text   = msg.text?.trim();
      const name   = msg.from?.first_name || 'пользователь';

      if (text === '/start') {
        await sendTelegramMessage(chatId,
          `👋 Привет, <b>${name}</b>!\n\n` +
          `Это бот платформы <b>FreeLanceHub</b>.\n\n` +
          `Твой <b>Chat ID</b>:\n` +
          `<code>${chatId}</code>\n\n` +
          `📋 Скопируй этот ID и вставь его в настройках профиля на сайте:\n` +
          `<b>Профиль → Уведомления → Telegram</b>\n\n` +
          `После этого ты будешь получать уведомления о новых откликах, принятых заявках и выполненных заданиях! 🚀`
        );
        console.log(`📱 Telegram /start from chatId: ${chatId}, name: ${name}`);
      } else if (text === '/help') {
        await sendTelegramMessage(chatId,
          `ℹ️ <b>FreeLanceHub Bot</b>\n\n` +
          `Этот бот отправляет уведомления о событиях на платформе.\n\n` +
          `<b>Команды:</b>\n` +
          `/start — получить свой Chat ID\n` +
          `/help — справка\n\n` +
          `Твой Chat ID: <code>${chatId}</code>`
        );
      }
    }
  } catch(e) {
    // Молча игнорируем ошибки polling — сервер не должен падать
  }
}

function startTelegramBot() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log('⚠️  TELEGRAM_BOT_TOKEN не задан — Telegram бот отключён');
    return;
  }
  console.log('📱 Telegram бот запущен');
  // Запускаем polling каждые 3 секунды
  setInterval(pollTelegram, 3000);
  // И сразу один раз
  pollTelegram();
}

module.exports = { startTelegramBot, sendTelegramMessage };