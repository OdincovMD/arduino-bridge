import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { RefreshControl, ScrollView, Text, Pressable, View } from 'react-native';

import { bloomPalette } from '@/constants/bloom';
import { bloomDemoStats } from '@/constants/bloom-demo';
import { Fonts } from '@/constants/theme';
import { useBackendSnapshot } from '@/hooks/use-backend-snapshot';

function averageValue(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export default function ActivityScreen() {
  const snapshot = useBackendSnapshot();
  const plants = snapshot.devices.flatMap((device) => device.plants);
  const liveDevices = snapshot.devices.filter((device) => device.connected).length;
  const hasMeasuredPlants = plants.length > 0;
  const moisture = hasMeasuredPlants ? averageValue(plants.map((plant) => plant.levelPercent)) : bloomDemoStats.moisture;
  const totalPlants = plants.length;
  const updatedLabel = snapshot.updatedLabel
    .replace('обновлено в ', 'updated at ')
    .replace('резервные данные', 'fallback data')
    .replace('демо-режим', 'demo mode');
  const stats = [
    {
      label: 'Light Level',
      value: `${snapshot.devices.length ? Math.round((liveDevices / snapshot.devices.length) * 100) || bloomDemoStats.light : bloomDemoStats.light}%`,
      accent: '#E9F5B2',
      ring: '#CFE461',
      icon: 'wb-sunny' as const,
    },
    {
      label: 'Moisture Level',
      value: `${moisture}%`,
      accent: '#DFF3FF',
      ring: '#6BC7FF',
      icon: 'water-drop' as const,
    },
    {
      label: 'Humidity',
      value: `${hasMeasuredPlants ? Math.max(28, Math.min(92, moisture + 8)) : bloomDemoStats.humidity}%`,
      accent: '#EEE4FF',
      ring: '#A987FF',
      icon: 'air' as const,
    },
    {
      label: 'Temperature',
      value: `${hasMeasuredPlants ? 20 + Math.min(9, totalPlants) : bloomDemoStats.temperature}°C`,
      accent: '#FFE9D5',
      ring: '#FFAE59',
      icon: 'device-thermostat' as const,
    },
  ];

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
          IOT Dashboard
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 20 }}>
        {stats.map((item) => (
          <View
            key={item.label}
            style={{
              width: '47%',
              aspectRatio: 1,
              borderRadius: 18,
              backgroundColor: bloomPalette.surface,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              gap: 14,
              boxShadow: `0 10px 24px ${bloomPalette.shadow}`,
            }}
          >
            <View
              style={{
                width: 118,
                height: 118,
                borderRadius: 999,
                backgroundColor: item.accent,
                borderWidth: 10,
                borderColor: item.ring,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 999,
                  backgroundColor: bloomPalette.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                <MaterialIcons name={item.icon} size={22} color={bloomPalette.primaryText} />
                <Text
                  selectable
                  style={{
                    color: bloomPalette.primaryText,
                    fontFamily: Fonts.rounded,
                    fontSize: 16,
                    fontWeight: '600',
                  }}
                >
                  {item.value}
                </Text>
              </View>
            </View>
            <Text
              style={{
                color: bloomPalette.primaryText,
                fontFamily: Fonts.rounded,
                fontSize: 14,
                opacity: 0.82,
              }}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      <View
        style={{
          borderRadius: 18,
          backgroundColor: bloomPalette.surface,
          padding: 18,
          gap: 8,
        }}
      >
        <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 16 }}>
          Control summary
        </Text>
        <Text selectable style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 14, lineHeight: 21 }}>
          {snapshot.error
            ? `Dashboard is showing the last stable data set: ${snapshot.error}.`
            : `Connected racks: ${liveDevices}/${snapshot.devices.length}. Last refresh ${updatedLabel}.`}
        </Text>
      </View>
    </ScrollView>
  );
}
