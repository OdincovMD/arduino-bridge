import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { DeviceStatusPill } from '@/components/device-status-pill';
import { SectionCard } from '@/components/section-card';
import { StatTile } from '@/components/stat-tile';
import { Colors, Fonts } from '@/constants/theme';
import { useBackendSnapshot } from '@/hooks/use-backend-snapshot';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { EnqueueCommandPayload, enqueueDeviceCommand } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

export default function DeviceDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colorScheme = useColorScheme() ?? 'dark';
  const palette = Colors[colorScheme];
  const snapshot = useBackendSnapshot();
  const { token } = useAuth();
  const device = snapshot.devices.find((entry) => entry.slug === slug);
  const [sendingCommand, setSendingCommand] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const needsWaterNow = device?.plants.filter((plant) => plant.levelPercent < 35).length ?? 0;

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
              args: { PLANT: '0', DURATION: '12' },
            }
          : {
              command_name: 'GET_SNAPSHOT',
              args: {},
            };

    const successLabel =
      action === 'light'
        ? 'Свет включится в ближайшее обновление.'
        : action === 'watering'
          ? 'Полив запущен. Изменение появится через пару секунд.'
          : 'Мы обновляем данные по этой теплице.';

    setSendingCommand(action);
    setFeedback(null);

    try {
      await enqueueDeviceCommand(token, device.slug, payload);
      setFeedback(successLabel);
      await snapshot.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Не удалось отправить команду');
    } finally {
      setSendingCommand(null);
    }
  }

  if (!device) {
    return (
      <>
        <Stack.Screen options={{ title: 'Устройство' }} />
        <View
          style={{
            flex: 1,
            padding: 24,
            justifyContent: 'center',
            backgroundColor: palette.background,
          }}
        >
          <SectionCard title="Устройство не найдено">
            <Text style={{ color: palette.muted, fontFamily: Fonts.rounded, fontSize: 14, lineHeight: 22 }}>
              Эта теплица пока недоступна. Вернитесь к списку и попробуйте обновить экран.
            </Text>
          </SectionCard>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: device.name }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          padding: 20,
          gap: 18,
        }}
        refreshControl={<RefreshControl refreshing={snapshot.isRefreshing} onRefresh={() => void snapshot.refresh()} />}
        style={{ flex: 1, backgroundColor: palette.background }}
      >
        <View
          style={{
            borderRadius: 32,
            backgroundColor: palette.hero,
            borderWidth: 1,
            borderColor: palette.lineStrong,
            padding: 20,
            gap: 18,
            boxShadow: `0 22px 48px ${palette.shadow}`,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
            >
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: palette.heroMuted, fontFamily: Fonts.rounded, fontSize: 12 }}>
                Теплица
              </Text>
              <Text
                selectable
                style={{
                  color: palette.heroText,
                  fontFamily: Fonts.serif,
                  fontSize: 30,
                }}
              >
                {device.name}
              </Text>
              <Text style={{ color: palette.heroMuted, fontFamily: Fonts.rounded, fontSize: 13 }}>{device.lastEvent}</Text>
            </View>
            <DeviceStatusPill connected={device.connected} inverted />
          </View>

          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            <StatTile label="Свет" value={device.lightTemplate} accent />
            <StatTile label="Растений" value={`${device.plants.length}`} />
            <StatTile label="Связь" value={device.lastHeartbeat} />
          </View>
        </View>

        {needsWaterNow > 0 ? (
          <SectionCard title="Требует внимания">
            <Text style={{ color: palette.text, fontFamily: Fonts.serif, fontSize: 22, lineHeight: 28 }}>
              {needsWaterNow} {needsWaterNow === 1 ? 'зона выглядит сухой' : 'зоны выглядят сухими'}
            </Text>
            <Text style={{ color: palette.muted, fontFamily: Fonts.rounded, fontSize: 14, lineHeight: 22 }}>
              Вы можете запустить полив прямо сейчас или сначала обновить данные, чтобы проверить свежую влажность.
            </Text>
          </SectionCard>
        ) : null}

        <SectionCard title="Быстрые действия">
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            {[
              { key: 'light' as const, label: 'Включить свет' },
              { key: 'watering' as const, label: 'Полить сейчас' },
              { key: 'snapshot' as const, label: 'Обновить данные' },
            ].map((action) => (
              <Pressable
                key={action.key}
                disabled={sendingCommand !== null}
                onPress={() => {
                  void handleQuickAction(action.key);
                }}
                style={{
                  flexBasis: '31%',
                  minWidth: 96,
                  borderRadius: 20,
                  backgroundColor: palette.badge,
                  paddingVertical: 16,
                  paddingHorizontal: 14,
                  opacity: sendingCommand && sendingCommand !== action.key ? 0.55 : 1,
                }}
              >
                {sendingCommand === action.key ? (
                  <ActivityIndicator color={palette.text} />
                ) : (
                  <Text
                    style={{
                      color: palette.text,
                      fontFamily: Fonts.rounded,
                      fontSize: 13,
                      textAlign: 'center',
                    }}
                  >
                    {action.label}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
          <Text style={{ color: palette.muted, fontFamily: Fonts.rounded, fontSize: 13, lineHeight: 20 }}>
            Выберите нужное действие, и приложение сразу отправит запрос на теплицу.
          </Text>
          {feedback ? (
            <View
              style={{
                borderRadius: 18,
                backgroundColor: palette.cardSoft,
                paddingHorizontal: 14,
                paddingVertical: 12,
              }}
            >
              <Text style={{ color: palette.text, fontFamily: Fonts.rounded, fontSize: 13, lineHeight: 20 }}>
                {feedback}
              </Text>
            </View>
          ) : null}
        </SectionCard>

        <SectionCard title="Растения и влажность">
          <View style={{ gap: 10 }}>
            {device.plants.map((plant) => (
              <View
                key={plant.name}
                style={{
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: palette.line,
                  backgroundColor: palette.cardSoft,
                  padding: 16,
                  gap: 10,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View>
                    <Text style={{ color: palette.text, fontFamily: Fonts.serif, fontSize: 18 }}>
                      {plant.name}
                    </Text>
                    <Text style={{ color: palette.muted, fontFamily: Fonts.rounded, fontSize: 12 }}>
                      {plant.mode}
                    </Text>
                  </View>
                  <Text
                    selectable
                    style={{
                      color: palette.text,
                      fontFamily: Fonts.mono,
                      fontSize: 13,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {plant.moisture}
                  </Text>
                </View>
                <Text style={{ color: plant.levelPercent > 55 ? palette.accent : palette.warning, fontFamily: Fonts.rounded, fontSize: 12 }}>
                  {plant.levelPercent > 55
                    ? 'Запас влаги хороший'
                    : plant.levelPercent > 35
                      ? 'Нормальный уровень'
                      : 'Стоит проверить полив'}
                </Text>
                <View
                  style={{
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: palette.barTrack,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      width: `${Math.max(8, Math.min(100, plant.levelPercent))}%`,
                      height: '100%',
                      borderRadius: 999,
                      backgroundColor: plant.levelPercent > 55 ? palette.accent : palette.warning,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Что было недавно">
          <Text selectable style={{ color: palette.text, fontFamily: Fonts.rounded, fontSize: 14, lineHeight: 22 }}>
            {device.lastEvent}
          </Text>
        </SectionCard>
      </ScrollView>
    </>
  );
}
