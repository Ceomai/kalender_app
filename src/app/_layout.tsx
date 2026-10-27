import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/src/lib/AuthContext';
import { PreferencesProvider, usePreferences } from '@/src/lib/PreferencesContext';
import { Toaster } from '@/src/ui/Toast';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
  });
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <PreferencesProvider>
              <RootNavigator />
            </PreferencesProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { colors, prefs, ready: prefsReady } = usePreferences();
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const ready = prefsReady && !isLoadingAuth;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // React Navigation's own theme follows the active palette so native chrome matches.
  const navTheme = useMemo(() => {
    const base = prefs.dark_mode ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.foreground,
        border: colors.border,
        notification: colors.destructive,
      },
    };
  }, [colors, prefs.dark_mode]);

  if (!ready) return null;

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={prefs.dark_mode ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        {/* The web's `_authed` gate: signed-out visitors only reach the auth pages. */}
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        {/* Full-screen auth pages, outside the app chrome; /login comes first so the gate lands there. */}
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="login" options={{ animation: 'fade' }} />
          <Stack.Screen name="register" options={{ animation: 'fade' }} />
          <Stack.Screen name="forgot-password" options={{ animation: 'fade' }} />
          <Stack.Screen name="reset-password" options={{ animation: 'fade' }} />
        </Stack.Protected>
      </Stack>
      <Toaster />
    </ThemeProvider>
  );
}
