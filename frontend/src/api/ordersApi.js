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

async function readBlobError(blob) {
  try {
    const text = await blob.text();
    const data = JSON.parse(text);
    return data.detail || 'Could not download invoice.';
  } catch {
    return 'Could not download invoice.';
  }
}

export async function downloadOrderInvoice(orderId, { email, sessionId } = {}) {
  const params = {};
  if (email) params.email = email;
  if (sessionId) params.session_id = sessionId;

  try {
    const response = await axiosClient.get(`orders/${orderId}/invoice/`, {
      params,
      responseType: 'blob',
    });

    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('application/json')) {
      throw new Error(await readBlobError(response.data));
    }

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-order-${orderId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    if (err.response?.data instanceof Blob) {
      throw new Error(await readBlobError(err.response.data));
    }
    throw err;
  }
}
