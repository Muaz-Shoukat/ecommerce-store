import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:8000/api/',
});

export function setAuthToken(accessToken) {
  if (accessToken) {
    axiosClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  } else {
    delete axiosClient.defaults.headers.common.Authorization;
  }
}

export default axiosClient;
