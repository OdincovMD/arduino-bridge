import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { bloomAssets } from '@/constants/bloom-assets';
import { bloomPalette } from '@/constants/bloom';
import { bloomDemoPlants } from '@/constants/bloom-demo';
import { Fonts } from '@/constants/theme';
import { useBackendSnapshot } from '@/hooks/use-backend-snapshot';
import { EnqueueCommandPayload, enqueueDeviceCommand } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

export default function DeviceDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const snapshot = useBackendSnapshot();
  const { token } = useAuth();
  const device = snapshot.devices.find((entry) => entry.slug === slug);
  const [sendingCommand, setSendingCommand] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const firstPlant = device?.plants[0];
  const displayPlant = firstPlant ?? bloomDemoPlants[0];
  const descriptionCopy = firstPlant
    ? `${device?.lastEvent} Keep this plant in a calm, bright corner and keep the root zone evenly hydrated for the healthiest foliage.`
    : 'A glossy tropical plant that enjoys balanced moisture, bright filtered light and a quick daily foliage check.';

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
        ? 'Light command queued for the next device heartbeat.'
        : action === 'watering'
          ? 'Watering started. Updated moisture will appear in a few seconds.'
          : 'Snapshot refresh requested for this greenhouse.';

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
            Plant not found
          </Text>
          <Text style={{ color: bloomPalette.mutedText, fontFamily: Fonts.rounded, fontSize: 14, lineHeight: 22 }}>
            Return to the garden list and refresh the screen.
          </Text>
        </View>
      </>
    );
  }

  const conditionCards = [
    {
      title: 'Water',
      value: displayPlant.moisture,
      color: bloomPalette.yellow,
      icon: 'water-drop' as const,
    },
    {
      title: 'Sunlight',
      value: device.lightTemplate.replace('Шаблон', 'Template'),
      color: bloomPalette.purple,
      icon: 'wb-sunny' as const,
    },
    {
      title: 'Fertilizer',
      value: displayPlant.mode,
      color: bloomPalette.coral,
      icon: 'air' as const,
    },
    {
      title: 'Humidity',
      value: `${Math.max(32, displayPlant.levelPercent)}%`,
      color: bloomPalette.orange,
      icon: 'opacity' as const,
    },
  ];

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
              Description
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
              Favored Conditions
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
                Water now
              </Text>
            )}
          </Pressable>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            {[
              { key: 'light' as const, label: 'Light' },
              { key: 'snapshot' as const, label: 'Refresh' },
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
        </View>
      </ScrollView>
    </>
  );
}
