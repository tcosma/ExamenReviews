import React from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import TextSemiBold from './TextSemibold'
import * as GlobalStyles from '../styles/GlobalStyles'
import TextRegular from './TextRegular'
export default function DeleteModal (props) {
  return (
    <Modal
    presentationStyle='overFullScreen'
    animationType='slide'
    transparent={true}
    visible={props.isVisible}
    onRequestClose={props.onCancel}>
    <View style={styles.centeredView}>
      <View style={styles.modalView}>
        <TextRegular textStyle={styles.messageText}>Are you sure you want to delete the order?</TextRegular>

        <View style={styles.buttonsContainer}>
          <Pressable
            onPress={props.onCancel}
            style={({ pressed }) => [
              {
                backgroundColor: pressed
                  ? GlobalStyles.brandBlueTap
                  : GlobalStyles.brandBlue
              },
              styles.actionButton,
              styles.cancelButton
            ]}>
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons name='close' color={'white'} size={20}/>
              <TextRegular textStyle={styles.text}>
                Cancel
              </TextRegular>
            </View>
          </Pressable>

          <Pressable
          onPress={props.onConfirm}
          style={({ pressed }) => [
            {
              backgroundColor: pressed
                ? GlobalStyles.brandPrimaryTap
                : GlobalStyles.brandPrimary
            },
            styles.actionButton,
            styles.deleteButton
          ]}>
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons name='delete' color={'white'} size={20}/>
              <TextRegular textStyle={styles.text}>
                Delete
              </TextRegular>
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
  )
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.75,
    shadowRadius: 4,
    elevation: 5,
    width: '90%'
  },
  messageText: {
    marginBottom: 25,
    fontSize: 16,
    textAlign: 'center'
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%'
  },
  actionButton: {
    borderRadius: 8,
    height: 40,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cancelButton: {
    // Specific styles for cancel button if needed
  },
  deleteButton: {
    // Specific styles for delete button if needed
  },
  text: {
    fontSize: 16,
    color: 'white',
    marginLeft: 5
  }
})
