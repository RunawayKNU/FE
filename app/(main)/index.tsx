import React, { useRef, useState, useEffect } from 'react'
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Dimensions,
  Button,
  PanResponder,
  Animated,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native'
import { useRouter } from 'expo-router'

import NaverMapComponent from '@/components/custom/NaverMapComponent'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const MIN_MAP_HEIGHT = SCREEN_HEIGHT * 0.5 // 지도 최소 높이 (화면의 45%)
const MAX_MAP_HEIGHT = SCREEN_HEIGHT * 0.8 // 지도 최대 높이 (화면의 80%)

const MainScreen = () => {
  const router = useRouter()
  const scrollViewRef = useRef(null)

  // 애니메이션 값
  const panY = useRef(new Animated.Value(0)).current

  // 드래그 가능 여부와 스크롤 가능 여부
  const [isDragging, setIsDragging] = useState(false)
  const [isScrollEnabled, setIsScrollEnabled] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')

  const [showMosquitoInfo, setShowMosquitoInfo] = useState(false)
  const [showDustInfo, setShowDustInfo] = useState(false)
  const [showAedMarkers, setShowAedMarkers] = useState<boolean>(false)
  const [showColdMarkers, setShowColdMarkers] = useState<boolean>(false)
  const [showHotMarkers, setShowHotMarkers] = useState<boolean>(false)
  const [showEarthquakeMarkers, setShowEarthquakeMarkers] = useState<boolean>(false)
  const handleMosquitoButtonPress = () => {
    setShowMosquitoInfo(true) // 모기 지수 표시
    setTimeout(() => {
      setShowMosquitoInfo(false) // 5초 후 숨기기
    }, 5000)
  }
  const handleDustButtonPress = () => {
    setShowDustInfo(true) // 미세먼지 지수 표시
    setTimeout(() => {
      setShowDustInfo(false) // 5초 후 숨기기
    }, 5000)
  }

  type Shelter = {
    name: string
    address: string
    type: string
    distance: string
  }
  const [filteredShelters, setFilteredShelters] = useState<Shelter[]>([])

  // 맵 높이 애니메이션 값
  const mapHeight = panY.interpolate({
    inputRange: [0, MAX_MAP_HEIGHT - MIN_MAP_HEIGHT],
    outputRange: [MIN_MAP_HEIGHT, MAX_MAP_HEIGHT],
    extrapolate: 'clamp',
  })

  // PanResponder 설정
  const panResponder = useRef(
    PanResponder.create({
      // 터치 시작 시 패널 제어권 가져오기 (드래그만 감지)

      onMoveShouldSetPanResponder: (_, gestureState) => {
        // 수직 드래그만 감지
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 3)
      },

      // 드래그 시작 시 호출되는 함수
      onPanResponderGrant: () => {
        setIsDragging(true)
        setIsScrollEnabled(false)
      },

      // 드래그 중 호출되는 함수 - 드래그 방향에 따라 값을 조정
      onPanResponderMove: (_, gestureState) => {
        const newValue = isExpanded
          ? MAX_MAP_HEIGHT - MIN_MAP_HEIGHT + gestureState.dy
          : gestureState.dy

        // 올바른 방향으로 움직임 제한
        if (newValue >= 0 && newValue <= MAX_MAP_HEIGHT - MIN_MAP_HEIGHT) {
          panY.setValue(newValue)
        }
      },

      // 드래그 종료 시 호출되는 함수
      onPanResponderRelease: (_, gestureState) => {
        setIsDragging(false)

        // 절반 이상 드래그 했으면 펼치거나 접기
        const threshold = (MAX_MAP_HEIGHT - MIN_MAP_HEIGHT) / 3 // 스냅 임계값 조정
        const maxValue = MAX_MAP_HEIGHT - MIN_MAP_HEIGHT

        // 아래로 드래그한 경우 (양수 dy)
        if (gestureState.dy > threshold && !isExpanded) {
          // 대피소 리스트를 내려야 함
          Animated.spring(panY, {
            toValue: maxValue,
            tension: 50,
            friction: 10,
            useNativeDriver: false,
          }).start(() => {
            setIsExpanded(true)
            setIsScrollEnabled(false) // 대피소 리스트가 축소된 상태에서는 스크롤 비활성화
          })
        }
        // 위로 드래그한 경우 (음수 dy)
        else if (gestureState.dy < -threshold && isExpanded) {
          // 대피소 리스트를 올려야 함
          Animated.timing(panY, {
            toValue: 0,
            duration: 700, // 더 긴 시간 (700ms)
            useNativeDriver: false,
          }).start(() => {
            setIsExpanded(false)
            setIsScrollEnabled(true)
          })
        }
        // 작게 드래그한 경우 원래 상태로 돌아가기
        else {
          const finalValue = isExpanded ? maxValue : 0
          Animated.spring(panY, {
            toValue: finalValue,
            tension: 50,
            friction: 10,
            useNativeDriver: false,
          }).start(() => {
            setIsScrollEnabled(!isExpanded)
          })
        }
      },
    })
  ).current

  // 탭 핸들러
  const handleTap = () => {
    if (isExpanded) {
      Animated.timing(panY, {
        toValue: 0,
        duration: 700, // 천천히 올라오는 애니메이션
        useNativeDriver: false,
      }).start(() => {
        setIsExpanded(false)
        setIsScrollEnabled(true)
      })
    }
  }

  // 컴포넌트 마운트 시 초기 상태 설정
  useEffect(() => {
    panY.setValue(0)
  }, [])

  // isExpanded 상태 변화 감지
  useEffect(() => {
    if (isExpanded) {
      // 강제로 올바른 위치 설정
      panY.setValue(MAX_MAP_HEIGHT - MIN_MAP_HEIGHT)
    } else {
      // 강제로 올바른 위치 설정
      panY.setValue(0)
    }
  }, [isExpanded])

  useEffect(() => {
    const allShelters = Array.from({ length: 15 }).map((_, index) => ({
      name: `대피소 ${index + 1}`,
      address: `서울시 OO구 OO동 123-${index}`,
      type: index % 2 === 0 ? '민방위 대피소' : '지진 대피소',
      distance: `${(index * 0.3 + 0.2).toFixed(1)}km`,
    }))

    const filtered = allShelters.filter(
      (shelter) => shelter.name.includes(searchQuery) || shelter.address.includes(searchQuery)
    )

    setFilteredShelters(filtered)
  }, [searchQuery])

  return (
    <View style={styles.container}>
      {/* 지도 애니메이션 */}
      {/* 지도 컨테이너 - 애니메이션 적용 */}
      <Animated.View style={[styles.mapContainer, { height: mapHeight }]}>
        <NaverMapComponent
          style={{ flex: 1 }}
          showMosquitoInfo={showMosquitoInfo}
          showAedMarkers={showAedMarkers}
          showColdMarkers={showColdMarkers}
          showHotMarkers={showHotMarkers}
          showEarthquakeMarkers={showEarthquakeMarkers}
          showDustInfo={showDustInfo}
        />

        <View style={styles.statusBar}>
          {/* 미세먼지 */}

          <TouchableOpacity
            style={styles.statusButtons}
            onPress={() =>
              showDustInfo // 이미 보이고 있으면 숨기기
                ? setShowDustInfo(false)
                : handleDustButtonPress()
            }
          >
            <Image
              source={require('@/assets/images/dustIcon.png')}
              style={{ width: 35, height: 35 }}
            />
          </TouchableOpacity>

          {/* 모기지수 */}

          <TouchableOpacity
            style={styles.statusButtons}
            onPress={() =>
              showMosquitoInfo // 이미 보이고 있으면 숨기기
                ? setShowMosquitoInfo(false)
                : handleMosquitoButtonPress()
            }
          >
            <Image
              source={require('@/assets/images/mosquitosIcon.png')}
              style={{ width: 35, height: 35 }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statusButtons}
            onPress={() => router.push('./Chatbot')}
          >
            <Image
              source={require('@/assets/images/chatIcon.png')}
              style={{ width: 35, height: 35 }}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.statusButtons, { position: 'absolute', bottom: 100, right: '3%' }]}
          onPress={() => router.push('./Details')}
        >
          <Image
            source={require('@/assets/images/detailIcon.png')}
            style={{ width: 35, height: 35 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statusButtons, { position: 'absolute', bottom: 45, right: '3%' }]}
          onPress={() => router.push('./EmergencyMessages')}
        >
          <Image
            source={require('@/assets/images/emergencyIcon.png')}
            style={{ width: 35, height: 35 }}
          />
        </TouchableOpacity>

        {/* 지도 테스트 버튼 - 지도 위에 절대 위치로 표시 */}
      </Animated.View>

      {/* 대피소 리스트 컨테이너 */}
      <View style={styles.listOuterContainer}>
        {/* 드래그 핸들 영역 */}
        <View
          {...panResponder.panHandlers}
          style={styles.dragHandle}
          onStartShouldSetResponder={() => true} // 터치 이벤트 감지
          onResponderRelease={handleTap} // 터치 시 애니메이션 실행
        >
          <View style={styles.dragIndicator} />
          <Text style={styles.listTitle}>주변 대피소</Text>
        </View>

        {/* 검색창 및 카테고리 버튼 */}
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 10 }}>
          {/* 검색 바 */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 10,
              paddingHorizontal: 10,
              marginBottom: 10,
              height: 40,
            }}
          >
            <Text style={{ fontSize: 16, color: '#888' }}>🔍</Text>
            <TextInput
              placeholder='검색어를 입력하세요'
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                flex: 1,
                fontSize: 16,
                color: '#000',
              }}
            />
          </View>

          {/* 카테고리 버튼 */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity
                style={{ alignItems: 'center' }}
                onPress={() => {
                  setShowEarthquakeMarkers((prev: boolean) => !prev)
                  console.log('setShowEarthquakeMarkers Clicked: ', showEarthquakeMarkers)
                }}
              >
                <Text style={{ fontSize: 20, opacity: showEarthquakeMarkers ? 1 : 0.4 }}>🏠</Text>
                <Text>지진</Text>
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity
                style={{ alignItems: 'center' }}
                onPress={() => setShowAedMarkers((prev: boolean) => !prev)}
              >
                <Text style={{ fontSize: 20, opacity: showAedMarkers ? 1 : 0.4 }}>❤️</Text>
                <Text>AED</Text>
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24 }}>🌫️</Text>
              <Text>미세먼지</Text>
            </View>

            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity
                style={{ alignItems: 'center' }}
                onPress={() => {
                  setShowColdMarkers((prev: boolean) => !prev)
                  console.log('setShowColdMarkers Clicked: ', showColdMarkers)
                }}
              >
                <Text style={{ fontSize: 20, opacity: showColdMarkers ? 1 : 0.4 }}>❄️</Text>
                <Text>한파</Text>
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity
                style={{ alignItems: 'center' }}
                onPress={() => {
                  setShowHotMarkers((prev: boolean) => !prev)
                  console.log('setShowHotMarkers Clicked: ', showHotMarkers)
                }}
              >
                <Text style={{ fontSize: 20, opacity: showHotMarkers ? 1 : 0.4 }}>☀️</Text>
                <Text>무더위</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 대피소 리스트 스크롤뷰 */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.listContainer}
          scrollEnabled={isScrollEnabled}
          showsVerticalScrollIndicator={true}
        >
          {filteredShelters.map((shelter, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => console.log(`${shelter.name} 선택됨`)}
            >
              <Text style={styles.name}>{shelter.name}</Text>
              <Text style={styles.addr}>{shelter.address}</Text>
              <View style={styles.footer}>
                <Text style={styles.type}>{shelter.type}</Text>
                <Text style={styles.distance}>{shelter.distance}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {/* 스크롤을 위한 여분의 공간 */}
          <View style={{ height: 50 }} />
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  mapContainer: {
    width: '100%',
    position: 'relative',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',

    top: 10,
    // 화면 절반 오른쪽
    left: '57%',
    width: '30%',
  },
  statusButtons: {
    backgroundColor: 'white',
    borderRadius: 100,
    borderColor: '#ccc',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    width: 45,
    height: 45,
  },
  buttonContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRadius: 8,
    padding: 4,
  },
  listOuterContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20, // 지도와 겹치게 하여 둥근 모서리 효과 생성
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dragHandle: {
    height: 50,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    // 확실한 인식을 위한 z-index 높이기
    zIndex: 10,
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 5,
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 10,
    backgroundColor: '#f8f8f8',
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginVertical: 8,
    padding: 15,
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
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  type: {
    fontSize: 13,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  distance: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4a89f3',
  },
})

// export default를 추가하여 기본 내보내기 오류 해결
export default MainScreen
