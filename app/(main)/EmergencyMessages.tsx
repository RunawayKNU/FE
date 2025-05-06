// EmergencyMessages.tsx
import React from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Button } from 'react-native'
import { useState } from 'react'
import { router, useRouter } from 'expo-router'

interface MessageData {
  id: string
  content: string
  region: string
  type: string
}

const dummyMessages: MessageData[] = [
  {
    id: '1',
    content: '[서울시] 현재 서울시 호우주의보 발효 중, 산사태 취약지역, 비탈면, 하천변산책로, 지하차도, 해안가저지대 등 위험지역에 접근을 금지하시고 안전에 유의바랍니다.',
    region: '서울특별시 양천구',
    type: '호우',
  },
  {
    id: '2',
    content: '[서울시] 서울시 호우주의보 발효 중, 시간당 20~40mm의 호우가 내리고 있습니다. 외출 자제 및 하천둔치·비탈면 접근 금지, 위험지역은 사전대피 바랍니다.',
    region: '서울특별시 마포구',
    type: '호우',
  },
  {
    id: '3',
    content: '[중구] 오늘 오전 많은 비가 예상되오니 상습침수지역 및 산사태우려지역, 지하차도, 척과천 징검다리 등 위험지역에 접근을 삼가해 주시기 바랍니다.',
    region: '서울특별시 중구',
    type: '호우',
  },
  {
    id: '4',
    content: '[서울시] 많은 비가 예상됨에 따라 해안가, 하천변, 저지대 등 급류에 각별히 유의하시고, 위험지역 출입을 자제하시기 바랍니다.',
    region: '서울특별시',
    type: '태풍',
  },
  {
    id: '5',
    content: '2025-05-05 07:53 충남 태안군 북서쪽 52km 해역 규모 3.7 지진발생/추가 지진 발생상황에 유의 바람 [기상청]',
    region: '서울특별시 강서구',
    type: '지진',
  },
  {
    id: '6',
    content: '강원, 경북 동해안 지역에 강풍특보 발령중이니 산림주변 불씨 취급에 주의바랍니다. 과실로 인해 산불발생시 3년 이하의 징역형에 처해질 수 있습니다. [산림청]',
    region: '서울특별시',
    type: '산불',
  },
  {
    id: '7',
    content: '오늘 순간풍속 15m/s 이상의 강한 바람, 건조, 기온상승 등으로 대형산불 위험이 높습니다. ▲산림 주변 소각 금지 ▲입산 자제 바랍니다. [행정안전부]',
    region: '서울특별시',
    type: '강풍',
  },
  {
    id: '8',
    content: '금일 11:50경 휘경동 308-144 일대 고압선이 끊어져 정전사고가 발생되어 복구 중이니 전자기기의 전원을 차단하는 등 안전사고에 유의하세요.[동대문구청]',
    region: '서울특별시 동대문구',
    type: '기타',
  },
  {
    id: '9',
    content: '서울 시내버스 노조에서 준법투쟁을 진행하여 출근시간 운행지연이 예상됩니다. 지하철,택시,무료셔틀버스 등 다른 교통수단을 이용해 주시기 바랍니다. [서대문구청]',
    region: '서울특별시 서대문구',
    type: '기타',
  },
  {
    id: '10',
    content: '09:48 상남교차로 인근 고물상에서 화재 발생. 인근지역 주민들께서는 연기 흡입을 하지 않도록 창문을 닫고 안전에 유의하시기 바랍니다. [중랑구청]',
    region: '서울특별시 중랑구',
    type: '화재',
  },
]

const EmergencyMessages = () => {
  const router = useRouter()

  const [selectedType, setSelectedType] = useState('전체')
  const [searchTerm, setSearchTerm] = useState('')
  const [modalVisible, setModalVisible] = useState(false)

  const TYPES = ['전체', '호우', '지진', '강풍', '산불', '화재', '태풍', '기타']

  const filteredMessages = dummyMessages.filter((msg) => {
    const matchesType = selectedType === '전체' || msg.type === selectedType
    const matchesSearch = msg.content.includes(searchTerm)
    return matchesType && matchesSearch
  })

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          title='뒤로'
          onPress={() => router.back()}
        />
        <Text style={styles.title}>📢 재난 문자 알림</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.dropdownText}>{selectedType} ▼</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.searchInput}
          placeholder='내용 검색'
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <Modal
        transparent={true}
        visible={modalVisible}
        animationType='slide'
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            {TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => {
                  setSelectedType(type)
                  setModalVisible(false)
                }}
              >
                <Text style={styles.modalItem}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <FlatList
        data={filteredMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.type}>[{item.type}]</Text>
            <Text style={styles.content}>{item.content}</Text>
            <Text style={styles.region}>📍 {item.region}</Text>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  dropdownText: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: 'white',
    marginHorizontal: 40,
    borderRadius: 8,
    padding: 16,
  },
  modalItem: {
    paddingVertical: 10,
    fontSize: 16,
  },
  card: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderColor: '#ddd',
    borderWidth: 1,
  },
  type: {
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 4,
  },
  content: {
    fontSize: 16,
    marginBottom: 4,
  },
  region: {
    fontSize: 14,
    color: '#555',
  },
})

export default EmergencyMessages
