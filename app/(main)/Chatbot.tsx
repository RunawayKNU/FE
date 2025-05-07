import React, { useState } from 'react'
import { View, Text, TextInput, Button, ScrollView, StyleSheet } from 'react-native'
import { TouchableOpacity } from 'react-native'
import { router, useRouter } from 'expo-router'
import axios from 'axios'

const presetQuestion = [
  '집에 불이 났어요!',
  '지진이 발생했어요!',
  '미세먼지가 심할 때 어떻게 해야하나요?',
  '열사병에 걸렸어요!',
]

const presetLabels = [
  '화재 발생 시 대처법',
  '지진 발생 시 행동 요령',
  '미세먼지 심할 때 행동 요령',
  '열사병 응급처치 방법',
]

const Chatbot = () => {
  const [messages, setMessages] = useState<string[]>([])
  const [input, setInput] = useState('')

  const sendMessage = async (question: string, label?: string) => {
    setMessages((prev) => [...prev, `🙋 You: ${question || label}`])
    try {
      const response = await axios.post(
        'https://clovastudio.stream.ntruss.com/testapp/v3/chat-completions/HCX-005',
        {
          messages: [
            { role: 'system', content: '' },
            { role: 'user', content: question },
          ],
          topP: 0.8,
          topK: 0,
          maxTokens: 256,
          temperature: 0.5,
          repetitionPenalty: 1.1,
          stop: [],
          includeAiFilters: true,
          seed: 0,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-NCP-CLOVASTUDIO-REQUEST-ID': '459d04a4d78e4b42b9d2f1a340b60117', // ✅ UUID (고유 식별자, 랜덤 생성 가능)
            Authorization: 'Bearer nv-77d388d194b2416dafbe71dfdc2de975rwrr',
          },
        }
      )

      const reply = response.data.result?.message?.content || '죄송합니다, 응답에 실패했어요.'
      setMessages((prev) => [...prev, `🤖 클로바: ${reply}`])
    } catch (error) {
      console.error(error)
      setMessages((prev) => [...prev, '❌ 오류가 발생했습니다.'])
    }
    setInput('')
  }
  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input)
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <ScrollView style={styles.chatBox}>
        {['🤖 클로바: 안녕하세요! 저는 CLOVA X입니다. 무엇을 도와드릴까요?', ...messages].map(
          (msg, index) => (
            <Text
              key={index}
              style={msg.startsWith('🙋 You:') ? styles.userMessage : styles.botMessage}
            >
              {msg.replace('🙋 You: ', '').replace('🤖 클로바: ', '')}
            </Text>
          )
        )}
      </ScrollView>

      <View style={styles.faqContainer}>
        {presetLabels.map((label, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              sendMessage(presetQuestion[index], label)
              setInput('')
            }}
          >
            <Text style={styles.faqItem}>{presetQuestion[index]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder='메시지를 입력하세요'
          value={input}
          onChangeText={setInput}
        />
        <Button
          title='보내기'
          onPress={handleSend}
        />
      </View>
    </View>
  )
}

export default Chatbot

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f6f8',
  },
  chatBox: {
    flex: 1,
    marginBottom: 10,

    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderColor: '#868AB0',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'rgba(75, 78, 109, 1)',
  },
  userMessage: {
    alignSelf: 'flex-end',
    marginVertical: 6,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    maxWidth: '80%',
    borderColor: '#868AB0',
    borderWidth: 1,
  },
  botMessage: {
    alignSelf: 'flex-start',
    marginVertical: 6,
    padding: 10,
    backgroundColor: '#868AB0',
    borderRadius: 10,
    maxWidth: '80%',
    color: '#ffffff',
    borderColor: '#868AB0',
    borderWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 10,
    backgroundColor: '#fafafa',
  },
  faqContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 10,
  },
  faqItem: {
    padding: 10,
    marginVertical: 4,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
  },
})
