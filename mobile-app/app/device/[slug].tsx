import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { bloomAssets } from '@/constants/bloom-assets';
import { bloomPalette } from '@/constants/bloom';
import { Fonts } from '@/constants/theme';
import { useBackendSnapshot } from '@/hooks/use-backend-snapshot';
import { EnqueueCommandPayload, enqueueDeviceCommand } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

export default function DeviceDetailScreen() {
  const params = useLocalSearchParams<{ slug?: string | string[]; plant?: string | string[] }>();
  const snapshot = useBackendSnapshot();
  const { token } = useAuth();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const plantParam = Array.isArray(params.plant) ? params.plant[0] : params.plant;
  const device = snapshot.devices.find((entry) => entry.slug === slug);
  const detail = device ? snapshot.detailsBySlug[device.slug] : undefined;
  const [sendingCommand, setSendingCommand] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const requestedPlantIndex = plantParam ? Number.parseInt(plantParam, 10) : 0;
  const selectedPlantIndex = Number.isInteger(requestedPlantIndex) && requestedPlantIndex >= 0 ? requestedPlantIndex : 0;
  const selectedPlant = device?.plants[selectedPlantIndex];
  const fallbackPlant = device?.plants[0];
  const activePlantIndex = selectedPlant ? selectedPlantIndex : 0;
  const displayPlant = selectedPlant ?? fallbackPlant ?? {
    name: `Зона ${activePlantIndex + 1}`,
    mode: 'Ожидает snapshot',
    moisture: '--',
    levelPercent: 0,
  };
  const descriptionCopy = selectedPlant ?? fallbackPlant
    ? `${detail?.latestStateSummary ?? device?.lastEvent} Контур работает в режиме "${displayPlant.mode.toLowerCase()}". Проверьте влажность и при необходимости отправьте ручную команду без выхода из экрана.`
    : 'Контур ожидает первый live snapshot. Пока можно проверить связь, шаблон света и доступность ручного полива.';

  const telemetryFeed = useMemo(
    () => [...(detail?.states ?? []), ...(detail?.heartbeats ?? [])].slice(0, 4),
    [detail?.heartbeats, detail?.states]
  );

  async function handleQuickAction(action: 'light' | 'watering' | 'snapshot') {
    if (!token || !device) {
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
              args: { PLANT: `${activePlantIndex}`, DURATION: '12' },
            }
          : {
              command_name: 'GET_SNAPSHOT',
              args: {},
            };

    const successLabel =
      action === 'light'
        ? 'Команда света поставлена в очередь для этого контроллера.'
        : action === 'watering'
          ? 'Ручной полив отправлен. Обновление влажности появится после ack.'
          : 'Запрошен новый snapshot по текущему контуру.';

    setSendingCommand(action);
    setFeedback(null);

    try {
      await enqueueDeviceCommand(token, device.slug, payload);
      setFeedback(successLabel);
      await snapshot.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to send the command');
    } finally {
      setSendingCommand(null);
    }
  }

  if (!device) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View
          style={{
            flex: 1,
            backgroundColor: bloomPalette.background,
            padding: 24,
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.serif, fontSize: 28 }}>
            Контур не найден
          </Text>
          <Text style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 14, lineHeight: 22 }}>
            Вернитесь к списку зон и обновите экран.
          </Text>
        </View>
      </>
    );
  }

  const conditionCards = [
    {
      title: 'Влажность',
      value: displayPlant.moisture,
      color: bloomPalette.yellow,
      icon: 'water-drop' as const,
    },
    {
      title: 'Свет',
      value: device.lightTemplate.replace('Шаблон', 'Профиль'),
      color: bloomPalette.purple,
      icon: 'wb-sunny' as const,
    },
    {
      title: 'Режим',
      value: displayPlant.mode,
      color: bloomPalette.coral,
      icon: 'tune' as const,
    },
    {
      title: 'Связь',
      value: device.lastHeartbeat,
      color: bloomPalette.orange,
      icon: 'sensors' as const,
    },
  ];

  const commandToneStyles = {
    neutral: {
      backgroundColor: bloomPalette.surfaceMuted,
      color: bloomPalette.primaryText,
    },
    success: {
      backgroundColor: '#EAF4EA',
      color: bloomPalette.primary,
    },
    warning: {
      backgroundColor: '#FFF0EF',
      color: bloomPalette.warning,
    },
  } as const;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingBottom: 28,
        }}
        refreshControl={<RefreshControl refreshing={snapshot.isRefreshing} onRefresh={() => void snapshot.refresh()} />}
        style={{ flex: 1, backgroundColor: bloomPalette.background }}
      >
        <View style={{ height: 302 }}>
          <Image source={bloomAssets.plantDetailHero} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          <Pressable
            onPress={() => router.back()}
            style={{
              position: 'absolute',
              top: 52,
              left: 20,
              width: 44,
              height: 44,
              borderRadius: 40,
              backgroundColor: bloomPalette.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name="arrow-back-ios-new" size={18} color={bloomPalette.primaryText} />
          </Pressable>
        </View>

        <View
          style={{
            marginTop: -24,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            backgroundColor: bloomPalette.background,
            paddingHorizontal: 20,
            paddingTop: 28,
            gap: 22,
          }}
        >
          <View style={{ gap: 10 }}>
            <Text
              selectable
              style={{
                color: bloomPalette.primaryText,
                fontFamily: Fonts.serif,
                fontSize: 24,
                lineHeight: 30,
              }}
            >
              {`${displayPlant.name} · ${device.name}`}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <View
                style={{
                  borderRadius: 999,
                  backgroundColor: device.connected ? '#EAF4EA' : '#FFF0EF',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={{
                    color: device.connected ? bloomPalette.primary : bloomPalette.warning,
                    fontFamily: Fonts.rounded,
                    fontSize: 11,
                  }}
                >
                  {device.connected ? 'На связи' : 'Оффлайн'}
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
                  {device.pendingCommands} команд в очереди
                </Text>
              </View>
            </View>
          </View>

          <View
            style={{
              borderBottomWidth: 0.3,
              borderBottomColor: bloomPalette.mutedText,
              paddingBottom: 18,
              gap: 8,
            }}
          >
            <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 14, fontWeight: '500' }}>
              Статус контура
            </Text>
            <Text
              selectable
              style={{
                color: bloomPalette.mutedText,
                fontFamily: Fonts.rounded,
                fontSize: 14,
                lineHeight: 22,
              }}
            >
              {descriptionCopy}
            </Text>
          </View>

          <View style={{ gap: 14 }}>
            <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 14, fontWeight: '500' }}>
              Оперативные параметры
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 }}>
              {conditionCards.map((item) => (
                <View
                  key={item.title}
                  style={{
                    width: '47%',
                    borderRadius: 18,
                    backgroundColor: bloomPalette.surface,
                    padding: 14,
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 10,
                      backgroundColor: item.color,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialIcons name={item.icon} size={24} color={bloomPalette.primaryText} />
                  </View>
                  <Text style={{ color: item.color, fontFamily: Fonts.rounded, fontSize: 14 }}>{item.title}</Text>
                  <Text selectable style={{ color: '#1A3025', fontFamily: Fonts.rounded, fontSize: 13 }}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <Pressable
            disabled={sendingCommand !== null}
            onPress={() => {
              void handleQuickAction('watering');
            }}
            style={{
              borderRadius: 999,
              backgroundColor: bloomPalette.primary,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 16,
              opacity: sendingCommand && sendingCommand !== 'watering' ? 0.68 : 1,
            }}
          >
            {sendingCommand === 'watering' ? (
              <ActivityIndicator color={bloomPalette.surface} />
            ) : (
              <Text style={{ color: bloomPalette.surface, fontFamily: Fonts.rounded, fontSize: 18 }}>
                Запустить полив
              </Text>
            )}
          </Pressable>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            {[
              { key: 'light' as const, label: 'Включить свет' },
              { key: 'snapshot' as const, label: 'Обновить снимок' },
            ].map((action) => (
              <Pressable
                key={action.key}
                disabled={sendingCommand !== null}
                onPress={() => {
                  void handleQuickAction(action.key);
                }}
                style={{
                  flex: 1,
                  borderRadius: 999,
                  backgroundColor: bloomPalette.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 14,
                  borderWidth: 1,
                  borderColor: bloomPalette.border,
                }}
              >
                {sendingCommand === action.key ? (
                  <ActivityIndicator color={bloomPalette.primaryText} />
                ) : (
                  <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 14 }}>
                    {action.label}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>

          {feedback ? (
            <View
              style={{
                borderRadius: 18,
                backgroundColor: bloomPalette.surface,
                paddingHorizontal: 14,
                paddingVertical: 12,
              }}
            >
              <Text style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 13, lineHeight: 20 }}>
                {feedback}
              </Text>
            </View>
          ) : null}

          <View style={{ gap: 12 }}>
            <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 15, fontWeight: '500' }}>
              Последние команды
            </Text>
            {detail?.commands.length ? (
              detail.commands.map((command) => {
                const tone = commandToneStyles[command.tone];
                return (
                  <View
                    key={command.id}
                    style={{
                      borderRadius: 18,
                      backgroundColor: bloomPalette.surface,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      gap: 8,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                      <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.serif, fontSize: 17 }}>
                        {command.label}
                      </Text>
                      <Text style={{ color: bloomPalette.mutedSoft, fontFamily: Fonts.rounded, fontSize: 12 }}>
                        {command.time}
                      </Text>
                    </View>
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        borderRadius: 999,
                        backgroundColor: tone.backgroundColor,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                      }}
                    >
                      <Text style={{ color: tone.color, fontFamily: Fonts.rounded, fontSize: 12 }}>
                        {command.statusLabel}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View
                style={{
                  borderRadius: 18,
                  backgroundColor: bloomPalette.surface,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <Text style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 13, lineHeight: 20 }}>
                  Команды для этого контура ещё не попадали в очередь backend.
                </Text>
              </View>
            )}
          </View>

          <View style={{ gap: 12 }}>
            <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 15, fontWeight: '500' }}>
              Состояние и heartbeat
            </Text>
            {telemetryFeed.length ? (
              telemetryFeed.map((entry) => (
                <View
                  key={entry.id}
                  style={{
                    borderRadius: 18,
                    backgroundColor: bloomPalette.surface,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    gap: 6,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                    <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 14 }}>
                      {'label' in entry ? entry.label : 'HEARTBEAT'}
                    </Text>
                    <Text style={{ color: bloomPalette.mutedSoft, fontFamily: Fonts.rounded, fontSize: 12 }}>
                      {entry.time}
                    </Text>
                  </View>
                  <Text style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 13, lineHeight: 20 }}>
                    {entry.description}
                  </Text>
                </View>
              ))
            ) : (
              <View
                style={{
                  borderRadius: 18,
                  backgroundColor: bloomPalette.surface,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <Text style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 13, lineHeight: 20 }}>
                  Живые state и heartbeat записи появятся после следующего цикла обмена контроллера с сервером.
                </Text>
              </View>
            )}
          </View>

          <View style={{ gap: 12 }}>
            <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.rounded, fontSize: 15, fontWeight: '500' }}>
              Последние события
            </Text>
            {detail?.events.length ? (
              detail.events.map((event) => (
                <View
                  key={event.id}
                  style={{
                    borderRadius: 18,
                    backgroundColor: bloomPalette.surface,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    gap: 6,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                    <Text style={{ color: bloomPalette.primaryText, fontFamily: Fonts.serif, fontSize: 17 }}>
                      {event.title}
                    </Text>
                    <Text style={{ color: bloomPalette.mutedSoft, fontFamily: Fonts.rounded, fontSize: 12 }}>
                      {event.time}
                    </Text>
                  </View>
                  <Text style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 13, lineHeight: 20 }}>
                    {event.description}
                  </Text>
                </View>
              ))
            ) : (
              <View
                style={{
                  borderRadius: 18,
                  backgroundColor: bloomPalette.surface,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <Text style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 13, lineHeight: 20 }}>
                  Пока нет событий от этого контура. После первого `EVT` лента появится автоматически.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
