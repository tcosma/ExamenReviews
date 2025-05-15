import { destroy, get, post, put } from './helpers/ApiRequestsHelper'

function getAll () {
  return get('orders')
}

function create (data) {
  return post('orders', data)
}

function getDetail (id) {
  return get(`orders/${id}`)
}

function update (id, data) {
  return put(`orders/${id}`, data)
}

function remove (id) {
  return destroy(`orders/${id}`)
}


export { getAll, create, getDetail, update, remove }
