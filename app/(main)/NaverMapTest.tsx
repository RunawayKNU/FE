import React, { useState, useEffect } from 'react'
import { View, Text, Button, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { NaverMapView } from '@mj-studio/react-native-naver-map'
import { useRouter } from 'expo-router'
import axios from 'axios'
import Constants from 'expo-constants'


// 모기 지수 API 응답 타입 정의
interface MosquitoStatusData {
  MOSQUITO_DATE: string
  MOSQUITO_VALUE_WATER: string
  MOSQUITO_VALUE_HOUSE: string
  MOSQUITO_VALUE_PARK: string
}

// 대기질 API 응답 타입 정의
interface AirQualityData {
  GRADE: string
  IDEX_MVL: string
  POLLUTANT: string
  PM10: string
  PM25: string
}

function APITest(): React.JSX.Element {
  const router = useRouter()

  // 모기
  const [mosquitoLoading, setMosquitoLoading] = useState(false)
  const [mosquitoData, setMosquitoData] = useState<MosquitoStatusData | null>(null)
  const [mosquitoError, setMosquitoError] = useState<string | null>(null)

  // 대기질
  const [airLoading, setAirLoading] = useState(false)
  const [airData, setAirData] = useState<AirQualityData | null>(null)
  const [airError, setAirError] = useState<string | null>(null)

  // 서울시 공공 데이터 API 키 가져오기
  const SEOUL_API_KEY = process.env.EXPO_PUBLIC_SEOUL_API_KEY

  // 서울시 모기 지수 API
  // https://data.seoul.go.kr/dataList/OA-13285/S/1/datasetView.do
  const fetchMosquitoData = async () => {
    setMosquitoLoading(true)
    setMosquitoError(null)

    try {
      const today = new Date()
      const padNumber = (num: number) => (num < 10 ? `0${num}` : `${num}`)
      // -1 해서 어제 date 로 설정정
      const formattedDate: string = `${today.getFullYear()}-${padNumber(today.getMonth() + 1)}-${padNumber(today.getDate() - 1)}`

      // 서울 공공데이터 - 모기 지수 API
      const response = await axios.get(`http://openapi.seoul.go.kr:8088/${SEOUL_API_KEY}/json/MosquitoStatus/1/5/${formattedDate}`)

      if (response.data?.MosquitoStatus?.row?.length > 0) {
        setMosquitoData(response.data.MosquitoStatus.row[0])
        console.log(`(${formattedDate}) 모기지수 API 응답:`, mosquitoData)
      } else {
        setMosquitoError('모기 지수 데이터가 없습니다.')
      }
    } catch (err) {
      console.error('모기지수 API 호출 오류:', err)
      setMosquitoError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setMosquitoLoading(false)
    }
  }

  // 서울시 실시간 대기환경 평균
  // https://data.seoul.go.kr/dataList/OA-1201/S/1/datasetView.do
  const fetchAirQualityData = async () => {
    setAirLoading(true)
    setAirError(null)

    try {
      // 서울시 대기질 API 호출
      const response = await axios.get(`http://openAPI.seoul.go.kr:8088/${SEOUL_API_KEY}/json/ListAvgOfSeoulAirQualityService/1/1/`)

      if (response.data?.ListAvgOfSeoulAirQualityService?.row?.length > 0) {
        setAirData(response.data.ListAvgOfSeoulAirQualityService.row[0])
        console.log('대기질 API 응답:', airData)
      } else {
        setAirError('대기질 데이터가 없습니다.')
      }
    } catch (err) {
      console.error('대기질 API 호출 오류:', err)
      setAirError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setAirLoading(false)
    }
  }

  // 컴포넌트 마운트 시 양쪽 API 모두 호출
  useEffect(() => {
    fetchMosquitoData()
    fetchAirQualityData()
  }, [])

  // 모든 데이터 새로고침 버튼
  const refreshAllData = () => {
    fetchMosquitoData()
    fetchAirQualityData()
  }

  // 대기질 등급에 따른 색상
  const getAirQualityColor = (grade: string) => {
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

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Button
          title='뒤로'
          onPress={() => router.back()}
        />
        <Text style={styles.title}>네이버 지도 API 테스트</Text>
        <View style={{ width: 50 }} /> {/* 빈 공간 */}
      </View>

      {/* 네이버 맵 */}
      <View style={styles.mapContainer}>
        <NaverMapView style={styles.map} />
      </View>

      {/* API 데이터 표시 */}
      <ScrollView style={styles.dataContainer}>
        {/* 모기 지수 섹션 */}
        <Text style={styles.sectionTitle}>서울시 모기 지수 데이터</Text>
        {mosquitoLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size='large'
              color='#4a89f3'
            />
            <Text style={styles.loadingText}>모기 지수 로딩 중...</Text>
          </View>
        ) : mosquitoError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{mosquitoError}</Text>
          </View>
        ) : mosquitoData ? (
          <View style={styles.dataCard}>
            <Text style={styles.dataDate}>날짜: {mosquitoData.MOSQUITO_DATE}</Text>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>수변부(하천) 모기 지수:</Text>
              <Text style={styles.dataValue}>{mosquitoData.MOSQUITO_VALUE_WATER}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>주거지 모기 지수:</Text>
              <Text style={styles.dataValue}>{mosquitoData.MOSQUITO_VALUE_HOUSE}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>공원 모기 지수:</Text>
              <Text style={styles.dataValue}>{mosquitoData.MOSQUITO_VALUE_PARK}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noDataText}>모기 지수 데이터가 없습니다.</Text>
        )}

        {/* 공간 구분선 */}
        <View style={styles.sectionDivider} />

        {/* 대기질 섹션 */}
        <Text style={styles.sectionTitle}>서울시 실시간 대기질 정보</Text>
        {airLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size='large'
              color='#4a89f3'
            />
            <Text style={styles.loadingText}>대기질 데이터 로딩 중...</Text>
          </View>
        ) : airError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{airError}</Text>
          </View>
        ) : airData ? (
          <View style={styles.dataCard}>
            <View style={[styles.gradeIndicator, { backgroundColor: getAirQualityColor(airData.GRADE) }]}>
              <Text style={styles.gradeText}>{airData.GRADE}</Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>미세먼지 (PM10):</Text>
              <Text style={styles.dataValue}>{airData.PM10} μg/m³</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>초미세먼지 (PM2.5):</Text>
              <Text style={styles.dataValue}>{airData.PM25} μg/m³</Text>
            </View>
            <Text style={styles.infoLabel}>* 실시간 서울시 평균 대기정보입니다</Text>
          </View>
        ) : (
          <Text style={styles.noDataText}>대기질 데이터가 없습니다.</Text>
        )}

        {/* 새로고침 버튼 */}
        <View style={styles.refreshButtonContainer}>
          <Button
            title='모든 데이터 새로고침'
            onPress={refreshAllData}
          />
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  mapContainer: {
    height: '30%',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  dataContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4a89f3',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffecec',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    marginVertical: 10,
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 10,
  },
  dataCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
    marginBottom: 12,
  },
  dataDate: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dataLabel: {
    fontSize: 14,
    color: '#555',
  },
  dataValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  gradeIndicator: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  gradeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 8,
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
    color: '#888',
  },
  refreshButtonContainer: {
    marginVertical: 16,
  },
})

export default APITest
