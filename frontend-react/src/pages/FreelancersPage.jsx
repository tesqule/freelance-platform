import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const SKILLS = ['React','Node.js','Python','Figma','Flutter','Vue','PHP','SEO','Монтаж','Копирайтинг','TypeScript','PostgreSQL'];
const PAGE_SIZE = 12;

const IcoSearch = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>;
const IcoUser   = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

export default function FreelancersPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [freelancers, setFreelancers] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [skill,       setSkill]       = useState('');
  const [sort,        setSort]        = useState('rating');
  const [page,        setPage]        = useState(1);

  useEffect(() => { loadFreelancers(); }, []);
  useEffect(() => { setPage(1); }, [search, skill, sort]);

  async function loadFreelancers() {
    setLoading(true);
    try {
      const { data } = await API.get('/users');
      setFreelancers(Array.isArray(data) ? data.filter(u => u.role === 'freelancer' || u.role === 'admin') : []);
    } catch {}
    setLoading(false);
  }

  const filtered = freelancers
    .filter(fl => {
      const q = search.toLowerCase();
      return (!q || fl.name?.toLowerCase().includes(q) || fl.bio?.toLowerCase().includes(q) || fl.skills?.some(s => s.toLowerCase().includes(q)))
        && (!skill || fl.skills?.some(s => s.toLowerCase().includes(skill.toLowerCase())));
    })
    .sort((a, b) => {
      if (sort === 'rating')    return (b.rating || 0) - (a.rating || 0);
      if (sort === 'completed') return (b.completedTasks || 0) - (a.completedTasks || 0);
      if (sort === 'newest')    return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function goPage(p) { setPage(p); window.scrollTo({ top:0, behavior:'smooth' }); }

  return (
    <div className="page">
      {/* Header */}
      <div style={{ borderBottom:'1px solid var(--b1)', background:'var(--card)' }}>
        <div className="container" style={{ padding:'2rem 1.25rem 1.25rem' }}>
          <div style={{ marginBottom:'1.25rem' }}>
            <div style={{ fontSize:'.65rem', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--t3)', marginBottom:'.35rem' }}>Специалисты</div>
            <h1 style={{ fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:800, letterSpacing:'-.035em' }}>Фрилансеры</h1>
            <p style={{ color:'var(--t3)', fontSize:'.82rem', marginTop:'.3rem' }}>{freelancers.length} специалистов на платформе</p>
          </div>

          <div className="search-wrap" style={{ marginBottom:'1rem', maxWidth:480 }}>
            <span className="si"><IcoSearch/></span>
            <input placeholder="Имя, навык или специализация..." value={search} onChange={e => setSearch(e.target.value)}/>
          </div>

          {/* Skill filter */}
          <div style={{ display:'flex', gap:'.3rem', flexWrap:'wrap' }}>
            <button className={`filter-btn${skill==='' ? ' active' : ''}`} onClick={() => setSkill('')}>Все</button>
            {SKILLS.map(s => (
              <button key={s} className={`filter-btn${skill===s ? ' active' : ''}`} onClick={() => setSkill(skill===s ? '' : s)}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding:'1.5rem 1.25rem 4rem' }}>
        {/* Toolbar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', flexWrap:'wrap', gap:'.75rem' }}>
          <span style={{ fontSize:'.78rem', color:'var(--t3)' }}>
            {filtered.length} специалистов{totalPages > 1 && ` · стр. ${page} из ${totalPages}`}
          </span>
          <select value={sort} onChange={e => setSort(e.target.value)}
            style={{ background:'var(--s1)', border:'1px solid var(--b1)', borderRadius:'var(--r)', padding:'.38rem .75rem', color:'var(--t2)', fontFamily:'var(--font)', fontSize:'.78rem', cursor:'pointer', outline:'none' }}>
            <option value="rating">По рейтингу</option>
            <option value="completed">По заказам</option>
            <option value="newest">Новые</option>
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="freelancers-grid">
            {Array.from({length:8}).map((_,i) => (
              <div key={i} style={{ background:'var(--card)', padding:'1.35rem 1.1rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'.55rem' }}>
                <div className="skeleton" style={{ width:52, height:52, borderRadius:'50%' }}/>
                <div className="skeleton" style={{ height:14, width:'55%' }}/>
                <div className="skeleton" style={{ height:11, width:'72%' }}/>
                <div className="skeleton" style={{ height:11, width:'60%' }}/>
                <div style={{ display:'flex', gap:'.25rem' }}>
                  <div className="skeleton" style={{ height:20, width:46, borderRadius:3 }}/>
                  <div className="skeleton" style={{ height:20, width:52, borderRadius:3 }}/>
                </div>
              </div>
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="empty-state" style={{ padding:'4rem 2rem' }}>
            <div className="empty-icon"><IcoUser/></div>
            <h3>Специалистов не найдено</h3>
            <p>Попробуйте изменить поиск или навык</p>
            {(search || skill) && (
              <button className="btn btn-outline" style={{ marginTop:'1rem' }} onClick={() => { setSearch(''); setSkill(''); }}>Сбросить</button>
            )}
          </div>
        ) : (
          <div className="freelancers-grid">
            {paginated.map((fl,i) => <FlCard key={fl._id} fl={fl} index={i} user={user} nav={nav}/>)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display:'flex', gap:'.3rem', justifyContent:'center', marginTop:'2rem', flexWrap:'wrap' }}>
            <button className="btn btn-ghost btn-sm" disabled={page===1} onClick={() => goPage(page-1)}>← Назад</button>
            {Array.from({length:totalPages},(_,i) => i+1)
              .filter(p => p===1 || p===totalPages || Math.abs(p-page)<=1)
              .reduce((acc,p,idx,arr) => { if (idx>0 && p-arr[idx-1]>1) acc.push('...'); acc.push(p); return acc; }, [])
              .map((p,i) => p==='...'
                ? <span key={`d${i}`} style={{ alignSelf:'center', color:'var(--t3)', padding:'0 4px' }}>…</span>
                : <button key={p} className={`btn btn-sm ${p===page ? 'btn-primary' : 'btn-ghost'}`} onClick={() => goPage(p)}>{p}</button>
              )}
            <button className="btn btn-ghost btn-sm" disabled={page===totalPages} onClick={() => goPage(page+1)}>Вперёд →</button>
          </div>
        )}
      </div>
    </div>
  );
}

function FlCard({ fl, index, user, nav }) {
  const isOwn = user?.id === fl._id;

  return (
    <div className="fl-card" style={{ animationDelay:`${index*25}ms` }} onClick={() => nav(`/profile/${fl._id}`)}>
      <div className="fl-avatar">
        {fl.avatar ? <img src={fl.avatar} alt={fl.name}/> : fl.name?.charAt(0).toUpperCase()}
      </div>
      <div className="fl-name">{fl.name}</div>
      {fl.rating > 0 ? (
        <div className="fl-rating">
          {'★'.repeat(Math.round(fl.rating))}{'☆'.repeat(5-Math.round(fl.rating))}
          {' '}{fl.rating.toFixed(1)}
        </div>
      ) : (
        <div style={{ fontSize:'.72rem', color:'var(--t3)', marginBottom:'.45rem' }}>Нет отзывов</div>
      )}
      {fl.bio && <p className="fl-bio">{fl.bio}</p>}
      {fl.skills?.length > 0 && (
        <div className="fl-skills">
          {fl.skills.slice(0,4).map(s => <span key={s} className="skill-tag">{s}</span>)}
          {fl.skills.length > 4 && <span className="skill-tag">+{fl.skills.length-4}</span>}
        </div>
      )}
      <div className="fl-stat">{fl.completedTasks || 0} выполненных · {fl.reviewCount || 0} отзывов</div>
      <div className="fl-actions" onClick={e => e.stopPropagation()}>
        <button className="btn btn-ghost btn-sm" style={{ flex:1 }} onClick={() => nav(`/profile/${fl._id}`)}>Профиль</button>
        {user && !isOwn && (
          <button className="btn btn-outline btn-sm" style={{ flex:1 }} onClick={() => nav(`/chat?user=${fl._id}`)}>Написать</button>
        )}
      </div>
    </div>
  );
}
