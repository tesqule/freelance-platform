/* Skeleton — базовый блок */
function Sk({ w = '100%', h = 14, radius = 6, style = {} }) {
  return (
    <div className="skeleton" style={{
      width: w, height: h, borderRadius: radius, flexShrink: 0, ...style
    }} />
  );
}

/* Скелетон карточки задания */
export function TaskCardSkeleton() {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 20, padding: '1.1rem',
      display: 'flex', flexDirection: 'column', gap: '.65rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
        <Sk h={18} w="60%" radius={8} />
        <Sk h={18} w="20%" radius={8} />
      </div>
      <Sk h={12} />
      <Sk h={12} w="80%" />
      <div style={{ display: 'flex', gap: '.4rem', marginTop: '.25rem' }}>
        <Sk h={22} w={60} radius={99} />
        <Sk h={22} w={70} radius={99} />
        <Sk h={22} w={50} radius={99} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '.5rem', borderTop: '1px solid var(--border)' }}>
        <Sk h={12} w="30%" />
        <Sk h={12} w="25%" />
      </div>
    </div>
  );
}

/* Скелетон карточки услуги */
export function ServiceCardSkeleton() {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 20, overflow: 'hidden',
    }}>
      <Sk h={140} radius={0} />
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
        <Sk h={16} w="85%" radius={8} />
        <Sk h={12} />
        <Sk h={12} w="65%" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '.75rem', borderTop: '1px solid var(--border)', marginTop: '.25rem' }}>
          <Sk h={20} w={80} radius={8} />
          <Sk h={30} w={80} radius={99} />
        </div>
      </div>
    </div>
  );
}

/* Скелетон карточки фрилансера */
export function FreelancerCardSkeleton() {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 20, padding: '1.25rem 1rem',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.5rem',
    }}>
      <Sk h={54} w={54} radius={99} />
      <Sk h={14} w="60%" radius={8} />
      <Sk h={12} w="40%" radius={8} />
      <div style={{ display: 'flex', gap: '.3rem' }}>
        <Sk h={20} w={50} radius={99} />
        <Sk h={20} w={55} radius={99} />
      </div>
      <Sk h={32} w="100%" radius={99} style={{ marginTop: '.25rem' }} />
    </div>
  );
}

/* Скелетон профиля (шапка) */
export function ProfileHeaderSkeleton() {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 24, padding: '1.75rem 1.5rem',
      display: 'flex', flexDirection: 'column', gap: '1rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Sk h={80} w={80} radius={99} />
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <Sk h={32} w={100} radius={99} />
          <Sk h={32} w={80} radius={99} />
        </div>
      </div>
      <Sk h={22} w="40%" radius={8} />
      <Sk h={14} w="25%" radius={99} />
      <Sk h={13} />
      <Sk h={13} w="80%" />
      <div style={{ display: 'flex', gap: '.4rem' }}>
        <Sk h={24} w={70} radius={99} />
        <Sk h={24} w={60} radius={99} />
        <Sk h={24} w={80} radius={99} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.75rem', marginTop: '.5rem' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '.85rem .65rem',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.35rem',
          }}>
            <Sk h={18} w={18} radius={99} />
            <Sk h={18} w="60%" radius={6} />
            <Sk h={10} w="80%" radius={6} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* Скелетон дашборд-статистики */
export function DashboardStatsSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '1rem' }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '1.25rem',
          display: 'flex', flexDirection: 'column', gap: '.5rem',
        }}>
          <Sk h={32} w={32} radius={8} />
          <Sk h={28} w="60%" radius={8} />
          <Sk h={12} w="80%" radius={6} />
        </div>
      ))}
    </div>
  );
}

/* Сетка скелетонов — универсальная */
export function SkeletonGrid({ count = 6, cols = 'repeat(auto-fill,minmax(280px,1fr))', Card = TaskCardSkeleton }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: cols, gap: '1rem' }}>
      {Array.from({ length: count }).map((_, i) => <Card key={i} />)}
    </div>
  );
}
