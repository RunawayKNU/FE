import React from 'react'
import { ActivityIndicator, View, StyleSheet, Image } from 'react-native'

const LoadingIndicator = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/Logo.png')}
        style={{ width: 100, height: 100, marginBottom: 20 }}
        resizeMode='contain'
      />
      <ActivityIndicator
        size='large'
        color='#0000ff'
      />
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
})

export default LoadingIndicator
