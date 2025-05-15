import { destroy, get, post, put } from './helpers/ApiRequestsHelper'

function getReviews(id) {
    return get(`restaurants/${id}/reviews`)
}
function createReviews(data) {
    return post(`restaurants/${data.restaurantId}/reviews`, data)
}

function deleteReviews(data) {
    return destroy(`restaurants/${data.restaurantId}/reviews/${data.id}`)
}
function editReviews(data) {
    return put(`restaurants/${data.restaurantId}/reviews/${data.id}`, data)
}

export { getReviews, editReviews, deleteReviews, createReviews }
