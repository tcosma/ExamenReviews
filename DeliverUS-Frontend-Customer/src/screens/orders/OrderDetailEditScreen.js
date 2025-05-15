/* eslint-disable react/prop-types */
import React, { useEffect, useState, useContext, useRef } from 'react'
import { StyleSheet, View, FlatList, ImageBackground, Image, Pressable, Text, Modal, Animated, TextInput } from 'react-native'
import { showMessage } from 'react-native-flash-message'
import { getDetail as getRestaurantDetail } from '../../api/RestaurantEndpoints'
import { getDetail as getOrderDetail, update as updateOrder } from '../../api/OrderEndpoints'
import TextRegular from '../../components/TextRegular'
import TextSemiBold from '../../components/TextSemibold'
import * as GlobalStyles from '../../styles/GlobalStyles'
import { API_BASE_URL } from '@env'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import ConfirmModal from '../../components/ConfirmModal'
import TextError from '../../components/TextError'
import { AuthorizationContext } from '../../context/AuthorizationContext'
import { Formik } from 'formik'
import * as yup from 'yup'

const validationSchema = yup.object().shape({
  products: yup.array().of(
    yup.object().shape({
      productId: yup.number().positive().integer('Product ID must be an integer'),
      quantity: yup.number().positive('Quantity must be positive').integer('Quantity must be an integer')
    })
  ).min(1, 'Order must have at least one product'),
  address: yup
    .string()
    .max(255, 'Address too long')
    .required('Address is required')
})

const getStatusColor = (status) => {
  switch (status) {
    case 'online': return '#4CAF50'
    case 'offline': return '#808080'
    case 'closed': return '#F44336'
    case 'temporarily closed': return '#FFC107'
    default: return '#808080'
  }
}

export default function OrderDetailEditScreen({ navigation, route }) {
  const { orderId, restaurantId } = route.params
  const [restaurant, setRestaurant] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [formikInitialValues, setFormikInitialValues] = useState({ products: [], address: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [backendErrors, setBackendErrors] = useState([])
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false)
  const [showContactInfo, setShowContactInfo] = useState(false)
  const { loggedInUser } = useContext(AuthorizationContext)
  const formikRef = useRef()

  useEffect(() => {
    fetchData()
  }, [orderId, restaurantId])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [fetchedRestaurant, fetchedOrder] = await Promise.all([
        getRestaurantDetail(restaurantId),
        getOrderDetail(orderId)
      ])
      setRestaurant(fetchedRestaurant)

      const initialProductsForFormik = fetchedOrder.products.map(prod => ({
        productId: prod.id,
        quantity: prod.OrderProducts.quantity
      }))
      const initialAddress = fetchedOrder.address

      setFormikInitialValues({
        products: initialProductsForFormik,
        address: initialAddress
      })

    } catch (error) {
      console.error('Error during fetchData:', error)
      showMessage({ message: `Error fetching data: ${error}`, type: 'error', style: GlobalStyles.flashStyle, titleStyle: GlobalStyles.flashTextStyle })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateSubtotal = (formikValues) => {
    let subtotal = 0
    formikValues.products.forEach(formikProduct => {
      const productDetails = restaurant.products?.find(p => p.id === formikProduct.productId)
      if (productDetails) {
        subtotal += productDetails.price * formikProduct.quantity
      }
    })
    return subtotal
  }

  const handleIncreaseQuantity = (productId, formik) => {
    const currentProducts = formik.values.products
    const productIndex = currentProducts.findIndex(p => p.productId === productId)

    if (productIndex > -1) {
      const updatedProducts = currentProducts.map((p, index) =>
        index === productIndex ? { ...p, quantity: p.quantity + 1 } : p
      )
      formik.setFieldValue('products', updatedProducts)
    } else {
      formik.setFieldValue('products', [...currentProducts, { productId, quantity: 1 }])
    }
  }

  const handleDecreaseQuantity = (productId, formik) => {
    const currentProducts = formik.values.products
    const productIndex = currentProducts.findIndex(p => p.productId === productId)

    if (productIndex > -1) {
      const currentQuantity = currentProducts[productIndex].quantity
      if (currentQuantity <= 1) {
        const updatedProducts = currentProducts.filter((_, index) => index !== productIndex)
        formik.setFieldValue('products', updatedProducts)
      } else {
        const updatedProducts = currentProducts.map((p, index) =>
          index === productIndex ? { ...p, quantity: p.quantity - 1 } : p
        )
        formik.setFieldValue('products', updatedProducts)
      }
    }
  }

  const handleSaveChanges = async (values) => {
    setIsSaving(true)
    setBackendErrors([])

    const payload = {
      products: values.products,
      address: values.address
    }

    try {
      await updateOrder(orderId, payload)
      showMessage({ message: 'Order updated successfully', type: 'success', style: GlobalStyles.flashStyle, titleStyle: GlobalStyles.flashTextStyle })
      setIsConfirmModalVisible(false)
      navigation.navigate('My orders', { screen: 'OrdersScreen', params: { dirty: true } })
    } catch (error) {
      console.error('Error updating order:', error)
      const errorsToShow = error.errors || (error.message ? [{ msg: error.message }] : [{ msg: 'Could not update order.' }])
      setBackendErrors(errorsToShow)
      showMessage({ message: 'Error updating order: ' + (errorsToShow[0]?.msg || 'Unknown error'), type: 'error', style: GlobalStyles.flashStyle, titleStyle: GlobalStyles.flashTextStyle })
    } finally {
      setIsSaving(false)
    }
  }

  const renderHeader = (formikProps) => {
    const { handleChange, handleBlur, values, errors, touched } = formikProps
    if (isLoading || !restaurant.id) return <TextRegular style={styles.loadingText}>Loading Restaurant...</TextRegular>

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
            <Image style={styles.profileImage} source={logoImageSource} />
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(restaurant.status) }]} />
          </View>

          <View style={styles.textContainer}>
            <TextSemiBold textStyle={styles.textTitle}>{restaurant.name}</TextSemiBold>
            <TextRegular textStyle={styles.description}>{restaurant.address}</TextRegular>
          </View>

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
        </View>

        <Modal
          animationType="fade"
          transparent={true}
          visible={showContactInfo}
          onRequestClose={() => setShowContactInfo(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowContactInfo(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalItem} key="email">
                <TextSemiBold>Email:</TextSemiBold>
                <TextRegular>{restaurant.email || 'example@gmail.com'}</TextRegular>
              </View>
              <View style={styles.modalItem} key="phone">
                <TextSemiBold>Phone:</TextSemiBold>
                <TextRegular>{restaurant.phone || '123456789'}</TextRegular>
              </View>
              <View style={styles.modalItem} key="url">
                <TextSemiBold>URL:</TextSemiBold>
                <TextRegular>{restaurant.url || 'www.example.com'}</TextRegular>
              </View>
              <View style={styles.modalItem} key="description">
                <TextSemiBold>Description:</TextSemiBold>
                <TextRegular>{restaurant.description || 'No description available'}</TextRegular>
              </View>
            </View>
          </Pressable>
        </Modal>

        <View style={styles.addressContainer}>
          <TextSemiBold style={styles.addressLabel}>Delivery Address:</TextSemiBold>
          <TextInput
            style={styles.addressInput}
            onChangeText={handleChange('address')}
            onBlur={handleBlur('address')}
            value={values.address}
            placeholder="Enter delivery address"
            multiline
          />
          {touched.address && errors.address && <TextError>{errors.address}</TextError>}
        </View>

        <TextSemiBold style={styles.productsHeader}>Products</TextSemiBold>
      </View>
    )
  }

  const renderProduct = ({ item }, formik) => {
    const formikProduct = formik.values.products.find(p => p.productId === item.id)
    const quantity = formikProduct ? formikProduct.quantity : 0

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
                    <Pressable onPress={() => handleDecreaseQuantity(item.id, formik)} style={styles.quantityControlButton}>
                      <Text style={styles.quantityControlText}>-</Text>
                    </Pressable>
                    <Text style={styles.quantityDisplay}>{quantity}</Text>
                    <Pressable onPress={() => handleIncreaseQuantity(item.id, formik)} style={styles.quantityControlButton}>
                      <Text style={styles.quantityControlText}>+</Text>
                    </Pressable>
                  </>)
                : (
                  <Pressable onPress={() => handleIncreaseQuantity(item.id, formik)} style={[styles.quantityControlButton, styles.addButton]}>
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
        {isLoading ? 'Loading products...' : 'This restaurant has no products.'}
      </TextRegular>
    )
  }

  return (
    <Formik
      innerRef={formikRef}
      initialValues={formikInitialValues}
      validationSchema={validationSchema}
      onSubmit={handleSaveChanges}
      enableReinitialize
    >
      {(formikProps) => {
        const { handleSubmit, values, dirty, errors, touched } = formikProps
        const subtotal = calculateSubtotal(values)
        const shippingCosts = subtotal >= 10 ? 0 : (restaurant.shippingCosts || 0)
        const totalPrice = subtotal + shippingCosts
        const showSaveButton = dirty && !isLoading

        return (
          <View style={styles.container}>
            <FlatList
              ListHeaderComponent={() => renderHeader(formikProps)}
              ListEmptyComponent={renderEmptyProductsList}
              data={restaurant.products || []}
              renderItem={(props) => renderProduct(props, { values, setFieldValue: formikProps.setFieldValue })}
              keyExtractor={item => item.id.toString()}
              ItemSeparatorComponent={renderSeparator}
              contentContainerStyle={styles.listContentContainer}
            />

            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
            </Pressable>

            {showSaveButton && (
              <View style={styles.saveButtonContainerFixed}>
                <Pressable
                  style={styles.saveButtonFAB}
                  onPress={() => {
                    formikProps.validateForm().then(() => {
                      if (Object.keys(formikProps.errors).length > 0) {
                        formikProps.setTouched({
                          products: true,
                          address: true
                        });
                        let errorMsg = 'Please fix the errors: '
                        if (formikProps.errors.products && typeof formikProps.errors.products === 'string') {
                          errorMsg += formikProps.errors.products
                        } else if (formikProps.errors.address) {
                          errorMsg += formikProps.errors.address
                        } else {
                          errorMsg = 'Please check the product quantities and address.'
                        }
                        showMessage({ message: errorMsg, type: 'warning', style: GlobalStyles.flashStyle, titleStyle: GlobalStyles.flashTextStyle })
                      } else {
                        setIsConfirmModalVisible(true)
                      }
                    });
                  }}
                  disabled={isSaving}
                >
                  <Text style={styles.saveButtonFABText}>{isSaving ? 'Saving...' : 'Save'}</Text>
                </Pressable>
              </View>
            )}

            <ConfirmModal
              isVisible={isConfirmModalVisible}
              onCancel={() => { setBackendErrors([]); setIsConfirmModalVisible(false) }}
              onConfirm={handleSubmit}
              confirmText={'Update'}
              disabled={isSaving}
            >
              <TextSemiBold style={styles.modalTitle}>Please confirm update</TextSemiBold>
              <View style={styles.modalTotalsContainer}>
                <View style={styles.modalTotalRow}>
                  <TextRegular style={styles.modalTotalLabel}>Subtotal:</TextRegular>
                  <TextSemiBold style={styles.modalTotalValue}>{subtotal.toFixed(2)} €</TextSemiBold>
                </View>
                <View style={styles.modalTotalRow}>
                  <TextRegular style={styles.modalTotalLabel}>Shipping Cost:</TextRegular>
                  <TextSemiBold style={styles.modalTotalValue}>{shippingCosts.toFixed(2)} €</TextSemiBold>
                </View>
                <View style={[styles.modalTotalRow, styles.modalFinalTotalRow]}>
                  <TextSemiBold style={styles.modalTotalLabel}>Total:</TextSemiBold>
                  <TextSemiBold style={[styles.modalTotalValue, styles.modalFinalTotalValue]}>{totalPrice.toFixed(2)} €</TextSemiBold>
                </View>
              </View>
              {backendErrors.length > 0 && (
                <View style={styles.errorContainer}>
                  {backendErrors.map((error, index) => (
                    <TextError key={index}>{error.param ? `${error.param}: ${error.msg}` : error.msg}</TextError>
                  ))}
                </View>
              )}
              {Object.keys(errors).length > 0 && (touched.products || touched.address) && (
                <View style={styles.errorContainer}>
                  {errors.products && typeof errors.products === 'string' && <TextError>{errors.products}</TextError>}
                  {errors.address && touched.address && <TextError>{errors.address}</TextError>}
                </View>
              )}
            </ConfirmModal>
          </View>
        )
      }}
    </Formik>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalStyles.brandBackground
  },
  imageBackground: {
    height: 200,
    width: '100%'
  },
  blurredImage: {
    resizeMode: 'cover'
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
    marginTop: -70
  },
  profileImageContainer: {
    position: 'relative'
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
    alignItems: 'stretch',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5
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
  addressContainer: {
    width: '100%',
    paddingHorizontal: 15,
    marginTop: 15,
    marginBottom: 5
  },
  addressLabel: {
    fontSize: 16,
    color: GlobalStyles.brandBlack,
    marginBottom: 5
  },
  addressInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GlobalStyles.brandLightGray,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top'
  },
  emptyList: {
    textAlign: 'center',
    padding: 50,
    color: GlobalStyles.brandGray
  },
  productsHeader: {
    fontSize: 18,
    color: GlobalStyles.brandPrimary,
    paddingVertical: 10,
    paddingHorizontal: 15,
    textAlign: 'left',
    backgroundColor: GlobalStyles.brandBackground,
    fontWeight: 'bold'
  },
  productContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    alignItems: 'flex-start',
    position: 'relative'
  },
  productDetails: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'flex-start',
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
  addButton: {
  },
  listContentContainer: {
    paddingBottom: 100
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
    color: GlobalStyles.brandGray
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
  saveButtonContainerFixed: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center'
  },
  saveButtonFAB: {
    borderRadius: 25,
    backgroundColor: GlobalStyles.brandPrimary,
    paddingVertical: 12,
    paddingHorizontal: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4
  },
  saveButtonFABText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  modalTitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20
  },
  modalTotalsContainer: {
    marginVertical: 15,
    width: '100%',
    alignSelf: 'stretch'
  },
  modalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  modalFinalTotalRow: {
    borderTopWidth: 1,
    borderColor: GlobalStyles.brandLightGray,
    paddingTop: 8,
    marginTop: 8
  },
  modalTotalLabel: {
    fontSize: 16,
    color: GlobalStyles.brandGray
  },
  modalTotalValue: {
    fontSize: 16,
    color: GlobalStyles.brandBlack
  },
  modalFinalTotalValue: {
    color: GlobalStyles.brandPrimary,
    fontWeight: 'bold'
  },
  errorContainer: {
    marginTop: 10,
    alignItems: 'stretch',
    paddingHorizontal: 10
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
  price: {
    color: GlobalStyles.brandPrimary
  },
  availability: {
    textAlign: 'right',
    marginRight: 5,
    color: GlobalStyles.brandSecondary
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
