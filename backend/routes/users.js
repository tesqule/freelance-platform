const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Отправить письмо с подтверждением ───────────────────────────────────────
router.post('/verify/send', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    if (user.isVerified) return res.status(400).json({ message: 'Email уже подтверждён' });

    // Генерируем токен
    const token = crypto.randomBytes(32).toString('hex');
    user.verifyToken = token;
    user.verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа
    await user.save();

    const siteUrl = process.env.SITE_URL || 'https://freelance-platform-production-2360.up.railway.app';
    const verifyUrl = `${siteUrl}/profile.html?verify=${token}`;

    await resend.emails.send({
      from: 'FreeLanceHub <onboarding@resend.dev>',
      to: user.email,
      subject: 'Подтвердите email — FreeLanceHub',
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#08081a;color:#eeeef8;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.07);">
          <div style="background:linear-gradient(135deg,#4f6ef7,#8b5cf6);padding:32px 36px 24px;">
            <div style="font-size:22px;font-weight:800;letter-spacing:-0.03em;">FreeLanceHub</div>
            <div style="font-size:13px;opacity:0.75;margin-top:4px;">Платформа для фриланса</div>
          </div>
          <div style="padding:32px 36px;">
            <h2 style="font-size:20px;font-weight:700;margin:0 0 12px;letter-spacing:-0.02em;">Привет, ${user.name}! 👋</h2>
            <p style="font-size:15px;color:#9999bb;line-height:1.7;margin:0 0 24px;">
              Ты зарегистрировался на <strong style="color:#eeeef8;">freelance-platform-production-2360.up.railway.app</strong>.<br>
              Нажми кнопку ниже чтобы подтвердить свой email и получить галочку верификации в профиле.
            </p>
            <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#4f6ef7,#8b5cf6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:99px;font-weight:700;font-size:15px;letter-spacing:-0.01em;">
              ✅ Подтвердить email
            </a>
            <p style="font-size:12px;color:#6e6e96;margin:24px 0 0;line-height:1.6;">
              Ссылка действует 24 часа. Если ты не регистрировался — просто проигнорируй это письмо.
            </p>
          </div>
        </div>
      `
    });

    res.json({ message: 'Письмо отправлено! Проверь почту.' });
  } catch (err) {
    console.error('Verify send error:', err);
    res.status(500).json({ message: 'Ошибка отправки письма', error: err.message });
  }
});

// ─── Подтвердить email по токену ─────────────────────────────────────────────
router.get('/verify/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      verifyToken: req.params.token,
      verifyTokenExpires: { $gt: new Date() }
    });

    if (!user) return res.status(400).json({ message: 'Ссылка недействительна или истекла' });

    user.isVerified = true;
    user.verifyToken = '';
    user.verifyTokenExpires = undefined;
    await user.save();

    res.json({ message: 'Email подтверждён! 🎉' });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка', error: err.message });
  }
});

// ─── Обновить профиль ─────────────────────────────────────────────────────────
// ⚠️ ВАЖНО: /profile/update должен быть ПЕРВЫМ, до /:id
router.put('/profile/update', auth, async (req, res) => {
  try {
    const { name, bio, skills, avatar, telegramChatId, emailNotifications } = req.body;

    const updateData = { name, bio, skills, avatar };
    if (telegramChatId !== undefined) updateData.telegramChatId = telegramChatId;
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── Список пользователей ─────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { role, skill, search } = req.query;
    let query = {};
    if (role) query.role = role;
    if (skill) query.skills = { $in: [skill] };
    if (search) query.name = { $regex: search, $options: 'i' };

    const users = await User.find(query).select('-password').sort({ rating: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── Профиль по ID ────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -email');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;