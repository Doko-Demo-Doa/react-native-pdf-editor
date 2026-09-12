import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HeroUINativeProvider } from 'heroui-native';
import '../global.css';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <SafeAreaProvider>
          {/* The Stack's header already accounts for the top inset; only the
            bottom (home indicator) needs handling, and since Stack always
            renders exactly one full-screen child, wrapping it once here
            covers every screen without touching each one individually. */}
          <Stack>
            <Stack.Screen
              name="index"
              options={{ title: 'PDF Editor', headerShown: false }}
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
        </SafeAreaProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
