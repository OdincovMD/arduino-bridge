import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthGate } from '@/components/auth-gate';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/providers/auth-provider';
import { BackendSnapshotProvider } from '@/providers/backend-snapshot-provider';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'dark'];

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <BackendSnapshotProvider>
          <AuthGate>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="device/[slug]"
                options={{
                  headerBackTitle: 'Назад',
                  headerShadowVisible: false,
                  headerStyle: { backgroundColor: palette.chrome },
                  headerTintColor: palette.text,
                }}
              />
              <Stack.Screen
                name="modal"
                options={{
                  presentation: 'modal',
                  title: 'Параметры',
                  headerShadowVisible: false,
                  headerStyle: { backgroundColor: palette.chrome },
                  headerTintColor: palette.text,
                }}
              />
            </Stack>
          </AuthGate>
        </BackendSnapshotProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </AuthProvider>
    </ThemeProvider>
  );
}
