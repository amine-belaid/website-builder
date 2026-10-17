import { create } from 'zustand';
import client from '../api/client'; //store token and user data in localStorage and manage authentication state using zustand store
//zustand store for authentication state management
// create : Custom Hook React (useAuthStore) to manage authentication state (token, user, isAuthenticated) and actions (login, register, logout)
//Custom Hook React : a function in js starting with "use" like useState, useEffect, etc. that allows you to use state and other React features in functional components. In this case, useAuthStore is a custom hook that provides authentication state and actions to manage it.
 
const useAuthStore = create((set) => ({
  token: localStorage.getItem('token'),
  user:  null,
  isAuthenticated: !!localStorage.getItem('token'), // !! => cast to bool 

  login: async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    set({ token: data.token, isAuthenticated: true });
  },

  register: async (email, password) => {
    const { data } = await client.post('/auth/register', { email, password });
    localStorage.setItem('token', data.token);
    set({ token: data.token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;