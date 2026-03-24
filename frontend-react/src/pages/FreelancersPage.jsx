import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const SKILLS = ['React', 'Node.js', 'Python', 'Figma', 'Flutter', 'Vue', 'PHP', 'SEO', 'Монтаж', 'Копирайтинг'];
const PAGE_SIZE = 12;

export default function FreelancersPage() {
  const { user }            = useAuth();
  const navigate            = useNavigate();
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [skill, setSkill]             = useState('');
  const [sort, setSort]               = useState('rating');
  const [page, setPage]               = useState(1);

  useEffect(() => { loadFreelancers(); }, []);
  useEffect(() => { setPage(1); }, [search, skill, sort]);

  async function loadFreelancers() {
    setLoading(true);
    try {
      const { data } = await API.get('/users');
      const fls = Array.isArray(data) ? data.filter(u => u.role === 'freelancer' || u.role === 'admin') : [];
      setFreelancers(fls);
    } catch {}
    setLoading(false);
  }

  const filtered = freelancers
    .filter(fl => {
      const q = search.toLowerCase();
      const matchSearch = !q
        || fl.name?.toLowerCase().includes(q)
        || fl.bio?.toLowerCase().includes(q)
        || fl.skills?.some(s => s.toLowerCase().includes(q));
      const matchSkill = !skill || fl.skills?.some(s => s.toLowerCase().includes(skill.toLowerCase()));
      return matchSearch && matchSkill;
    })
    .sort((a, b) => {
      if (sort === 'rating')    return (b.rating || 0) - (a.rating || 0);
      if (sort === 'completed') return (b.completedTasks || 0) - (a.completedTasks || 0);
      if (sort === 'newest')    return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function goPage(p) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="page">
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(180deg,rgba(79,110,247,.06) 0%,transparent 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '3rem 0 2rem'
      }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.8rem,4vw,2.8rem)',
            fontWeight: 800, letterSpacing: '-.04em', marginBottom: '.5rem'
          }}>
            Найди фрилансера
          </h1>
          <p style={{ color: 'var(--text2)', marginBottom: '1.5rem', fontSize: '.95rem' }}>
            {freelancers.length} специалистов готовы взяться за твой проект
          </p>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: '1rem', pointerEvents: 'none' }}>⌕</span>
            <input
              style={{ width: '100%', padding: '13px 14px 13px 42px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '.95rem', outline: 'none', boxSizing: 'border-box' }}
              placeholder="Имя, навык, описание..."
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Популярные навыки */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${skill === '' ? 'btn-primary' : 'btn-glass'}`}
              onClick={() => setSkill('')}>
              Все
            </button>
            {SKILLS.map(s => (
              <button key={s}
                className={`btn btn-sm ${skill === s ? 'btn-primary' : 'btn-glass'}`}
                onClick={() => setSkill(skill === s ? '' : s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 1100, padding: '2rem 1rem 4rem' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ color: 'var(--text3)', fontSize: '.875rem' }}>
            Найдено: <strong style={{ color: 'var(--text)' }}>{filtered.length}</strong>
            {totalPages > 1 && <> · стр. {page} из {totalPages}</>}
          </span>
          <select value={sort} onChange={e => setSort(e.target.value)}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '.85rem', cursor: 'pointer', outline: 'none' }}>
            <option value="rating">По рейтингу</option>
            <option value="completed">По выполненным</option>
            <option value="newest">Новые</option>
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.75rem' }}>
                <div className="skeleton skeleton-avatar" style={{ width: 72, height: 72 }} />
                <div className="skeleton skeleton-line w-1-2 h-lg" />
                <div className="skeleton skeleton-line w-3-4" />
                <div className="skeleton skeleton-line w-full h-sm" />
              </div>
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <h3>Никого не найдено</h3>
            <p>Попробуй изменить поиск или навык</p>
            {(search || skill) && (
              <button className="btn btn-primary" style={{ marginTop: '1rem' }}
                onClick={() => { setSearch(''); setSkill(''); }}>
                Сбросить фильтры
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
            {paginated.map((fl, i) => (
              <FreelancerCard key={fl._id} fl={fl} user={user} navigate={navigate} index={i} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: '2rem', flexWrap: 'wrap' }}>
            <button className="btn btn-glass btn-sm" disabled={page === 1} onClick={() => goPage(page - 1)}>← Назад</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) => p === '...'
                ? <span key={`d${i}`} style={{ alignSelf: 'center', color: 'var(--text3)', padding: '0 4px' }}>…</span>
                : <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-glass'}`} onClick={() => goPage(p)}>{p}</button>
              )
            }
            <button className="btn btn-glass btn-sm" disabled={page === totalPages} onClick={() => goPage(page + 1)}>Вперёд →</button>
          </div>
        )}
      </div>
    </div>
  );
}

function FreelancerCard({ fl, user, navigate, index }) {
  const isOwn = user?.id === fl._id;

  return (
    <div className="card" style={{
      padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
      textAlign: 'center', cursor: 'pointer', transition: 'border-color .15s, transform .15s',
      animationDelay: `${index * 30}ms`, animation: 'fadeUp .4s ease both'
    }}
      onClick={() => navigate(`/profile/${fl._id}`)}
      onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Аватар */}
      <div className="avatar" style={{ width: 72, height: 72, fontSize: '1.6rem', marginBottom: '.75rem', background: 'linear-gradient(135deg,var(--blue),var(--purple))', boxShadow: '0 4px 16px rgba(79,110,247,.2)' }}>
        {fl.avatar
          ? <img src={fl.avatar} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
          : fl.name?.charAt(0).toUpperCase()}
      </div>

      {/* Имя */}
      <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '.2rem' }}>{fl.name}</div>

      {/* Рейтинг */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: '.6rem' }}>
        <span style={{ color: '#f59e0b', fontSize: '.85rem' }}>
          {'★'.repeat(Math.round(fl.rating || 0))}{'☆'.repeat(5 - Math.round(fl.rating || 0))}
        </span>
        <span style={{ fontSize: '.78rem', color: 'var(--text3)' }}>
          {fl.rating ? fl.rating.toFixed(1) : '—'}
        </span>
      </div>

      {/* Bio */}
      {fl.bio && (
        <p style={{
          fontSize: '.82rem', color: 'var(--text2)', lineHeight: 1.55,
          marginBottom: '.75rem', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {fl.bio}
        </p>
      )}

      {/* Навыки */}
      {fl.skills?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginBottom: '.75rem' }}>
          {fl.skills.slice(0, 4).map(s => (
            <span key={s} className="skill-tag" style={{ fontSize: '.7rem' }}>{s}</span>
          ))}
          {fl.skills.length > 4 && (
            <span className="skill-tag" style={{ fontSize: '.7rem' }}>+{fl.skills.length - 4}</span>
          )}
        </div>
      )}

      {/* Статистика */}
      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '.78rem', color: 'var(--text3)', marginBottom: '1rem' }}>
        <span>✅ {fl.completedTasks || 0} выполнено</span>
      </div>

      {/* Кнопки */}
      <div style={{ display: 'flex', gap: 8, width: '100%' }} onClick={e => e.stopPropagation()}>
        <button className="btn btn-glass btn-sm" style={{ flex: 1 }}
          onClick={() => navigate(`/profile/${fl._id}`)}>
          👤 Профиль
        </button>
        {user && !isOwn && (
          <button className="btn btn-primary btn-sm" style={{ flex: 1 }}
            onClick={() => navigate(`/chat?user=${fl._id}`)}>
            💬 Написать
          </button>
        )}
      </div>
    </div>
  );
}