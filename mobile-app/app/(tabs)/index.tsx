import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { SectionCard } from '@/components/section-card';
import { ShellHeader } from '@/components/shell-header';
import { StatTile } from '@/components/stat-tile';
import { Colors, Fonts } from '@/constants/theme';
import { useBackendSnapshot } from '@/hooks/use-backend-snapshot';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function OverviewScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const palette = Colors[colorScheme];
  const snapshot = useBackendSnapshot();
  const totalDevices = snapshot.devices.length;
  const liveDevices = snapshot.devices.filter((device) => device.connected).length;
  const totalPlants = snapshot.devices.reduce((sum, device) => sum + device.plants.length, 0);
  const needsAttention = snapshot.devices.reduce(
    (sum, device) => sum + device.plants.filter((plant) => plant.levelPercent < 35).length,
    0
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        padding: 20,
        gap: 18,
      }}
      refreshControl={<RefreshControl refreshing={snapshot.isRefreshing} onRefresh={() => void snapshot.refresh()} />}
      style={{
        flex: 1,
        backgroundColor: palette.background,
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: -80,
          right: -50,
          width: 220,
          height: 220,
          borderRadius: 220,
          backgroundColor: palette.ambientA,
          opacity: 0.18,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 180,
          left: -70,
          width: 180,
          height: 180,
          borderRadius: 180,
          backgroundColor: palette.ambientB,
          opacity: 0.16,
        }}
      />

      <ShellHeader
        eyebrow="Сегодня"
        title="Смотрите, как чувствует себя ваш сад прямо сейчас."
        description="Здесь собраны главное состояние, влажность и быстрый обзор по всем теплицам без лишних деталей."
      />

      <View
        style={{
          borderRadius: 32,
          backgroundColor: palette.hero,
          padding: 20,
          gap: 18,
          borderWidth: 1,
          borderColor: palette.lineStrong,
          boxShadow: `0 24px 48px ${palette.shadow}`,
        }}
      >
        <View style={{ gap: 8 }}>
          <Text style={{ color: palette.heroMuted, fontFamily: Fonts.rounded, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            Общая картина
          </Text>
          <Text
            selectable
            style={{
              color: palette.heroText,
              fontFamily: Fonts.serif,
              fontSize: 31,
              lineHeight: 35,
            }}
          >
            {liveDevices === totalDevices
              ? 'Все теплицы в порядке и доступны.'
              : `${liveDevices} из ${totalDevices} теплиц сейчас на связи.`}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          <StatTile label="Теплицы" value={`${totalDevices}`} accent />
          <StatTile label="Растения" value={`${totalPlants}`} />
          <StatTile label="Нужно проверить" value={`${needsAttention}`} />
        </View>
      </View>

      <SectionCard title="Ваши теплицы">
        <View style={{ gap: 12 }}>
          {snapshot.devices.map((device) => (
            <View
              key={device.slug}
              style={{
                borderRadius: 22,
                borderWidth: 1,
                borderColor: palette.line,
                backgroundColor: palette.cardSoft,
                padding: 16,
                gap: 8,
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
                <View style={{ gap: 2 }}>
                  <Text style={{ color: palette.text, fontFamily: Fonts.serif, fontSize: 20 }}>{device.name}</Text>
                  <Text style={{ color: palette.muted, fontFamily: Fonts.rounded, fontSize: 12 }}>
                    {device.plants.length} растений • свет «{device.lightTemplate}»
                  </Text>
                </View>
                <Text
                  style={{
                    color: device.connected ? palette.accent : palette.warning,
                    fontFamily: Fonts.rounded,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  {device.connected ? 'на связи' : 'не в сети'}
                </Text>
              </View>
              <Text selectable style={{ color: palette.muted, fontFamily: Fonts.rounded, fontSize: 13 }}>
                {device.lastEvent}
              </Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Обновление данных">
        <View style={{ gap: 10 }}>
          <Text
            selectable
            style={{
              color: palette.muted,
              fontFamily: Fonts.rounded,
              fontSize: 14,
              lineHeight: 22,
            }}
          >
            {snapshot.error
              ? `Сейчас не удалось обновить данные: ${snapshot.error}. Пока приложение показывает последнее доступное состояние.`
              : snapshot.source === 'remote'
                ? 'Данные обновляются автоматически. Если хотите, можно потянуть экран вниз и проверить всё ещё раз.'
                : 'Сейчас показан сохранённый пример экрана. После подключения вы увидите живые данные.'}
          </Text>
          <Text style={{ color: palette.text, fontFamily: Fonts.rounded, fontSize: 13 }}>
            Последнее обновление: {snapshot.updatedLabel}
          </Text>
        </View>
      </SectionCard>
    </ScrollView>
  );
}
