import { useEffect } from 'react';
import API from './api';

function App() {

  useEffect(() => {
    API.get('/tasks')
      .then(res => console.log('✅ задачи:', res.data))
      .catch(err => console.error('❌ ошибка:', err));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>🚀 React подключен к backend</h1>
      <p>Открой консоль (F12)</p>
    </div>
  );
}

export default App;