import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const CAT_EMOJIS = {
  development: '💻', design: '🎨', writing: '✍️',
  marketing: '📣', video: '🎬', music: '🎵', other: '🔧'
};
const ROLE_LABELS = {
  client: 'Заказчик', freelancer: 'Фрилансер', admin: 'Админ'
};
const ROLE_COLORS = {
  client:     { bg: 'rgba(236,72,153,.12)',  color: '#f472b6',  border: 'rgba(236,72,153,.25)' },
  freelancer: { bg: 'rgba(79,110,247,.12)',  color: '#7b93ff',  border: 'rgba(79,110,247,.25)' },
  admin:      { bg: 'rgba(245,158,11,.12)',  color: '#fbbf24',  border: 'rgba(245,158,11,.25)' },
};

/* ─── Звёзды ─── */
function Stars({ rating, size = '1rem' }) {
  const full = Math.round(rating);
  return (
    <span style={{ color: 'var(--amber)', fontSize: size, letterSpacing: '.05em' }}>
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
    </span>
  );
}

export default function ProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile,   setProfile]   = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [services,  setServices]  = useState([]);
  const [reviews,   setReviews]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('overview');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating,    setRating]    = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment,   setComment]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (id) loadProfile(); }, [id]);

  async function loadProfile() {
    setLoading(true);
    try {
      const { data } = await API.get(`/users/${id}`);
      setProfile(data);
      const [portRes, revRes] = await Promise.allSettled([
        API.get(`/portfolio/${id}`),
        API.get(`/reviews/user/${id}`),
      ]);
      if (portRes.status === 'fulfilled')
        setPortfolio(Array.isArray(portRes.value.data) ? portRes.value.data : []);
      if (revRes.status === 'fulfilled') {
        const d = revRes.value.data;
        setReviews(Array.isArray(d) ? d : d.reviews || []);
      }
      if (data.role === 'freelancer' || data.role === 'admin') {
        try {
          const { data: svcs } = await API.get(`/services?freelancer=${id}`);
          setServices(Array.isArray(svcs) ? svcs : []);
        } catch {}
      }
    } catch { navigate('/tasks'); }
    setLoading(false);
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!rating) return;
    setSubmitting(true);
    try {
      await API.post('/reviews', { revieweeId: id, rating, comment });
      setReviewOpen(false); setRating(0); setHoverRating(0); setComment('');
      loadProfile();
    } catch (err) { alert(err.response?.data?.message || 'Ошибка'); }
    setSubmitting(false);
  }

  /* ── Загрузка ── */
  if (loading) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );
  if (!profile) return null;

  const isOwn        = user?.id === id;
  const isFreelancer = profile.role === 'freelancer' || profile.role === 'admin';
  const avgRating    = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : null;
  const roleStyle = ROLE_COLORS[profile.role] || ROLE_COLORS.client;

  const TABS = [
    { id: 'overview',  label: 'Обзор',     icon: '👤' },
    { id: 'portfolio', label: `Портфолио`, icon: '🖼',  count: portfolio.length },
    ...(isFreelancer ? [{ id: 'services', label: 'Услуги', icon: '🛠', count: services.length }] : []),
    { id: 'reviews',   label: 'Отзывы',    icon: '⭐', count: reviews.length },
  ];

  return (
    <div className="page" style={{ background: 'var(--bg)' }}>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 1rem 5rem' }}>

        {/* ══ HERO-КАРТОЧКА ══ */}
        <div style={{
          marginTop: '1.5rem',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 24,
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Градиентная полоска сверху */}
          <div style={{
            height: 4,
            background: 'linear-gradient(90deg, var(--blue), var(--purple), var(--pink))',
          }} />

          {/* Фоновый глоу */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 200,
            background: 'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(79,110,247,.08), transparent)',
            pointerEvents: 'none',
          }} />

          <div style={{ padding: '1.75rem 1.5rem 1.5rem', position: 'relative' }}>

            {/* Верхняя строка: аватар + кнопки */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', gap: '1rem' }}>

              {/* Аватар */}
              <div style={{
                width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, var(--blue), var(--purple))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', fontWeight: 800, color: '#fff',
                fontFamily: 'var(--font-display)',
                boxShadow: '0 0 0 3px var(--card), 0 0 0 5px rgba(79,110,247,.35), 0 8px 24px rgba(79,110,247,.3)',
                overflow: 'hidden', position: 'relative',
              }}>
                {profile.avatar
                  ? <img src={profile.avatar} alt={profile.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : profile.name?.charAt(0)?.toUpperCase()}
              </div>

              {/* Кнопки действий */}
              <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {isOwn ? (
                  <Link to="/dashboard" className="btn btn-primary btn-sm">✏️ Редактировать</Link>
                ) : user ? (
                  <>
                    <Link to={`/chat?user=${id}`} className="btn btn-primary btn-sm">
                      💬 Написать
                    </Link>
                    <button className="btn btn-glass btn-sm" onClick={() => setReviewOpen(true)}>
                      ⭐ Отзыв
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            {/* Имя + бейдж роли */}
            <div style={{ marginBottom: '.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap', marginBottom: '.4rem' }}>
                <h1 style={{
                  fontFamily: 'var(--font-display)', fontSize: '1.45rem',
                  fontWeight: 800, letterSpacing: '-.035em', color: 'var(--text)',
                }}>
                  {profile.name}
                </h1>
                {profile.isVerified && (
                  <span style={{
                    background: 'rgba(16,217,138,.1)', border: '1px solid rgba(16,217,138,.25)',
                    color: 'var(--green)', borderRadius: 99, padding: '.18rem .6rem',
                    fontSize: '.68rem', fontWeight: 700, letterSpacing: '.04em',
                  }}>✓ Верифицирован</span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
                {/* Роль */}
                <span style={{
                  background: roleStyle.bg, color: roleStyle.color,
                  border: `1px solid ${roleStyle.border}`,
                  borderRadius: 99, padding: '.22rem .75rem',
                  fontSize: '.72rem', fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase',
                }}>
                  {profile.role === 'client' ? '📋' : profile.role === 'admin' ? '⚙️' : '💼'}{' '}
                  {ROLE_LABELS[profile.role]}
                </span>

                {/* Рейтинг */}
                {avgRating && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.82rem' }}>
                    <span style={{ color: 'var(--amber)', fontWeight: 700 }}>★ {avgRating}</span>
                    <span style={{ color: 'var(--text3)' }}>({reviews.length})</span>
                  </span>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p style={{
                color: 'var(--text2)', fontSize: '.9rem', lineHeight: 1.7,
                marginBottom: '.85rem', maxWidth: 540,
              }}>
                {profile.bio}
              </p>
            )}

            {/* Скиллы */}
            {profile.skills?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem', marginBottom: '.85rem' }}>
                {profile.skills.map(s => (
                  <span key={s} className="skill-tag">{s}</span>
                ))}
              </div>
            )}

            {/* ── Статистика ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${isFreelancer ? 4 : 3}, 1fr)`,
              gap: '.75rem',
              marginTop: '1.25rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border)',
            }}>
              {[
                { icon: '✅', value: profile.completedTasks || 0, label: 'Выполнено' },
                { icon: '⭐', value: avgRating ? avgRating : '—', label: 'Рейтинг' },
                ...(isFreelancer ? [{ icon: '🛠', value: services.length, label: 'Услуг' }] : []),
                {
                  icon: '📅',
                  value: new Date(profile.createdAt).toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' }),
                  label: 'На сайте',
                },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: '.85rem .65rem',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '1.1rem', marginBottom: '.25rem' }}>{s.icon}</div>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: '1.1rem',
                    fontWeight: 800, color: 'var(--text)', lineHeight: 1,
                    marginBottom: '.2rem',
                  }}>{s.value}</div>
                  <div style={{ fontSize: '.68rem', color: 'var(--text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ ТАБЫ ══ */}
        <div style={{
          display: 'flex', gap: '.3rem', marginTop: '1.25rem',
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '.3rem', overflow: 'auto',
        }}>
          {TABS.map(t => (
            <button key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '.35rem', padding: '.55rem .75rem', borderRadius: 12, border: 'none',
                cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)',
                fontSize: '.82rem', fontWeight: 600, transition: 'all .18s',
                background: tab === t.id ? 'linear-gradient(135deg,var(--blue),var(--purple))' : 'transparent',
                color: tab === t.id ? '#fff' : 'var(--text2)',
                boxShadow: tab === t.id ? '0 4px 14px rgba(79,110,247,.4)' : 'none',
              }}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span style={{
                  background: tab === t.id ? 'rgba(255,255,255,.2)' : 'var(--surface2)',
                  borderRadius: 99, padding: '.05rem .45rem', fontSize: '.7rem', fontWeight: 700,
                  color: tab === t.id ? '#fff' : 'var(--text3)',
                }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══ КОНТЕНТ ══ */}
        <div style={{ marginTop: '1.25rem' }}>

          {/* ОБЗОР */}
          {tab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {!profile.bio && portfolio.length === 0 && services.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👤</div>
                  <h3>Профиль пока пустой</h3>
                  {isOwn && <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '1rem' }}>Заполнить профиль</Link>}
                </div>
              ) : null}

              {portfolio.length > 0 && (
                <Section
                  title="🖼 Последние работы"
                  action={portfolio.length > 2 ? { label: `Все ${portfolio.length} →`, onClick: () => setTab('portfolio') } : null}
                >
                  <div className="portfolio-grid">
                    {portfolio.slice(0, 2).map(item => <PortfolioCard key={item._id} item={item} />)}
                  </div>
                </Section>
              )}

              {isFreelancer && services.length > 0 && (
                <Section
                  title="🛠 Популярные услуги"
                  action={services.length > 2 ? { label: `Все ${services.length} →`, onClick: () => setTab('services') } : null}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '1rem' }}>
                    {services.slice(0, 2).map(s => <ServiceCard key={s._id} service={s} userId={id} />)}
                  </div>
                </Section>
              )}

              {reviews.length > 0 && (
                <Section
                  title="⭐ Последние отзывы"
                  action={reviews.length > 2 ? { label: `Все ${reviews.length} →`, onClick: () => setTab('reviews') } : null}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                    {reviews.slice(0, 2).map(r => <ReviewItem key={r._id} review={r} />)}
                  </div>
                </Section>
              )}
            </div>
          )}

          {/* ПОРТФОЛИО */}
          {tab === 'portfolio' && (
            portfolio.length === 0 ? (
              <EmptyState icon="🖼" title="Портфолио пусто">
                {isOwn && <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '1rem' }}>Добавить работу</Link>}
              </EmptyState>
            ) : (
              <div className="portfolio-grid">
                {portfolio.map(item => <PortfolioCard key={item._id} item={item} />)}
              </div>
            )
          )}

          {/* УСЛУГИ */}
          {tab === 'services' && (
            services.length === 0 ? (
              <EmptyState icon="🛠" title="Услуг пока нет">
                {isOwn && <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '1rem' }}>Добавить услугу</Link>}
              </EmptyState>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '1.25rem' }}>
                {services.map(s => <ServiceCard key={s._id} service={s} userId={id} />)}
              </div>
            )
          )}

          {/* ОТЗЫВЫ */}
          {tab === 'reviews' && (
            <div>
              {reviews.length === 0 ? (
                <EmptyState icon="⭐" title="Отзывов пока нет">
                  {user && !isOwn && (
                    <button className="btn btn-primary mt-2" onClick={() => setReviewOpen(true)}>
                      Оставить первый отзыв
                    </button>
                  )}
                </EmptyState>
              ) : (
                <>
                  {/* Сводка рейтинга */}
                  <div style={{
                    background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: 20, padding: '1.5rem', marginBottom: '1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: '1rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{
                        fontFamily: 'var(--font-display)', fontSize: '3.5rem',
                        fontWeight: 800, color: 'var(--amber)', lineHeight: 1,
                      }}>
                        {avgRating}
                      </div>
                      <div>
                        <Stars rating={avgRating} size="1.2rem" />
                        <div style={{ fontSize: '.8rem', color: 'var(--text3)', marginTop: '.3rem' }}>
                          {reviews.length} {reviews.length === 1 ? 'отзыв' : reviews.length < 5 ? 'отзыва' : 'отзывов'}
                        </div>
                      </div>
                    </div>
                    {user && !isOwn && (
                      <button className="btn btn-primary btn-sm" onClick={() => setReviewOpen(true)}>
                        ⭐ Оставить отзыв
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                    {reviews.map(r => <ReviewItem key={r._id} review={r} />)}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══ МОДАЛ ОТЗЫВА ══ */}
      {reviewOpen && (
        <div className="modal-overlay open"
          onClick={e => e.target === e.currentTarget && setReviewOpen(false)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>Оставить отзыв</h3>
              <button className="modal-close" onClick={() => setReviewOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <p style={{ fontSize: '.875rem', color: 'var(--text2)', marginBottom: '1.25rem' }}>
              Оцените <strong style={{ color: 'var(--text)' }}>{profile.name}</strong>
            </p>

            <form onSubmit={submitReview}>
              {/* Звёздный выбор */}
              <div className="form-group">
                <label>Оценка *</label>
                <div style={{ display: 'flex', gap: '.4rem', margin: '.5rem 0 .25rem' }}>
                  {[1,2,3,4,5].map(v => (
                    <span key={v}
                      onClick={() => setRating(v)}
                      onMouseEnter={() => setHoverRating(v)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        fontSize: '2rem', cursor: 'pointer', userSelect: 'none',
                        color: v <= (hoverRating || rating) ? 'var(--amber)' : 'var(--border3)',
                        transition: 'color .1s, transform .1s',
                        transform: v <= (hoverRating || rating) ? 'scale(1.15)' : 'scale(1)',
                        display: 'inline-block',
                      }}>★</span>
                  ))}
                </div>
                {rating > 0 && (
                  <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>
                    {['', 'Плохо', 'Ниже среднего', 'Нормально', 'Хорошо', 'Отлично!'][rating]}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Комментарий</label>
                <textarea className="form-control"
                  placeholder="Поделитесь впечатлениями о работе..."
                  style={{ minHeight: 100, resize: 'none' }}
                  value={comment}
                  onChange={e => setComment(e.target.value)} />
              </div>

              <button className="btn btn-primary w-full mt-3" type="submit"
                disabled={!rating || submitting}
                style={{ opacity: !rating ? .5 : 1 }}>
                {submitting ? 'Отправляем...' : '⭐ Отправить отзыв'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Вспомогательные компоненты ─── */

function Section({ title, action, children }) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 20, padding: '1.25rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '.95rem', fontWeight: 700, color: 'var(--text)' }}>{title}</h3>
        {action && (
          <button className="btn btn-glass btn-sm" onClick={action.onClick}>{action.label}</button>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ icon, title, children }) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 20, padding: '3rem 2rem', textAlign: 'center',
    }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '.75rem', opacity: .5 }}>{icon}</div>
      <h3 style={{ color: 'var(--text)', fontSize: '1rem', marginBottom: '.4rem' }}>{title}</h3>
      {children}
    </div>
  );
}

function PortfolioCard({ item }) {
  return (
    <div className="portfolio-card" style={{ borderRadius: 16, overflow: 'hidden' }}>
      <div className="portfolio-img" style={{ height: 150, fontSize: '2.5rem' }}>
        {item.imageUrl
          ? <img src={item.imageUrl} alt={item.title}
              onError={e => { e.target.style.display = 'none'; }} />
          : CAT_EMOJIS[item.category] || '🔧'}
      </div>
      <div className="portfolio-body">
        <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: '.25rem', color: 'var(--text)' }}>
          {item.title}
        </div>
        {item.description && (
          <div style={{ fontSize: '.78rem', color: 'var(--text2)', lineHeight: 1.6, marginBottom: '.5rem',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.description}
          </div>
        )}
        {item.skills?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.25rem', marginBottom: '.5rem' }}>
            {item.skills.slice(0, 3).map(s => (
              <span key={s} className="skill-tag" style={{ fontSize: '.68rem' }}>{s}</span>
            ))}
          </div>
        )}
        {item.projectUrl && (
          <a href={item.projectUrl} target="_blank" rel="noopener noreferrer"
            className="btn btn-glass btn-sm" style={{ marginTop: '.25rem' }}>
            🔗 Смотреть
          </a>
        )}
      </div>
    </div>
  );
}

function ServiceCard({ service, userId }) {
  const navigate = useNavigate();
  return (
    <div style={{
      background: 'var(--card2)', border: '1px solid var(--border)',
      borderRadius: 16, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      transition: 'border-color .18s, transform .18s, box-shadow .18s',
    }}
      onMouseOver={e => {
        e.currentTarget.style.borderColor = 'rgba(79,110,247,.4)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,.4)';
      }}
      onMouseOut={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Обложка */}
      <div style={{
        width: '100%', height: 140, background: 'var(--bg3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '3rem', overflow: 'hidden', position: 'relative', flexShrink: 0,
      }}>
        {service.imageUrl
          ? <img src={service.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.style.display = 'none'; }} />
          : CAT_EMOJIS[service.category] || '🔧'}
        <div style={{
          position: 'absolute', top: 8, left: 8,
          background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(8px)',
          borderRadius: 8, padding: '3px 9px', fontSize: '.65rem',
          color: '#fff', fontWeight: 600,
        }}>
          {CAT_EMOJIS[service.category]} {service.category}
        </div>
      </div>

      {/* Контент */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{
          fontWeight: 700, fontSize: '.9rem', lineHeight: 1.35, marginBottom: '.35rem',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          color: 'var(--text)',
        }}>
          {service.title}
        </div>
        {service.skills?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.25rem', marginBottom: '.65rem' }}>
            {service.skills.slice(0, 3).map(s => (
              <span key={s} className="skill-tag" style={{ fontSize: '.68rem' }}>{s}</span>
            ))}
          </div>
        )}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 'auto', paddingTop: '.75rem', borderTop: '1px solid var(--border)',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--green)' }}>
              ₽{service.price?.toLocaleString()}
            </div>
            <div style={{ fontSize: '.7rem', color: 'var(--text3)' }}>⏱ {service.deliveryDays} дн.</div>
          </div>
          <button className="btn btn-primary btn-sm"
            onClick={() => navigate(`/chat?user=${userId}&service=${service._id}`)}>
            Заказать
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewItem({ review }) {
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 16, padding: '1rem 1.1rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
          <div className="avatar" style={{ width: 36, height: 36, fontSize: '.85rem', flexShrink: 0 }}>
            {review.reviewer?.avatar
              ? <img src={review.reviewer.avatar} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
              : review.reviewer?.name?.charAt(0) || '?'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '.875rem', color: 'var(--text)' }}>
              {review.reviewer?.name || 'Пользователь'}
            </div>
            <div style={{ color: 'var(--amber)', fontSize: '.82rem', letterSpacing: '.04em' }}>{stars}</div>
          </div>
        </div>
        <div style={{ fontSize: '.72rem', color: 'var(--text3)', flexShrink: 0 }}>
          {new Date(review.createdAt).toLocaleDateString('ru-RU')}
        </div>
      </div>
      {review.comment && (
        <p style={{ fontSize: '.875rem', color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>
          {review.comment}
        </p>
      )}
    </div>
  );
}
