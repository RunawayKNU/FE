import React from 'react'
import { View, Text, Button } from 'react-native'
import { NaverMapView } from '@mj-studio/react-native-naver-map';

import { useRouter } from 'expo-router'

function NaverMapTest(): React.JSX.Element{
  const router = useRouter()

  return (
    <View style={{ flex: 1 }}>
      {/* 간단한 헤더 */}
      <View style={{ padding: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Button
          title='뒤로'
          onPress={() => router.back()}
        />
        <Text>네이버 지도 API 테스트</Text>
        <Button
          title='대피소 추가'
          onPress={() => console.log('대피소 추가')}
        />
      </View>

      {/* 네이버 맵 */}
      <View style={{ height: 300 }}>
        <NaverMapView
          style={{ width: '100%', height: '100%' }}

        />
      </View>

      {/* 간단한 대피소 리스트 */}
      <View style={{ padding: 10 }}>
        <Text>주변 대피소 리스트</Text>
        <Button
          title='대피소 1: 시청역 대피소 (0.5km)'
          onPress={() => console.log('대피소 1 선택')}
        />
        <Button
          title='대피소 2: 서울역 대피소 (1.8km)'
          onPress={() => console.log('대피소 2 선택')}
        />
      </View>
    </View>
  )
}

export default NaverMapTest
