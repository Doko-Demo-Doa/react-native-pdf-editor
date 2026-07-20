import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'PdfEditor Example' }} />
      <Stack.Screen name="add-page" options={{ title: 'Add page' }} />
      <Stack.Screen name="add-text" options={{ title: 'Add text' }} />
      <Stack.Screen name="rotate" options={{ title: 'Rotate' }} />
      <Stack.Screen name="sign" options={{ title: 'Sign' }} />
      <Stack.Screen name="diagnostics" options={{ title: 'Diagnostics' }} />
    </Stack>
  );
}
