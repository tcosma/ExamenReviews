/* eslint-disable react/prop-types */
import React, { useEffect, useState, useContext } from 'react'
import { StyleSheet, View, Pressable, FlatList, ScrollView, Image } from 'react-native'
import TextSemiBold from '../../components/TextSemibold'
import TextRegular from '../../components/TextRegular'
import * as GlobalStyles from '../../styles/GlobalStyles'
import { getAllRestaurants, getRestaurantCategories } from '../../api/RestaurantEndpoints'
import { getPopularProducts } from '../../api/ProductEndpoints'
import { showMessage } from 'react-native-flash-message'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import StarRating from 'react-native-star-rating-widget'
import { AuthorizationContext } from '../../context/AuthorizationContext'
import DeleteModal from '../../components/DeleteModal'
import { createReviews, editReviews, deleteReviews, getReviews } from '../../api/ReviewEndpoints'

export default function ReviewsScreen({ navigation, route }) {
  const [reviews, setReviews] = useState([])
  const { loggedInUser } = useContext(AuthorizationContext)
  const [status, setStatus] = useState(true)
  const [reviewToBeDeleted, setReviewToBeDeleted] = useState(null)

  useEffect(() => {
    fetchReviews()
  }, [route])

  const renderReview = ({ item }) => {
    return (

      <View
        style={styles.orderCard}>
        <View style={styles.linea}>
          <StarRating rating={item.stars} starSize={28} />
          <View style={styles.linea}>
            <Pressable
              style={{ marginRight: 4 }}
              onPress={() => {
                navigation.navigate('ReviewsScreenEdit', {
                  restaurantId: item.restaurantId,
                  customerId: item.customerId,
                  reviewId: item.id,
                  stars: item.stars,
                  body: item.body,
                  dirty: true
                })
              }}>
              {loggedInUser && loggedInUser.id === item.customerId &&
                <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
                  <MaterialCommunityIcons name='pencil' color={'grey'} size={20} />
                </View>
              }
            </Pressable>
            <Pressable
              onPress={() => { setReviewToBeDeleted(item) }}>
              {loggedInUser && loggedInUser.id === item.customerId &&
                <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
                  <MaterialCommunityIcons name='delete' color={'grey'} size={20} />
                </View>
              }
            </Pressable>
          </View>
        </View>
        <TextRegular >
          {item.body}
        </TextRegular>

        <DeleteModal
          isVisible={reviewToBeDeleted !== null}
          onCancel={() => setReviewToBeDeleted(null)}
          onConfirm={() => removeRestaurant(reviewToBeDeleted)}>
          <TextRegular>This review will be deleted.</TextRegular>
        </DeleteModal>
      </View >
    )
  }

  const removeRestaurant = async (restaurant) => {
    try {
      console.log(restaurant)
      await deleteReviews(restaurant)
      await fetchReviews()
      setReviewToBeDeleted(null)
      setStatus(true)
      showMessage({
        message: `Review ${restaurant.id} succesfully removed`,
        type: 'success',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    } catch (error) {
      console.log(error)
      setReviewToBeDeleted(null)
      showMessage({
        message: `Review ${restaurant.id} could not be removed.`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  const renderEmptyReview = () => {
    return (
      <TextRegular textStyle={styles.emptyList}>
        No reviews were retrieved.
      </TextRegular>
    )
  }

  const fetchReviews = async () => {
    try {
      const fetchedReviews = await getReviews(route.params.restaurantId)
      setReviews(fetchedReviews)
      if (loggedInUser) {
        for (const review of fetchedReviews) {
          if (review.customerId === loggedInUser.id) {
            setStatus(false)
          }
        }
      }
    } catch (error) {
      showMessage({
        message: `There was an error while retrieving reviews. ${error} `,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.container}>
        <FlatList
          style={styles.listContainer}
          data={reviews}
          renderItem={renderReview}
          keyExtractor={item => item.id.toString()}
          ListEmptyComponent={renderEmptyReview}
          contentContainerStyle={styles.listContentContainer}
        />
      </View>
      {loggedInUser && status && <View style={styles.estrella}>
        <Pressable
          onPress={() => {
            navigation.navigate('ReviewsScreenCreate', {
              restaurantId: route.params.restaurantId
            })
          }}
        >
          <TextSemiBold>Create review</TextSemiBold>
        </Pressable>
      </View>}
    </View>

  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  linea: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  estrella: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(185, 185, 185, 0.5)',
    height: 30,
    width: 190,
    borderRadius: 20,
    marginBottom: 80,
    alignSelf: 'center',
    padding: 5

  },

  orderCard: {
    flexDirection: 'column',
    alignItems: 'left',
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
  listContainer: {
    flex: 1,
    width: '100%'
  },
  listContentContainer: {
    paddingBottom: 75
  },
  sectionTitle: {
    fontSize: 18,
    marginVertical: 8,
    marginLeft: 10
  },
  button: {
    borderRadius: 8,
    height: 40,
    margin: 12,
    padding: 10,
    width: '100%'
  },
  text: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center'
  },
  emptyList: {
    textAlign: 'center',
    padding: 50
  },
  categoriesContainer: {
    marginVertical: 5
  },
  categoriesList: {
    paddingVertical: 5,
    paddingHorizontal: 6
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  selectedCategoryButton: {
    backgroundColor: GlobalStyles.brandPrimary,
    borderColor: GlobalStyles.brandPrimary
  },
  categoryIcon: {
    marginRight: 5
  },
  categoryText: {
    fontSize: 14
  },
  selectedCategoryText: {
    color: '#fff'
  },
  popularProductsContainer: {
    marginVertical: 5
  },
  popularProductsList: {
    paddingVertical: 5,
    paddingHorizontal: 6
  },
  image: {
    width: 100,
    height: 100,
    borderColor: GlobalStyles.brandPrimary,
    borderWidth: 1,
    borderRadius: 50,
    marginTop: -20,
    alignSelf: 'center'
  },
  popularProductCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
    width: 130 // Fixed width for carousel items
  },
  popularProductImage: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8
  },
  popularProductDetails: {
    padding: 8
  },
  popularProductName: {
    fontSize: 14,
    marginBottom: 2
  },
  popularProductRestaurant: {
    fontSize: 12,
    color: GlobalStyles.brandGray
  },
  restaurantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginBottom: 10,
    marginHorizontal: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3
  },
  restaurantImage: {
    width: 100,
    height: 100,
    borderRadius: 8
  },
  restaurantDetailsContainer: {
    flex: 1,
    marginLeft: 15
  },
  restaurantName: {
    fontSize: 18,
    marginBottom: 5
  },
  restaurantDescription: {
    fontSize: 14,
    color: GlobalStyles.brandGray,
    marginBottom: 5
  },
  restaurantInfo: {
    fontSize: 14,
    color: GlobalStyles.brandBlack
  }
})
