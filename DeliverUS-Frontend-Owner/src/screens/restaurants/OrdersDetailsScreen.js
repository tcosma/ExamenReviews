/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'
import { StyleSheet, View, FlatList, ImageBackground, Image, Pressable } from 'react-native'
import { showMessage } from 'react-native-flash-message'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { getDetail, getOrders, getUser, backward, forward } from '../../api/RestaurantEndpoints'
import { remove } from '../../api/ProductEndpoints'
import ImageCard from '../../components/ImageCard'
import TextRegular from '../../components/TextRegular'
import TextSemiBold from '../../components/TextSemibold'
import * as GlobalStyles from '../../styles/GlobalStyles'
import DeleteModal from '../../components/DeleteModal'
import defaultProductImage from '../../../assets/product.jpeg'
import timer from '../../../assets/timer-sand.jpg'
import chef from '../../../assets/chef-hat.jpg'
import truck from '../../../assets/truck-delivery.jpg'
import food from '../../../assets/food.jpg'

export default function OrdersDetailsScreen ({ navigation, route }) {
  const [orders, setOrders] = useState({})

  useEffect(() => {
    fetchOrders()
  }, [route])

  const getImage = (item) => {
    switch (item) {
      case 'pending':
        return timer
      case 'in process':
        return chef
      case 'sent':
        return truck
      case 'delivered':
        return food
    }
  }

  const canBackward = (item) => {
    switch (item) {
      case 'pending':
        return false
      case 'in process':
        return true
      case 'sent':
        return true
      case 'delivered':
        return false
    }
  }

  const canForward = (item) => {
    switch (item) {
      case 'pending':
        return true
      case 'in process':
        return true
      case 'sent':
        return true
      case 'delivered':
        return false
    }
  }
  const renderOrder = ({ item }) => {
    return (
            <ImageCard
                imageUri={ { uri: getImage(item.status) }}
                title={item.status}
            >
                <TextSemiBold textStyle={styles.price}>Fecha creación{item.createdAt}</TextSemiBold>
                <TextRegular>Total {item.price}+{item.shippingCosts}€</TextRegular>
                <TextRegular>Usuario {item.user.firstName} {item.user.lastName}</TextRegular>

                <View style={styles.actionButtonsContainer}>
          {canBackward(item.status) && <Pressable
            onPress={() => { performBackwarding(item) }}
            style={({ pressed }) => [
              {
                backgroundColor: pressed
                  ? GlobalStyles.brandBlue
                  : GlobalStyles.brandBlueTap
              },
              styles.actionButtonLeft
            ]}>
            <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
              <MaterialCommunityIcons name='page-previous' color={'white'} size={20} />
              <TextRegular textStyle={styles.text}>
                Previous
              </TextRegular>
            </View>
          </Pressable>}
          {canForward(item.status) && <Pressable
            onPress={() => { performForwarding(item) }}
            style={({ pressed }) => [
              {
                backgroundColor: pressed
                  ? GlobalStyles.brandPrimaryTap
                  : GlobalStyles.brandPrimary
              },
              styles.actionButtonRight
            ]}>
            <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
              <MaterialCommunityIcons name='page-next' color={'white'} size={20} />
              <TextRegular textStyle={styles.text}>
                Next
              </TextRegular>
            </View>
          </Pressable>}
            </View>

            </ImageCard>
    )
  }

  const performBackwarding = async (order) => {
    try {
      await backward(order.id)
      fetchOrders()
      showMessage({
        message: `Order ${order.id} succesfully backwarded`,
        type: 'success',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    } catch (error) {
      console.log(error)
      showMessage({
        message: `Order ${order.id} could not be backwarded`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }
  const performForwarding = async (order) => {
    try {
      await forward(order.id)
      fetchOrders()
      showMessage({
        message: `Order ${order.id} succesfully forwarded`,
        type: 'success',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    } catch (error) {
      console.log(error)
      showMessage({
        message: `Order ${order.id} could not be forwarded`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  const renderEmptyOrdersList = () => {
    return (
            <TextRegular textStyle={styles.emptyList}>
                This restaurant has no orders yet.
            </TextRegular>
    )
  }

  const fetchOrders = async () => {
    try {
      const fetchedOrders = await getOrders(route.params.id)
      console.log(fetchOrders)
      for (const order of fetchedOrders) {
        console.log(order)
        order.customer = getUser(order.userId)
      }
      console.log(fetchedOrders)
      setOrders(fetchedOrders)
    } catch (error) {
      showMessage({
        message: `There was an error while retrieving orders of restaurant (id ${route.params.id}). ${error}`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }
  /*
                    const removeProduct = async (product) => {
                      try {
                        await remove(product.id)
                        await fetchRestaurantDetail()
                        setProductToBeDeleted(null)
                        showMessage({
                          message: `Product ${product.name} succesfully removed`,
                          type: 'success',
                          style: GlobalStyles.flashStyle,
                          titleStyle: GlobalStyles.flashTextStyle
                        })
                      } catch (error) {
                        console.log(error)
                        setProductToBeDeleted(null)
                        showMessage({
                          message: `Product ${product.name} could not be removed.`,
                          type: 'error',
                          style: GlobalStyles.flashStyle,
                          titleStyle: GlobalStyles.flashTextStyle
                        })
                      }
                    } */

  return (
        <View style={styles.container}>
            <FlatList
                ListEmptyComponent={renderEmptyOrdersList}
                style={styles.container}
                data={orders}
                renderItem={renderOrder}
                keyExtractor={item => item.id.toString()}
            />
        </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  row: {
    padding: 15,
    marginBottom: 5,
    backgroundColor: GlobalStyles.brandSecondary
  },
  restaurantHeaderContainer: {
    height: 250,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'column',
    alignItems: 'center'
  },
  imageBackground: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center'
  },
  price: {
    color: '#be0f2e'
  },
  image: {
    height: 100,
    width: 100,
    margin: 10
  },
  description: {
    color: 'white'
  },
  textTitle: {
    fontSize: 20,
    color: 'white'
  },
  emptyList: {
    textAlign: 'center',
    padding: 50
  },
  button: {
    borderRadius: 8,
    height: 40,
    marginTop: 12,
    padding: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    width: '80%'
  },
  text: {
    fontSize: 16,
    color: 'white',
    alignSelf: 'center',
    marginLeft: 5
  },
  availability: {
    textAlign: 'right',
    marginRight: 5,
    color: GlobalStyles.brandSecondary
  },
  actionButtonLeft: {
    borderRadius: 8,
    height: 40,
    marginTop: 12,
    margin: '1%',
    padding: 10,
    alignSelf: 'center',
    flexDirection: 'column',
    width: '50%',
    marginLeft: 0

  },
  actionButtonRight: {
    borderRadius: 8,
    height: 40,
    marginTop: 12,
    margin: '1%',
    padding: 10,
    alignSelf: 'center',
    flexDirection: 'column',
    width: '50%',
    marginLeft: 'auto',
    marginRight: -10
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    bottom: 5,
    position: 'absolute',
    width: '90%'
  }
})
