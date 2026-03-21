import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const CAT_EMOJIS = { development: '💻', design: '🎨', writing: '✍️', marketing: '📣', video: '🎬', music: '🎵', other: '🔧' };

export default function ProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => { if (id) loadProfile(); }, [id]);

  async function loadProfile() {
    setLoading(true);
    try {
      const { data } = await API.get(`/users/${id}`);
      setProfile(data);
      const [portRes, revRes] = await Promise.allSettled([
        API.get(`/portfolio/${id}`),
        API.get(`/reviews/${id}`),
      ]);
      if (portRes.status === 'fulfilled') setPortfolio(Array.isArray(portRes.value.data) ? portRes.value.data : []);
      if (revRes.status === 'fulfilled') {
  const revData = revRes.value.data;
  setReviews(Array.isArray(revData) ? revData : revData.reviews || []);
}
      if (data.role === 'freelancer') {
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
    if (!rating) { alert('Выберите оценку'); return; }
    try {
      await API.post('/reviews', { reviewee: id, rating, comment });
      setReviewOpen(false); setRating(0); setComment('');
      loadProfile();
    } catch (err) { alert(err.response?.data?.message || 'Ошибка'); }
  }

  if (loading) return <div className="page"><div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}><div className="spinner" /></div></div>;
  if (!profile) return null;

  const isOwn = user?.id === id;
  const avgRating = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : null;
  const TABS = [
    { id: 'overview', label: '👤 Обзор' },
    { id: 'portfolio', label: '🖼 Портфолио' },
    ...(profile.role === 'freelancer' ? [{ id: 'services', label: '🛠 Услуги' }] : []),
    { id: 'reviews', label: `⭐ Отзывы (${reviews.length})` },
  ];

  return (
    <div className="page">
      <div className="container" style={{ paddingBottom: '4rem', maxWidth: 860 }}>

        {/* Шапка */}
        <div className="card mt-3 mb-2" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div className="avatar" style={{ width: 80, height: 80, fontSize: '2rem', flexShrink: 0, boxShadow: '0 4px 20px rgba(79,110,247,.3)' }}>
              {profile.avatar ? <img src={profile.avatar} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} /> : profile.name?.charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap', marginBottom: '.4rem' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-.03em' }}>{profile.name}</h1>
                {profile.verified && <span style={{ background: 'rgba(16,217,138,.1)', border: '1px solid rgba(16,217,138,.25)', color: 'var(--green)', borderRadius: 99, padding: '.2rem .65rem', fontSize: '.72rem', fontWeight: 700 }}>✓ Верифицирован</span>}
              </div>
              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.75rem' }}>
                <span className={`badge badge-${profile.role === 'client' ? 'design' : 'development'}`}>{profile.role === 'client' ? '📋 Заказчик' : '💼 Фрилансер'}</span>
                {avgRating && <span style={{ color: 'var(--amber)', fontSize: '.85rem' }}>★ {avgRating} <span style={{ color: 'var(--text3)', fontSize: '.78rem' }}>({reviews.length} отзывов)</span></span>}
              </div>
              {profile.bio && <p style={{ color: 'var(--text2)', fontSize: '.9rem', lineHeight: 1.7, marginBottom: '.75rem' }}>{profile.bio}</p>}
              {profile.skills?.length > 0 && <div className="task-skills">{profile.skills.map(s => <span key={s} className="skill-tag">{s}</span>)}</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', flexShrink: 0 }}>
              {isOwn ? (
                <Link to="/dashboard" className="btn btn-primary btn-sm">✏️ Редактировать</Link>
              ) : (
                <>
                  {user && <Link to={`/chat?user=${id}`} className="btn btn-primary btn-sm">💬 Написать</Link>}
                  {user && <button className="btn btn-outline btn-sm" onClick={() => setReviewOpen(true)}>⭐ Отзыв</button>}
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '2rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
            {[
              { label: 'Выполнено', value: profile.completedTasks || 0 },
              { label: 'Рейтинг', value: avgRating ? `★ ${avgRating}` : '—' },
              { label: 'На платформе', value: new Date(profile.createdAt).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }) },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700 }}>{s.value}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginTop: '.1rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Табы */}
        <div className="profile-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`profile-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {/* Обзор */}
        {tab === 'overview' && (
          <div>
            {portfolio.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.05rem' }}>🖼 Последние работы</h3>
                  <button className="btn btn-glass btn-sm" onClick={() => setTab('portfolio')}>Все →</button>
                </div>
                <div className="portfolio-grid">{portfolio.slice(0, 3).map(item => <PortfolioCard key={item._id} item={item} />)}</div>
              </div>
            )}
            {profile.role === 'freelancer' && services.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.05rem' }}>🛠 Услуги</h3>
                  <button className="btn btn-glass btn-sm" onClick={() => setTab('services')}>Все →</button>
                </div>
                <div className="services-grid-profile">{services.slice(0, 3).map(s => <ServiceCard key={s._id} service={s} userId={id} />)}</div>
              </div>
            )}
            {portfolio.length === 0 && services.length === 0 && (
              <div className="empty-state"><div className="empty-icon">👤</div><h3>Профиль пока пустой</h3></div>
            )}
          </div>
        )}

        {/* Портфолио */}
        {tab === 'portfolio' && (
          portfolio.length === 0
            ? <div className="empty-state"><div className="empty-icon">🖼</div><h3>Портфолио пусто</h3></div>
            : <div className="portfolio-grid">{portfolio.map(item => <PortfolioCard key={item._id} item={item} />)}</div>
        )}

        {/* Услуги */}
        {tab === 'services' && (
          services.length === 0
            ? <div className="empty-state"><div className="empty-icon">🛠</div><h3>Услуг пока нет</h3></div>
            : <div className="services-grid-profile">{services.map(s => <ServiceCard key={s._id} service={s} userId={id} />)}</div>
        )}

        {/* Отзывы */}
        {tab === 'reviews' && (
          <div className="card" style={{ padding: '1.75rem' }}>
            {reviews.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem 0' }}>
                <div className="empty-icon">⭐</div>
                <h3>Отзывов пока нет</h3>
                {user && !isOwn && <button className="btn btn-primary mt-2" onClick={() => setReviewOpen(true)}>Оставить первый отзыв</button>}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 800, color: 'var(--amber)', lineHeight: 1 }}>{avgRating}</div>
                    <div>
                      <div style={{ color: 'var(--amber)', fontSize: '1.1rem' }}>{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}</div>
                      <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>{reviews.length} отзывов</div>
                    </div>
                  </div>
                  {user && !isOwn && <button className="btn btn-primary btn-sm" onClick={() => setReviewOpen(true)}>⭐ Оставить отзыв</button>}
                </div>
                {reviews.map(r => <ReviewItem key={r._id} review={r} />)}
              </>
            )}
          </div>
        )}
      </div>

      {/* Review modal */}
      {reviewOpen && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setReviewOpen(false)}>
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3>Оставить отзыв</h3>
              <button className="modal-close" onClick={() => setReviewOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={submitReview}>
              <p style={{ fontSize: '.875rem', color: 'var(--text2)', marginBottom: '1rem' }}>Оцените <strong>{profile.name}</strong></p>
              <div className="form-group">
                <label>Оценка *</label>
                <div style={{ display: 'flex', gap: '.3rem', fontSize: '1.6rem', cursor: 'pointer', margin: '.5rem 0' }}>
                  {[1,2,3,4,5].map(v => (
                    <span key={v} onClick={() => setRating(v)} style={{ color: v <= rating ? 'var(--amber)' : 'var(--text3)', transition: 'color .12s', userSelect: 'none' }}>★</span>
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Комментарий</label>
                <textarea className="form-control" placeholder="Поделитесь впечатлениями..." style={{ minHeight: 100 }} value={comment} onChange={e => setComment(e.target.value)} />
              </div>
              <button className="btn btn-primary w-full mt-3" type="submit">Отправить отзыв ⭐</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PortfolioCard({ item }) {
  return (
    <div className="portfolio-card">
      <div className="portfolio-img">
        {item.imageUrl ? <img src={item.imageUrl} alt={item.title} onError={e => e.target.parentElement.innerHTML = CAT_EMOJIS[item.category] || '🔧'} /> : CAT_EMOJIS[item.category] || '🔧'}
      </div>
      <div className="portfolio-body">
        <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '.3rem' }}>{item.title}</div>
        {item.description && <div style={{ fontSize: '.8rem', color: 'var(--text2)', lineHeight: 1.6, marginBottom: '.5rem' }}>{item.description}</div>}
        {item.skills?.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem', marginBottom: '.5rem' }}>{item.skills.slice(0, 3).map(s => <span key={s} className="skill-tag" style={{ fontSize: '.7rem' }}>{s}</span>)}</div>}
        {item.projectUrl && <a href={item.projectUrl} target="_blank" rel="noopener noreferrer" className="btn btn-glass btn-sm">🔗 Смотреть</a>}
      </div>
    </div>
  );
}

function ServiceCard({ service, userId }) {
  return (
    <div className="service-card-profile">
      <div className="service-card-img">
        {service.imageUrl ? <img src={service.imageUrl} style={{ width: '100%', height: 155, objectFit: 'cover' }} onError={e => e.target.parentElement.innerHTML = `<span style="font-size:2.5rem">${CAT_EMOJIS[service.category] || '🔧'}</span>`} /> : CAT_EMOJIS[service.category] || '🔧'}
      </div>
      <div className="service-card-body">
        <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '.3rem' }}>{service.title}</div>
        <div style={{ fontSize: '.82rem', color: 'var(--text2)', lineHeight: 1.65, marginBottom: '.5rem' }}>{service.description?.slice(0, 100)}{service.description?.length > 100 ? '…' : ''}</div>
        {service.skills?.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem', marginBottom: '.75rem' }}>{service.skills.slice(0, 3).map(s => <span key={s} className="skill-tag" style={{ fontSize: '.7rem' }}>{s}</span>)}</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="service-card-price">₽{service.price?.toLocaleString()}</div>
            <div className="service-card-delivery">⏱ {service.deliveryDays} дн.</div>
          </div>
          {userId && <Link to={`/chat?user=${userId}`} className="btn btn-primary btn-sm">Заказать</Link>}
        </div>
      </div>
    </div>
  );
}

function ReviewItem({ review }) {
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
  return (
    <div className="review-item">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.5rem', flexWrap: 'wrap', gap: '.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <div className="avatar" style={{ width: 34, height: 34, fontSize: '.85rem', flexShrink: 0 }}>
            {review.reviewer?.avatar ? <img src={review.reviewer.avatar} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} /> : review.reviewer?.name?.charAt(0) || '?'}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{review.reviewer?.name || 'Пользователь'}</div>
            <div style={{ color: 'var(--amber)', fontSize: '.8rem' }}>{stars}</div>
          </div>
        </div>
        <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>{new Date(review.createdAt).toLocaleDateString('ru-RU')}</div>
      </div>
      {review.comment && <p style={{ fontSize: '.875rem', color: 'var(--text2)', lineHeight: 1.7 }}>{review.comment}</p>}
    </div>
  );
}
