import axiosClient from './axiosClient';

export function getStripeConfig() {
  return axiosClient.get('payments/stripe/config/').then((res) => res.data);
}

export function confirmStripeSession({ sessionId, orderId }) {
  return axiosClient
    .post('payments/stripe/confirm/', {
      session_id: sessionId,
      order_id: orderId,
    })
    .then((res) => res.data);
}
