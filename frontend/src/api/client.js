import axios from 'axios';
//axios instance :  attaches the JWT token to every request

//cree un client pré-configuré : ecrire client.get("/sites")au lieu d ecrire axios.get ("http://localhost:3000/sites")
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

// Attach token on every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('token being sent:', token);
  if (token) config.headers.Authorization = `Bearer ${token}`;  // Attach JWT token to request headers
  return config;
});

// Handle 401 globally — redirect to login
//il surveuille les reponses reenvoyés par le backend node.js
client.interceptors.response.use(
  (res) => res, // return response if successful
  (err) => { // handle error
    if (err.response?.status === 401) {
      localStorage.removeItem('token'); // remove token from localStorage
      window.location.href = '/login'; //   redirect to login page
    }
    return Promise.reject(err);
  }
);

export default client;