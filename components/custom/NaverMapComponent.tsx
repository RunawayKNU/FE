import React, { useEffect, useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native'
import { NaverMapView, NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map'
import axios from 'axios'
import { Share, Linking } from 'react-native'
import { XMLParser } from 'fast-xml-parser'

interface MosquitoStatusData {
  MOSQUITO_DATE: string
  MOSQUITO_VALUE_WATER: string
  MOSQUITO_VALUE_HOUSE: string
  MOSQUITO_VALUE_PARK: string
}

interface AirQualityData {
  GRADE: string
  PM10: string
  PM25: string
}

interface NaverMapComponentProps {
  style?: any
  initialLocation?: {
    latitude: number
    longitude: number
    zoom: number
  }
  showAedMarkers?: boolean
  showColdMarkers?: boolean
  showMosquitoInfo?: boolean
  showHotMarkers?: boolean
  showEarthquakeMarkers?: boolean
  showDustInfo?: boolean
  showDustMarkers?: boolean
}

interface AedInfo {
  name: string
  address: string
  latitude: number
  longitude: number
}

interface ColdInfo {
  name: string
  address: string
  latitude: number
  longitude: number
}

interface HotInfo {
  name: string
  address: string
  latitude: number
  longitude: number
}

interface EarthquakeInfo {
  name: string
  address: string
  latitude: number
  longitude: number
}

interface DustInfo {
  name: string
  address: string
  latitude: number
  longitude: number
}
const NaverMapComponent: React.FC<NaverMapComponentProps> = ({
  style,
  initialLocation = {
    // 기본 멋쟁이사자처럼 본사 광화문 좌표
    latitude: 37.571203,
    longitude: 126.978974,
    zoom: 15,
  },
  showMosquitoInfo = true,
  showDustInfo = true,

  showAedMarkers = false,
  showColdMarkers = false,
  showHotMarkers = false,
  showEarthquakeMarkers = false,
  showDustMarkers = false,
}) => {
  const [aedData, setAedData] = useState<AedInfo[]>([])
  const [coldPlaces, setColdPlaces] = useState<ColdInfo[]>([])
  const [hotPlaces, setHotPlaces] = useState<HotInfo[]>([])
  const [earthquakePlaces, setEarthquakePlaces] = useState<EarthquakeInfo[]>([])
  const [dustPlaces, setDustPlaces] = useState<DustInfo[]>([])

  const [visibleAedMarkers, setVisibleAedMarkers] = useState<AedInfo[]>([])
  const [visibleColdMarkers, setVisibleColdMarkers] = useState<ColdInfo[]>([])
  const [visibleHotMarkers, setVisibleHotMarkers] = useState<HotInfo[]>([])
  const [visibleEarthquakeMarkers, setVisibleEarthquakeMarkers] = useState<EarthquakeInfo[]>([])
  const [visibleDustMarkers, setVisibleDustMarkers] = useState<DustInfo[]>([])

  const [mosquitoData, setMosquitoData] = useState<MosquitoStatusData | null>(null)
  const [airData, setAirData] = useState<AirQualityData | null>(null)
  const [loading, setLoading] = useState(true)

  const API_KEY = process.env.EXPO_PUBLIC_SEOUL_API_KEY || 'YOUR_DEFAULT_API_KEY'
  const MY_IP = process.env.EXPO_PUBLIC_MY_IP || 'YOUR_DEFAULT_IP'

  const fetchData = async () => {
    setLoading(true)
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
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getAirQualityColor = (grade: string | undefined) => {
    switch (grade) {
      case '좋음':
        return '#4caf50'
      case '보통':
        return '#2196f3'
      case '나쁨':
        return '#ff9800'
      case '매우나쁨':
        return '#f44336'
      default:
        return '#9e9e9e'
    }
  }

  // AED 데이터 가져오기
  useEffect(() => {
    const fetchAedData = async () => {
      try {
        const response = await axios.get(
          `http://openapi.seoul.go.kr:8088/${API_KEY}/xml/tbEmgcAedInfo/1/1000/`
        )
        const parser = new XMLParser()
        const jsonObj = parser.parse(response.data)

        if (!jsonObj.tbEmgcAedInfo || !jsonObj.tbEmgcAedInfo.row) {
          console.error('AED 데이터가 없습니다.')
          return
        }

        const rows = Array.isArray(jsonObj.tbEmgcAedInfo.row)
          ? jsonObj.tbEmgcAedInfo.row
          : [jsonObj.tbEmgcAedInfo.row]
        const parsedData = rows.map((row: any) => ({
          name: row.BUILDPLACE || '',
          address: row.BUILDADDRESS || '',
          latitude: parseFloat(row.WGS84LAT || '0'),
          longitude: parseFloat(row.WGS84LON || '0'),
        }))

        setAedData(parsedData)
      } catch (error) {
        console.error('AED 데이터 불러오기 실패:', error)
      }
    }

    fetchAedData()
  }, [])

  // 한파대피소 데이터 가져오기
  useEffect(() => {
    const fetchColdPlaces = async () => {
      try {
        const response = await axios.get(`http://${MY_IP}:8080/api/coldplaces/all`)
        const parsedColdPlaces = response.data.map((item: any) => ({
          name: item.fcltNm || '',
          address: item.addr || '',
          latitude: item.latitude || 0, // Note: check for swapped lat/lng
          longitude: item.longitude || 0,
        }))
        setColdPlaces(parsedColdPlaces)
        console.log('한파대피소 데이터 불러오기 성공')
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
          name: item.fcltNm || '',
          address: item.addr || '',
          latitude: item.latitude || 0, // Note: check for swapped lat/lng
          longitude: item.longitude || 0,
        }))
        setHotPlaces(parsedHotPlaces)
        console.log('폭염대피소 데이터 불러오기 성공')
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
        setEarthquakePlaces(parsedEarthquakePlaces)
        console.log('지진대피소 데이터 불러오기 성공')
      } catch (error) {
        console.error('지진대피소 데이터 불러오기 실패:', error)
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
        setDustPlaces(parsedDustPlaces)
        console.log('미세먼지대피소 데이터 불러오기 성공')
      } catch (error) {
        console.error('미세먼지대피소 데이터 불러오기 실패:', error)
      }
    }

    fetchDustPlaces()
  }, [])

  const [selectedMarker, setSelectedMarker] = useState<any | null>(null)
  const [showModal, setShowModal] = useState(false)

  return (
    <View style={[styles.container, style]}>
      <NaverMapView
        style={styles.map}
        initialCamera={{
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
          zoom: initialLocation.zoom,
        }}
        isShowLocationButton={true}
        onCameraChanged={(event) => {
          const region = event.region
          // console.log('Camera Region:', region)
          const { latitude, longitude, latitudeDelta, longitudeDelta } = region

          // 여유를 추가한 남서쪽(southWest)와 북동쪽(northEast) 좌표 계산
          const paddingFactor = 2 // 범위를 2배 넓게 설정
          const bounds = {
            southWest: {
              latitude: latitude - (latitudeDelta * paddingFactor) / 2,
              longitude: longitude - (longitudeDelta * paddingFactor) / 2,
            },
            northEast: {
              latitude: latitude + (latitudeDelta * paddingFactor) / 2,
              longitude: longitude + (longitudeDelta * paddingFactor) / 2,
            },
          }

          // console.log('Calculated Bounds with Padding:', bounds)

          // 가시 영역 내 마커 필터링
          const visibleAeds = aedData.filter(
            (aed) =>
              aed.latitude >= bounds.southWest.latitude &&
              aed.latitude <= bounds.northEast.latitude &&
              aed.longitude >= bounds.southWest.longitude &&
              aed.longitude <= bounds.northEast.longitude
          )

          const visibleColds = coldPlaces.filter(
            (place) =>
              place.latitude >= bounds.southWest.latitude &&
              place.latitude <= bounds.northEast.latitude &&
              place.longitude >= bounds.southWest.longitude &&
              place.longitude <= bounds.northEast.longitude
          )

          const visibleHots = hotPlaces.filter(
            (place) =>
              place.latitude >= bounds.southWest.latitude &&
              place.latitude <= bounds.northEast.latitude &&
              place.longitude >= bounds.southWest.longitude &&
              place.longitude <= bounds.northEast.longitude
          )

          const visibleEarthquakes = earthquakePlaces.filter(
            (place) =>
              place.latitude >= bounds.southWest.latitude &&
              place.latitude <= bounds.northEast.latitude &&
              place.longitude >= bounds.southWest.longitude &&
              place.longitude <= bounds.northEast.longitude
          )

          const visibleDust = dustPlaces.filter(
            (place) =>
              place.latitude >= bounds.southWest.latitude &&
              place.latitude <= bounds.northEast.latitude &&
              place.longitude >= bounds.southWest.longitude &&
              place.longitude <= bounds.northEast.longitude
          )

          setVisibleAedMarkers(visibleAeds)
          setVisibleColdMarkers(visibleColds)
          setVisibleHotMarkers(visibleHots)
          setVisibleEarthquakeMarkers(visibleEarthquakes)
          setVisibleDustMarkers(visibleDust)
        }}
      >
        {showAedMarkers &&
          visibleAedMarkers.map((place, index) => (
            <NaverMapMarkerOverlay
              key={index}
              latitude={place.latitude}
              longitude={place.longitude}
              caption={{
                text: place.name,
                align: 'Bottom',
                textSize: 10,
              }}
              image={require('@/assets/images/redmarker.png')}
              width={38}
              height={40}
              onTap={() => {
                console.log(place.address)
                setSelectedMarker(place)
                setShowModal(true)
              }}
            />
          ))}
        {showColdMarkers &&
          visibleColdMarkers.map((place, index) => (
            <NaverMapMarkerOverlay
              key={`cold-${index}`}
              latitude={place.latitude}
              longitude={place.longitude}
              caption={{
                text: place.name,
                align: 'Bottom',
                textSize: 10,
              }}
              image={require('@/assets/images/bluemarker.png')}
              width={30}
              height={30}
              onTap={() => {
                console.log(place.address)
                setSelectedMarker(place)
                setShowModal(true)
              }}
            />
          ))}
        {showHotMarkers &&
          visibleHotMarkers.map((place, index) => (
            <NaverMapMarkerOverlay
              key={`hot-${index}`}
              latitude={place.latitude}
              longitude={place.longitude}
              caption={{
                text: place.name,
                align: 'Bottom',
                textSize: 10,
              }}
              image={require('@/assets/images/yellowmarker.png')}
              width={30}
              height={30}
              onTap={() => {
                console.log(place.address)
                setSelectedMarker(place)

                setShowModal(true)
              }}
            />
          ))}
        {showEarthquakeMarkers &&
          visibleEarthquakeMarkers.map((place, index) => (
            <NaverMapMarkerOverlay
              key={`earthquake-${index}`}
              latitude={place.latitude}
              longitude={place.longitude}
              caption={{
                text: place.name,
                align: 'Bottom',
                textSize: 10,
              }}
              image={require('@/assets/images/greenmarker.png')}
              width={22}
              height={30}
              onTap={() => {
                console.log(place.address)
                setSelectedMarker(place)
                setShowModal(true)
              }}
            />
          ))}
        {showDustMarkers &&
          visibleDustMarkers.map((place, index) => (
            <NaverMapMarkerOverlay
              key={`dust-${index}`}
              latitude={place.latitude}
              longitude={place.longitude}
              caption={{
                text: place.name,
                align: 'Bottom',
                textSize: 10,
              }}
              image={require('@/assets/images/blackmarker.png')}
              width={30}
              height={32}
              onTap={() => {
                console.log(place.address)
                setSelectedMarker(place)
                setShowModal(true)
              }}
            />
          ))}
      </NaverMapView>
      {/* 모달 */}
      {showModal && selectedMarker && (
        <View style={styles.modalContainer}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedMarker.name}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalAddress}>{selectedMarker.address}</Text>
            <Text style={styles.modalAddress}>위도: {selectedMarker.latitude}</Text>
            <Text style={styles.modalAddress}>경도: {selectedMarker.longitude}</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  // 공유 기능
                  Share.share({
                    message: `${selectedMarker.name}\n
                      주소: ${selectedMarker.address}\n
                      위도: ${selectedMarker.latitude},\n
                      경도: ${selectedMarker.longitude}`,
                  }).then((result) => console.log(result))

                  setShowModal(false)
                }}
              >
                <Text style={styles.actionButtonText}>공유</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  // 네이버 지도 앱이나 웹으로 연결
                  setShowModal(false)
                  const webUrl = `https://map.naver.com/v5/search/${encodeURIComponent(
                    selectedMarker.name
                  )}?c=${selectedMarker.longitude},${selectedMarker.latitude},15,0,0,0,dh`
                  Linking.openURL(webUrl)
                  console.log('길찾기:', webUrl)
                }}
              >
                <Text style={styles.actionButtonText}>길찾기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={styles.overlay}>
        {/* <View style={[styles.badge, { backgroundColor: getAirQualityColor(airData?.GRADE) }]}>
          <Text style={styles.badgeText}>{airData?.GRADE || 'N/A'}</Text>
        </View> */}

        {showMosquitoInfo && (
          <View style={styles.mosquitoInfo}>
            <Text style={styles.mosquitoText}>
              ({new Date().toISOString().split('T')[0]})
              {/* 모기지수 원래는 오늘 날짜 아님 어제 날짜 기준임*/}
            </Text>
            <Text style={styles.mosquitoText}>
              수변부 모기지수: {mosquitoData?.MOSQUITO_VALUE_WATER || 'N/A'}
            </Text>
            <Text style={styles.mosquitoText}>
              공원 모기지수: {mosquitoData?.MOSQUITO_VALUE_PARK || 'N/A'}
            </Text>
          </View>
        )}
        {showDustInfo && (
          <View style={[styles.mosquitoInfo, { height: 100 }]}>
            <Text style={styles.mosquitoText}>({new Date().toISOString().split('T')[0]})</Text>
            <Text
              style={[
                styles.mosquitoText,
                {
                  color:
                    airData?.PM25 !== undefined && Number(airData.PM25) <= 35
                      ? '#0277BD'
                      : airData?.PM25 !== undefined &&
                        !isNaN(Number(airData.PM25)) &&
                        Number(airData.PM25) <= 75
                      ? '#EF6C00'
                      : '#C62827',
                },
              ]}
            >
              대기질 지수: {airData?.GRADE || 'N/A'}
            </Text>
            <Text style={styles.mosquitoText}>미세먼지: {airData?.PM10 || 'N/A'} ㎍/㎥</Text>
            <Text style={styles.mosquitoText}>초미세먼지: {airData?.PM25 || 'N/A'} ㎍/㎥</Text>
          </View>
        )}
      </View>
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
  toggleButton: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 6,
    elevation: 5,
  },
  overlay: {
    position: 'absolute',
    top: 55,
    margin: 10,
    left: '60%',
    alignItems: 'flex-start',
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  mosquitoInfo: {
    width: 150,
    height: 80,

    backgroundColor: 'rgba(255, 255, 255, 0.75)',

    borderWidth: 1,

    padding: 10,
    borderRadius: 10,
  },
  mosquitoText: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
  },
  additionalOverlay: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  //
  // styles에 추가
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    fontSize: 20,
    color: '#888',
    padding: 5,
  },
  modalAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: '#4a89f3',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '500',
  },
})

export default NaverMapComponent
