import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'
import OrdersScreen from './OrdersScreen'
import OrderDetailScreen from './OrderDetailScreen'
import OrderDetailEditScreen from './OrderDetailEditScreen'
const Stack = createNativeStackNavigator()

export default function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name='OrdersScreen'
        component={OrdersScreen}
        options={{
          title: 'My Orders'
        }} />
      <Stack.Screen
        name='OrderDetailScreen'
        component={OrderDetailScreen}
        options={{
          title: 'Order Detail'
        }} />

      <Stack.Screen
        name='OrderDetailEditScreen'
        component={OrderDetailEditScreen}
        options={{
          title: 'Edit Order'
        }} />
    </Stack.Navigator>
  )
}
