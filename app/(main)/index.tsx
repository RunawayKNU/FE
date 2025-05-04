import React from 'react'
import { View, Text, StyleSheet, Button } from 'react-native'
import { useRouter } from 'expo-router'

const MainPage = () => {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <Text style={styles.text}>도망가보자고</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 20,
  },
})

export default MainPage
