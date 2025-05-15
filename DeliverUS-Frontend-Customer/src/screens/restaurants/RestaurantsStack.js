import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'
import RestaurantDetailScreen from './RestaurantDetailScreen'
import RestaurantsScreen from './RestaurantsScreen'
import ReviewsScreenCreate from './ReviewsScreenCreate'
import ReviewsScreen from './ReviewsScreen'
import ReviewsScreenEdit from './ReviewsScreenEdit'
const Stack = createNativeStackNavigator()

export default function RestaurantsStack () {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name='RestaurantsScreen'
        component={RestaurantsScreen}
        options={{
          title: 'Restaurants'
        }} />
      <Stack.Screen
        name='RestaurantDetailScreen'
        component={RestaurantDetailScreen}
        options={{
          title: 'Restaurant Detail'
        }} />
      <Stack.Screen
        name='ReviewsScreenCreate'
        component={ReviewsScreenCreate}
        options={{
          title: 'Create review'
        }} />
      <Stack.Screen
        name='ReviewsScreen'
        component={ReviewsScreen}
        options={{
          title: 'List reviews'
        }} />
      <Stack.Screen
        name='ReviewsScreenEdit'
        component={ReviewsScreenEdit}
        options={{
          title: 'Edit Reviews'
        }} />
    </Stack.Navigator>
  )
}
