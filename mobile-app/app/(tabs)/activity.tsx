import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { EventRow } from '@/components/event-row';
import { SectionCard } from '@/components/section-card';
import { ShellHeader } from '@/components/shell-header';
import { Colors, Fonts } from '@/constants/theme';
import { useBackendSnapshot } from '@/hooks/use-backend-snapshot';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ActivityScreen() {
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
        eyebrow="История"
        title="Последние изменения и уход за растениями."
        description="Здесь вы увидите, когда включался свет, запускался полив и что недавно происходило в теплицах."
      />

      <SectionCard title="Последние события">
        {snapshot.activity.length ? (
          <View style={{ gap: 12 }}>
            {snapshot.activity.map((item) => (
              <EventRow key={item.id} item={item} />
            ))}
          </View>
        ) : (
          <Text style={{ color: palette.muted, fontFamily: Fonts.rounded, fontSize: 14, lineHeight: 22 }}>
            Как только появятся новые действия, они покажутся здесь аккуратной лентой.
          </Text>
        )}
      </SectionCard>

      <SectionCard title="За сегодня">
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          {snapshot.commandStats.map((stat) => (
            <View
              key={stat.label}
              style={{
                minWidth: 148,
                flex: 1,
                borderRadius: 22,
                backgroundColor: palette.badge,
                padding: 16,
                gap: 4,
              }}
            >
              <Text style={{ color: palette.muted, fontFamily: Fonts.rounded, fontSize: 12 }}>
                {stat.label}
              </Text>
              <Text
                selectable
                style={{
                  color: palette.text,
                  fontFamily: Fonts.serif,
                  fontSize: 28,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {stat.value}
              </Text>
            </View>
          ))}
        </View>
      </SectionCard>
    </ScrollView>
  );
}
