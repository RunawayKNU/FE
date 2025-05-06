import { Stack } from 'expo-router'
import { useState, useEffect } from 'react'
import LodingIndicator from '@/components/custom/LodingIndicator'

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
      console.log('Loading complete')
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <LodingIndicator />
  } else {
    return (
      <Stack>
        <Stack.Screen
          name='(main)/index'
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='(main)/EmergencyMessages'
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='(main)/Chatbot'
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name='(main)/Details'
          options={{ headerShown: false }}
        />
      </Stack>
    )
  }
}
