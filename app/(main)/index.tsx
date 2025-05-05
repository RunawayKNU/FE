import React from 'react'
import { View, ScrollView, Text, StyleSheet, Dimensions, Button } from 'react-native'
import { WebView } from 'react-native-webview'
import { useRouter } from 'expo-router'

const screenHeight = Dimensions.get('window').height

const ShelterScreen = () => {
  const router = useRouter()

  return (
    <View style={styles.container}>
      {/* 지도 */}
      <View style={styles.mapContainer}>
        <WebView
          source={{ uri: 'https://map.naver.com/' }} // 일단 이걸로
          style={{ flex: 1 }}
        />

        {/* 지도 테스트 버튼 - 지도 위에 절대 위치로 표시 */}
        <View style={{ position: 'absolute', top: 10, right: 10 }}>
          <Button
            title='네이버 맵 테스트'
            onPress={() => router.push('./NaverMapTest')}
          />
          <Button
              title='챗봇'
              onPress={() => router.push('./Chatbot')}
          />
        </View>
      </View>

      {/* 대피소 리스트 */}
      <ScrollView style={styles.listContainer}>
        {Array.from({ length: 10 }).map((_, index) => (
          <View
            key={index}
            style={styles.card}
          >
            <Text style={styles.name}>대피소 명</Text>
            <Text style={styles.addr}>상세 주소 상세 주소 상세 주소</Text>
            <View style={styles.footer}>
              <Text style={styles.type}>대피소 유형</Text>
              <Text style={styles.distance}>00.0KM</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    height: screenHeight * 0.4,
    position: 'relative',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 10,
    backgroundColor: '#f8f8f8',
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginVertical: 8,
    padding: 12,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  addr: {
    marginTop: 4,
    fontSize: 14,
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  type: {
    fontSize: 13,
    color: '#666',
  },
  distance: {
    fontSize: 13,
    fontWeight: 'bold',
  },
})

export default ShelterScreen
