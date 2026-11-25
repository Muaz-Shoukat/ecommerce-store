import axiosClient from './axiosClient';

export function login({ username, password }) {
  return axiosClient
    .post('auth/login/', { username, password })
    .then((res) => res.data);
}

export function register(payload) {
  return axiosClient.post('auth/register/', payload).then((res) => res.data);
}

export function refreshToken(refresh) {
  return axiosClient
    .post('auth/token/refresh/', { refresh })
    .then((res) => res.data);
}
