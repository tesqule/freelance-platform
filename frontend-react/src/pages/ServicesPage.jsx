import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const CATS = ['all','development','design','writing','marketing','video','music','other'];
const CAT_LABELS = { all:'Все', development:'Разработка', design:'Дизайн', writing:'Тексты', marketing:'Маркетинг', video:'Видео', music:'Аудио', other:'Другое' };
const EMPTY_FORM = { title:'', description:'', imageUrl:'', category:'development', price:'', deliveryDays:'', skills:'' };

const IcoSearch = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>;

export default function ServicesPage({ onAuthOpen }) {
  const { user } = useAuth();
  const [services,   setServices]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [category,   setCategory]   = useState('all');
  const [search,     setSearch]     = useState('');
  const [sort,       setSort]       = useState('newest');
  const [showCreate, setShowCreate] = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [creating,   setCreating]   = useState(false);
  const [formError,  setFormError]  = useState('');

  useEffect(() => { loadServices(); }, []);

  async function loadServices() {
    setLoading(true);
    try { const { data } = await API.get('/services'); setServices(Array.isArray(data) ? data : []); } catch {}
    setLoading(false);
  }

  async function createService(e) {
    e.preventDefault(); setFormError('');
    if (!form.title || !form.price || !form.deliveryDays) { setFormError('Заполните все обязательные поля'); return; }
    setCreating(true);
    try {
      const skills = form.skills.split(',').map(s => s.trim()).filter(Boolean);
      await API.post('/services', { ...form, price:Number(form.price), deliveryDays:Number(form.deliveryDays), skills });
      setShowCreate(false); setForm(EMPTY_FORM); loadServices();
    } catch (err) { setFormError(err.response?.data?.message || 'Ошибка при создании'); }
    setCreating(false);
  }

  const filtered = services
    .filter(s => {
      const q = search.toLowerCase();
      return (!q || s.title?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q))
        && (category === 'all' || s.category === category);
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
      {/* Header */}
      <div style={{ borderBottom:'1px solid var(--b1)', background:'var(--card)' }}>
        <div className="container" style={{ padding:'2rem 1.25rem 1.25rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem', marginBottom:'1.25rem' }}>
            <div>
              <div style={{ fontSize:'.65rem', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--t3)', marginBottom:'.35rem' }}>Каталог</div>
              <h1 style={{ fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:800, letterSpacing:'-.035em' }}>Услуги</h1>
              <p style={{ color:'var(--t3)', fontSize:'.82rem', marginTop:'.3rem' }}>{services.length} предложений от фрилансеров</p>
            </div>
            <div style={{ display:'flex', gap:'.5rem' }}>
              {user?.role === 'freelancer' && (
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Добавить услугу</button>
              )}
              {!user && (
                <button className="btn btn-outline" onClick={() => onAuthOpen('register')}>Стать фрилансером</button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="search-wrap" style={{ marginBottom:'1rem', maxWidth:520 }}>
            <span className="si"><IcoSearch/></span>
            <input placeholder="React-разработка, дизайн логотипа, SEO..." value={search} onChange={e => setSearch(e.target.value)}/>
          </div>

          {/* Category tabs */}
          <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--b1)', marginBottom:'-1px', overflowX:'auto' }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                style={{
                  padding:'.5rem .9rem', background:'none', border:'none',
                  borderBottom:`2px solid ${category===c ? 'var(--t1)' : 'transparent'}`,
                  color: category===c ? 'var(--t1)' : 'var(--t3)',
                  fontFamily:'var(--font)', fontSize:'.78rem', fontWeight: category===c ? 600 : 400,
                  cursor:'pointer', transition:'color .12s', whiteSpace:'nowrap', marginBottom:'-1px',
                }}>
                {CAT_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding:'1.5rem 1.25rem 4rem' }}>
        {/* Toolbar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', flexWrap:'wrap', gap:'.75rem' }}>
          <span style={{ fontSize:'.78rem', color:'var(--t3)' }}>{filtered.length} услуг</span>
          <select value={sort} onChange={e => setSort(e.target.value)}
            style={{ background:'var(--s1)', border:'1px solid var(--b1)', borderRadius:'var(--r)', padding:'.38rem .75rem', color:'var(--t2)', fontFamily:'var(--font)', fontSize:'.78rem', cursor:'pointer', outline:'none' }}>
            <option value="newest">Сначала новые</option>
            <option value="price_asc">Цена по возрастанию</option>
            <option value="price_desc">Цена по убыванию</option>
            <option value="rating">По рейтингу</option>
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="services-grid">
            {Array.from({length:6}).map((_,i) => (
              <div key={i} style={{ background:'var(--card)', overflow:'hidden' }}>
                <div className="skeleton" style={{ height:140, borderRadius:0 }}/>
                <div style={{ padding:'.9rem', display:'flex', flexDirection:'column', gap:'.45rem' }}>
                  <div className="skeleton" style={{ height:14, width:'72%' }}/>
                  <div className="skeleton" style={{ height:11 }}/>
                  <div className="skeleton" style={{ height:11, width:'60%' }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:'.3rem' }}>
                    <div className="skeleton" style={{ height:18, width:70, borderRadius:3 }}/>
                    <div className="skeleton" style={{ height:28, width:68, borderRadius:6 }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding:'4rem 2rem' }}>
            <div className="empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <h3>Услуги не найдены</h3>
            <p>Попробуйте изменить поиск или категорию</p>
            {user?.role === 'freelancer' && (
              <button className="btn btn-primary" style={{ marginTop:'1rem' }} onClick={() => setShowCreate(true)}>Добавить первую услугу</button>
            )}
          </div>
        ) : (
          <div className="services-grid">
            {filtered.map((s,i) => <ServiceCard key={s._id} service={s} index={i} user={user} onAuthOpen={onAuthOpen}/>)}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="modal-overlay open" onClick={e => e.target===e.currentTarget && setShowCreate(false)}>
          <div className="modal" style={{ maxWidth:520 }}>
            <div className="modal-header">
              <h3>Добавить услугу</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}>
                <svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 5 5 15M5 5l10 10"/></svg>
              </button>
            </div>
            <form onSubmit={createService}>
              {formError && <div style={{ background:'var(--red-dim)', border:'1px solid rgba(239,68,68,.2)', borderRadius:'var(--r)', padding:'9px 12px', marginBottom:'.9rem', color:'#f87171', fontSize:'.78rem' }}>{formError}</div>}
              <div className="form-group"><label>Название *</label><input className="form-control" placeholder="Разработка сайта на React" value={form.title} onChange={e => setForm(f => ({...f, title:e.target.value}))} required/></div>
              <div className="form-group"><label>Описание</label><textarea className="form-control" style={{ minHeight:90, resize:'none' }} placeholder="Что именно вы делаете, какой результат получит заказчик..." value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))}/></div>
              <div className="form-group"><label>Обложка (ссылка)</label><input className="form-control" placeholder="https://..." value={form.imageUrl} onChange={e => setForm(f => ({...f, imageUrl:e.target.value}))}/></div>
              <div className="grid-2">
                <div className="form-group"><label>Цена (₽) *</label><input className="form-control" type="number" placeholder="3000" value={form.price} onChange={e => setForm(f => ({...f, price:e.target.value}))} required/></div>
                <div className="form-group"><label>Срок (дней) *</label><input className="form-control" type="number" placeholder="3" value={form.deliveryDays} onChange={e => setForm(f => ({...f, deliveryDays:e.target.value}))} required/></div>
              </div>
              <div className="form-group"><label>Категория</label>
                <select className="form-control" value={form.category} onChange={e => setForm(f => ({...f, category:e.target.value}))}>
                  {CATS.filter(c => c!=='all').map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Навыки</label><input className="form-control" placeholder="React, Figma, SEO" value={form.skills} onChange={e => setForm(f => ({...f, skills:e.target.value}))}/></div>
              <button className="btn btn-primary w-full" type="submit" disabled={creating}>{creating ? 'Публикуем...' : 'Опубликовать услугу'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ServiceCard({ service, index, user, onAuthOpen }) {
  const nav = useNavigate();
  const fl  = service.freelancer || {};

  function handleOrder(e) {
    e.stopPropagation();
    if (!user) { onAuthOpen('login'); return; }
    nav(`/chat?user=${fl._id}&service=${service._id}`);
  }

  return (
    <div className="service-card" style={{ animationDelay:`${index*30}ms` }}>
      <div className="service-thumb">
        {service.imageUrl
          ? <img src={service.imageUrl} alt={service.title} onError={e => { e.target.style.display='none'; }}/>
          : <span className="service-thumb-empty">—</span>}
        <span className="service-cat-badge">{CAT_LABELS[service.category]}</span>
      </div>
      <div className="service-body">
        {/* Author */}
        <div style={{ display:'flex', alignItems:'center', gap:'.4rem', marginBottom:'.6rem' }}>
          <div className="avatar" style={{ width:22, height:22, fontSize:'.62rem' }}>
            {fl.avatar ? <img src={fl.avatar} alt=""/> : (fl.name||'?').charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize:'.75rem', color:'var(--t2)', fontWeight:500, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{fl.name||'Фрилансер'}</span>
          {fl.rating > 0 && <span style={{ fontSize:'.72rem', color:'var(--amber)', fontWeight:600, flexShrink:0 }}>★ {fl.rating.toFixed(1)}</span>}
        </div>

        <div className="service-title">{service.title}</div>

        {service.description && (
          <p style={{ fontSize:'.76rem', color:'var(--t2)', lineHeight:1.55, marginBottom:'.5rem', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{service.description}</p>
        )}

        {service.skills?.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:'.2rem', marginBottom:'.55rem' }}>
            {service.skills.slice(0,3).map(s => <span key={s} className="skill-tag">{s}</span>)}
            {service.skills.length > 3 && <span className="skill-tag">+{service.skills.length-3}</span>}
          </div>
        )}

        <div className="service-footer">
          <div>
            <div className="service-price">₽{service.price?.toLocaleString()}</div>
            <div className="service-delivery">Срок {service.deliveryDays} дн.</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleOrder}>Заказать</button>
        </div>
      </div>
    </div>
  );
}
