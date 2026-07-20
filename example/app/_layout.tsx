import { Stack } from 'expo-router';
import { HeroUINativeProvider } from 'heroui-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import '../global.css';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <HeroUINativeProvider>
          {/* The Stack's header already accounts for the top inset; only the
              bottom (home indicator) needs handling, and since Stack always
              renders exactly one full-screen child, wrapping it once here
              covers every screen without touching each one individually. */}
          <SafeAreaView edges={['bottom']} className="flex-1">
            <Stack>
              <Stack.Screen
                name="index"
                options={{ title: 'PdfEditor Example' }}
              />
              <Stack.Screen name="add-page" options={{ title: 'Add page' }} />
              <Stack.Screen name="add-text" options={{ title: 'Add text' }} />
              <Stack.Screen name="rotate" options={{ title: 'Rotate' }} />
              <Stack.Screen name="sign" options={{ title: 'Sign' }} />
              <Stack.Screen name="password" options={{ title: 'Password' }} />
              <Stack.Screen
                name="diagnostics"
                options={{ title: 'Diagnostics' }}
              />
            </Stack>
          </SafeAreaView>
        </HeroUINativeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
