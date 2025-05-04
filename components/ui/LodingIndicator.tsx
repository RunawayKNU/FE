import React from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'

const LoadingIndicator = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator
        size='large'
        color='#0000ff'
      />
      로딩화면
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
