import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* The Stack's header already accounts for the top inset; only the
            bottom (home indicator) needs handling, and since Stack always
            renders exactly one full-screen child, wrapping it once here
            covers every screen without touching each one individually. */}
        <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
          <Stack>
            <Stack.Screen
              name="index"
              options={{ title: 'PdfEditor Example' }}
            />
            <Stack.Screen name="add-page" options={{ title: 'Add page' }} />
            <Stack.Screen name="add-text" options={{ title: 'Add text' }} />
            <Stack.Screen name="rotate" options={{ title: 'Rotate' }} />
            <Stack.Screen name="sign" options={{ title: 'Sign' }} />
            <Stack.Screen
              name="sign-yubikey"
              options={{ title: 'Sign with YubiKey' }}
            />
            <Stack.Screen
              name="verify-signature"
              options={{ title: 'Verify signature' }}
            />
            <Stack.Screen name="password" options={{ title: 'Password' }} />
            <Stack.Screen
              name="render-page"
              options={{ title: 'Render page' }}
            />
            <Stack.Screen name="metadata" options={{ title: 'Metadata' }} />
            <Stack.Screen
              name="diagnostics"
              options={{ title: 'Diagnostics' }}
            />
          </Stack>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
