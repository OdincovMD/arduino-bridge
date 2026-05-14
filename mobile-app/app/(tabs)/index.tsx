import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link } from 'expo-router';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { bloomAssets } from '@/constants/bloom-assets';
import { bloomPalette } from '@/constants/bloom';
import { bloomDemoFeed, bloomDemoPlants, bloomDemoStats } from '@/constants/bloom-demo';
import { Fonts } from '@/constants/theme';
import { useBackendSnapshot } from '@/hooks/use-backend-snapshot';
import { EnqueueCommandPayload, enqueueDeviceCommand } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

function percentageAverage(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export default function OverviewScreen() {
  const snapshot = useBackendSnapshot();
  const { token } = useAuth();
  const primaryDevice = snapshot.devices[0];
  const [sendingCommand, setSendingCommand] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const plants = snapshot.devices.flatMap((device) =>
    device.plants.map((plant, index) => ({
      ...plant,
      slug: device.slug,
      image: bloomAssets.gardenPlants[index % bloomAssets.gardenPlants.length],
    }))
  );

  const fallbackSlug = primaryDevice?.slug ?? bloomDemoFeed[0].slug;
  const visualPlants = plants.length
    ? plants
    : bloomDemoPlants.map((plant, index) => ({
        ...plant,
        slug: fallbackSlug,
        image: bloomAssets.gardenPlants[index % bloomAssets.gardenPlants.length],
      }));
  const featuredPlants = visualPlants.slice(0, 5);
  const liveDevices = snapshot.devices.filter((device) => device.connected).length || bloomDemoStats.liveDevices;
  const needsAttention = plants.length
    ? plants.filter((plant) => plant.levelPercent < 35).length
    : bloomDemoStats.needsAttention;
  const moisture = plants.length
    ? percentageAverage(plants.map((plant) => plant.levelPercent))
    : bloomDemoStats.moisture;
  const pendingCommands = snapshot.devices.reduce((sum, device) => sum + device.pendingCommands, 0);
  const feedCards = (snapshot.devices.length ? snapshot.devices : []).slice(0, 3);

  while (feedCards.length < 3) {
    const fallback = bloomDemoFeed[feedCards.length];
    if (!fallback) {
      break;
    }

    feedCards.push({
      ...fallback,
      slug: primaryDevice?.slug ?? fallback.slug,
      plantsOnline: 0,
      pendingCommands: 0,
      lightTemplate: 'Bloom default',
      lastHeartbeat: fallback.connected ? 'online' : 'offline',
      plants: [],
    });
  }

  async function handleQuickAction(action: 'light' | 'watering' | 'snapshot') {
    if (!token || !primaryDevice) {
      setFeedback('Сначала авторизуйтесь и дождитесь загрузки активной стойки.');
      return;
    }

    const payload: EnqueueCommandPayload =
      action === 'light'
        ? {
            command_name: 'LIGHT_MANUAL',
            args: { STATE: 'ON', PRIORITY: 'HIGH', DURATION: '1800' },
          }
        : action === 'watering'
          ? {
              command_name: 'WATERING_PULSE',
              args: { PLANT: '0', DURATION: '12' },
            }
          : {
              command_name: 'GET_SNAPSHOT',
              args: {},
            };

    const successLabel =
      action === 'light'
        ? 'Команда света поставлена в очередь до ближайшего heartbeat.'
        : action === 'watering'
          ? 'Импульс полива отправлен. Снимок обновится после подтверждения контроллера.'
          : 'Запрошен свежий snapshot состояния активной стойки.';

    setSendingCommand(action);
    setFeedback(null);

    try {
      await enqueueDeviceCommand(token, primaryDevice.slug, payload);
      setFeedback(successLabel);
      await snapshot.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Не удалось отправить команду');
    } finally {
      setSendingCommand(null);
    }
  }

  const spotlightHref = (primaryDevice ? `/device/${primaryDevice.slug}` : '/devices') as never;
  const operationalCards = [
    {
      title: 'Шаблон света',
      value: primaryDevice?.lightTemplate ?? 'Нет данных',
      description: 'Текущий профиль освещения для активной стойки.',
      icon: 'wb-sunny' as const,
    },
    {
      title: 'Зон на связи',
      value: `${liveDevices}`,
      description: 'Контроллеры, которые ответили последним heartbeat.',
      icon: 'sensors' as const,
    },
    {
      title: 'Требуют внимания',
      value: `${needsAttention}`,
      description: 'Контуры с влажностью ниже рабочего порога.',
      icon: 'warning-amber' as const,
    },
    {
      title: 'Очередь команд',
      value: `${pendingCommands}`.padStart(2, '0'),
      description: 'Команды ждут выдачи при следующем цикле связи.',
      icon: 'bolt' as const,
    },
  ];

  return (
    <>
      <StatusBar style="light" />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 126,
          gap: 18,
        }}
        refreshControl={<RefreshControl refreshing={snapshot.isRefreshing} onRefresh={() => void snapshot.refresh()} />}
        style={{ flex: 1, backgroundColor: bloomPalette.background }}
      >
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 282,
            overflow: 'hidden',
            borderBottomLeftRadius: 36,
            borderBottomRightRadius: 36,
          }}
        >
          <Image source={bloomAssets.plantDetailHero} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          <View
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: bloomPalette.heroOverlay,
            }}
          />
        </View>

        <View
          style={{
            marginTop: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              backgroundColor: bloomPalette.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name="spa" size={22} color={bloomPalette.primary} />
          </View>

          <View style={{ alignItems: 'center', gap: 3 }}>
            <Text
              style={{
                color: 'rgba(255,255,255,0.82)',
                fontFamily: Fonts.rounded,
                fontSize: 12,
              }}
            >
              Активная площадка
            </Text>
            <Text
              selectable
              style={{
                color: bloomPalette.surface,
                fontFamily: Fonts.rounded,
                fontSize: 15,
              }}
            >
              {primaryDevice?.name ?? 'Тепличный контур'}
            </Text>
          </View>

          <Link href={'/settings' as never} asChild>
            <Pressable
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                backgroundColor: bloomPalette.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="notifications-none" size={22} color={bloomPalette.primaryText} />
              <View
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 8,
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: bloomPalette.coral,
                }}
              />
            </Pressable>
          </Link>
        </View>

        <Link href="/devices" asChild>
          <Pressable
            style={{
              marginTop: 14,
              borderRadius: 30,
              backgroundColor: bloomPalette.surface,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              boxShadow: `0 12px 26px ${bloomPalette.shadow}`,
            }}
          >
            <MaterialIcons name="search" size={22} color={bloomPalette.mutedText} />
            <Text style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 14 }}>
              Найти стойку, зону или режим
            </Text>
          </Pressable>
        </Link>

        <View
          style={{
            marginTop: 22,
            borderRadius: 22,
            backgroundColor: bloomPalette.surface,
            paddingHorizontal: 18,
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: `0 16px 30px ${bloomPalette.shadow}`,
          }}
        >
          <View style={{ gap: 3, flex: 1, paddingRight: 16 }}>
            <Text
              selectable
              style={{
                color: bloomPalette.primaryText,
                fontFamily: Fonts.serif,
                fontSize: 34,
                lineHeight: 38,
              }}
            >
              {moisture}%
            </Text>
            <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 14 }}>
              Средняя влажность по живым зонам
            </Text>
            <Text style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 14 }}>
              {liveDevices} контроллера на связи, {pendingCommands} команд в очереди
            </Text>
          </View>

          <View style={{ width: 92, gap: 10 }}>
            <View
              style={{
                borderRadius: 18,
                backgroundColor: bloomPalette.surfaceSoft,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 12 }}>Порог</Text>
              <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.serif, fontSize: 18 }}>35%</Text>
            </View>
            <View
              style={{
                borderRadius: 18,
                backgroundColor: bloomPalette.surfaceSoft,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 12 }}>Риск</Text>
              <Text style={{ color: bloomPalette.warning, fontFamily: Fonts.serif, fontSize: 18 }}>
                {needsAttention}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 14 }}>
          {featuredPlants.map((plant, index) => (
            <View
              key={`${plant.slug}-${plant.name}`}
              style={{
                borderRadius: 22,
                backgroundColor: index === 0 ? bloomPalette.primary : bloomPalette.surface,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: index === 0 ? 6 : 7,
                paddingVertical: 6,
                minHeight: 44,
                minWidth: 44,
                boxShadow: index === 0 ? `0 12px 22px ${bloomPalette.shadow}` : undefined,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  overflow: 'hidden',
                  backgroundColor: bloomPalette.surfaceSoft,
                }}
              >
                <Image source={plant.image} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              </View>
              {index === 0 ? (
                <Text
                  selectable
                  style={{
                    marginLeft: 8,
                    marginRight: 10,
                    color: bloomPalette.surface,
                    fontFamily: Fonts.rounded,
                    fontSize: 12,
                  }}
                >
                  {plant.name}
                </Text>
              ) : null}
            </View>
          ))}
        </View>

        <View
          style={{
            borderRadius: 20,
            backgroundColor: bloomPalette.surface,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <View
            style={{
              width: 90,
              height: 126,
              borderRadius: 12,
              backgroundColor: bloomPalette.surfaceMuted,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <Image source={bloomAssets.gardenPlants[0]} style={{ width: 80, height: 110 }} contentFit="contain" />
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <Text
              selectable
              style={{
                color: bloomPalette.primary,
                fontFamily: Fonts.serif,
                fontSize: 28,
                lineHeight: 30,
              }}
            >
              Командный центр
            </Text>
            <Text
              selectable
              style={{
                color: bloomPalette.mutedText,
                fontFamily: Fonts.rounded,
                fontSize: 13,
                lineHeight: 19,
              }}
            >
              Откройте активную стойку, проверьте последний event, шаблон света и запустите ручной полив в один тап.
            </Text>
            <Link href={spotlightHref} asChild>
              <Pressable
                style={{
                  alignSelf: 'flex-start',
                  borderRadius: 999,
                  backgroundColor: bloomPalette.primary,
                  paddingHorizontal: 28,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: bloomPalette.surface, fontFamily: Fonts.rounded, fontSize: 12 }}>
                  Открыть стойку
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>

        <View
          style={{
            borderRadius: 22,
            backgroundColor: bloomPalette.surface,
            padding: 16,
            gap: 14,
          }}
        >
          <View style={{ gap: 4 }}>
            <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 16 }}>
              Быстрые действия
            </Text>
            <Text style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 13, lineHeight: 18 }}>
              Команды уходят в очередь активной стойки и подтверждаются на ближайшем heartbeat.
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[
              { key: 'light' as const, label: 'Свет', icon: 'wb-sunny' as const },
              { key: 'watering' as const, label: 'Полив', icon: 'water-drop' as const },
              { key: 'snapshot' as const, label: 'Снимок', icon: 'sync' as const },
            ].map((action) => (
              <Pressable
                key={action.key}
                disabled={sendingCommand !== null}
                onPress={() => {
                  void handleQuickAction(action.key);
                }}
                style={{
                  flex: 1,
                  borderRadius: 18,
                  backgroundColor: action.key === 'watering' ? bloomPalette.primary : bloomPalette.surfaceSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 14,
                  gap: 6,
                  borderWidth: action.key === 'watering' ? 0 : 1,
                  borderColor: bloomPalette.border,
                }}
              >
                {sendingCommand === action.key ? (
                  <ActivityIndicator color={action.key === 'watering' ? bloomPalette.surface : bloomPalette.primaryText} />
                ) : (
                  <>
                    <MaterialIcons
                      name={action.icon}
                      size={20}
                      color={action.key === 'watering' ? bloomPalette.surface : bloomPalette.primaryText}
                    />
                    <Text
                      style={{
                        color: action.key === 'watering' ? bloomPalette.surface : bloomPalette.primaryText,
                        fontFamily: Fonts.rounded,
                        fontSize: 13,
                      }}
                    >
                      {action.label}
                    </Text>
                  </>
                )}
              </Pressable>
            ))}
          </View>

          {feedback ? (
            <View
              style={{
                borderRadius: 16,
                backgroundColor: bloomPalette.surfaceSoft,
                paddingHorizontal: 14,
                paddingVertical: 12,
              }}
            >
              <Text style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 13, lineHeight: 19 }}>
                {feedback}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ gap: 14 }}>
          <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 24 }}>
            Состояние системы
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 }}>
            {operationalCards.map((card) => (
              <View
                key={card.title}
                style={{
                  width: '48%',
                  minHeight: 182,
                  borderRadius: 18,
                  backgroundColor: '#F7F7F7',
                  paddingHorizontal: 14,
                  paddingTop: 14,
                  paddingBottom: 16,
                  gap: 10,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    backgroundColor: bloomPalette.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name={card.icon} size={20} color={bloomPalette.primaryText} />
                </View>
                <Text
                  selectable
                  style={{
                    color: bloomPalette.primaryText,
                    fontFamily: Fonts.serif,
                    fontSize: 18,
                  }}
                >
                  {card.title}
                </Text>
                <Text
                  selectable
                  style={{
                    color: bloomPalette.primary,
                    fontFamily: Fonts.serif,
                    fontSize: 24,
                    lineHeight: 28,
                  }}
                >
                  {card.value}
                </Text>
                <Text
                  selectable
                  style={{
                    color: bloomPalette.mutedText,
                    fontFamily: Fonts.rounded,
                    fontSize: 12,
                    lineHeight: 18,
                  }}
                >
                  {card.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View
          style={{
            borderRadius: 18,
            backgroundColor: bloomPalette.surface,
            padding: 16,
            gap: 12,
          }}
        >
          <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 16 }}>
            Активные контроллеры
          </Text>
          {feedCards.map((device) => (
            <Link key={`${device.slug}-${device.name}`} href={`/device/${device.slug}`} asChild>
              <Pressable
                style={{
                  borderRadius: 16,
                  backgroundColor: bloomPalette.surfaceSoft,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.serif, fontSize: 18 }}>
                    {device.name}
                  </Text>
                  <Text style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 12 }}>
                    {device.lastEvent}
                  </Text>
                  <Text style={{ color: bloomPalette.mutedSoft, fontFamily: Fonts.rounded, fontSize: 12 }}>
                    {device.pendingCommands} в очереди • {device.lastHeartbeat}
                  </Text>
                </View>
                <MaterialIcons
                  name={device.connected ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={18}
                  color={device.connected ? bloomPalette.primary : bloomPalette.warning}
                />
              </Pressable>
            </Link>
          ))}
        </View>
      </ScrollView>
    </>
  );
}
