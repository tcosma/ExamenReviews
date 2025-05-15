import React, { useEffect, useState } from 'react'
import { StyleSheet, View, Pressable, FlatList, Image } from 'react-native'
import TextRegular from '../../components/TextRegular'
import TextSemiBold from '../../components/TextSemibold'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as GlobalStyles from '../../styles/GlobalStyles'
import { API_BASE_URL } from '@env'
import { getDetail, remove } from '../../api/OrderEndpoints'
import { showMessage } from 'react-native-flash-message'
import restaurantLogo from '../../../assets/restaurantLogo.jpeg'
import DeleteModal from '../../components/DeleteModal'

export default function OrderDetailScreen({ navigation, route }) {
  const [order, setOrder] = useState({})
  const [loading, setLoading] = useState(true)
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false)

  useEffect(() => {
    fetchOrderDetail()
  }, [route])

  const fetchOrderDetail = async () => {
    try {
      setLoading(true)
      const fetchedOrder = await getDetail(route.params.id)
      setOrder(fetchedOrder)
    } catch (error) {
      showMessage({
        message: `Error retrieving order details: ${error}`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOrder = async () => {
    try {
      await remove(order.id)
      showMessage({
        message: `Order ${order.id} successfully deleted`,
        type: 'success',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
      setIsDeleteModalVisible(false)
      navigation.navigate('My orders', { screen: 'OrdersScreen', params: { dirty: true } })
    } catch (error) {
      setIsDeleteModalVisible(false)
      showMessage({
        message: `Order ${order.id} could not be deleted. ${error}`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  const renderProduct = ({ item }) => {
    if (!item || !item.OrderProducts) {
      return null
    }

    return (
      <View style={styles.productContainer}>
        <Image
          style={styles.productImage}
          source={item.image ? { uri: API_BASE_URL + '/' + item.image, cache: 'force-cache' } : undefined}
        />
        <View style={styles.productDetails}>
          <View>
            <TextSemiBold style={styles.productName}>{item.name}</TextSemiBold>
            <TextRegular style={styles.productPrice}>{item.price.toFixed(2)} €</TextRegular>
            {item.OrderProducts && (
              <TextRegular style={styles.quantity}>
                Quantity: <TextSemiBold>{item.OrderProducts.quantity}</TextSemiBold>
              </TextRegular>
            )}
          </View>
          <TextRegular style={styles.itemTotalStatic}>
            Item Total: <TextSemiBold textStyle={{ color: GlobalStyles.brandPrimary }}>
              {(item.price * item.OrderProducts.quantity).toFixed(2)} €
            </TextSemiBold>
          </TextRegular>
        </View>
      </View>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`
  }

  const renderHeader = () => {
    if (!order.id) return null

    const productsSubtotal = order.products
      ? order.products.reduce((sum, product) => {
        return sum + (product.price * product.OrderProducts.quantity)
      }, 0)
      : 0

    return (
      <View style={styles.orderSummary}>
        <View style={styles.restaurantInfo}>
          <Image
            style={styles.restaurantLogo}
            source={order.restaurant?.logo
              ? { uri: API_BASE_URL + '/' + order.restaurant.logo }
              : restaurantLogo
            }
          />
          <View style={styles.restaurantDetails}>
            <TextSemiBold style={styles.restaurantName}>
              {order.restaurant?.name || 'Restaurant'}
            </TextSemiBold>
            <TextRegular style={styles.orderDate}>
              Ordered on: <TextSemiBold>{formatDate(order.createdAt)}</TextSemiBold>
            </TextRegular>
          </View>
        </View>

        <View style={styles.orderStatusContainer}>
          <TextRegular style={styles.statusLabel}>Status:</TextRegular>
          <View style={[styles.statusBadge, getStatusStyle(order.status)]}>
            <TextRegular textStyle={styles.statusText}>
              {order.status}
            </TextRegular>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <TextRegular style={styles.detailLabel}>Shipping Address:</TextRegular>
            <TextSemiBold style={styles.detailValue}>{order.address}</TextSemiBold>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <TextRegular style={styles.detailLabel}>Products Subtotal:</TextRegular>
            <TextSemiBold style={[styles.detailValue, styles.priceText]}>
              {productsSubtotal.toFixed(2)} €
            </TextSemiBold>
          </View>

          <View style={styles.detailRow}>
            <TextRegular style={styles.detailLabel}>Shipping Cost:</TextRegular>
            <TextSemiBold style={[styles.detailValue, styles.priceText]}>
              {order.shippingCosts?.toFixed(2)} €
            </TextSemiBold>
          </View>

          <View style={styles.detailRow}>
            <TextRegular style={styles.detailLabel}>Total Cost:</TextRegular>
            <TextSemiBold style={[styles.detailValue, styles.priceText]}>
              {order.price?.toFixed(2)} €
            </TextSemiBold>
          </View>
        </View>

        <View style={styles.productsHeader}>
          <TextSemiBold style={styles.productsHeaderText}>
            Ordered Items
          </TextSemiBold>
        </View>
      </View>
    )
  }

  const renderEmptyList = () => (
    <View style={styles.emptyListContainer}>
      <TextRegular style={styles.emptyList}>
        {loading ? 'Loading order details...' : 'No products found in this order.'}
      </TextRegular>
    </View>
  )

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending':
        return styles.pendingStatus
      case 'in process':
        return styles.processingStatus
      case 'sent':
        return styles.readyStatus
      case 'delivered':
        return styles.deliveredStatus
      case 'cancelled':
        return styles.cancelledStatus
      default:
        return {}
    }
  }

  const renderSeparator = () => <View style={styles.separator} />

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </Pressable>
        <TextSemiBold style={styles.headerTitle}>My Order</TextSemiBold>
        <View style={styles.headerActions}>
          {order.status === 'pending' && (
            <Pressable
              style={styles.iconButton}
              onPress={() => {
                if (order.restaurantId) {
                  navigation.navigate('OrderDetailEditScreen', {
                    orderId: order.id,
                    restaurantId: order.restaurantId
                  })
                } else {
                  console.error('Cannot edit order: order.restaurantId is missing.')
                  showMessage({
                    message: 'Cannot edit order: Restaurant information is missing.',
                    type: 'danger',
                    style: GlobalStyles.flashStyle,
                    titleStyle: GlobalStyles.flashTextStyle
                  })
                }
              }}
            >
              <MaterialCommunityIcons name="square-edit-outline" size={24} color={GlobalStyles.brandPrimary} />
            </Pressable>
          )}
          {order.id && order.status === 'pending' && (
            <Pressable
              style={styles.iconButton}
              onPress={() => setIsDeleteModalVisible(true)}
            >
              <MaterialCommunityIcons name="delete" size={24} color={GlobalStyles.brandPrimary} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={order.products || []}
        renderItem={renderProduct}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyList}
        ItemSeparatorComponent={renderSeparator}
        contentContainerStyle={styles.listContentContainer}
      />

      <DeleteModal
        isVisible={isDeleteModalVisible}
        onCancel={() => setIsDeleteModalVisible(false)}
        onConfirm={handleDeleteOrder}
      >
        <TextRegular>Are you sure you want to delete order <TextSemiBold>#{order.id}</TextSemiBold>?</TextRegular>
      </DeleteModal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalStyles.brandBackground
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingTop: 40,
    paddingBottom: 10,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5
  },
  headerTitle: {
    color: GlobalStyles.brandPrimary,
    fontSize: 18,
    left: 135,
    flex: 1
  },
  headerActions: {
    flexDirection: 'row',
    minWidth: 50,
    justifyContent: 'flex-end'
  },
  iconButton: {
    padding: 6,
    marginLeft: 8
  },
  backButton: {
    position: 'absolute',
    top: 25,
    left: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  listContentContainer: {
    paddingBottom: 20
  },
  orderSummary: {
    backgroundColor: 'white',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  restaurantLogo: {
    width: 60,
    height: 60,
    borderRadius: 30
  },
  restaurantDetails: {
    marginLeft: 15,
    flex: 1
  },
  restaurantName: {
    fontSize: 18,
    marginBottom: 5,
    color: GlobalStyles.brandBlack
  },
  orderDate: {
    fontSize: 14,
    color: GlobalStyles.brandGray
  },
  orderStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  statusLabel: {
    fontSize: 14,
    marginRight: 10,
    color: GlobalStyles.brandGray
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: '#ddd'
  },
  pendingStatus: {
    backgroundColor: '#e60b21'
  },
  processingStatus: {
    backgroundColor: '#f58e07'
  },
  readyStatus: {
    backgroundColor: '#2ff507'
  },
  deliveredStatus: {
    backgroundColor: '#07b9f5'
  },
  cancelledStatus: {
    backgroundColor: '#F44336'
  },
  statusText: {
    color: 'white',
    fontSize: 14
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10
  },
  orderDetails: {
    marginVertical: 10
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5
  },
  detailLabel: {
    fontSize: 14,
    color: GlobalStyles.brandGray,
    flex: 1
  },
  detailValue: {
    fontSize: 14,
    textAlign: 'right',
    flex: 2
  },
  priceText: {
    color: GlobalStyles.brandPrimary
  },
  productsHeader: {
    backgroundColor: GlobalStyles.brandExtraLightGray,
    padding: 10,
    marginTop: 10,
    borderRadius: 5
  },
  productsHeaderText: {
    fontSize: 16
  },
  productContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 5
  },
  productDetails: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'space-between'
  },
  productName: {
    fontSize: 16,
    marginBottom: 5
  },
  productPrice: {
    fontSize: 14,
    color: GlobalStyles.brandGray,
    marginBottom: 5
  },
  quantity: {
    fontSize: 14,
    color: GlobalStyles.brandBlack,
    marginTop: 5
  },
  itemTotalStatic: {
    fontSize: 14,
    marginTop: 'auto',
    alignSelf: 'flex-end',
    paddingTop: 10
  },
  separator: {
    height: 5,
    backgroundColor: 'transparent'
  },
  emptyListContainer: {
    padding: 30,
    alignItems: 'center'
  },
  emptyList: {
    textAlign: 'center',
    color: GlobalStyles.brandGray,
    fontSize: 16
  }
})
