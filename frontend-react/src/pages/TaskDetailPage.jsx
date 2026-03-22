import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const CAT_EMOJIS = { development: '💻', design: '🎨', writing: '✍️', marketing: '📣', video: '🎬', music: '🎵', other: '🔧' };
const STATUS_LABELS = { open: '🟢 Открыто', in_progress: '🔵 В работе', completed: '✅ Выполнено', cancelled: '❌ Отменено' };

export default function TaskDetailPage({ onAuthOpen }) {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');

  // Proposal form
  const [coverLetter, setCoverLetter] = useState('');
  const [price, setPrice] = useState('');
  const [days, setDays] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadTask(); }, [id]);

  async function loadTask() {
    setLoading(true);
    try {
      const { data } = await API.get(`/tasks/${id}`);
      // Защита массивов
      if (data) {
        data.proposals = Array.isArray(data.proposals) ? data.proposals : [];
        data.skills    = Array.isArray(data.skills)    ? data.skills    : [];
      }
      setTask(data);
    } catch { navigate('/tasks'); }
    setLoading(false);
  }

  async function submitProposal(e) {
    e.preventDefault();
    if (!user) { onAuthOpen('login'); return; }
    setSubmitting(true);
    try {
      await API.post(`/tasks/${id}/proposals`, { coverLetter, price: Number(price), deliveryDays: Number(days) });
      setProposalOpen(false);
      loadTask();
      // Открываем чат с заказчиком с контекстом задания
      navigate(`/chat?user=${task.client._id}&task=${id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка');
    }
    setSubmitting(false);
  }

  async function acceptProposal(proposalId) {
    try { await API.patch(`/tasks/${id}/proposals/${proposalId}/accept`); loadTask(); } catch {}
  }

  async function rejectProposal(proposalId) {
    try { await API.patch(`/tasks/${id}/proposals/${proposalId}/reject`); loadTask(); } catch {}
  }

  async function completeTask() {
    try { await API.patch(`/tasks/${id}/complete`); loadTask(); } catch {}
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!selectedRating) { alert('Выберите оценку'); return; }
    try {
      await API.post('/reviews', { reviewee: reviewTarget.id, rating: selectedRating, comment: reviewComment, taskId: id });
      setReviewOpen(false);
      setSelectedRating(0);
      setReviewComment('');
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка');
    }
  }

  if (loading) return <div className="page"><div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}><div className="spinner"/></div></div>;
  if (!task) return null;

  const isOwner = user && user.id === task.client?._id;
  const isFreelancer = user && user.role === 'freelancer';
  const alreadyApplied = user && task.proposals?.some(p => p.freelancer?._id === user.id || p.freelancer === user.id);
  const isAssigned = user && (task.assignedTo?._id === user.id || task.assignedTo === user?.id);

  return (
    <div className="page">
      <div className="container" style={{ paddingBottom: '4rem', maxWidth: 980 }}>
        <Link to="/tasks" className="btn btn-glass btn-sm mt-2 mb-3" style={{ display: 'inline-flex', gap: '.4rem' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Назад к заданиям
        </Link>

        <div className="task-detail-grid">
          {/* LEFT */}
          <div>
            <div className="card mb-2" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <span className={`badge badge-${task.category}`}>{CAT_EMOJIS[task.category] || '🔧'} {task.category}</span>
                <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
              </div>
              <h1 style={{ fontSize: '1.6rem', marginBottom: '1rem', letterSpacing: '-.03em' }}>{task.title}</h1>
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '.8rem', color: 'var(--text3)', marginBottom: '1.5rem' }}>
                <span>📅 {new Date(task.createdAt).toLocaleDateString('ru-RU')}</span>
                <span>⏰ {new Date(task.deadline).toLocaleDateString('ru-RU')}</span>
                <span>💬 {task.proposals?.length || 0} откликов</span>
              </div>
              <p style={{ color: 'var(--text2)', lineHeight: 1.85, whiteSpace: 'pre-wrap', fontSize: '.925rem' }}>{task.description}</p>
              {task.skills?.length > 0 && (
                <div className="task-skills mt-3">{task.skills.map(s => <span key={s} className="skill-tag">{s}</span>)}</div>
              )}
            </div>

            {/* Review prompt for completed */}
            {task.status === 'completed' && user && (isOwner || isAssigned) && (
              <div className="card mb-2" style={{ padding: '1.5rem', borderColor: 'rgba(245,158,11,.15)' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '.5rem' }}>⭐ Оставить отзыв по заданию</h3>
                <p style={{ fontSize: '.82rem', color: 'var(--text3)', marginBottom: '1rem' }}>Задание выполнено — поделитесь впечатлениями</p>
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                  {isOwner && task.assignedTo && (
                    <button className="btn btn-primary btn-sm" onClick={() => { setReviewTarget({ id: task.assignedTo._id || task.assignedTo, name: task.assignedTo.name || 'Фрилансер' }); setReviewOpen(true); }}>
                      Оценить фрилансера
                    </button>
                  )}
                  {isAssigned && (
                    <button className="btn btn-outline btn-sm" onClick={() => { setReviewTarget({ id: task.client._id, name: task.client.name }); setReviewOpen(true); }}>
                      Оценить заказчика
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Proposals */}
            <div className="card" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '1.5rem', letterSpacing: '-.02em' }}>
                Отклики <span style={{ fontSize: '.85rem', color: 'var(--text3)', fontWeight: 400 }}>({task.proposals?.length || 0})</span>
              </h3>
              {!task.proposals?.length ? (
                <div className="empty-state" style={{ padding: '2rem 0' }}><div className="empty-icon">📭</div><p>Откликов пока нет. Будьте первым!</p></div>
              ) : task.proposals.map(p => {
                const fr = p.freelancer || {};
                const borderColor = { accepted: 'var(--green)', rejected: 'var(--red)', pending: 'var(--border2)' }[p.status] || 'var(--border2)';
                return (
                  <div key={p._id} style={{ background: 'var(--bg2)', border: `1px solid ${borderColor}`, borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '.85rem', flexWrap: 'wrap' }}>
                      <Link to={`/profile/${fr._id}`} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', textDecoration: 'none' }}>
                        <div className="avatar" style={{ width: 40, height: 40, fontSize: '.95rem', flexShrink: 0 }}>
                          {fr.avatar ? <img src={fr.avatar} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} /> : (fr.name || '?').charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text)' }}>{fr.name || 'Фрилансер'}</div>
                          <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>★ {(fr.rating || 0).toFixed(1)} · {fr.completedTasks || 0} задан</div>
                        </div>
                      </Link>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--green)' }}>₽{p.price?.toLocaleString()}</div>
                        <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>{p.deliveryDays} дн.</div>
                      </div>
                    </div>
                    {fr.skills?.length > 0 && (
                      <div className="task-skills mb-2">{fr.skills.slice(0, 4).map(s => <span key={s} className="skill-tag">{s}</span>)}</div>
                    )}
                    <p style={{ fontSize: '.875rem', color: 'var(--text2)', lineHeight: 1.7 }}>{p.coverLetter}</p>
                    <div style={{ display: 'flex', gap: '.5rem', marginTop: '.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {p.status !== 'pending' && (
                        <span className={`badge ${p.status === 'accepted' ? 'badge-open' : 'badge-cancelled'}`}>
                          {p.status === 'accepted' ? '✓ Принят' : '✗ Отклонён'}
                        </span>
                      )}
                      {isOwner && p.status === 'pending' && task.status === 'open' && (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => acceptProposal(p._id)}>✓ Принять</button>
                          <button className="btn btn-danger btn-sm" onClick={() => rejectProposal(p._id)}>✗ Отклонить</button>
                        </>
                      )}
                      {user && user.id !== fr._id && (
                        <Link to={`/chat?user=${fr._id}&task=${id}`} className="btn btn-glass btn-sm">💬 Написать</Link>
                      )}
                      {user && user.id !== fr._id && (
                        <button className="btn btn-outline btn-sm" onClick={() => { setReviewTarget({ id: fr._id, name: fr.name || 'Фрилансер' }); setReviewOpen(true); }}>⭐ Отзыв</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="task-detail-sidebar">
            <div className="card mb-2 budget-box" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text3)', marginBottom: '.5rem' }}>Бюджет</div>
              <div className="budget-amount">₽{task.budget?.toLocaleString()}</div>
              {isFreelancer && task.status === 'open' && !alreadyApplied && (
                <button className="btn btn-primary w-full mt-3" onClick={() => user ? setProposalOpen(true) : onAuthOpen('login')}>
                  Откликнуться 🚀
                </button>
              )}
              {isFreelancer && alreadyApplied && (
                <div style={{ background: 'rgba(16,217,138,.07)', border: '1px solid rgba(16,217,138,.2)', color: 'var(--green)', borderRadius: 99, padding: '.7rem', textAlign: 'center', fontSize: '.875rem', fontWeight: 600, marginTop: '1rem' }}>
                  ✅ Вы уже откликнулись
                </div>
              )}
              {isOwner && task.status === 'open' && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', fontSize: '.78rem', color: 'var(--text3)' }}>
                  💡 Примите отклик чтобы начать работу
                </div>
              )}
              {isOwner && task.status === 'in_progress' && (
                <button className="btn btn-success w-full mt-3" onClick={completeTask}>✅ Отметить выполненным</button>
              )}
              {isOwner && task.status === 'completed' && (
                <div style={{ background: 'rgba(16,217,138,.07)', border: '1px solid rgba(16,217,138,.2)', color: 'var(--green)', borderRadius: 99, padding: '.7rem', textAlign: 'center', fontSize: '.875rem', fontWeight: 600, marginTop: '1rem' }}>
                  🎉 Задание выполнено
                </div>
              )}
              {!user && (
                <button className="btn btn-outline w-full mt-3" onClick={() => onAuthOpen('login')}>
                  Войдите чтобы откликнуться
                </button>
              )}
            </div>

            {/* Client card */}
            {task.client && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text3)', marginBottom: '1rem' }}>Заказчик</div>
                <Link to={`/profile/${task.client._id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '.85rem', marginBottom: '.85rem', textDecoration: 'none', padding: '.5rem', margin: '-.5rem', borderRadius: 'var(--radius)', transition: 'background .15s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <div className="avatar" style={{ width: 46, height: 46, fontSize: '1.1rem', flexShrink: 0 }}>
                    {task.client.avatar ? <img src={task.client.avatar} style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover' }} /> : task.client.name?.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--text)' }}>{task.client.name}</div>
                    <div style={{ color: 'var(--amber)', fontSize: '.8rem', marginTop: '.1rem' }}>★ {(task.client.rating || 0).toFixed(1)}</div>
                  </div>
                </Link>
                {task.client.bio && <p style={{ fontSize: '.82rem', color: 'var(--text2)', lineHeight: 1.65, margin: '.75rem 0' }}>{task.client.bio}</p>}
                <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginBottom: '.85rem' }}>✅ Выполнено: {task.client.completedTasks || 0}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                  <Link to={`/profile/${task.client._id}`} className="btn btn-glass w-full btn-sm">👤 Перейти в профиль</Link>
                  {user && user.id !== task.client._id && (
                    <Link to={`/chat?user=${task.client._id}&task=${id}`} className="btn btn-glass w-full btn-sm">💬 Написать</Link>
                  )}
                  {user && user.id !== task.client._id && (
                    <button className="btn btn-outline w-full btn-sm" onClick={() => { setReviewTarget({ id: task.client._id, name: task.client.name }); setReviewOpen(true); }}>⭐ Оставить отзыв</button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Proposal modal */}
      {proposalOpen && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setProposalOpen(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Отклик на задание</h3>
              <button className="modal-close" onClick={() => setProposalOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={submitProposal}>
              <div className="form-group"><label>Сопроводительное письмо *</label><textarea className="form-control" placeholder="Расскажите почему вы подходите..." style={{ minHeight: 130 }} value={coverLetter} onChange={e => setCoverLetter(e.target.value)} required /></div>
              <div className="grid-2">
                <div className="form-group"><label>Ваша цена (₽) *</label><input type="number" className="form-control" placeholder="3000" value={price} onChange={e => setPrice(e.target.value)} required /></div>
                <div className="form-group"><label>Срок (дней) *</label><input type="number" className="form-control" placeholder="7" min="1" value={days} onChange={e => setDays(e.target.value)} required /></div>
              </div>
              <button className="btn btn-primary w-full" type="submit" disabled={submitting}>{submitting ? 'Отправляем...' : 'Отправить отклик 🚀'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Review modal */}
      {reviewOpen && reviewTarget && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setReviewOpen(false)}>
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3>Оставить отзыв</h3>
              <button className="modal-close" onClick={() => setReviewOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={submitReview}>
              <p style={{ fontSize: '.875rem', color: 'var(--text2)', marginBottom: '1rem' }}>Оцените <strong>{reviewTarget.name}</strong></p>
              <div className="form-group">
                <label>Оценка *</label>
                <div style={{ display: 'flex', gap: '.3rem', fontSize: '1.6rem', cursor: 'pointer', margin: '.5rem 0' }}>
                  {[1,2,3,4,5].map(v => (
                    <span key={v} onClick={() => setSelectedRating(v)} style={{ color: v <= selectedRating ? 'var(--amber)' : 'var(--text3)', transition: 'color .12s', userSelect: 'none' }}>★</span>
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Комментарий</label>
                <textarea className="form-control" placeholder="Поделитесь впечатлениями..." style={{ minHeight: 100 }} value={reviewComment} onChange={e => setReviewComment(e.target.value)} />
              </div>
              <button className="btn btn-primary w-full mt-3" type="submit">Отправить отзыв ⭐</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}