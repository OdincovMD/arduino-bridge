import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link, router } from 'expo-router';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { bloomAssets } from '@/constants/bloom-assets';
import { bloomPalette } from '@/constants/bloom';
import { bloomDemoFeed, bloomDemoPlants } from '@/constants/bloom-demo';
import { Fonts } from '@/constants/theme';
import { useBackendSnapshot } from '@/hooks/use-backend-snapshot';

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function DevicesScreen() {
  const snapshot = useBackendSnapshot();
  const [mode, setMode] = useState<'plants' | 'schedule'>('plants');
  const [selectedDay, setSelectedDay] = useState('Wed');

  const plantCards = useMemo(
    () =>
      snapshot.devices.flatMap((device, deviceIndex) =>
        device.plants.map((plant, index) => ({
          ...plant,
          slug: device.slug,
          deviceName: device.name,
          pendingCommands: device.pendingCommands,
          lightTemplate: device.lightTemplate,
          connected: device.connected,
          heartbeat: device.lastHeartbeat,
          image: bloomAssets.gardenPlants[(deviceIndex + index) % bloomAssets.gardenPlants.length],
          status:
            plant.levelPercent < 35 ? 'Нужна проверка' : plant.levelPercent < 55 ? 'Рабочая зона' : 'Стабильный контур',
        }))
      ),
    [snapshot.devices]
  );
  const fallbackSlug = snapshot.devices[0]?.slug ?? bloomDemoFeed[0].slug;
  const visualPlantCards = plantCards.length
    ? plantCards
    : bloomDemoPlants.map((plant, index) => ({
        ...plant,
        slug: snapshot.devices[index % Math.max(snapshot.devices.length, 1)]?.slug ?? fallbackSlug,
        deviceName:
          snapshot.devices[index % Math.max(snapshot.devices.length, 1)]?.name ??
          bloomDemoFeed[index % bloomDemoFeed.length].name,
        pendingCommands: snapshot.devices[index % Math.max(snapshot.devices.length, 1)]?.pendingCommands ?? 0,
        lightTemplate: snapshot.devices[index % Math.max(snapshot.devices.length, 1)]?.lightTemplate ?? 'Утренний цикл',
        connected: snapshot.devices[index % Math.max(snapshot.devices.length, 1)]?.connected ?? true,
        heartbeat: snapshot.devices[index % Math.max(snapshot.devices.length, 1)]?.lastHeartbeat ?? 'online',
        image: bloomAssets.gardenPlants[index % bloomAssets.gardenPlants.length],
        status: plant.levelPercent < 35 ? 'Нужна проверка' : 'Рабочая зона',
      }));

  const scheduleCards = visualPlantCards.slice(0, 4).map((plant, index) => ({
    title: plant.name,
    greenhouse: plant.deviceName,
    time: ['09:00', '13:30', '18:00', '21:15'][index] ?? '09:00',
    repeat: index === 1 ? 'Каждую неделю' : 'Каждый день',
    action: index % 2 === 0 ? 'Полив' : 'Свет',
    profile: plant.lightTemplate,
  }));

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 126,
        gap: 18,
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
        <Text
          style={{
            color: bloomPalette.primaryText,
            fontFamily: Fonts.rounded,
            fontSize: 18,
          }}
        >
          Зоны теплицы
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.serif, fontSize: 28 }}>Контуры и расписания</Text>
        <Text style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 13, lineHeight: 19 }}>
          Переключайтесь между зонами и графиком, чтобы быстро понять, где работает автоматический полив, а где нужна ручная команда.
        </Text>
      </View>

      <View
        style={{
          borderRadius: 15,
          backgroundColor: bloomPalette.surface,
          padding: 6,
          flexDirection: 'row',
        }}
      >
        <Pressable
          onPress={() => setMode('plants')}
          style={{
            flex: 1,
            borderRadius: 12,
            backgroundColor: mode === 'plants' ? bloomPalette.primary : 'transparent',
            paddingVertical: 12,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: mode === 'plants' ? bloomPalette.surface : bloomPalette.primaryText,
              fontFamily: Fonts.rounded,
              fontSize: 14,
            }}
          >
            Зоны
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode('schedule')}
          style={{
            flex: 1,
            borderRadius: 12,
            backgroundColor: mode === 'schedule' ? bloomPalette.primary : 'transparent',
            paddingVertical: 12,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: mode === 'schedule' ? bloomPalette.surface : bloomPalette.primaryText,
              fontFamily: Fonts.rounded,
              fontSize: 14,
            }}
          >
            Расписание
          </Text>
        </Pressable>
      </View>

      {mode === 'plants' ? (
        <View style={{ gap: 14 }}>
          {visualPlantCards.slice(0, 6).map((plant) => (
            <Link key={`${plant.slug}-${plant.name}`} href={`/device/${plant.slug}`} asChild>
              <Pressable
                style={{
                  borderRadius: 16,
                  backgroundColor: bloomPalette.surface,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: `0 10px 22px ${bloomPalette.shadow}`,
                }}
              >
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 12,
                    backgroundColor: '#E2E2E2',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <Image source={plant.image} style={{ width: 56, height: 58 }} contentFit="contain" />
                </View>

                <View style={{ flex: 1, gap: 5 }}>
                  <Text
                    selectable
                    style={{
                      color: bloomPalette.primary,
                      fontFamily: Fonts.serif,
                      fontSize: 18,
                    }}
                  >
                    {plant.name}
                  </Text>
                  <Text
                    style={{
                      color: plant.levelPercent < 35 ? bloomPalette.warning : bloomPalette.mutedText,
                      fontFamily: Fonts.rounded,
                      fontSize: 13,
                    }}
                  >
                    {plant.status}
                  </Text>
                  <Text style={{ color: bloomPalette.mutedSoft, fontFamily: Fonts.rounded, fontSize: 12 }}>
                    {plant.deviceName} • {plant.heartbeat}
                  </Text>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    <View
                      style={{
                        borderRadius: 999,
                        backgroundColor: '#ECF5ED',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                      }}
                    >
                      <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 11 }}>
                        {plant.moisture}
                      </Text>
                    </View>
                    <View
                      style={{
                        borderRadius: 999,
                        backgroundColor: bloomPalette.surfaceMuted,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                      }}
                    >
                      <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 11 }}>
                        {plant.mode}
                      </Text>
                    </View>
                    <View
                      style={{
                        borderRadius: 999,
                        backgroundColor: plant.connected ? '#EAF4EA' : '#FFF0EF',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: plant.connected ? bloomPalette.primary : bloomPalette.warning,
                          fontFamily: Fonts.rounded,
                          fontSize: 11,
                        }}
                      >
                        {plant.pendingCommands} в очереди
                      </Text>
                    </View>
                  </View>
                </View>

                <MaterialIcons name="chevron-right" size={24} color={bloomPalette.mutedText} />
              </Pressable>
            </Link>
          ))}
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            {dayLabels.map((day) => (
              <Pressable
                key={day}
                onPress={() => setSelectedDay(day)}
                style={{
                  width: 40,
                  height: 56,
                  borderRadius: 18,
                  backgroundColor: selectedDay === day ? bloomPalette.primary : bloomPalette.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: selectedDay === day ? bloomPalette.surface : bloomPalette.primaryText,
                    fontFamily: Fonts.rounded,
                    fontSize: 12,
                  }}
                >
                  {day}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 18 }}>
            {selectedDay === 'Wed' ? 'Среда' : selectedDay}
          </Text>

          <View style={{ gap: 14 }}>
            {scheduleCards.map((item) => (
              <View
                key={`${item.title}-${item.time}`}
                style={{
                  borderRadius: 18,
                  backgroundColor: bloomPalette.surface,
                  padding: 16,
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ gap: 4, flex: 1, paddingRight: 12 }}>
                    <Text style={{ color: bloomPalette.primary, fontFamily: Fonts.serif, fontSize: 18 }}>
                      {item.title}
                    </Text>
                    <Text style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 13 }}>
                      {item.greenhouse}
                    </Text>
                  </View>
                  <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 13 }}>
                    {item.time}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <View
                    style={{
                      borderRadius: 999,
                      backgroundColor: bloomPalette.surfaceMuted,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                    }}
                  >
                    <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 12 }}>
                      {item.repeat}
                    </Text>
                  </View>
                  <View
                    style={{
                      borderRadius: 999,
                      backgroundColor: bloomPalette.surfaceMuted,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                    }}
                  >
                    <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 12 }}>
                      {item.action}
                    </Text>
                  </View>
                  <View
                    style={{
                      borderRadius: 999,
                      backgroundColor: '#ECF5ED',
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                    }}
                  >
                    <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 12 }}>
                      {item.profile}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 999,
                backgroundColor: bloomPalette.primary,
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 12px 26px ${bloomPalette.shadow}`,
              }}
            >
              <MaterialIcons name="edit-calendar" size={22} color={bloomPalette.surface} />
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}
