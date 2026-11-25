import axiosClient from './axiosClient';

export function getProducts(params = {}) {
  return axiosClient.get('products/', { params }).then((res) => res.data);
}

export function getProductBySlug(slug) {
  return axiosClient.get(`products/${slug}/`).then((res) => res.data);
}

export function getCategories() {
  return axiosClient.get('categories/').then((res) => res.data);
}

export function getProductReviews(slug, params = {}) {
  return axiosClient
    .get(`products/${slug}/reviews/`, { params })
    .then((res) => res.data);
}

export function createProductReview(slug, payload) {
  return axiosClient
    .post(`products/${slug}/reviews/`, payload)
    .then((res) => res.data);
}
