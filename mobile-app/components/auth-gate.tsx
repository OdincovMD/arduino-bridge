import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { ReactNode, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { bloomAssets } from '@/constants/bloom-assets';
import { bloomPalette } from '@/constants/bloom';
import { Fonts } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

export function AuthGate({ children }: { children: ReactNode }) {
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
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 28,
        gap: 22,
      }}
      style={{ flex: 1, backgroundColor: bloomPalette.background }}
    >
      <View
        style={{
          position: 'absolute',
          top: -70,
          right: -40,
          width: 220,
          height: 220,
          borderRadius: 999,
          backgroundColor: '#E8F1E7',
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 80,
          left: -40,
          width: 160,
          height: 160,
          borderRadius: 999,
          backgroundColor: '#EAF4EA',
        }}
      />

      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 999,
          backgroundColor: bloomPalette.surface,
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 12px 24px ${bloomPalette.shadow}`,
        }}
      >
        <MaterialIcons name="arrow-back-ios-new" size={18} color={bloomPalette.primaryText} />
      </View>

      <View style={{ alignItems: 'center', gap: 8 }}>
        <Text
          style={{
            color: bloomPalette.primaryText,
            fontFamily: Fonts.rounded,
            fontSize: 34,
            fontWeight: '700',
            textAlign: 'center',
          }}
        >
          Панель теплицы
        </Text>
        <Text
          selectable
          style={{
            color: bloomPalette.mutedText,
            fontFamily: Fonts.rounded,
            fontSize: 16,
            lineHeight: 24,
            textAlign: 'center',
            maxWidth: 320,
          }}
        >
          Войдите, чтобы видеть свет, полив, очередь команд и телеметрию контроллеров в одном месте.
        </Text>
      </View>

      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -4,
          marginBottom: -6,
        }}
      >
        <View
          style={{
            width: 172,
            height: 172,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.42)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            source={bloomAssets.gardenPlants[0]}
            style={{ width: 142, height: 142 }}
            contentFit="contain"
          />
        </View>
      </View>

      <View
        style={{
          borderRadius: 26,
          backgroundColor: bloomPalette.surface,
          paddingHorizontal: 18,
          paddingVertical: 20,
          gap: 18,
          boxShadow: `0 18px 36px ${bloomPalette.shadow}`,
        }}
      >
        <View style={{ gap: 8 }}>
          <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 14, fontWeight: '500' }}>
            Почта оператора
          </Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onFocus={clearError}
            onChangeText={setEmail}
            placeholder="admin@example.com"
            placeholderTextColor={bloomPalette.mutedText}
            style={{
              borderRadius: 18,
              backgroundColor: bloomPalette.surfaceSoft,
              color: bloomPalette.darkText,
              fontFamily: Fonts.rounded,
              fontSize: 15,
              paddingHorizontal: 16,
              paddingVertical: 15,
            }}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 14, fontWeight: '500' }}>
            Пароль
          </Text>
          <TextInput
            secureTextEntry
            value={password}
            onFocus={clearError}
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor={bloomPalette.mutedText}
            style={{
              borderRadius: 18,
              backgroundColor: bloomPalette.surfaceSoft,
              color: bloomPalette.darkText,
              fontFamily: Fonts.rounded,
              fontSize: 15,
              paddingHorizontal: 16,
              paddingVertical: 15,
            }}
          />
        </View>

        <Text
            style={{
              alignSelf: 'flex-end',
              color: bloomPalette.mutedText,
              fontFamily: Fonts.rounded,
              fontSize: 13,
            }}
          >
          Восстановить доступ
        </Text>

        {error ? (
          <View
            style={{
              borderRadius: 16,
              backgroundColor: '#FFF0EF',
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
          >
            <Text style={{ color: bloomPalette.warning, fontFamily: Fonts.rounded, fontSize: 13, lineHeight: 20 }}>
              {error}
            </Text>
          </View>
        ) : null}

        <Pressable
          disabled={isLoading || !email.trim() || !password}
          onPress={() => {
            void signIn(email.trim(), password);
          }}
          style={{
            borderRadius: 18,
            backgroundColor: bloomPalette.primary,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 16,
            opacity: isLoading || !email.trim() || !password ? 0.76 : 1,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color={bloomPalette.surface} />
          ) : (
            <Text style={{ color: bloomPalette.surface, fontFamily: Fonts.rounded, fontSize: 16, fontWeight: '600' }}>
              Войти
            </Text>
          )}
        </Pressable>
      </View>

      <Text
        style={{
          color: bloomPalette.mutedText,
          fontFamily: Fonts.rounded,
          fontSize: 14,
          textAlign: 'center',
        }}
      >
        Тестовый доступ использует backend-учётную запись администратора.
      </Text>
    </ScrollView>
  );
}
