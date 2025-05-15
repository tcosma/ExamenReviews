/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'
import { StyleSheet, View, Pressable, FlatList, ScrollView, Image } from 'react-native'
import TextSemiBold from '../../components/TextSemibold'
import TextRegular from '../../components/TextRegular'
import * as GlobalStyles from '../../styles/GlobalStyles'
import { getAllRestaurants, getRestaurantCategories } from '../../api/RestaurantEndpoints'
import { getPopularProducts } from '../../api/ProductEndpoints'
import { showMessage } from 'react-native-flash-message'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { API_BASE_URL } from '@env'
import restaurantLogo from '../../../assets/restaurantLogo.jpeg'
import productDefaultImage from '../../../assets/product.jpeg'

export default function RestaurantsScreen({ navigation, route }) {
  const [restaurants, setRestaurants] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [filteredRestaurants, setFilteredRestaurants] = useState({})
  const [popularProducts, setPopularProducts] = useState([])

  useEffect(() => {
    fetchRestaurants()
    fetchCategories()
    fetchPopularProducts()
  }, [route])

  useEffect(() => {
    if (selectedCategory) {
      const filtered = restaurants.filter(restaurant =>
        restaurant.restaurantCategoryId === selectedCategory.id)
      setFilteredRestaurants(filtered)
    } else {
      setFilteredRestaurants(restaurants)
    }
  }, [selectedCategory, restaurants])

  const fetchCategories = async () => {
    try {
      const fetchedCategories = await getRestaurantCategories()
      setCategories(fetchedCategories)
    } catch (error) {
      showMessage({
        message: `There was an error while retrieving categories. ${error}`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  const fetchPopularProducts = async () => {
    try {
      const fetchedPopularProducts = await getPopularProducts()
      setPopularProducts(fetchedPopularProducts)
    } catch (error) {
      showMessage({
        message: `There was an error while retrieving popular products. ${error}`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  const renderRestaurant = ({ item }) => {
    return (
      <Pressable
        style={styles.restaurantCard}
        onPress={() => {
          navigation.navigate('RestaurantDetailScreen', { id: item.id })
        }}
      >
        <Image
          style={styles.restaurantImage}
          source={item.logo ? { uri: API_BASE_URL + '/' + item.logo } : restaurantLogo}
        />
        <View style={styles.restaurantDetailsContainer}>
          <TextSemiBold style={styles.restaurantName}>{item.name}</TextSemiBold>
          <TextRegular style={styles.restaurantDescription} numberOfLines={2}>{item.description}</TextRegular>
          {item.averageServiceMinutes !== null &&
            <TextRegular style={styles.restaurantInfo}>
              Avg. service time: <TextSemiBold textStyle={{ color: GlobalStyles.brandPrimary }}>{item.averageServiceMinutes} min.</TextSemiBold>
            </TextRegular>
          }
          <TextRegular style={styles.restaurantInfo}>
            Shipping: <TextSemiBold textStyle={{ color: GlobalStyles.brandPrimary }}>{item.shippingCosts.toFixed(2)}€</TextSemiBold>
          </TextRegular>
        </View>
      </Pressable>
    )
  }

  const renderEmptyRestaurantsList = () => {
    return (
      <TextRegular textStyle={styles.emptyList}>
        No restaurants were retreived.
      </TextRegular>
    )
  }

  const fetchRestaurants = async () => {
    try {
      const fetchedRestaurants = await getAllRestaurants()
      setRestaurants(fetchedRestaurants)
      setFilteredRestaurants(fetchedRestaurants)
    } catch (error) {
      showMessage({
        message: `There was an error while retrieving restaurants. ${error} `,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  const renderCategoryItem = ({ item }) => {
    const getCategoryIcon = (categoryName) => {
      switch (categoryName) {
        case 'Spanish': return 'food-variant'
        case 'Pizza': return 'pizza'
        case 'Burger': return 'hamburger'
        case 'Healthy': return 'food-apple'
        case 'Asian': return 'noodles'
        case 'Others': return 'food-fork-drink'
        default: return 'food'
      }
    }

    return (
      <Pressable
        onPress={() => setSelectedCategory(selectedCategory?.id === item.id ? null : item)}
        style={[
          styles.categoryButton,
          selectedCategory?.id === item.id ? styles.selectedCategoryButton : {}
        ]}
      >
        <MaterialCommunityIcons
          name={getCategoryIcon(item.name)}
          size={24}
          color={selectedCategory?.id === item.id ? '#fff' : GlobalStyles.brandPrimary}
          style={styles.categoryIcon}
        />
        <TextRegular textStyle={[
          styles.categoryText,
          selectedCategory?.id === item.id ? styles.selectedCategoryText : {}
        ]}>
          {item.name}
        </TextRegular>
      </Pressable>
    )
  }

  const renderPopularProductItem = ({ item }) => {
    return (
      <Pressable
        style={styles.popularProductCard}
        onPress={() => {
          navigation.navigate('RestaurantDetailScreen', { id: item.restaurantId })
        }}
      >
        <Image
          style={styles.popularProductImage}
          source={item.image ? { uri: API_BASE_URL + '/' + item.image } : productDefaultImage}
        />
        <View style={styles.popularProductDetails}>
          <TextSemiBold numberOfLines={1} style={styles.popularProductName}>{item.name}</TextSemiBold>
          <TextRegular numberOfLines={1} style={styles.popularProductRestaurant}>{item.restaurant.name}</TextRegular>
        </View>
      </Pressable>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.listContainer}
        data={filteredRestaurants}
        renderItem={renderRestaurant}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={renderEmptyRestaurantsList}
        contentContainerStyle={styles.listContentContainer}
        ListHeaderComponent={() => (
          <>
            {popularProducts.length > 0 && (
              <View style={styles.popularProductsContainer}>
                <TextSemiBold style={styles.sectionTitle}>Popular Products</TextSemiBold>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.popularProductsList}
                >
                  {popularProducts.map(product => renderPopularProductItem({ item: product }))}
                </ScrollView>
              </View>
            )}
            <View style={styles.categoriesContainer}>
              <TextSemiBold style={styles.sectionTitle}>Categories</TextSemiBold>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesList}
              >
                <Pressable
                  onPress={() => setSelectedCategory(null)}
                  style={[
                    styles.categoryButton,
                    selectedCategory === null ? styles.selectedCategoryButton : {}
                  ]}
                >
                  <MaterialCommunityIcons
                    name="food-fork-drink"
                    size={24}
                    color={selectedCategory === null ? '#fff' : GlobalStyles.brandPrimary}
                    style={styles.categoryIcon}
                  />
                  <TextRegular textStyle={[
                    styles.categoryText,
                    selectedCategory === null ? styles.selectedCategoryText : {}
                  ]}>
                    All
                  </TextRegular>
                </Pressable>
                {categories.map(category => renderCategoryItem({ item: category }))}
              </ScrollView>
            </View>
            <TextSemiBold style={styles.sectionTitle}>Restaurants</TextSemiBold>
          </>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
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
