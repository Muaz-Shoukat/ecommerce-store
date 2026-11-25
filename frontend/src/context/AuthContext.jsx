import { createContext, useState } from 'react';
import * as authApi from '../api/authApi';
import { setAuthToken } from '../api/axiosClient';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState(null);

  async function login({ username, password }) {
    const tokens = await authApi.login({ username, password });
    setAccessToken(tokens.access);
    setRefreshToken(tokens.refresh);
    setAuthToken(tokens.access);
    setUser({ username });
    return tokens;
  }

  async function register(payload) {
    const created = await authApi.register(payload);
    await login({ username: payload.username, password: payload.password });
    setUser({
      id: created.id,
      username: created.username,
      email: created.email,
      phone: created.phone,
      first_name: created.first_name,
      last_name: created.last_name,
    });
    return created;
  }

  function logout() {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setAuthToken(null);
  }

  async function refreshAccessToken() {
    if (!refreshToken) {
      throw new Error('No refresh token');
    }
    const data = await authApi.refreshToken(refreshToken);
    setAccessToken(data.access);
    setAuthToken(data.access);
    return data.access;
  }

  const value = {
    user,
    accessToken,
    refreshToken,
    isAuthenticated: Boolean(accessToken),
    login,
    register,
    logout,
    refreshAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
