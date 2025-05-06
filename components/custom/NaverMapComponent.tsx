import React, { useEffect, useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native'
import { NaverMapView, NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map'
import axios from 'axios'
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
  showMosquitoInfo?: boolean
}

interface AedInfo {
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
}) => {
  const [aedData, setAedData] = useState<AedInfo[]>([])

  const [showMarkers, setShowMarkers] = useState(true)
  const [visibleMarkers, setVisibleMarkers] = useState<AedInfo[]>([])

  const [mosquitoData, setMosquitoData] = useState<MosquitoStatusData | null>(null)
  const [airData, setAirData] = useState<AirQualityData | null>(null)
  const [loading, setLoading] = useState(true)

  const API_KEY = process.env.EXPO_PUBLIC_SEOUL_API_KEY || 'YOUR_DEFAULT_API_KEY'

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

  return (
    <View style={[styles.container, style]}>
      <NaverMapView
        style={styles.map}
        initialCamera={{
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
          zoom: initialLocation.zoom,
        }}
        onCameraChanged={(event) => {
          const region = event.region
          console.log('Camera Region:', region)
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

          console.log('Calculated Bounds with Padding:', bounds)

          // 가시 영역 내 마커 필터링
          const visibleMarkers = aedData.filter(
            (aed) =>
              aed.latitude >= bounds.southWest.latitude &&
              aed.latitude <= bounds.northEast.latitude &&
              aed.longitude >= bounds.southWest.longitude &&
              aed.longitude <= bounds.northEast.longitude
          )

          setVisibleMarkers(visibleMarkers) // 가시 영역 내 마커만 상태로 저장
        }}
      >
        {showMarkers &&
          visibleMarkers.map((aed, index) => (
            <NaverMapMarkerOverlay
              key={index}
              latitude={aed.latitude}
              longitude={aed.longitude}
              caption={{
                text: aed.name,
                align: 'Bottom',
                textSize: 10, // Adjust the text size to make it smaller
              }}
              width={20} // Adjust the marker width
              height={30} // Adjust the marker height
              onTap={() => console.log(aed.address)}
            />
          ))}
      </NaverMapView>
      <View style={styles.overlay}>
        <View style={[styles.badge, { backgroundColor: getAirQualityColor(airData?.GRADE) }]}>
          <Text style={styles.badgeText}>{airData?.GRADE || 'N/A'}</Text>
        </View>

        {showMosquitoInfo && (
          <View style={styles.mosquitoInfo}>
            <Text style={styles.mosquitoText}>
              수변부 모기지수: {mosquitoData?.MOSQUITO_VALUE_WATER || 'N/A'}
            </Text>
            <Text style={styles.mosquitoText}>
              공원 모기지수: {mosquitoData?.MOSQUITO_VALUE_PARK || 'N/A'}
            </Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={[styles.toggleButton, { bottom: 45, right: 15 }]}
        onPress={() => setShowMarkers(!showMarkers)}
      >
        <Text style={{ fontSize: 20, opacity: showMarkers ? 1 : 0.4 }}>❤️</Text>
      </TouchableOpacity>
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
    top: 20,
    left: 20,
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
    position: 'absolute',

    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 8,
    borderRadius: 8,
  },
  mosquitoText: {
    fontSize: 12,
    color: '#333',
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
})

export default NaverMapComponent
