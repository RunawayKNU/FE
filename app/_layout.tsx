import { Stack } from 'expo-router'

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name='LodingScreen'
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='(main)/index'
        options={{ headerShown: false }}
      />
    </Stack>
  )
}
