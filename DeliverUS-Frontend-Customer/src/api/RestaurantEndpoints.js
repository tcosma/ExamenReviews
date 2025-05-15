import { get, post } from './helpers/ApiRequestsHelper'
function getAll() {
  return get('users/myrestaurants')
}

function getAllRestaurants() {
  return get('/restaurants')
}

function getDetail(id) {
  return get(`restaurants/${id}`)
}

function getRestaurantCategories() {
  return get('restaurantCategories')
}
function createReviews(data) {
  return post(`restaurants/${data.restaurantId}/reviews`, data)
}


export { createReviews, getAll, getAllRestaurants, getDetail, getRestaurantCategories }
