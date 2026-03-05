const express = require('express');
const router  = express.Router();
const Service = require('../models/Service');
const auth    = require('../middleware/auth');

// GET /api/services — все услуги (для главной страницы)
router.get('/', async (req, res) => {
  try {
    const { category, freelancer } = req.query;
    const filter = { isActive: true };
    if (category)   filter.category   = category;
    if (freelancer) filter.freelancer = freelancer;
    const services = await Service.find(filter)
      .populate('freelancer', 'name avatar rating completedTasks')
      .sort({ createdAt: -1 });
    res.json(services);
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// GET /api/services/my — мои услуги (для профиля)
router.get('/my', auth, async (req, res) => {
  try {
    const services = await Service.find({ freelancer: req.user.id })
      .sort({ createdAt: -1 });
    res.json(services);
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// POST /api/services — создать услугу
router.post('/', auth, async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'freelancer') {
      return res.status(403).json({ message: 'Только фрилансеры могут создавать услуги' });
    }
    const { title, description, imageUrl, category, price, deliveryDays, skills } = req.body;
    if (!title)        return res.status(400).json({ message: 'Укажите название' });
    if (!price)        return res.status(400).json({ message: 'Укажите цену' });
    if (!deliveryDays) return res.status(400).json({ message: 'Укажите срок выполнения' });

    const service = new Service({
      freelancer: user.id,
      title, description, imageUrl, category,
      price: Number(price),
      deliveryDays: Number(deliveryDays),
      skills: skills || []
    });
    await service.save();
    res.status(201).json(service);
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// PUT /api/services/:id — обновить услугу
router.put('/:id', auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Услуга не найдена' });
    if (service.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Нет доступа' });
    }
    const { title, description, imageUrl, category, price, deliveryDays, skills, isActive } = req.body;
    if (title)        service.title        = title;
    if (description !== undefined) service.description = description;
    if (imageUrl !== undefined)    service.imageUrl    = imageUrl;
    if (category)     service.category     = category;
    if (price)        service.price        = Number(price);
    if (deliveryDays) service.deliveryDays = Number(deliveryDays);
    if (skills)       service.skills       = skills;
    if (isActive !== undefined) service.isActive = isActive;
    await service.save();
    res.json(service);
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// DELETE /api/services/:id — удалить услугу
router.delete('/:id', auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Услуга не найдена' });
    if (service.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Нет доступа' });
    }
    await service.deleteOne();
    res.json({ message: 'Удалено' });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;