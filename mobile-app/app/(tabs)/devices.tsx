import { Link } from 'expo-router';
import { RefreshControl, Pressable, ScrollView, Text, View } from 'react-native';

import { DeviceStatusPill } from '@/components/device-status-pill';
import { SectionCard } from '@/components/section-card';
import { ShellHeader } from '@/components/shell-header';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
import { useBackendSnapshot } from '@/hooks/use-backend-snapshot';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function DevicesScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const palette = Colors[colorScheme];
  const snapshot = useBackendSnapshot();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        padding: 20,
        gap: 18,
      }}
      refreshControl={<RefreshControl refreshing={snapshot.isRefreshing} onRefresh={() => void snapshot.refresh()} />}
      style={{ flex: 1, backgroundColor: palette.background }}
    >
      <ShellHeader
        eyebrow="Теплицы"
        title="Откройте любую теплицу и управляйте уходом."
        description="Здесь видно, какие зоны доступны, сколько в них растений и какой световой режим активен."
      />

      {snapshot.devices.map((device) => (
        <Link key={device.slug} href={`/device/${device.slug}`} asChild>
          <Pressable
            style={{
              borderRadius: 28,
              backgroundColor: palette.card,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 18,
              gap: 14,
              boxShadow: `0 18px 36px ${palette.shadow}`,
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
                <Text
                  selectable
                  style={{
                    color: palette.text,
                    fontFamily: Fonts.serif,
                    fontSize: 24,
                  }}
                >
                  {device.name}
                </Text>
                <Text style={{ color: palette.muted, fontFamily: Fonts.rounded, fontSize: 12 }}>{device.lastEvent}</Text>
              </View>
              <DeviceStatusPill connected={device.connected} />
            </View>

            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <View
                style={{
                  borderRadius: 999,
                  backgroundColor: palette.badge,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: palette.text, fontFamily: Fonts.rounded, fontSize: 12 }}>
                  {device.plantsOnline} растений
                </Text>
              </View>
              <View
                style={{
                  borderRadius: 999,
                  backgroundColor: palette.badge,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: palette.text, fontFamily: Fonts.rounded, fontSize: 12 }}>
                  {device.pendingCommands > 0 ? `выполняется ${device.pendingCommands}` : 'всё спокойно'}
                </Text>
              </View>
            </View>

            <SectionCard title="Сейчас" compact>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={{ gap: 6 }}>
                  <Text style={{ color: palette.muted, fontFamily: Fonts.rounded, fontSize: 12 }}>
                    Шаблон света
                  </Text>
                  <Text style={{ color: palette.text, fontFamily: Fonts.serif, fontSize: 18 }}>
                    {device.lightTemplate}
                  </Text>
                </View>
                <IconSymbol size={24} name="chevron.right" color={palette.muted} />
              </View>
            </SectionCard>
          </Pressable>
        </Link>
      ))}

      <SectionCard title="Небольшая подсказка">
        <Text style={{ color: palette.muted, fontFamily: Fonts.rounded, fontSize: 14, lineHeight: 21 }}>
          Потяните экран вниз, если хотите обновить данные вручную. Внутри каждой теплицы доступны быстрые действия,
          влажность по зонам и последние изменения.
        </Text>
      </SectionCard>
    </ScrollView>
  );
}
