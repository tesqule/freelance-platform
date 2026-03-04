// backend/utils/notify.js
// Единый модуль для Email и Telegram уведомлений

const nodemailer = require('nodemailer');

// ── EMAIL ──────────────────────────────────────────────
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  transporter = nodemailer.createTransport({
    service: 'gmail',      // или 'yandex', 'mail.ru' — меняй под себя
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS   // App Password для Gmail
    }
  });
  return transporter;
}

async function sendEmail(to, subject, html) {
  const t = getTransporter();
  if (!t || !to) return;
  try {
    await t.sendMail({
      from: `"FreeLanceHub" <${process.env.EMAIL_USER}>`,
      to, subject, html
    });
    console.log(`📧 Email sent to ${to}`);
  } catch (err) {
    console.error('Email error:', err.message);
  }
}

// ── TELEGRAM ───────────────────────────────────────────
async function sendTelegram(chatId, text) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !chatId) return;
  try {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
    const data = await res.json();
    if (!data.ok) console.error('Telegram error:', data.description);
    else console.log(`📱 Telegram sent to ${chatId}`);
  } catch (err) {
    console.error('Telegram error:', err.message);
  }
}

// ── ШАБЛОНЫ ────────────────────────────────────────────
async function notifyNewProposal(client, task, freelancer) {
  const subject = `Новый отклик на задание "${task.title}"`;
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#4f6ef7;">FreeLanceHub</h2>
      <p>Привет, <b>${client.name}</b>!</p>
      <p>Фрилансер <b>${freelancer.name}</b> откликнулся на ваше задание:</p>
      <div style="background:#f5f5ff;border-radius:8px;padding:1rem;margin:1rem 0;">
        <b>${task.title}</b><br>
        <span style="color:#666;">Бюджет: ₽${task.budget.toLocaleString()}</span>
      </div>
      <a href="${process.env.SITE_URL}/task-detail.html?id=${task._id}"
         style="background:#4f6ef7;color:#fff;padding:.75rem 1.5rem;border-radius:99px;text-decoration:none;font-weight:600;">
        Посмотреть отклик →
      </a>
    </div>`;

  if (client.emailNotifications) {
    await sendEmail(client.email, subject, html);
  }
  if (client.telegramChatId) {
    await sendTelegram(client.telegramChatId,
      `🔔 <b>Новый отклик!</b>\n\nФрилансер <b>${freelancer.name}</b> откликнулся на задание «${task.title}».\n\n👉 ${process.env.SITE_URL}/task-detail.html?id=${task._id}`
    );
  }
}

async function notifyProposalAccepted(freelancer, task) {
  const subject = `Ваш отклик принят — "${task.title}"`;
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#4f6ef7;">FreeLanceHub</h2>
      <p>Привет, <b>${freelancer.name}</b>!</p>
      <p>Заказчик принял ваш отклик на задание:</p>
      <div style="background:#f0fff8;border-radius:8px;padding:1rem;margin:1rem 0;border-left:4px solid #10d98a;">
        <b>${task.title}</b><br>
        <span style="color:#666;">Бюджет: ₽${task.budget.toLocaleString()}</span>
      </div>
      <a href="${process.env.SITE_URL}/task-detail.html?id=${task._id}"
         style="background:#10d98a;color:#fff;padding:.75rem 1.5rem;border-radius:99px;text-decoration:none;font-weight:600;">
        Перейти к заданию →
      </a>
    </div>`;

  if (freelancer.emailNotifications) {
    await sendEmail(freelancer.email, subject, html);
  }
  if (freelancer.telegramChatId) {
    await sendTelegram(freelancer.telegramChatId,
      `✅ <b>Отклик принят!</b>\n\nЗаказчик принял ваш отклик на задание «${task.title}».\n\n👉 ${process.env.SITE_URL}/task-detail.html?id=${task._id}`
    );
  }
}

async function notifyTaskCompleted(freelancer, task) {
  const subject = `Задание выполнено — "${task.title}"`;
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#4f6ef7;">FreeLanceHub</h2>
      <p>Привет, <b>${freelancer.name}</b>!</p>
      <p>Заказчик принял работу по заданию <b>${task.title}</b>. Не забудьте оставить взаимный отзыв!</p>
      <a href="${process.env.SITE_URL}/task-detail.html?id=${task._id}"
         style="background:#4f6ef7;color:#fff;padding:.75rem 1.5rem;border-radius:99px;text-decoration:none;font-weight:600;">
        Оставить отзыв →
      </a>
    </div>`;

  if (freelancer.emailNotifications) {
    await sendEmail(freelancer.email, subject, html);
  }
  if (freelancer.telegramChatId) {
    await sendTelegram(freelancer.telegramChatId,
      `🎉 <b>Задание выполнено!</b>\n\n«${task.title}» — заказчик принял работу. Оставьте отзыв!\n\n👉 ${process.env.SITE_URL}/task-detail.html?id=${task._id}`
    );
  }
}

async function notifyNewReview(user, reviewer, rating) {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  if (user.emailNotifications) {
    await sendEmail(user.email, 'Новый отзыв на FreeLanceHub',
      `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
        <h2 style="color:#4f6ef7;">FreeLanceHub</h2>
        <p>Привет, <b>${user.name}</b>! Пользователь <b>${reviewer.name}</b> оставил вам отзыв:</p>
        <div style="font-size:1.5rem;color:#f59e0b;">${stars}</div>
      </div>`
    );
  }
  if (user.telegramChatId) {
    await sendTelegram(user.telegramChatId,
      `⭐ <b>Новый отзыв!</b>\n\n${reviewer.name} оценил вас на ${stars}`
    );
  }
}

module.exports = {
  sendEmail,
  sendTelegram,
  notifyNewProposal,
  notifyProposalAccepted,
  notifyTaskCompleted,
  notifyNewReview
};