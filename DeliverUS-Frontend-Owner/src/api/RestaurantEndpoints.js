import { get, post, put, destroy, patch } from './helpers/ApiRequestsHelper'
function getAll() {
  return get('users/myrestaurants')
}

function getDetail(id) {
  return get(`restaurants/${id}`)
}

function forward(id) {
  return patch(`orders/${id}/forward`)
}

function backward(id) {
  return patch(`orders/${id}/backward`)
}
function getOrders(id) {
  return get(`restaurants/${id}/orders`)
}

function getUser(id) {
  return get(`users/${id}`)
}
function getRestaurantCategories() {
  return get('restaurantCategories')
}

function create(data) {
  return post('restaurants', data)
}

function update(id, data) {
  return put(`restaurants/${id}`, data)
}

function remove(id) {
  return destroy(`restaurants/${id}`)
}

export { getAll, forward, backward, getOrders, getUser, getDetail, getRestaurantCategories, create, update, remove }
