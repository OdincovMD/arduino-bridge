import { ReactNode, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/providers/auth-provider';

export function AuthGate({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme() ?? 'dark';
  const palette = Colors[colorScheme];
  const { token, signIn, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin12345');

  if (token) {
    return <>{children}</>;
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
        gap: 18,
      }}
      style={{ flex: 1, backgroundColor: palette.background }}
    >
      <View
        style={{
          position: 'absolute',
          top: -40,
          right: -30,
          width: 220,
          height: 220,
          borderRadius: 999,
          backgroundColor: palette.ambientA,
          opacity: 0.18,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 120,
          left: -60,
          width: 180,
          height: 180,
          borderRadius: 999,
          backgroundColor: palette.ambientB,
          opacity: 0.18,
        }}
      />

      <View
        style={{
          borderRadius: 34,
          backgroundColor: palette.hero,
          borderWidth: 1,
          borderColor: palette.lineStrong,
          padding: 24,
          gap: 16,
          boxShadow: `0 24px 48px ${palette.shadow}`,
        }}
      >
        <Text
          style={{
            color: palette.heroMuted,
            fontFamily: Fonts.rounded,
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: 1.1,
          }}
        >
          Verdant Relay
        </Text>
        <Text
          style={{
            color: palette.heroText,
            fontFamily: Fonts.serif,
            fontSize: 34,
            lineHeight: 38,
          }}
        >
          Ваш сад всегда под рукой.
        </Text>
        <Text
          selectable
          style={{
            color: palette.heroMuted,
            fontFamily: Fonts.rounded,
            fontSize: 15,
            lineHeight: 22,
          }}
        >
          Смотрите, как чувствуют себя растения, включайте свет и запускайте полив в пару касаний.
        </Text>
      </View>

      <View
        style={{
          borderRadius: 28,
          backgroundColor: palette.card,
          borderWidth: 1,
          borderColor: palette.line,
          padding: 20,
          gap: 14,
        }}
      >
        <Text style={{ color: palette.text, fontFamily: Fonts.rounded, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>
          Вход
        </Text>
        <Text style={{ color: palette.muted, fontFamily: Fonts.rounded, fontSize: 13, lineHeight: 20 }}>
          Войдите, чтобы открыть свои теплицы, историю ухода и быстрые действия.
        </Text>

        <View style={{ gap: 8 }}>
          <Text style={{ color: palette.muted, fontFamily: Fonts.rounded, fontSize: 12 }}>Почта</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onFocus={clearError}
            onChangeText={setEmail}
            placeholder="admin@example.com"
            placeholderTextColor={palette.muted}
            style={{
              borderRadius: 18,
              borderWidth: 1,
              borderColor: palette.line,
              backgroundColor: palette.cardSoft,
              color: palette.text,
              fontFamily: Fonts.rounded,
              fontSize: 15,
              paddingHorizontal: 14,
              paddingVertical: 14,
            }}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ color: palette.muted, fontFamily: Fonts.rounded, fontSize: 12 }}>Пароль</Text>
          <TextInput
            secureTextEntry
            value={password}
            onFocus={clearError}
            onChangeText={setPassword}
            placeholder="Введите пароль"
            placeholderTextColor={palette.muted}
            style={{
              borderRadius: 18,
              borderWidth: 1,
              borderColor: palette.line,
              backgroundColor: palette.cardSoft,
              color: palette.text,
              fontFamily: Fonts.rounded,
              fontSize: 15,
              paddingHorizontal: 14,
              paddingVertical: 14,
            }}
          />
        </View>

        {error ? (
          <View
            style={{
              borderRadius: 18,
              backgroundColor: palette.badge,
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
          >
            <Text style={{ color: palette.warning, fontFamily: Fonts.rounded, fontSize: 13, lineHeight: 20 }}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          disabled={isLoading || !email.trim() || !password}
          onPress={() => {
            void signIn(email.trim(), password);
          }}
          style={{
            borderRadius: 18,
            backgroundColor: palette.accent,
            paddingVertical: 16,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isLoading || !email.trim() || !password ? 0.75 : 1,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color={palette.background} />
          ) : (
            <Text style={{ color: palette.background, fontFamily: Fonts.rounded, fontSize: 15 }}>Войти</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
