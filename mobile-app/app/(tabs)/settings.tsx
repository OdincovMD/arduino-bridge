import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { ScrollView, Pressable, Text, View } from 'react-native';

import { bloomPalette } from '@/constants/bloom';
import { Fonts } from '@/constants/theme';
import { useBackendSnapshot } from '@/hooks/use-backend-snapshot';
import { useAuth } from '@/providers/auth-provider';

function SettingsRow({
  icon,
  label,
  external = false,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  external?: boolean;
}) {
  return (
    <View
      style={{
        borderRadius: 15,
        borderWidth: 1,
        borderColor: bloomPalette.border,
        backgroundColor: bloomPalette.surface,
        paddingHorizontal: 15,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <MaterialIcons name={icon} size={18} color={bloomPalette.primaryText} />
      <Text
        style={{
          flex: 1,
          color: bloomPalette.primaryText,
          fontFamily: Fonts.rounded,
          fontSize: 15,
        }}
      >
        {label}
      </Text>
      <MaterialIcons
        name={external ? 'open-in-new' : 'chevron-right'}
        size={external ? 14 : 18}
        color={bloomPalette.mutedText}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const snapshot = useBackendSnapshot();
  const updatedLabel = snapshot.updatedLabel
    .replace('обновлено в ', 'обновлено в ')
    .replace('резервные данные', 'резервные данные')
    .replace('демо-режим', 'демо-режим');

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 32,
        gap: 28,
      }}
      style={{ flex: 1, backgroundColor: bloomPalette.background }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 8,
        }}
      >
        <Pressable
          onPress={() => router.replace('/')}
          style={{
            width: 46,
            height: 44,
            borderRadius: 40,
            backgroundColor: bloomPalette.surface,
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 10px 20px ${bloomPalette.shadow}`,
          }}
        >
          <MaterialIcons name="arrow-back-ios-new" size={18} color={bloomPalette.primaryText} />
        </Pressable>
        <Text
          style={{
            color: bloomPalette.primaryText,
            fontFamily: Fonts.rounded,
            fontSize: 18,
            fontWeight: '500',
          }}
        >
          Профиль оператора
        </Text>
        <View style={{ width: 46 }} />
      </View>

      <View style={{ gap: 20 }}>
        <Text
          style={{
            color: bloomPalette.primaryText,
            fontFamily: Fonts.rounded,
            fontSize: 18,
            fontWeight: '600',
          }}
        >
          Управление доступом
        </Text>
        <View style={{ gap: 15 }}>
          <SettingsRow icon="badge" label={user?.email ?? 'Оператор не авторизован'} />
          <SettingsRow icon="vpn-key" label="Сменить пароль backend" />
          <SettingsRow icon="translate" label="Язык интерфейса" />
        </View>
      </View>

      <View style={{ gap: 20 }}>
        <Text
          style={{
            color: bloomPalette.primaryText,
            fontFamily: Fonts.rounded,
            fontSize: 18,
            fontWeight: '600',
          }}
        >
          Документация и политика
        </Text>
        <View style={{ gap: 15 }}>
          <SettingsRow icon="description" label="Протокол обмена" external />
          <SettingsRow icon="shield" label="Политика доступа" external />
          <SettingsRow icon="info-outline" label="Помощь оператору" external />
        </View>
      </View>

      <View
        style={{
          borderRadius: 18,
          backgroundColor: bloomPalette.surface,
          padding: 18,
          gap: 8,
          borderWidth: 1,
          borderColor: bloomPalette.border,
        }}
      >
        <Text style={{ color: bloomPalette.darkText, fontFamily: Fonts.rounded, fontSize: 13 }}>Backend session</Text>
        <Text selectable style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 18, fontWeight: '600' }}>
          {user?.email ?? 'Вход не выполнен'}
        </Text>
        <Text style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 13 }}>
          Источник snapshot: {snapshot.source === 'remote' ? 'живой backend' : 'fallback demo data'}
        </Text>
        <Text style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 13 }}>
          Последнее обновление: {updatedLabel}
        </Text>
        <Text style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 13 }}>
          Активных контроллеров: {snapshot.devices.filter((device) => device.connected).length}/{snapshot.devices.length}
        </Text>
      </View>

      <View style={{ alignItems: 'center', gap: 18 }}>
        <Pressable
          onPress={signOut}
          style={{
            width: '100%',
            borderRadius: 15,
            borderWidth: 1,
            borderColor: bloomPalette.border,
            backgroundColor: bloomPalette.surface,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 20,
          }}
        >
          <Text
            style={{
              color: bloomPalette.black,
              fontFamily: Fonts.rounded,
              fontSize: 14,
              fontWeight: '500',
              textDecorationLine: 'underline',
            }}
          >
            Выйти из сессии
          </Text>
        </Pressable>
        <Text style={{ color: 'rgba(0,0,0,0.6)', fontFamily: Fonts.rounded, fontSize: 12 }}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}
