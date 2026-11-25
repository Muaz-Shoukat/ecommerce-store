import axiosClient from './axiosClient';

export function createOrder(payload) {
  return axiosClient.post('orders/', payload).then((res) => res.data);
}

export function getOrders() {
  return axiosClient.get('orders/').then((res) => res.data);
}

export function getOrderById(id) {
  return axiosClient.get(`orders/${id}/`).then((res) => res.data);
}
