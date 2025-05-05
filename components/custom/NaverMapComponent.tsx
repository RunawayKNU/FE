import React from 'react'
import { View, StyleSheet } from 'react-native'
import { NaverMapView } from '@mj-studio/react-native-naver-map'

interface NaverMapComponentProps {
  style?: any
  initialLocation?: {
    latitude: number
    longitude: number
    zoom: number
  }
}
// latitude : 위도, longitude : 경도
// https://medium.com/mj-studio/%EB%A6%AC%EC%95%A1%ED%8A%B8-%EB%84%A4%EC%9D%B4%ED%8A%B8%EB%B8%8C%EB%A1%9C-%EB%84%A4%EC%9D%B4%EB%B2%84-%EC%A7%80%EB%8F%84-%EA%B5%AC%ED%98%84%ED%95%98%EA%B8%B0-2-%EC%B9%B4%EB%A9%94%EB%9D%BC-%EC%9C%84%EC%B9%98-%EC%9D%B4%EB%8F%99%ED%95%98%EA%B8%B0-ea39843b31d2
const NaverMapComponent: React.FC<NaverMapComponentProps> = ({ style, initialLocation = { latitude: 37.571203, longitude: 126.978974, zoom: 15 } }) => {
  return (
    <View style={[styles.container, style]}>
      <NaverMapView
        style={styles.map}
        initialCamera={{
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
          zoom: initialLocation.zoom,
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
})

export default NaverMapComponent
