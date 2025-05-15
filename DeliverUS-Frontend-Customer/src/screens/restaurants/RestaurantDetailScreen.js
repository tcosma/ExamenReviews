import React, { useEffect, useState, useContext, useRef } from 'react'
import { StyleSheet, View, FlatList, ImageBackground, Image, Modal, Pressable, Text, Animated, Button } from 'react-native'
import { showMessage } from 'react-native-flash-message'
import { getDetail } from '../../api/RestaurantEndpoints'
import { create } from '../../api/OrderEndpoints'
import TextRegular from '../../components/TextRegular'
import TextSemiBold from '../../components/TextSemibold'
import * as GlobalStyles from '../../styles/GlobalStyles'
import { API_BASE_URL } from '@env'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import ConfirmModal from '../../components/ConfirmModal'
import * as yup from 'yup'
import { Formik, ErrorMessage } from 'formik'
import InputItem from '../../components/InputItem'
import TextError from '../../components/TextError'
import { AuthorizationContext } from '../../context/AuthorizationContext'
import StarRating from 'react-native-star-rating-widget'
import { createReviews, editReviews, deleteReviews, getReviews } from '../../api/ReviewEndpoints'

const getStatusColor = (status) => {
  switch (status) {
    case 'online':
      return '#4CAF50'
    case 'offline':
      return '#808080'
    case 'closed':
      return '#F44336'
    case 'temporarily closed':
      return '#FFC107'
    default:
      return '#808080'
  }
}

export default function RestaurantDetailScreen({ navigation, route }) {
  const [restaurant, setRestaurant] = useState({})
  const [showContactInfo, setShowContactInfo] = useState(false)
  const [products, setProducts] = useState({})
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false)
  const [backendErrors, setBackendErrors] = useState([])
  const { loggedInUser } = useContext(AuthorizationContext)
  const cartButtonBottom = useRef(new Animated.Value(-100)).current
  const [reviews, setReviews] = useState(0)

  const calculateTotalPrice = () => {
    let totalPrice = 0
    for (const productId in products) {
      const quantity = products[productId]
      const product = restaurant.products?.find(p => p.id.toString() === productId)
      if (product) {
        totalPrice += product.price * quantity
      }
    }
    return totalPrice
  }

  const initialOrderValues = { restaurantId: route.params.id, address: loggedInUser?.address || '' }

  const validationSchema = yup.object().shape({
    address: yup
      .string()
      .required('Address is required'),
    restaurantId: yup
      .number()
      .positive()
      .integer()
      .required('It seems that this restaurant is not valid')
  })

  useEffect(() => {
    fetchRestaurantDetail()
    fetchReviews()
  }, [route])

  useEffect(() => {
    const cartHasItems = Object.keys(products).length > 0
    Animated.timing(cartButtonBottom, {
      toValue: cartHasItems ? 20 : -100,
      duration: 300,
      useNativeDriver: false
    }).start()
  }, [products])

  const fetchReviews = async () => {
    try {
      console.log(route)
      const fetchedReviews = await getReviews(route.params.id)
      setReviews(fetchedReviews)
    } catch (error) {
      showMessage({
        message: `There was an error while retrieving reviews. ${error} `,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }
  const renderHeader = () => {
    const heroImageSource = restaurant?.heroImage ? { uri: API_BASE_URL + '/' + restaurant.heroImage, cache: 'force-cache' } : undefined
    const logoImageSource = restaurant?.logo ? { uri: API_BASE_URL + '/' + restaurant.logo, cache: 'force-cache' } : undefined
    const fallbackImageSource = logoImageSource
    const imageSource = heroImageSource || fallbackImageSource
    const shouldBlur = !heroImageSource && fallbackImageSource
    return (
      <View>
        <ImageBackground
          source={imageSource}
          style={styles.imageBackground}
          imageStyle={shouldBlur ? styles.blurredImage : {}}
          blurRadius={shouldBlur ? 10 : 0}
        >
          <View style={styles.headerButtons}>
            <Pressable style={styles.iconButton} onPress={() => setShowContactInfo(true)}>
              <MaterialCommunityIcons name="information" size={24} color="white" />
            </Pressable>
          </View>
        </ImageBackground>

        <View style={styles.contentContainer}>

          <View style={styles.profileImageContainer}>
            <Image style={styles.profileImage} source={restaurant.logo ? { uri: API_BASE_URL + '/' + restaurant.logo, cache: 'force-cache' } : undefined} />
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(restaurant.status) }]} />
          </View>

          <View style={styles.textContainer}>
            <TextSemiBold textStyle={styles.textTitle}>{restaurant.name}</TextSemiBold>
            <TextRegular textStyle={styles.description}>{restaurant.address}</TextRegular>
          </View>
          <StarRating rating={Number(restaurant.avgStars)} starSize={26} />

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <TextSemiBold>Shipping costs</TextSemiBold>
              <TextRegular>{restaurant.shippingCosts?.toFixed(2)}€</TextRegular>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <TextSemiBold>Average service time</TextSemiBold>
              <TextRegular>{restaurant.averageServiceMinutes !== null ? `${restaurant.averageServiceMinutes} min` : 'Not available'}</TextRegular>
            </View>
          </View>
          <View style={styles.estrella}>
            <Pressable
              onPress={() => {
                navigation.navigate('ReviewsScreen', {
                  restaurantId: restaurant.id
                })
              }}
            >
              <TextSemiBold>Check all reviews</TextSemiBold>
            </Pressable>
          </View>
        </View>
      </View >
    )
  }

  const handleIncreaseQuantity = (productId) => {
    setProducts(prevQuantities => ({
      ...prevQuantities,
      [productId]: (prevQuantities[productId] || 0) + 1
    }))
  }

  const handleDecreaseQuantity = (productId) => {
    setProducts(prevQuantities => {
      const currentQuantity = prevQuantities[productId] || 0
      if (currentQuantity <= 1) {
        const { [productId]: _, ...restQuantities } = prevQuantities
        return restQuantities
      } else {
        return {
          ...prevQuantities,
          [productId]: currentQuantity - 1
        }
      }
    })
  }

  const handleConfirmOrder = async (values) => {
    setBackendErrors([])
    const orderData = {
      ...values,
      price: calculateTotalPrice(),
      shippingCosts: restaurant.shippingCosts,
      products: Object.entries(products).map(([productId, quantity]) => ({ productId: parseInt(productId), quantity }))
    }
    try {
      await create(orderData)
      setIsConfirmModalVisible(false)
      setProducts({})
      showMessage({
        message: 'Order successfully created',
        type: 'success',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
      navigation.navigate('My orders', { screen: 'OrdersScreen', params: { dirty: true } })
    } catch (error) {
      setBackendErrors(error.errors || [{ msg: 'An unexpected error occurred.' }])
    }
  }

  const renderProduct = ({ item }) => {
    const quantity = products[item.id] || 0
    return (
      <View style={styles.productContainer}>
        <Image style={styles.productImage} source={item.image ? { uri: API_BASE_URL + '/' + item.image, cache: 'force-cache' } : undefined} />
        <View style={styles.productDetails}>
          <TextSemiBold style={styles.productName}>{item.name}</TextSemiBold>
          <TextRegular style={styles.productPrice}>{item.price.toFixed(2)} €</TextRegular>
          <TextRegular numberOfLines={3} style={styles.productDescription}>{item.description}</TextRegular>
          {!item.availability &&
            <TextRegular style={styles.notAvailable}>Not available</TextRegular>
          }
          {loggedInUser && item.availability &&
            <View style={styles.quantityControlContainer}>
              {quantity > 0
                ? (
                  <>
                    <Pressable onPress={() => handleDecreaseQuantity(item.id)} style={styles.quantityControlButton}>
                      <Text style={styles.quantityControlText}>-</Text>
                    </Pressable>
                    <Text style={styles.quantityDisplay}>{quantity}</Text>
                    <Pressable onPress={() => handleIncreaseQuantity(item.id)} style={styles.quantityControlButton}>
                      <Text style={styles.quantityControlText}>+</Text>
                    </Pressable>
                  </>)
                : (
                  <Pressable onPress={() => handleIncreaseQuantity(item.id)} style={[styles.quantityControlButton, styles.addButton]}>
                    <Text style={styles.quantityControlText}>+</Text>
                  </Pressable>)
              }
            </View>
          }
        </View>
      </View>
    )
  }

  const renderSeparator = () => <View style={styles.separator} />

  const renderEmptyProductsList = () => {
    return (
      <TextRegular textStyle={styles.emptyList}>
        This restaurant has no products yet.
      </TextRegular>
    )
  }

  const fetchRestaurantDetail = async () => {
    try {
      const fetchedRestaurant = await getDetail(route.params.id)
      setRestaurant(fetchedRestaurant)
      console.log(fetchedRestaurant)
    } catch (error) {
      showMessage({
        message: `There was an error while retrieving restaurant details (id ${route.params.id}). ${error}`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyProductsList}
        data={restaurant.products}
        renderItem={renderProduct}
        keyExtractor={item => item.id.toString()}
        ItemSeparatorComponent={renderSeparator}
      />
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
      </Pressable>

      {loggedInUser && (
        <Animated.View style={[styles.cartButton, { bottom: cartButtonBottom }]}>
          {Object.keys(products).length > 0 &&
            <Pressable onPress={() => setIsConfirmModalVisible(true)}>
              <MaterialCommunityIcons name="cart" size={24} color="white" />
            </Pressable>
          }
        </Animated.View>
      )}

      <Formik
        initialValues={initialOrderValues}
        validationSchema={validationSchema}
        onSubmit={handleConfirmOrder}
      >
        {({ handleSubmit }) => (
          <ConfirmModal
            isVisible={isConfirmModalVisible}
            onCancel={() => {
              setIsConfirmModalVisible(false)
              setBackendErrors([])
            }}
            onConfirm={handleSubmit}
          >
            <TextRegular>Please provide your address to confirm the order:</TextRegular>
            <InputItem
              name='address'
              label='Address:'
            />
            <ErrorMessage name="address" component={TextError} />
            {backendErrors && backendErrors.map((error, index) => (
              <TextError key={index}>{error.param ? `${error.param}: ${error.msg}` : error.msg}</TextError>
            ))}
            <TextSemiBold textStyle={styles.totalPriceText}>
              Total Price: {(calculateTotalPrice() + restaurant.shippingCosts).toFixed(2)} €
            </TextSemiBold>
            <TextRegular textStyle={styles.shippingCostsText}>
              Shipping Costs: {calculateTotalPrice() >= 10 ? 'Free' : `${restaurant.shippingCosts?.toFixed(2)} €`}
            </TextRegular>
          </ConfirmModal>
        )}
      </Formik>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  imageBackground: {
    height: 200,
    width: '100%'
  },
  blurredImage: {
    resizeMode: 'cover'
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    position: 'absolute',
    top: 30,
    right: 20,
    zIndex: 1
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center'
  },
  estrella: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    backgroundColor: 'rgba(185, 185, 185, 0.5)',
    height: 30,
    width: 150,
    borderRadius: 20
  },
  profileImageContainer: {
    position: 'relative',
    marginTop: -70
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'white'
  },
  statusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    bottom: 5,
    right: 5,
    borderWidth: 2,
    borderColor: 'white'
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 10
  },
  textTitle: {
    fontSize: 24,
    color: 'black',
    marginBottom: 5,
    textAlign: 'center'
  },
  description: {
    color: 'black',
    marginBottom: 10,
    textAlign: 'center'
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    width: '100%',
    alignItems: 'center'
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E0E0E0',
    marginHorizontal: 10
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%'
  },
  modalItem: {
    marginBottom: 15
  },
  emptyList: {
    textAlign: 'center',
    padding: 50
  },
  price: {
    color: GlobalStyles.brandPrimary
  },
  availability: {
    textAlign: 'right',
    marginRight: 5,
    color: GlobalStyles.brandSecondary
  },
  productContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    alignItems: 'flex-start',
    position: 'relative',
    minHeight: 120
  },
  productDetails: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'space-between',
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  productName: {
    fontSize: 18,
    marginBottom: 5
  },
  productPrice: {
    fontSize: 16,
    color: GlobalStyles.brandPrimary,
    marginBottom: 5
  },
  productDescription: {
    fontSize: 14,
    color: GlobalStyles.brandGray,
    width: '90%',
    flexWrap: 'wrap',
    marginBottom: 10,
    flex: 1
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8
  },
  notAvailable: {
    marginTop: 5,
    color: GlobalStyles.brandSecondary,
    fontSize: 14,
    fontWeight: 'bold'
  },
  separator: {
    height: 1,
    backgroundColor: GlobalStyles.brandBackground
  },
  quantityControlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    alignSelf: 'flex-end',
    paddingTop: 10
  },
  quantityControlButton: {
    backgroundColor: GlobalStyles.brandExtraLightGray,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5
  },
  quantityControlText: {
    color: GlobalStyles.brandPrimary,
    fontSize: 18,
    fontWeight: 'bold'
  },
  quantityDisplay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GlobalStyles.brandBlack,
    minWidth: 20,
    textAlign: 'center',
    marginHorizontal: 5
  },
  backButton: {
    position: 'absolute',
    top: 38,
    left: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  addButton: {
  },
  cartButton: {
    position: 'absolute',
    left: 20,
    backgroundColor: GlobalStyles.brandPrimary,
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4
  },
  totalPriceText: {
    marginTop: 15,
    fontSize: 16,
    color: GlobalStyles.brandPrimary
  },
  shippingCostsText: {
    marginTop: 5,
    fontSize: 14,
    color: GlobalStyles.brandGray
  }
})
