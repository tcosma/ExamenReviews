import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import React, { useContext, useEffect } from 'react'
import * as GlobalStyles from '../styles/GlobalStyles'
import RestaurantsStack from './restaurants/RestaurantsStack'
import ProfileStack from './profile/ProfileStack'
import OrdersStack from './orders/OrdersStack'

// eslint-disable-next-line camelcase
import { useFonts, Montserrat_400Regular, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat'
import FlashMessage from 'react-native-flash-message'
import { AuthorizationContext } from '../context/AuthorizationContext'
import { AppContext } from '../context/AppContext'
import { ApiError } from '../api/helpers/Errors'

const Tab = createBottomTabNavigator()

export default function Layout() {
  const { getToken, loggedInUser: loggedInUserState } = useContext(AuthorizationContext)
  const { setLoggedInUser } = useContext(AppContext)

  const [fontsLoaded] = useFonts({
    // eslint-disable-next-line camelcase
    Montserrat_400Regular,
    // eslint-disable-next-line camelcase
    Montserrat_600SemiBold
  })

  useEffect(() => {
    if (fontsLoaded) {
      checkLogin()
    }
  }, [fontsLoaded])

  const checkLogin = async () => {
    try {
      const token = await getToken()
      if (token) {
        setLoggedInUser(true)
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setLoggedInUser(false)
      }
    }
  }

  return (
    <>
      {fontsLoaded &&
        <NavigationContainer theme={GlobalStyles.navigationTheme}>

          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ color, size }) => {
                let iconName
                if (route.name === 'Restaurants') {
                  iconName = 'silverware-fork-knife'
                } else if (route.name === 'My orders') {
                  iconName = 'format-list-text'
                } else if (route.name === 'Profile') {
                  iconName = 'account-circle'
                }
                return <MaterialCommunityIcons name={iconName} color={color} size={size} />
              },
              headerShown: false,
              tabBarStyle: ((route) => {
                const routeName = getFocusedRouteNameFromRoute(route) ?? ''
                const hideOnScreens = ['RestaurantDetailScreen', 'OrderDetailScreen', 'OrderDetailEditScreen']
                if (hideOnScreens.includes(routeName)) {
                  return { display: 'none' }
                }
                return {
                  height: 60,
                  paddingBottom: 8,
                  paddingTop: 8,
                  backgroundColor: '#ffffff',
                  position: 'absolute',
                  left: 7,
                  right: 7,
                  bottom: 7,
                  borderTopColor: 'transparent',
                  borderRadius: 22,
                  marginBottom: 0,
                  elevation: 8,
                  shadowColor: '#000',
                  shadowOffset: {
                    width: 0,
                    height: 0
                  },
                  shadowOpacity: 0.3,
                  shadowRadius: 10
                }
              })(route),
              tabBarActiveTintColor: GlobalStyles.brandPrimary,
              tabBarInactiveTintColor: '#999999',
              tabBarLabelStyle: {
                fontSize: 12,
                fontFamily: 'Montserrat_400Regular'
              }
            })}>
            <Tab.Screen
              name='Restaurants'
              component={RestaurantsStack}
              listeners={({ navigation, route }) => ({
                tabPress: e => {
                  // Prevent default action
                  e.preventDefault()
                  // Navigate to the top screen of the stack
                  navigation.navigate('Restaurants', { screen: 'RestaurantsScreen' })
                }
              })}
            />
            {loggedInUserState && <Tab.Screen
              name='My orders'
              component={OrdersStack} />}
            <Tab.Screen
              name='Profile'
              component={ProfileStack} />
          </Tab.Navigator>
          <FlashMessage position="top" />

        </NavigationContainer>
      }
    </>
  )
}
