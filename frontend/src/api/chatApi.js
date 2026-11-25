import axiosClient from './axiosClient';

/**
 * @param {{ message: string, productSlug?: string }} payload
 */
export async function sendChatMessage({ message, productSlug }) {
  const body = { message };
  if (productSlug) {
    body.product_slug = productSlug;
  }
  const { data } = await axiosClient.post('assistant/chat/', body);
  return data;
}