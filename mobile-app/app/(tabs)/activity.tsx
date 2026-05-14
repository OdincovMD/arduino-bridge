import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { RefreshControl, ScrollView, Text, Pressable, View } from 'react-native';

import { bloomPalette } from '@/constants/bloom';
import { Fonts } from '@/constants/theme';
import { useBackendSnapshot } from '@/hooks/use-backend-snapshot';

function statusColor(connected: boolean) {
  return connected ? bloomPalette.primary : bloomPalette.warning;
}

export default function ActivityScreen() {
  const snapshot = useBackendSnapshot();
  const updatedLabel = snapshot.updatedLabel
    .replace('обновлено в ', '')
    .replace('резервные данные', 'резервный набор')
    .replace('демо-режим', 'демо-режим');

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 126,
        gap: 20,
      }}
      refreshControl={<RefreshControl refreshing={snapshot.isRefreshing} onRefresh={() => void snapshot.refresh()} />}
      style={{ flex: 1, backgroundColor: bloomPalette.background }}
    >
      <View
        style={{
          marginTop: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          onPress={() => router.replace('/')}
          style={{
            width: 44,
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
        <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 18 }}>
          Пульс системы
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.serif, fontSize: 28 }}>Очередь и события</Text>
        <Text style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 13, lineHeight: 19 }}>
          Здесь видно, что уже доставлено на контроллеры, что ждёт heartbeat и какие площадки отдали последние события.
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 }}>
        {snapshot.commandStats.map((item, index) => (
          <View
            key={item.label}
            style={{
              width: index === 2 ? '100%' : '48%',
              borderRadius: 20,
              backgroundColor: index === 0 ? bloomPalette.primary : bloomPalette.surface,
              paddingHorizontal: 16,
              paddingVertical: 18,
              gap: 6,
              boxShadow: `0 10px 24px ${bloomPalette.shadow}`,
            }}
          >
            <Text
              style={{
                color: index === 0 ? 'rgba(255,255,255,0.76)' : bloomPalette.mutedText,
                fontFamily: Fonts.rounded,
                fontSize: 12,
              }}
            >
              {item.label}
            </Text>
            <Text
              selectable
              style={{
                color: index === 0 ? bloomPalette.surface : bloomPalette.primaryText,
                fontFamily: Fonts.serif,
                fontSize: 30,
                lineHeight: 34,
              }}
            >
              {item.value}
            </Text>
          </View>
        ))}
      </View>

      <View
        style={{
          borderRadius: 18,
          backgroundColor: bloomPalette.surface,
          padding: 18,
          gap: 10,
        }}
      >
        <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 16 }}>
          Последняя синхронизация
        </Text>
        <Text selectable style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 14, lineHeight: 21 }}>
          {snapshot.error
            ? `Работаем на резервных данных: ${snapshot.error}.`
            : `Снимок обновлён в ${updatedLabel}. Источник: ${snapshot.source === 'remote' ? 'живой backend' : 'локальный fallback'}.`}
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 16 }}>Лента событий</Text>
        {snapshot.activity.map((item) => (
          <View
            key={item.id}
            style={{
              borderRadius: 18,
              backgroundColor: bloomPalette.surface,
              paddingHorizontal: 16,
              paddingVertical: 14,
              gap: 6,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.serif, fontSize: 18 }}>{item.title}</Text>
              <Text style={{ color: bloomPalette.mutedSoft, fontFamily: Fonts.rounded, fontSize: 12 }}>{item.time}</Text>
            </View>
            <Text selectable style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 13, lineHeight: 19 }}>
              {item.description}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ gap: 12 }}>
        <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 16 }}>Контроллеры на линии</Text>
        {snapshot.devices.map((device) => (
          <View
            key={device.slug}
            style={{
              borderRadius: 18,
              backgroundColor: bloomPalette.surface,
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.serif, fontSize: 18 }}>{device.name}</Text>
              <Text style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 13 }}>
                {device.plantsOnline} зон • {device.pendingCommands} в очереди
              </Text>
              <Text style={{ color: bloomPalette.mutedSoft, fontFamily: Fonts.rounded, fontSize: 12 }}>{device.lastHeartbeat}</Text>
            </View>
            <View
              style={{
                borderRadius: 999,
                backgroundColor: device.connected ? '#EAF4EA' : '#FFF0EF',
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  color: statusColor(device.connected),
                  fontFamily: Fonts.rounded,
                  fontSize: 12,
                }}
              >
                {device.connected ? 'на связи' : 'оффлайн'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
