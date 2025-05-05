import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import LoadingIndicator from '@/components/custom/LodingIndicator'

const LoadingScreen = () => {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('./index') // 3초 후 메인 페이지로 이동
    }, 3000)

    return () => clearTimeout(timer) // 타이머 정리
  }, [router])

  return (
    <View style={styles.container}>
      <View>로딩화면</View>
      <LoadingIndicator />
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

export default LoadingScreen
