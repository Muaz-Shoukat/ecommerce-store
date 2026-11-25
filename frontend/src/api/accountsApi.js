import axiosClient from './axiosClient';

export function getAddresses() {
  return axiosClient.get('accounts/addresses/').then((res) => res.data);
}

export function addAddress(payload) {
  return axiosClient.post('accounts/addresses/', payload).then((res) => res.data);
}
