import axios from 'axios';

const API = axios.create({
  baseURL: 'https://freelance-platform-production-2360.up.railway.app/api'
});

export default API;