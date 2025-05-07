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
  Share,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import axios from 'axios'

import NaverMapComponent from '@/components/custom/NaverMapComponent'
import {XMLParser} from "fast-xml-parser";

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const MIN_MAP_HEIGHT = SCREEN_HEIGHT * 0.5 // 지도 최소 높이 (화면의 45%)
const MAX_MAP_HEIGHT = SCREEN_HEIGHT * 0.8 // 지도 최대 높이 (화면의 80%)

const API_KEY = process.env.EXPO_PUBLIC_SEOUL_API_KEY || 'YOUR_DEFAULT_API_KEY'

const MainScreen = () => {
  const router = useRouter()
  const scrollViewRef = useRef(null)

  // 애니메이션 값
  const panY = useRef(new Animated.Value(0)).current

  // 드래그 가능 여부와 스크롤 가능 여부
  const [isDragging, setIsDragging] = useState(false)
  const [isScrollEnabled, setIsScrollEnabled] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  const [showMosquitoInfo, setShowMosquitoInfo] = useState(false)
  const [showDustInfo, setShowDustInfo] = useState(false)
  const [showAedMarkers, setShowAedMarkers] = useState<boolean>(false)
  const [showColdMarkers, setShowColdMarkers] = useState<boolean>(false)
  const [showHotMarkers, setShowHotMarkers] = useState<boolean>(false)
  const [showEarthquakeMarkers, setShowEarthquakeMarkers] = useState<boolean>(false)
  const [showDustMarkers, setShowDustMarkers] = useState<boolean>(false)


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
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 3) && !isScrollEnabled
      },

      // 드래그 시작 시 호출되는 함수
      onPanResponderGrant: () => {
        setIsDragging(true)
        setIsScrollEnabled(true)
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
            setIsScrollEnabled(true) // 대피소 리스트가 축소된 상태에서는 스크롤 비활성화
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
            setIsScrollEnabled(true)
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

  const MY_IP = process.env.EXPO_PUBLIC_MY_IP || 'YOUR_DEFAULT_IP'

  // 원본 데이터와 필터링된 데이터를 분리하여 무한 루프 방지
  const [coldPlacesOriginal, setColdPlacesOriginal] = useState<any[]>([])
  const [hotPlacesOriginal, setHotPlacesOriginal] = useState<any[]>([])
  const [earthquakePlacesOriginal, setEarthquakePlacesOriginal] = useState<any[]>([])
  const [dustPlacesOriginal, setDustPlacesOriginal] = useState<any[]>([])

  const [coldfilterPlaces, setColdfilterPlaces] = useState<any[]>([])
  const [hotfilterPlaces, setHotfilterPlaces] = useState<any[]>([])
  const [earthquakefilterPlaces, setEarthquakefilterPlaces] = useState<any[]>([])
  const [dustfilterPlaces, setDustfilterPlaces] = useState<any[]>([])
  const [aedPlaces, setAedPlaces] = useState<any[]>([])
  // 상태 추가
  const [searchQuery, setSearchQuery] = useState<string>('')

  // 검색 함수 수정 - 두 가지 데이터 형식 모두 처리하도록 수정
  const filterPlaces = (places: any[], query: string): any[] => {
    if (!query.trim()) return places // 검색어가 없으면 전체 반환

    return places.filter((place) => {
      // fcltNm이 있으면 사용하고, 없으면 name을 사용
      const name = place.fcltNm || place.name || ''
      // addr이 있으면 사용하고, 없으면 address를 사용
      const address = place.addr || place.address || ''

      return (
        name.toLowerCase().includes(query.toLowerCase()) ||
        address.toLowerCase().includes(query.toLowerCase())
      )
    })
  }

  // 검색어 변경 시 필터링 적용
  useEffect(() => {
    // 원본 데이터에서 필터링
    setColdfilterPlaces(filterPlaces(coldPlacesOriginal, searchQuery))
    setHotfilterPlaces(filterPlaces(hotPlacesOriginal, searchQuery))
    setEarthquakefilterPlaces(filterPlaces(earthquakePlacesOriginal, searchQuery))
    setDustfilterPlaces(filterPlaces(dustPlacesOriginal, searchQuery))
  }, [
    searchQuery,
    coldPlacesOriginal,
    hotPlacesOriginal,
    earthquakePlacesOriginal,
    dustPlacesOriginal,
  ])

  // -- 데이터 가져오기 --
  // 한파대피소 데이터 가져오기
  useEffect(() => {
    const fetchColdPlaces = async () => {
      try {
        const response = await axios.get(`http://${MY_IP}:8080/api/coldplaces/all`)
        const parsedColdPlaces = response.data.map((item: any) => ({
          fcltNm: item.fcltNm || '', // API 응답의 필드 이름과 일치시킴
          addr: item.addr || '',
          latitude: item.latitude || 0,
          longitude: item.longitude || 0,
        }))
        setColdPlacesOriginal(parsedColdPlaces) // 원본 데이터 저장
        setColdfilterPlaces(parsedColdPlaces) // 초기 필터링된 데이터도 동일하게 설정
        console.log('index한파대피소 데이터 불러오기 성공')
      } catch (error) {
        console.error('한파대피소 데이터 불러오기 실패:', error)
      }
    }

    fetchColdPlaces()
  }, [])

  // 폭염대피소 데이터 가져오기
  useEffect(() => {
    const fetchHotPlaces = async () => {
      try {
        const response = await axios.get(`http://${MY_IP}:8080/api/hotplaces/all`)
        const parsedHotPlaces = response.data.map((item: any) => ({
          fcltNm: item.fcltNm || '',
          addr: item.addr || '',
          latitude: item.latitude || 0,
          longitude: item.longitude || 0,
        }))
        setHotPlacesOriginal(parsedHotPlaces)
        setHotfilterPlaces(parsedHotPlaces)
        console.log('index폭염대피소 데이터 불러오기 성공')
      } catch (error) {
        console.error('폭염대피소 데이터 불러오기 실패:', error)
      }
    }

    fetchHotPlaces()
  }, [])

  // 지진대피소 데이터 가져오기
  useEffect(() => {
    const fetchEarthquakePlaces = async () => {
      try {
        const response = await axios.get(`http://${MY_IP}:8080/api/earthquakeplaces/all`)
        const parsedEarthquakePlaces = response.data.map((item: any) => ({
          name: item.fcltNm || '',
          address: item.addr || '',
          latitude: item.latitude || 0, // Note: check for swapped lat/lng
          longitude: item.longitude || 0,
        }))
        setEarthquakefilterPlaces(parsedEarthquakePlaces)
        setEarthquakePlacesOriginal(parsedEarthquakePlaces) // 원본 데이터 저장
        console.log('index지진대피소 데이터 불러오기 성공')
      } catch (error) {
        console.error('지진진대피소 데이터 불러오기 실패:', error)
      }
    }

    fetchEarthquakePlaces()
  }, [])

  // 미세먼지대피소 데이터 가져오기
  useEffect(() => {
    const fetchDustPlaces = async () => {
      try {
        const response = await axios.get(`http://${MY_IP}:8080/api/dustplaces/all`)
        const parsedDustPlaces = response.data.map((item: any) => ({
          name: item.fcltNm || '',
          address: item.addr || '',
          latitude: item.latitude || 0, // Note: check for swapped lat/lng
          longitude: item.longitude || 0,
        }))
        setDustfilterPlaces(parsedDustPlaces)
        setDustPlacesOriginal(parsedDustPlaces) // 원본 데이터 저장
        console.log('index미세먼지대피소 데이터 불러오기 성공')
      } catch (error) {
        console.error('미세먼지대피소 데이터 불러오기 실패:', error)
      }
    }

    fetchDustPlaces()
  }, [])

  // Aed 데이터 가져오기
  useEffect(() => {
    const fetchAedPlaces = async () => {
      try {
        const response = await axios.get(`http://openapi.seoul.go.kr:8088/${API_KEY}/xml/tbEmgcAedInfo/1/1000/`)

        const parser = new XMLParser()
        const jsonObj = parser.parse(response.data)

        const rows = Array.isArray(jsonObj.tbEmgcAedInfo?.row)
            ? jsonObj.tbEmgcAedInfo.row
            : [jsonObj.tbEmgcAedInfo?.row]

        const parsedAedPlaces = rows.map((item: any) => ({
          name: item.BUILDPLACE || '',
          address: item.BUILDADDRESS || '',
          latitude: parseFloat(item.WGS84LAT || '0'),
          longitude: parseFloat(item.WGS84LON || '0'),
        }))
        setAedPlaces(parsedAedPlaces)
        console.log('index AED 데이터 불러오기 성공')
      } catch (error) {
        console.error('미세먼지대피소 데이터 불러오기 실패:', error)
      }
    }

    fetchAedPlaces()
  }, [])

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

  const [loadingMore, setLoadingMore] = useState(false)
  const [visibleItems, setVisibleItems] = useState(10) // 처음 보여줄 아이템 수

  // 스크롤 이벤트 핸들러 - 스크롤이 끝에 도달하면 더 많은 아이템 보여주기
  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent

    // 스크롤이 90% 이상 내려갔을 때 추가 로드 (더 일찍 트리거)
    const scrollPercentage = (layoutMeasurement.height + contentOffset.y) / contentSize.height

    if (scrollPercentage > 0.8 && !loadingMore) {
      loadMoreItems()
    }
  }

  // 더 많은 아이템 로딩 함수 개선
  const loadMoreItems = () => {
    // 현재 표시되는 아이템 수 확인
    const totalItems = (() => {
      let count = 0
      if (showColdMarkers) count += coldfilterPlaces.length
      if (showHotMarkers) count += hotfilterPlaces.length
      if (showEarthquakeMarkers) count += earthquakefilterPlaces.length
      if (showDustMarkers) count += dustfilterPlaces.length
      return count
    })()

    // 현재 보여지는 아이템 수가 총 아이템 수보다 작을 때만 로딩 시작
    if (visibleItems < totalItems) {
      setLoadingMore(true)

      console.log('로드 시작: visibleItems =', visibleItems, ', totalItems =', totalItems)

      // 로딩 효과를 위한 지연
      setTimeout(() => {
        setVisibleItems((prevVisibleItems) => prevVisibleItems + 10) // 한번에 10개씩 추가 로드
        setLoadingMore(false)
        console.log('로드 완료: 새 visibleItems =', visibleItems + 10)
      }, 300)
    } else {
      console.log('모든 아이템이 이미 로드됨:', visibleItems, '>=', totalItems)
    }
  }

  const API_KEY = process.env.EXPO_PUBLIC_SEOUL_API_KEY || 'YOUR_DEFAULT'
  const [mosquitoData, setMosquitoData] = useState<any>(null)
  const [airData, setAirData] = useState<any>(null)
  const fetchData = async () => {
    try {
      const today = new Date()
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
      const date = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate() - 1)}`

      const [mosquitoRes, airRes] = await Promise.all([
        axios.get(`http://openapi.seoul.go.kr:8088/${API_KEY}/json/MosquitoStatus/1/5/${date}`),
        axios.get(
          `http://openAPI.seoul.go.kr:8088/${API_KEY}/json/ListAvgOfSeoulAirQualityService/1/1/`
        ),
      ])

      setMosquitoData(mosquitoRes.data?.MosquitoStatus?.row[0])
      setAirData(airRes.data?.ListAvgOfSeoulAirQualityService?.row[0])
    } catch (error) {
      console.error('API 호출 실패:', error)
    } finally {
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

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
          showDustMarkers={showDustMarkers}
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
              style={{
                width: 35,
                height: 35,
                tintColor:
                  airData?.PM25 <= 35 ? '#0277BD' : airData?.PM25 <= 75 ? '#EF6C00' : '#C62827',
              }}
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
              style={{
                width: 35,
                height: 35,
                tintColor:
                  mosquitoData?.MOSQUITO_VALUE_WATER <= 30
                    ? '#0277BD'
                    : mosquitoData?.MOSQUITO_VALUE_WATER <= 65
                    ? '#EF6C00'
                    : '#C62827',
              }}
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
                  setVisibleItems(10) // 초기 아이템 수로 리셋
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
              <TouchableOpacity
                style={{ alignItems: 'center' }}
                onPress={() => {
                  setShowDustMarkers((prev: boolean) => !prev)
                  setVisibleItems(10) // 초기 아이템 수로 리셋
                  console.log('setShowDustMarkers Clicked: ', showDustMarkers)
                }}
              >
                <Text style={{ fontSize: 20, opacity: showDustMarkers ? 1 : 0.4 }}>🌫️</Text>
                <Text>미세먼지</Text>
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity
                style={{ alignItems: 'center' }}
                onPress={() => {
                  setShowColdMarkers((prev: boolean) => !prev)
                  setVisibleItems(10) // 초기 아이템 수로 리셋
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
                  setVisibleItems(10) // 초기 아이템 수로 리셋
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
          onStartShouldSetResponder={() => false}
          onScroll={handleScroll} // 스크롤 이벤트 핸들러 추가
          scrollEventThrottle={400} // 스크롤 이벤트 호출 빈도 조절
        >
          {/* 한파 대피소 */}
          {showColdMarkers &&
            coldfilterPlaces.slice(0, visibleItems).map((shelter, index) => (
              <TouchableOpacity
                key={`cold-${index}`}
                style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#4285F4' }]}
                activeOpacity={0.7}
                onPress={() => console.log(`${shelter.fcltNm} 선택됨`)}
              >
                <Text style={styles.name}>{shelter.fcltNm}</Text>
                <Text style={styles.addr}>{shelter.addr}</Text>
                <View style={styles.footer}>
                  <Text style={[styles.type, { backgroundColor: '#E3F2FD' }]}>한파 대피소</Text>
                  <Text style={styles.distance}>{shelter.distance || `${(Math.random() * (15 - 5) + 5).toFixed(1)} km`}</Text>
                </View>
              </TouchableOpacity>
            ))}

          {/* 폭염 대피소 */}
          {showHotMarkers &&
            hotfilterPlaces.slice(0, visibleItems).map((shelter, index) => (
              <TouchableOpacity
                key={`hot-${index}`}
                style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#EA4335' }]} // 빨간색 테두리로 폭염 대피소 구분
                activeOpacity={0.7}
                onPress={() => console.log(`${shelter.fcltNm} 선택됨`)}
              >
                <Text style={styles.name}>{shelter.fcltNm}</Text>
                <Text style={styles.addr}>{shelter.addr}</Text>
                <View style={styles.footer}>
                  <Text style={[styles.type, { backgroundColor: '#FFEBEE' }]}>폭염 대피소</Text>
                  <Text style={styles.distance}>{shelter.distance || `${(Math.random() * (15 - 5) + 5).toFixed(1)} km`}</Text>
                </View>
              </TouchableOpacity>
            ))}

          {/* 지진 대피소 */}
          {showEarthquakeMarkers &&
            earthquakefilterPlaces.slice(0, visibleItems).map((shelter, index) => (
              <TouchableOpacity
                key={`earthquake-${index}`}
                style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#FBBC05' }]} // 노란색 테두리로 지진 대피소 구분
                activeOpacity={0.7}
                onPress={() => console.log(`${shelter.name} 선택됨`)}
              >
                <Text style={styles.name}>{shelter.name}</Text>
                <Text style={styles.addr}>{shelter.address}</Text>
                <View style={styles.footer}>
                  <Text style={[styles.type, { backgroundColor: '#FFF9C4' }]}>지진 대피소</Text>
                  <Text style={styles.distance}>{shelter.distance || `${(Math.random() * (15 - 5) + 5).toFixed(1)} km`}</Text>
                </View>
              </TouchableOpacity>
            ))}

          {/* 미세먼지 대피소 */}
          {showDustMarkers &&
            dustfilterPlaces.slice(0, visibleItems).map((shelter, index) => (
              <TouchableOpacity
                key={`dust-${index}`}
                style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#34A853' }]} // 초록색 테두리로 미세먼지 대피소 구분
                activeOpacity={0.7}
                onPress={() => console.log(`${shelter.name} 선택됨`)}
              >
                <Text style={styles.name}>{shelter.name}</Text>
                <Text style={styles.addr}>{shelter.address}</Text>
                <View style={styles.footer}>
                  <Text style={[styles.type, { backgroundColor: '#E8F5E9' }]}>미세먼지 대피소</Text>
                  <Text style={styles.distance}>{shelter.distance || `${(Math.random() * (15 - 5) + 5).toFixed(1)} km`}</Text>
                </View>
              </TouchableOpacity>
            ))}

          {/* AED 위치 표시 */}
          {showAedMarkers &&
              aedPlaces.slice(0, visibleItems).map((shelter, index) => (
                  <TouchableOpacity
                      key={`aed-${index}`}
                      style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#F4B400' }]} // 노란색 테두리로 AED 구분
                      activeOpacity={0.7}
                      onPress={() => console.log(`${shelter.name} 선택됨`)}
                  >
                    <Text style={styles.name}>{shelter.name}</Text>
                    <Text style={styles.addr}>{shelter.address}</Text>
                    <View style={styles.footer}>
                      <Text style={[styles.type, { backgroundColor: '#FFF8E1' }]}>AED</Text>
                      <Text style={styles.distance}>
                        {`${(Math.random() * (15 - 5) + 5).toFixed(1)} km`}
                      </Text>
                    </View>
                  </TouchableOpacity>
              ))}

          {/* 데이터가 없을 경우 메시지 표시 */}
          {!showColdMarkers && !showHotMarkers && !showEarthquakeMarkers && !showDustMarkers && !showAedMarkers && (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>대피소 유형을 선택해주세요</Text>
            </View>
          )}

          {/* 필터링된 대피소가 없을 경우 메시지 표시 */}
          {(showColdMarkers || showHotMarkers || showEarthquakeMarkers || showDustMarkers) &&
            coldfilterPlaces.length === 0 &&
            hotfilterPlaces.length === 0 &&
            earthquakefilterPlaces.length === 0 &&
            dustfilterPlaces.length === 0 && (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>검색 결과가 없습니다</Text>
              </View>
            )}

          {/* 로딩 인디케이터 */}
          {loadingMore && (
            <View style={{ padding: 10, alignItems: 'center' }}>
              <ActivityIndicator
                size='small'
                color='#4a89f3'
              />
              <Text style={{ marginTop: 5, color: '#888' }}>더 불러오는 중...</Text>
            </View>
          )}

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
    //동그랗게
    borderRadius: 50,

    // 그림자 효과
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 10 }, // 그림자를 아래로 이동
    shadowOpacity: 0.3,
    shadowRadius: 6, // 그림자 퍼짐 정도 조정
    elevation: 5,

    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    width: 45,
    height: 45,
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
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noDataText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
})

// export default를 추가하여 기본 내보내기 오류 해결
export default MainScreen
