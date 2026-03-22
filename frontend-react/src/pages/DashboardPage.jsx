import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API from '../api';

const CAT_EMOJIS  = { development:'💻', design:'🎨', writing:'✍️', marketing:'📣', video:'🎬', music:'🎵', other:'🔧' };
const CAT_LABELS  = { development:'Разработка', design:'Дизайн', writing:'Тексты', marketing:'Маркетинг', video:'Видео', music:'Музыка', other:'Другое' };
const CLOUDINARY_CLOUD  = 'dttvzxrvg';
const CLOUDINARY_PRESET = 'freelancehub_unsigned';

/* ── Скелетон статистики ── */
function StatSkeleton() {
  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:20, padding:'1.25rem', display:'flex', flexDirection:'column', gap:'.5rem' }}>
      <div className="skeleton" style={{ height:32, width:32, borderRadius:8 }} />
      <div className="skeleton" style={{ height:28, width:'55%', borderRadius:8 }} />
      <div className="skeleton" style={{ height:12, width:'75%', borderRadius:6 }} />
    </div>
  );
}

/* ── Диалог подтверждения ── */
function ConfirmDialog({ msg, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay open" onClick={onCancel}>
      <div className="modal" style={{ maxWidth:380 }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign:'center', padding:'.5rem 0 1rem' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'.75rem' }}>🗑</div>
          <h3 style={{ marginBottom:'.5rem', fontSize:'1.1rem' }}>Подтверждение</h3>
          <p style={{ color:'var(--text2)', fontSize:'.9rem', lineHeight:1.6 }}>{msg}</p>
        </div>
        <div style={{ display:'flex', gap:'.65rem', marginTop:'1.25rem' }}>
          <button className="btn btn-glass w-full" onClick={onCancel}>Отмена</button>
          <button className="btn btn-danger w-full" onClick={onConfirm}>Удалить</button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, updateUser, logout } = useAuth();
  const navigate  = useNavigate();
  const toast     = useToast();

  const [tab, setTab]           = useState('overview');
  const [profile, setProfile]   = useState(null);
  const [myTasks, setMyTasks]   = useState([]);
  const [myProposals, setMyProposals] = useState([]);
  const [portfolio, setPortfolio]     = useState([]);
  const [services, setServices]       = useState([]);
  const [favTasks, setFavTasks]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [confirm, setConfirm]         = useState(null); // { msg, onConfirm }

  // Edit form
  const [editName, setEditName]   = useState('');
  const [editBio, setEditBio]     = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving]       = useState(false);

  // Portfolio modal
  const [portModal, setPortModal] = useState(false);
  const [portEdit, setPortEdit]   = useState(null);
  const [portForm, setPortForm]   = useState({ title:'', description:'', category:'development', imageUrl:'', projectUrl:'', skills:'' });

  // Service modal
  const [svcModal, setSvcModal]   = useState(false);
  const [svcEdit, setSvcEdit]     = useState(null);
  const [svcForm, setSvcForm]     = useState({ title:'', description:'', category:'development', price:'', deliveryDays:'', imageUrl:'', skills:'' });

  useEffect(() => { if (!user) { navigate('/'); return; } loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const { data } = await API.get(`/users/${user.id}`);
      setProfile(data);
    } catch {}
    setLoading(false);
  }

  async function loadMyTasks() {
    try {
      const { data } = await API.get('/tasks/my');
      setMyTasks(Array.isArray(data) ? data : []);
    } catch {
      try {
        const { data } = await API.get('/tasks');
        setMyTasks(data.filter(t => t.client?._id === user.id || t.client === user.id));
      } catch {}
    }
  }

  async function loadMyProposals() {
    try {
      const { data } = await API.get('/tasks');
      const proposals = [];
      data.forEach(task => {
        task.proposals?.forEach(p => {
          if (p.freelancer?._id === user.id || p.freelancer === user.id)
            proposals.push({ ...p, task });
        });
      });
      setMyProposals(proposals);
    } catch {}
  }

  async function loadPortfolio() {
    try { const { data } = await API.get(`/portfolio/${user.id}`); setPortfolio(data); } catch {}
  }

  async function loadServices() {
    try { const { data } = await API.get('/services/my'); setServices(data); } catch {}
  }

  async function loadFavs() {
    try {
      const { data } = await API.get('/favorites');
      setFavTasks(data.map(f => f.task).filter(Boolean));
    } catch {}
  }

  function switchTab(t) {
    setTab(t);
    if (t === 'tasks')     { loadMyTasks(); if (user.role === 'freelancer') loadMyProposals(); }
    if (t === 'edit')      { setEditName(user.name||''); setEditBio(user.bio||''); setEditSkills((user.skills||[]).join(', ')); setEditAvatar(user.avatar||''); loadPortfolio(); loadServices(); }
    if (t === 'favorites') { loadFavs(); }
  }

  async function saveProfile() {
    if (!editName.trim()) { toast('Имя не может быть пустым', 'error'); return; }
    setSaving(true);
    try {
      const skills = editSkills.split(',').map(s => s.trim()).filter(Boolean);
      const { data } = await API.put('/users/profile/update', { name:editName, avatar:editAvatar, bio:editBio, skills });
      updateUser({ ...user, name:data.name, avatar:data.avatar, bio:data.bio, skills:data.skills });
      toast('Профиль обновлён ✅');
    } catch (err) { toast(err.response?.data?.message || 'Ошибка', 'error'); }
    setSaving(false);
  }

  async function uploadAvatar(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast('Файл слишком большой (макс. 5MB)', 'error'); return; }
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', CLOUDINARY_PRESET);
      fd.append('folder', 'freelancehub');
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method:'POST', body:fd });
      const data = await res.json();
      if (data.secure_url) { setEditAvatar(data.secure_url); toast('Фото загружено ✅'); }
      else throw new Error();
    } catch {
      const reader = new FileReader();
      reader.onload = ev => { setEditAvatar(ev.target.result); toast('Фото выбрано (base64)'); };
      reader.readAsDataURL(file);
    }
    setAvatarUploading(false);
  }

  async function savePortfolio() {
    if (!portForm.title.trim()) { toast('Укажите название', 'error'); return; }
    const skills = portForm.skills.split(',').map(s => s.trim()).filter(Boolean);
    try {
      if (portEdit) { await API.put(`/portfolio/${portEdit}`, { ...portForm, skills }); toast('Обновлено ✅'); }
      else          { await API.post('/portfolio', { ...portForm, skills }); toast('Работа добавлена 🎉'); }
      setPortModal(false); setPortEdit(null);
      setPortForm({ title:'', description:'', category:'development', imageUrl:'', projectUrl:'', skills:'' });
      loadPortfolio();
    } catch (err) { toast(err.response?.data?.message || 'Ошибка', 'error'); }
  }

  function confirmDelete(msg, action) {
    setConfirm({ msg, onConfirm: async () => { setConfirm(null); await action(); } });
  }

  async function deletePortfolio(id) {
    confirmDelete('Удалить эту работу из портфолио?', async () => {
      try { await API.delete(`/portfolio/${id}`); toast('Удалено'); loadPortfolio(); } catch {}
    });
  }

  async function saveService() {
    if (!svcForm.title.trim() || !svcForm.price || !svcForm.deliveryDays) {
      toast('Заполните все обязательные поля', 'error'); return;
    }
    const skills = svcForm.skills.split(',').map(s => s.trim()).filter(Boolean);
    const body   = { ...svcForm, price:Number(svcForm.price), deliveryDays:Number(svcForm.deliveryDays), skills };
    try {
      if (svcEdit) { await API.put(`/services/${svcEdit}`, body); toast('Услуга обновлена ✅'); }
      else         { await API.post('/services', body); toast('Услуга добавлена 🎉'); }
      setSvcModal(false); setSvcEdit(null);
      setSvcForm({ title:'', description:'', category:'development', price:'', deliveryDays:'', imageUrl:'', skills:'' });
      loadServices();
    } catch (err) { toast(err.response?.data?.message || 'Ошибка', 'error'); }
  }

  async function deleteService(id) {
    confirmDelete('Удалить эту услугу?', async () => {
      try { await API.delete(`/services/${id}`); toast('Удалено'); loadServices(); } catch {}
    });
  }

  async function removeFav(taskId) {
    try { await API.delete(`/favorites/${taskId}`); setFavTasks(prev => prev.filter(t => t._id !== taskId)); toast('Удалено из избранного'); } catch {}
  }

  const p = profile || user;

  const STATS = [
    { icon:'⭐', label:'Рейтинг',   value:(p?.rating||0).toFixed(1),              color:'var(--amber)',  bg:'rgba(245,158,11,.08)'  },
    { icon:'✅', label:'Выполнено', value:p?.completedTasks||0,                   color:'var(--green)',  bg:'rgba(16,217,138,.08)'  },
    { icon:'💰', label:'Баланс',    value:`₽${(p?.balance||0).toLocaleString()}`, color:'var(--blue)',   bg:'rgba(79,110,247,.08)'  },
    { icon:'💬', label:'Отзывов',   value:p?.reviewCount||0,                      color:'var(--purple)', bg:'rgba(139,92,246,.08)'  },
  ];

  const TABS = [
    { id:'overview',  icon:'🏠', label:'Обзор'        },
    { id:'tasks',     icon:'📋', label:'Задания'       },
    { id:'favorites', icon:'❤️', label:'Избранное'    },
    { id:'edit',      icon:'✏️', label:'Редактировать' },
  ];

  return (
    <div className="page">
      <div className="container" style={{ paddingBottom:'5rem' }}>
        <div className="dashboard-grid mt-3">

          {/* ── SIDEBAR ── */}
          <aside className="sidebar">
            {loading ? (
              <div className="card mb-2" style={{ padding:'1.75rem', display:'flex', flexDirection:'column', gap:'.75rem', alignItems:'center' }}>
                <div className="skeleton" style={{ width:76, height:76, borderRadius:'50%' }} />
                <div className="skeleton" style={{ width:'60%', height:16, borderRadius:8 }} />
                <div className="skeleton" style={{ width:'80%', height:12, borderRadius:6 }} />
              </div>
            ) : (
              <div className="card mb-2" style={{ textAlign:'center', padding:'1.75rem 1.25rem' }}>
                <div style={{ position:'relative', width:76, height:76, margin:'0 auto .9rem' }}>
                  <div className="avatar" style={{ width:76, height:76, fontSize:'1.9rem', boxShadow:'0 4px 20px rgba(79,110,247,.35)' }}>
                    {p?.avatar
                      ? <img src={p.avatar} style={{ width:76, height:76, borderRadius:'50%', objectFit:'cover' }} alt="" />
                      : p?.name?.charAt(0)}
                  </div>
                </div>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1.05rem' }}>{p?.name}</div>
                <div style={{ fontSize:'.8rem', color:'var(--text3)', marginTop:'.2rem' }}>{p?.email||user.email}</div>
                <div style={{ marginTop:'.6rem' }}>
                  <span style={{
                    display:'inline-block', padding:'.22rem .75rem', borderRadius:99,
                    fontSize:'.7rem', fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase',
                    background: p?.role==='client' ? 'rgba(236,72,153,.1)' : 'rgba(79,110,247,.1)',
                    color:      p?.role==='client' ? '#f472b6' : 'var(--blue-light)',
                    border:     `1px solid ${p?.role==='client' ? 'rgba(236,72,153,.25)' : 'rgba(79,110,247,.25)'}`,
                  }}>
                    {p?.role==='client' ? '📋 Заказчик' : '💼 Фрилансер'}
                  </span>
                </div>
                <div style={{ marginTop:'.9rem', paddingTop:'.9rem', borderTop:'1px solid var(--border)' }}>
                  <div style={{ fontSize:'.7rem', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'.2rem' }}>Баланс</div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:800, color:'var(--green)' }}>
                    ₽{(p?.balance||0).toLocaleString()}
                  </div>
                </div>
                <Link to={`/profile/${user.id}`} className="btn btn-glass btn-sm" style={{ marginTop:'.9rem', width:'100%' }}>
                  👤 Мой профиль
                </Link>
              </div>
            )}

            <nav className="card" style={{ padding:'.4rem' }}>
              <ul className="sidebar-nav">
                {TABS.map(t => (
                  <li key={t.id}>
                    <a href="#" className={tab===t.id ? 'active' : ''}
                      onClick={e => { e.preventDefault(); switchTab(t.id); }}>
                      <span className="icon">{t.icon}</span>{t.label}
                    </a>
                  </li>
                ))}
                <li><Link to="/chat"><span className="icon">💬</span>Сообщения</Link></li>
                <li><Link to="/tasks"><span className="icon">🔍</span>Найти задания</Link></li>
                <li style={{ borderTop:'1px solid var(--border)', paddingTop:'.4rem', marginTop:'.4rem' }}>
                  <a href="#" onClick={e => { e.preventDefault(); logout(); navigate('/'); }}
                    style={{ color:'var(--red)' }}>
                    <span className="icon">🚪</span>Выйти
                  </a>
                </li>
              </ul>
            </nav>
          </aside>

          {/* ── MAIN ── */}
          <main>

            {/* OVERVIEW */}
            {tab==='overview' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                <div>
                  <div className="section-eyebrow">Дашборд</div>
                  <h2 style={{ fontSize:'1.6rem', letterSpacing:'-.035em' }}>
                    Добро пожаловать, {p?.name?.split(' ')[0]} 👋
                  </h2>
                </div>

                {/* Статистика */}
                {loading ? (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'1rem' }}>
                    {[1,2,3,4].map(i => <StatSkeleton key={i} />)}
                  </div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'1rem' }}>
                    {STATS.map(s => (
                      <div key={s.label} style={{
                        background:'var(--card)', border:'1px solid var(--border)',
                        borderRadius:20, padding:'1.25rem',
                        display:'flex', flexDirection:'column', gap:'.35rem',
                        transition:'border-color .18s, transform .18s',
                      }}
                        onMouseOver={e => { e.currentTarget.style.borderColor='rgba(79,110,247,.35)'; e.currentTarget.style.transform='translateY(-2px)'; }}
                        onMouseOut={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='none'; }}
                      >
                        <div style={{ width:36, height:36, borderRadius:10, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem' }}>
                          {s.icon}
                        </div>
                        <div style={{ fontFamily:'var(--font-display)', fontSize:'1.55rem', fontWeight:800, color:s.color, letterSpacing:'-.04em', lineHeight:1 }}>
                          {s.value}
                        </div>
                        <div style={{ fontSize:'.72rem', color:'var(--text3)', fontWeight:500, textTransform:'uppercase', letterSpacing:'.05em' }}>
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Быстрые действия */}
                <div style={{
                  background:'var(--card)', border:'1px solid var(--border)',
                  borderRadius:20, padding:'1.25rem',
                }}>
                  <h3 style={{ fontSize:'.95rem', fontWeight:700, marginBottom:'1rem' }}>⚡ Быстрые действия</h3>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'.65rem' }}>
                    {[
                      { icon:'🔍', label:'Найти задания',  to:'/tasks',        color:'var(--blue)'   },
                      { icon:'🛠', label:'Каталог услуг',  to:'/services',     color:'var(--purple)' },
                      { icon:'👥', label:'Фрилансеры',     to:'/freelancers',  color:'var(--green)'  },
                      { icon:'💬', label:'Мои сообщения',  to:'/chat',         color:'var(--amber)'  },
                    ].map(a => (
                      <Link key={a.to} to={a.to} style={{
                        display:'flex', alignItems:'center', gap:'.7rem',
                        padding:'.8rem 1rem', borderRadius:14,
                        background:'var(--surface)', border:'1px solid var(--border)',
                        color:'var(--text)', textDecoration:'none',
                        transition:'all .16s', fontSize:'.875rem', fontWeight:600,
                      }}
                        onMouseOver={e => { e.currentTarget.style.borderColor='var(--border2)'; e.currentTarget.style.background='var(--surface2)'; }}
                        onMouseOut={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--surface)'; }}
                      >
                        <span style={{ fontSize:'1.2rem' }}>{a.icon}</span>
                        {a.label}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Bio и навыки */}
                {p?.bio && (
                  <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:20, padding:'1.25rem' }}>
                    <h3 style={{ fontSize:'.95rem', fontWeight:700, marginBottom:'.75rem' }}>О себе</h3>
                    <p style={{ color:'var(--text2)', lineHeight:1.75, fontSize:'.9rem' }}>{p.bio}</p>
                  </div>
                )}

                {p?.skills?.length > 0 && (
                  <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:20, padding:'1.25rem' }}>
                    <h3 style={{ fontSize:'.95rem', fontWeight:700, marginBottom:'.75rem' }}>Навыки</h3>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'.35rem' }}>
                      {p.skills.map(s => <span key={s} className="skill-tag">{s}</span>)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MY TASKS */}
            {tab==='tasks' && (
              <div>
                {user.role==='client' ? (
                  <>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                      <h3 style={{ fontSize:'1.3rem', letterSpacing:'-.03em' }}>Мои задания</h3>
                      <Link to="/tasks" className="btn btn-primary btn-sm">+ Разместить</Link>
                    </div>
                    {myTasks.length===0
                      ? <EmptyBox icon="📭" title="Заданий пока нет" sub="Разместите первое задание">
                          <Link to="/tasks" className="btn btn-primary mt-2">Разместить задание</Link>
                        </EmptyBox>
                      : myTasks.map(task => <TaskRow key={task._id} task={task} />)
                    }
                  </>
                ) : (
                  <>
                    <h3 style={{ fontSize:'1.3rem', letterSpacing:'-.03em', marginBottom:'1.5rem' }}>Мои отклики</h3>
                    {myProposals.length===0
                      ? <EmptyBox icon="📭" title="Откликов пока нет" sub="Найдите задания и откликнитесь">
                          <Link to="/tasks" className="btn btn-primary mt-2">Найти задания</Link>
                        </EmptyBox>
                      : myProposals.map((p,i) => <ProposalRow key={i} proposal={p} />)
                    }
                  </>
                )}
              </div>
            )}

            {/* FAVORITES */}
            {tab==='favorites' && (
              <div>
                <h3 style={{ fontSize:'1.3rem', letterSpacing:'-.03em', marginBottom:'1.5rem' }}>Избранные задания</h3>
                {favTasks.length===0
                  ? <EmptyBox icon="❤️" title="Избранного нет" sub="Добавляйте задания через сердечко" />
                  : <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
                    {favTasks.map(task => (
                      <div key={task._id} style={{
                        background:'var(--card)', border:'1px solid var(--border)',
                        borderRadius:16, padding:'1.1rem 1.25rem',
                        display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem',
                        transition:'border-color .15s',
                      }}
                        onMouseOver={e => e.currentTarget.style.borderColor='var(--border2)'}
                        onMouseOut={e => e.currentTarget.style.borderColor='var(--border)'}
                      >
                        <div>
                          <Link to={`/tasks/${task._id}`} style={{ fontWeight:700, color:'var(--text)', textDecoration:'none', fontSize:'.95rem' }}>
                            {task.title}
                          </Link>
                          <div style={{ fontSize:'.8rem', color:'var(--text3)', marginTop:'.25rem' }}>
                            ₽{task.budget?.toLocaleString()}
                          </div>
                        </div>
                        <button className="btn btn-danger btn-sm" onClick={() => removeFav(task._id)}>🗑</button>
                      </div>
                    ))}
                  </div>
                }
              </div>
            )}

            {/* EDIT */}
            {tab==='edit' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
                <div>
                  <div className="section-eyebrow">Аккаунт</div>
                  <h3 style={{ fontSize:'1.3rem', letterSpacing:'-.03em' }}>Редактировать профиль</h3>
                </div>

                {/* Основная форма */}
                <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:20, padding:'1.75rem' }}>
                  <div className="grid-2" style={{ gap:'1rem', marginBottom:'1rem' }}>
                    <div className="form-group" style={{ marginBottom:0 }}>
                      <label>Имя</label>
                      <input className="form-control" value={editName} onChange={e => setEditName(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom:0 }}>
                      <label>Аватар</label>
                      <div style={{ display:'flex', gap:'.6rem', alignItems:'flex-start' }}>
                        <div style={{ width:64, height:64, borderRadius:12, background:'var(--surface2)', border:'1px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', fontSize:'1.5rem', flexShrink:0 }}>
                          {editAvatar ? <img src={editAvatar} style={{ width:64, height:64, objectFit:'cover' }} alt="" /> : '👤'}
                        </div>
                        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'.4rem' }}>
                          <input className="form-control" style={{ fontSize:'.82rem' }} placeholder="https://..." value={editAvatar} onChange={e => setEditAvatar(e.target.value)} />
                          <label style={{ display:'inline-flex', alignItems:'center', gap:'.4rem', padding:'.45rem .85rem', borderRadius:8, background:'var(--surface)', border:'1px solid var(--border2)', color:'var(--text2)', fontSize:'.78rem', fontWeight:600, cursor:'pointer' }}>
                            {avatarUploading ? '⏳ Загрузка...' : '📁 Загрузить'}
                            <input type="file" accept="image/*" style={{ display:'none' }} onChange={uploadAvatar} />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="form-group mt-2">
                    <label>О себе</label>
                    <textarea className="form-control" style={{ minHeight:115, resize:'none' }} placeholder="Расскажите о себе..." value={editBio} onChange={e => setEditBio(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Навыки (через запятую)</label>
                    <input className="form-control" placeholder="React, Node.js, Figma..." value={editSkills} onChange={e => setEditSkills(e.target.value)} />
                    <div style={{ fontSize:'.72rem', color:'var(--text3)', marginTop:'.4rem' }}>Навыки помогают заказчикам найти тебя</div>
                  </div>
                  {editSkills && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'.4rem', marginBottom:'1.25rem' }}>
                      {editSkills.split(',').map(s=>s.trim()).filter(Boolean).map(s => <span key={s} className="skill-tag">{s}</span>)}
                    </div>
                  )}
                  <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
                    {saving ? 'Сохраняем...' : 'Сохранить изменения'}
                  </button>
                </div>

                {/* Портфолио — только для фрилансеров */}
                {user.role==='freelancer' && (
                  <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:20, padding:'1.5rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                      <h3 style={{ fontSize:'1rem', fontWeight:700 }}>🖼 Портфолио</h3>
                      <button className="btn btn-primary btn-sm" onClick={() => { setPortEdit(null); setPortForm({ title:'', description:'', category:'development', imageUrl:'', projectUrl:'', skills:'' }); setPortModal(true); }}>
                        + Добавить
                      </button>
                    </div>
                    {portfolio.length===0
                      ? <EmptyBox icon="🖼" title="Портфолио пусто" sub="Добавьте работы чтобы заказчики видели ваш опыт" />
                      : <div className="portfolio-grid">
                        {portfolio.map(item => (
                          <div key={item._id} className="portfolio-card">
                            <div className="portfolio-img">
                              {item.imageUrl ? <img src={item.imageUrl} alt={item.title} onError={e => { e.target.style.display='none'; }} /> : CAT_EMOJIS[item.category]||'🔧'}
                            </div>
                            <div className="portfolio-body">
                              <div style={{ fontWeight:700, fontSize:'.9rem', marginBottom:'.3rem' }}>{item.title}</div>
                              {item.description && <div style={{ fontSize:'.78rem', color:'var(--text2)', lineHeight:1.6 }}>{item.description}</div>}
                              <div style={{ display:'flex', gap:'.4rem', marginTop:'.75rem' }}>
                                {item.projectUrl && <a href={item.projectUrl} target="_blank" rel="noopener noreferrer" className="btn btn-glass btn-sm">🔗</a>}
                                <button className="btn btn-glass btn-sm" onClick={() => { setPortEdit(item._id); setPortForm({ title:item.title, description:item.description||'', category:item.category, imageUrl:item.imageUrl||'', projectUrl:item.projectUrl||'', skills:(item.skills||[]).join(', ') }); setPortModal(true); }}>✏️</button>
                                <button className="btn btn-danger btn-sm" onClick={() => deletePortfolio(item._id)}>🗑</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    }
                  </div>
                )}

                {/* Услуги — только для фрилансеров */}
                {user.role==='freelancer' && (
                  <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:20, padding:'1.5rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                      <h3 style={{ fontSize:'1rem', fontWeight:700 }}>🛠 Услуги</h3>
                      <button className="btn btn-primary btn-sm" onClick={() => { setSvcEdit(null); setSvcForm({ title:'', description:'', category:'development', price:'', deliveryDays:'', imageUrl:'', skills:'' }); setSvcModal(true); }}>
                        + Добавить
                      </button>
                    </div>
                    {services.length===0
                      ? <EmptyBox icon="🛠" title="Услуг пока нет" sub="Добавьте услуги чтобы заказчики могли вас нанять напрямую" />
                      : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'1rem' }}>
                        {services.map(s => (
                          <div key={s._id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' }}>
                            <div style={{ width:'100%', height:120, background:'var(--bg3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem', overflow:'hidden' }}>
                              {s.imageUrl ? <img src={s.imageUrl} style={{ width:'100%', height:120, objectFit:'cover' }} alt="" onError={e => { e.target.style.display='none'; }} /> : CAT_EMOJIS[s.category]||'🔧'}
                            </div>
                            <div style={{ padding:'.85rem' }}>
                              <div style={{ fontWeight:700, fontSize:'.88rem', marginBottom:'.3rem' }}>{s.title}</div>
                              <div style={{ fontFamily:'var(--font-display)', fontSize:'1rem', fontWeight:800, color:'var(--green)', margin:'.3rem 0' }}>₽{s.price?.toLocaleString()}</div>
                              <div style={{ fontSize:'.72rem', color:'var(--text3)', marginBottom:'.6rem' }}>⏱ {s.deliveryDays} дн.</div>
                              <div style={{ display:'flex', gap:'.4rem' }}>
                                <button className="btn btn-glass btn-sm" onClick={() => { setSvcEdit(s._id); setSvcForm({ title:s.title, description:s.description, category:s.category, price:s.price, deliveryDays:s.deliveryDays, imageUrl:s.imageUrl||'', skills:(s.skills||[]).join(', ') }); setSvcModal(true); }}>✏️ Изменить</button>
                                <button className="btn btn-danger btn-sm" onClick={() => deleteService(s._id)}>🗑</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    }
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── Диалог подтверждения ── */}
      {confirm && <ConfirmDialog msg={confirm.msg} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}

      {/* ── Portfolio Modal ── */}
      {portModal && (
        <div className="modal-overlay open" onClick={e => e.target===e.currentTarget && setPortModal(false)}>
          <div className="modal" style={{ maxWidth:540 }}>
            <div className="modal-header">
              <h3>{portEdit ? 'Редактировать работу' : 'Добавить работу'}</h3>
              <button className="modal-close" onClick={() => setPortModal(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="form-group"><label>Название *</label><input className="form-control" placeholder="Лендинг для стартапа" value={portForm.title} onChange={e => setPortForm(f=>({...f,title:e.target.value}))} /></div>
            <div className="form-group"><label>Описание</label><textarea className="form-control" style={{ minHeight:85, resize:'none' }} value={portForm.description} onChange={e => setPortForm(f=>({...f,description:e.target.value}))} /></div>
            <div className="grid-2">
              <div className="form-group"><label>Категория</label>
                <select className="form-control" value={portForm.category} onChange={e => setPortForm(f=>({...f,category:e.target.value}))}>
                  {Object.entries(CAT_LABELS).map(([v,l]) => <option key={v} value={v}>{CAT_EMOJIS[v]} {l}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Навыки</label><input className="form-control" placeholder="React, Figma..." value={portForm.skills} onChange={e => setPortForm(f=>({...f,skills:e.target.value}))} /></div>
            </div>
            <div className="form-group"><label>Ссылка на картинку</label><input className="form-control" style={{ fontSize:'.82rem' }} placeholder="https://i.imgur.com/..." value={portForm.imageUrl} onChange={e => setPortForm(f=>({...f,imageUrl:e.target.value}))} /></div>
            <div className="form-group" style={{ marginBottom:0 }}><label>Ссылка на проект</label><input className="form-control" placeholder="https://myproject.com" value={portForm.projectUrl} onChange={e => setPortForm(f=>({...f,projectUrl:e.target.value}))} /></div>
            <button className="btn btn-primary w-full mt-3" onClick={savePortfolio}>Сохранить</button>
          </div>
        </div>
      )}

      {/* ── Service Modal ── */}
      {svcModal && (
        <div className="modal-overlay open" onClick={e => e.target===e.currentTarget && setSvcModal(false)}>
          <div className="modal" style={{ maxWidth:540 }}>
            <div className="modal-header">
              <h3>{svcEdit ? 'Редактировать услугу' : 'Добавить услугу'}</h3>
              <button className="modal-close" onClick={() => setSvcModal(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="form-group"><label>Название услуги *</label><input className="form-control" placeholder="Создам сайт на React под ключ" value={svcForm.title} onChange={e => setSvcForm(f=>({...f,title:e.target.value}))} /></div>
            <div className="form-group"><label>Описание *</label><textarea className="form-control" style={{ minHeight:100, resize:'none' }} value={svcForm.description} onChange={e => setSvcForm(f=>({...f,description:e.target.value}))} /></div>
            <div className="form-group"><label>Категория</label>
              <select className="form-control" value={svcForm.category} onChange={e => setSvcForm(f=>({...f,category:e.target.value}))}>
                {Object.entries(CAT_LABELS).map(([v,l]) => <option key={v} value={v}>{CAT_EMOJIS[v]} {l}</option>)}
              </select>
            </div>
            <div className="grid-2">
              <div className="form-group"><label>Цена (₽) *</label><input type="number" className="form-control" placeholder="3000" value={svcForm.price} onChange={e => setSvcForm(f=>({...f,price:e.target.value}))} /></div>
              <div className="form-group"><label>Срок (дней) *</label><input type="number" className="form-control" placeholder="7" value={svcForm.deliveryDays} onChange={e => setSvcForm(f=>({...f,deliveryDays:e.target.value}))} /></div>
            </div>
            <div className="form-group"><label>Картинка (ссылка)</label><input className="form-control" style={{ fontSize:'.82rem' }} placeholder="https://i.imgur.com/..." value={svcForm.imageUrl} onChange={e => setSvcForm(f=>({...f,imageUrl:e.target.value}))} /></div>
            <div className="form-group" style={{ marginBottom:0 }}><label>Навыки</label><input className="form-control" placeholder="React, Node.js..." value={svcForm.skills} onChange={e => setSvcForm(f=>({...f,skills:e.target.value}))} /></div>
            <button className="btn btn-primary w-full mt-3" onClick={saveService}>Сохранить услугу</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Вспомогательные компоненты ── */
function EmptyBox({ icon, title, sub, children }) {
  return (
    <div style={{ textAlign:'center', padding:'3rem 2rem', background:'var(--surface)', borderRadius:20, border:'1px solid var(--border)' }}>
      <div style={{ fontSize:'2.5rem', marginBottom:'.75rem', opacity:.5 }}>{icon}</div>
      <h3 style={{ color:'var(--text)', fontSize:'1rem', marginBottom:'.35rem' }}>{title}</h3>
      {sub && <p style={{ fontSize:'.85rem', color:'var(--text3)' }}>{sub}</p>}
      {children}
    </div>
  );
}

function TaskRow({ task }) {
  const STATUS = { open:'🟢 Открыто', in_progress:'🔵 В работе', completed:'✅ Выполнено', cancelled:'❌ Отменено' };
  return (
    <Link to={`/tasks/${task._id}`} style={{ textDecoration:'none', display:'block', marginBottom:'.65rem' }}>
      <div style={{
        background:'var(--card)', border:'1px solid var(--border)',
        borderRadius:16, padding:'1.1rem 1.25rem',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        gap:'1rem', flexWrap:'wrap', transition:'border-color .15s',
      }}
        onMouseOver={e => e.currentTarget.style.borderColor='rgba(79,110,247,.4)'}
        onMouseOut={e => e.currentTarget.style.borderColor='var(--border)'}
      >
        <div>
          <div style={{ fontWeight:700, color:'var(--text)', marginBottom:'.3rem', fontSize:'.95rem' }}>{task.title}</div>
          <div style={{ fontSize:'.78rem', color:'var(--text3)', display:'flex', gap:'.85rem', flexWrap:'wrap' }}>
            <span>{STATUS[task.status]}</span>
            <span>💬 {task.proposals?.length||0} откликов</span>
            <span>⏰ {new Date(task.deadline).toLocaleDateString('ru-RU')}</span>
          </div>
        </div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', fontWeight:800, color:'var(--green)', flexShrink:0 }}>
          ₽{task.budget?.toLocaleString()}
        </div>
      </div>
    </Link>
  );
}

function ProposalRow({ proposal }) {
  const STATUS = { pending:'⏳ На рассмотрении', accepted:'✅ Принят', rejected:'❌ Отклонён' };
  const sc = proposal.status==='accepted' ? 'var(--green)' : proposal.status==='rejected' ? 'var(--red)' : 'var(--amber)';
  return (
    <Link to={`/tasks/${proposal.task?._id}`} style={{ textDecoration:'none', display:'block', marginBottom:'.65rem' }}>
      <div style={{
        background:'var(--card)', border:'1px solid var(--border)',
        borderRadius:16, padding:'1.1rem 1.25rem', transition:'border-color .15s',
      }}
        onMouseOver={e => e.currentTarget.style.borderColor='rgba(79,110,247,.4)'}
        onMouseOut={e => e.currentTarget.style.borderColor='var(--border)'}
      >
        <div style={{ fontWeight:700, color:'var(--text)', marginBottom:'.4rem', fontSize:'.95rem' }}>{proposal.task?.title}</div>
        <div style={{ fontSize:'.8rem', display:'flex', gap:'.85rem', flexWrap:'wrap' }}>
          <span style={{ color:sc, fontWeight:600 }}>{STATUS[proposal.status]}</span>
          <span style={{ color:'var(--text3)' }}>💰 ₽{proposal.price?.toLocaleString()}</span>
          <span style={{ color:'var(--text3)' }}>📅 {proposal.deliveryDays} дн.</span>
        </div>
        {proposal.coverLetter && (
          <p style={{ fontSize:'.82rem', color:'var(--text2)', marginTop:'.5rem', lineHeight:1.65 }}>
            {proposal.coverLetter.slice(0,130)}{proposal.coverLetter.length>130 ? '...' : ''}
          </p>
        )}
      </div>
    </Link>
  );
}
