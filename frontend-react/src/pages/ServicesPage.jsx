import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['all', 'development', 'design', 'writing', 'marketing', 'video', 'music', 'other'];
const CAT_LABELS = {
  all: 'Все', development: '💻 Разработка', design: '🎨 Дизайн',
  writing: '✍️ Копирайтинг', marketing: '📣 Маркетинг',
  video: '🎬 Видео', music: '🎵 Музыка', other: '🔧 Другое'
};
const CAT_EMOJIS = {
  development: '💻', design: '🎨', writing: '✍️',
  marketing: '📣', video: '🎬', music: '🎵', other: '🔧'
};

const EMPTY_FORM = {
  title: '', description: '', imageUrl: '',
  category: 'development', price: '', deliveryDays: '', skills: ''
};

export default function ServicesPage({ onAuthOpen }) {
  const { user } = useAuth();
  const [services, setServices]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [category, setCategory]     = useState('all');
  const [search, setSearch]         = useState('');
  const [sort, setSort]             = useState('newest');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [creating, setCreating]     = useState(false);
  const [formError, setFormError]   = useState('');

  useEffect(() => { loadServices(); }, []);

  async function loadServices() {
    setLoading(true);
    try {
      const { data } = await API.get('/services');
      setServices(data);
    } catch {}
    setLoading(false);
  }

  async function createService(e) {
    e.preventDefault();
    setFormError('');
    if (!form.title || !form.price || !form.deliveryDays) {
      setFormError('Заполните все обязательные поля');
      return;
    }
    setCreating(true);
    try {
      const skills = form.skills.split(',').map(s => s.trim()).filter(Boolean);
      await API.post('/services', { ...form, price: Number(form.price), deliveryDays: Number(form.deliveryDays), skills });
      setShowCreate(false);
      setForm(EMPTY_FORM);
      loadServices();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Ошибка при создании');
    }
    setCreating(false);
  }

  const filtered = services
    .filter(s => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.title?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q);
      const matchCat = category === 'all' || s.category === category;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sort === 'newest')     return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === 'price_asc')  return a.price - b.price;
      if (sort === 'price_desc') return b.price - a.price;
      if (sort === 'rating')     return (b.freelancer?.rating || 0) - (a.freelancer?.rating || 0);
      return 0;
    });

  return (
    <div className="page">
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(79,110,247,.06) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '3rem 0 2rem'
      }}>
        <div className="container" style={{ maxWidth: 860 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.8rem,4vw,2.8rem)',
            fontWeight: 800,
            letterSpacing: '-.04em',
            marginBottom: '.75rem'
          }}>
            Услуги фрилансеров
          </h1>
          <p style={{ color: 'var(--text2)', marginBottom: '1.5rem', fontSize: '.95rem' }}>
            {services.length} услуг от профессионалов — выбери и закажи прямо сейчас
          </p>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <span style={{
              position: 'absolute', left: 16, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text3)',
              fontSize: '1rem', pointerEvents: 'none'
            }}>⌕</span>
            <input
              style={{
                width: '100%', padding: '14px 16px 14px 44px',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', color: 'var(--text)',
                fontFamily: 'var(--font-body)', fontSize: '.95rem',
                outline: 'none', boxSizing: 'border-box'
              }}
              placeholder="Поиск услуги: React, дизайн логотипа, SEO..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Categories */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`btn btn-sm ${category === c ? 'btn-primary' : 'btn-glass'}`}>
                {CAT_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 1100, padding: '2rem 1rem 4rem' }}>
        {/* Toolbar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '1.5rem',
          flexWrap: 'wrap', gap: 12
        }}>
          <span style={{ color: 'var(--text3)', fontSize: '.875rem' }}>
            Найдено: <strong style={{ color: 'var(--text)' }}>{filtered.length}</strong>
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '7px 12px', color: 'var(--text)',
                fontFamily: 'var(--font-body)', fontSize: '.85rem',
                cursor: 'pointer', outline: 'none'
              }}>
              <option value="newest">Новые</option>
              <option value="price_asc">Цена ↑</option>
              <option value="price_desc">Цена ↓</option>
              <option value="rating">По рейтингу</option>
            </select>
            {user?.role === 'freelancer' && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
                + Добавить услугу
              </button>
            )}
            {!user && (
              <button className="btn btn-glass btn-sm" onClick={() => onAuthOpen('register')}>
                Стать фрилансером
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.25rem' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                background: 'var(--surface)', borderRadius: 'var(--radius)',
                border: '1px solid var(--border)', overflow: 'hidden'
              }}>
                <div className="skeleton" style={{ width: '100%', height: 180 }} />
                <div style={{ padding: '1rem' }}>
                  <div className="skeleton skeleton-line w-3-4 h-lg" style={{ marginBottom: '.6rem' }} />
                  <div className="skeleton skeleton-line w-full" style={{ marginBottom: '.4rem' }} />
                  <div className="skeleton skeleton-line w-1-2" style={{ marginBottom: '1rem' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="skeleton skeleton-avatar" style={{ width: 28, height: 28 }} />
                      <div className="skeleton skeleton-line w-1-3 h-sm" />
                    </div>
                    <div className="skeleton skeleton-line w-1-4 h-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>Услуги не найдены</h3>
            <p>Попробуй изменить фильтры или поисковый запрос</p>
            {user?.role === 'freelancer' && (
              <button className="btn btn-primary" style={{ marginTop: '1rem' }}
                onClick={() => setShowCreate(true)}>
                Добавить первую услугу
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.25rem' }}>
            {filtered.map((service, i) => (
              <ServiceCard key={service._id} service={service} index={i} user={user} onAuthOpen={onAuthOpen} />
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3>Добавить услугу</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={createService}>
              {formError && (
                <div style={{
                  background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)',
                  borderRadius: 8, padding: '10px 14px', marginBottom: '1rem',
                  color: '#ef4444', fontSize: '.875rem'
                }}>
                  {formError}
                </div>
              )}
              <div className="form-group">
                <label>Название *</label>
                <input className="form-control" placeholder="Разработка сайта на React"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea className="form-control" placeholder="Расскажи что именно ты делаешь, какой результат получит заказчик..."
                  style={{ minHeight: 90 }}
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Ссылка на изображение</label>
                <input className="form-control" placeholder="https://..."
                  value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Цена (₽) *</label>
                  <input className="form-control" type="number" placeholder="3000"
                    value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Срок (дней) *</label>
                  <input className="form-control" type="number" placeholder="3"
                    value={form.deliveryDays} onChange={e => setForm(f => ({ ...f, deliveryDays: e.target.value }))} required />
                </div>
              </div>
              <div className="form-group">
                <label>Категория</label>
                <select className="form-control" value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.filter(c => c !== 'all').map(c => (
                    <option key={c} value={c}>{CAT_LABELS[c]}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Навыки (через запятую)</label>
                <input className="form-control" placeholder="React, Figma, SEO"
                  value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} />
              </div>
              <button className="btn btn-primary w-full" type="submit" disabled={creating}>
                {creating ? 'Создаём...' : 'Опубликовать услугу 🚀'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ServiceCard({ service, index, user, onAuthOpen }) {
  const navigate = useNavigate();
  const fl = service.freelancer || {};

  function handleOrder(e) {
    e.stopPropagation();
    if (!user) { onAuthOpen('login'); return; }
    // Открываем чат с фрилансером
    navigate(`/chat?userId=${fl._id}`);
  }

  return (
    <div
      className="task-card"
      style={{
        padding: 0, overflow: 'hidden', cursor: 'default',
        animationDelay: `${index * 40}ms`,
        animation: 'fadeUp .4s ease both',
        display: 'flex', flexDirection: 'column'
      }}
    >
      {/* Обложка */}
      <div style={{
        width: '100%', height: 180, background: 'var(--surface2)',
        overflow: 'hidden', position: 'relative', flexShrink: 0
      }}>
        {service.imageUrl ? (
          <img src={service.imageUrl} alt={service.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '3rem', opacity: .4
          }}>
            {CAT_EMOJIS[service.category] || '🔧'}
          </div>
        )}
        {/* Категория бейдж */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)',
          borderRadius: 6, padding: '3px 8px',
          fontSize: '.72rem', color: '#fff', fontWeight: 500
        }}>
          {CAT_LABELS[service.category] || service.category}
        </div>
      </div>

      {/* Контент */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Фрилансер */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '.75rem' }}>
          <div className="avatar" style={{
            width: 28, height: 28, fontSize: '.75rem', flexShrink: 0,
            background: 'linear-gradient(135deg,var(--blue),var(--purple))'
          }}>
            {fl.avatar
              ? <img src={fl.avatar} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
              : (fl.name || '?').charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: '.85rem', color: 'var(--text2)', fontWeight: 500 }}>
            {fl.name || 'Фрилансер'}
          </span>
          {fl.rating > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: '.78rem', color: '#f59e0b', fontWeight: 600 }}>
              ★ {fl.rating?.toFixed(1)}
            </span>
          )}
        </div>

        {/* Заголовок */}
        <h3 style={{
          fontSize: '.95rem', fontWeight: 600, lineHeight: 1.4,
          marginBottom: '.5rem', color: 'var(--text)',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {service.title}
        </h3>

        {/* Описание */}
        {service.description && (
          <p style={{
            fontSize: '.82rem', color: 'var(--text3)', lineHeight: 1.5,
            marginBottom: '.75rem', flex: 1,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden'
          }}>
            {service.description}
          </p>
        )}

        {/* Скиллы */}
        {service.skills?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: '.75rem' }}>
            {service.skills.slice(0, 3).map(s => (
              <span key={s} className="skill-tag" style={{ fontSize: '.72rem' }}>{s}</span>
            ))}
            {service.skills.length > 3 && (
              <span className="skill-tag" style={{ fontSize: '.72rem' }}>+{service.skills.length - 3}</span>
            )}
          </div>
        )}

        {/* Футер */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: '.75rem', borderTop: '1px solid var(--border)', marginTop: 'auto'
        }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
              ₽{service.price?.toLocaleString()}
            </div>
            <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>
              ⏱ {service.deliveryDays} дн.
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleOrder}
            style={{ fontSize: '.8rem' }}
          >
            Заказать
          </button>
        </div>
      </div>
    </div>
  );
}
