import React, { useState, useEffect } from 'react'
import { StyleSheet, View, Pressable, FlatList, Image } from 'react-native'
import TextSemiBold from '../../components/TextSemibold'
import TextRegular from '../../components/TextRegular'
import * as GlobalStyles from '../../styles/GlobalStyles'
import { getAll, remove } from '../../api/OrderEndpoints'
import { showMessage } from 'react-native-flash-message'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { API_BASE_URL } from '@env'
import restaurantLogo from '../../../assets/restaurantLogo.jpeg'
import DeleteModal from '../../components/DeleteModal'

export default function OrdersScreen({ navigation, route }) {
  const [orders, setOrders] = useState([])
  const [orderToBeDeleted, setOrderToBeDeleted] = useState(null)

  useEffect(() => {
    fetchOrders()
    if (route.params?.dirty) {
      fetchOrders()
    }
  }, [route])

  const fetchOrders = async () => {
    try {
      const fetchedOrders = await getAll()
      setOrders(fetchedOrders)
    } catch (error) {
      showMessage({
        message: `There was an error while retrieving your orders. ${error}`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  const removeOrder = async order => {
    try {
      await remove(order.id)
      await fetchOrders()
      setOrderToBeDeleted(null)
      showMessage({
        message: `Order ${order.id} successfully removed`,
        type: 'success',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    } catch (error) {
      setOrderToBeDeleted(null)
      showMessage({
        message: `Order ${order.id} could not be removed. ${error}`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  const renderOrder = ({ item }) => {
    const restaurantName = item.restaurant?.name || 'Restaurant Not Found'
    const orderDate = new Date(item.createdAt).toLocaleDateString()
    const orderTime = new Date(item.createdAt).toLocaleTimeString()

    return (
      <Pressable
        style={styles.orderCard}
        onPress={() => {
          navigation.navigate('OrderDetailScreen', { id: item.id })
        }}
      >
        <Image
          style={styles.orderImage}
          source={item.restaurant?.logo ? { uri: `${API_BASE_URL}/${item.restaurant.logo}` } : restaurantLogo}
        />
        <View style={styles.orderDetailsContainer}>
          <TextSemiBold style={styles.restaurantName}>{restaurantName}</TextSemiBold>
          <TextRegular style={styles.orderInfo}>
            Order Date: <TextSemiBold>{orderDate} at {orderTime}</TextSemiBold>
          </TextRegular>
          <TextRegular style={styles.orderInfo}>
            Status: <TextSemiBold textStyle={{ color: GlobalStyles.brandPrimary }}>{item.status}</TextSemiBold>
          </TextRegular>
          <TextRegular style={styles.orderInfo}>
            Total Price: <TextSemiBold textStyle={{ color: GlobalStyles.brandPrimary }}>{(item.price).toFixed(2)}€</TextSemiBold>
          </TextRegular>
          <TextRegular style={styles.orderInfo}>
            Address: <TextSemiBold>{item.address}</TextSemiBold>
          </TextRegular>
        </View>

        {item.status === 'pending' && (
          <View style={styles.actionButtonsContainer}>
            <Pressable
              style={[styles.iconButton, styles.editButtonPosition]}
              onPress={() => {
                if (item.restaurantId) {
                  navigation.navigate('OrderDetailEditScreen', {
                    orderId: item.id,
                    restaurantId: item.restaurantId
                  })
                } else {
                  console.error('Cannot edit order from list: item.restaurantId is missing.', item)
                  showMessage({
                    message: 'Cannot edit order: Restaurant information is missing.',
                    type: 'danger',
                    style: GlobalStyles.flashStyle,
                    titleStyle: GlobalStyles.flashTextStyle
                  })
                }
              }}
            >
              <MaterialCommunityIcons name="square-edit-outline" size={22} color={GlobalStyles.brandPrimary} />
            </Pressable>

            <Pressable
              style={[styles.iconButton, styles.deleteButtonPosition]}
              onPress={() => setOrderToBeDeleted(item)}
            >
              <MaterialCommunityIcons name="delete" size={22} color={GlobalStyles.brandPrimary} />
            </Pressable>
          </View>
        )}{item.status === 'delivered' && (
          <View style={styles.actionButtonsContainer}>
            <Pressable
              style={[styles.iconButton, styles.editButtonPosition]}
              onPress={() => {
                if (item.restaurantId) {
                  navigation.navigate('ReviewsScreen', {
                    restaurantId: item.restaurantId
                  })
                } else {
                  console.error('Cannot edit order from list: item.restaurantId is missing.', item)
                  showMessage({
                    message: 'Cannot edit order: Restaurant information is missing.',
                    type: 'danger',
                    style: GlobalStyles.flashStyle,
                    titleStyle: GlobalStyles.flashTextStyle
                  })
                }
              }}
            >
              <MaterialCommunityIcons name="star" size={22} color={GlobalStyles.brandPrimary} />
            </Pressable>
          </View>
        )}
      </Pressable>
    )
  }

  const renderEmptyOrdersList = () => {
    return (
      <TextRegular textStyle={styles.emptyList}>
        You do not have any orders yet.
      </TextRegular>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.listContainer}
        data={orders}
        renderItem={renderOrder}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={renderEmptyOrdersList}
        contentContainerStyle={styles.listContentContainer}
      />
      {orderToBeDeleted && (
        <DeleteModal
          isVisible={orderToBeDeleted !== null}
          onCancel={() => setOrderToBeDeleted(null)}
          onConfirm={() => removeOrder(orderToBeDeleted)}
        >
          <TextRegular>Are you sure you want to delete order <TextSemiBold>#{orderToBeDeleted.id}</TextSemiBold>?</TextRegular>
        </DeleteModal>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  listContainer: {
    flex: 1,
    marginTop: 10,
    width: '100%'
  },
  listContentContainer: {
    paddingBottom: 80
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    marginVertical: 5,
    marginHorizontal: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3
  },
  orderImage: {
    width: 100,
    height: 100,
    borderRadius: 8
  },
  orderDetailsContainer: {
    flex: 1,
    marginLeft: 15
  },
  restaurantName: {
    fontSize: 18,
    marginBottom: 5,
    color: GlobalStyles.brandBlack
  },
  orderInfo: {
    fontSize: 14,
    marginBottom: 3,
    color: GlobalStyles.brandGray
  },
  emptyList: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: GlobalStyles.brandSecondary
  },
  button: {
    position: 'absolute',
    bottom: 10,
    left: 16,
    right: 16,
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0
  },
  text: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center'
  },
  actionButtonsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 10,
    justifyContent: 'space-between',
    paddingVertical: 10
  },
  iconButton: {
    padding: 5
  },
  editButtonPosition: {
  },
  deleteButtonPosition: {
  }
})
