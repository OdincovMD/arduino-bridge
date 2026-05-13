import { Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type StatTileProps = {
  label: string;
  value: string;
  accent?: boolean;
};

export function StatTile({ label, value, accent = false }: StatTileProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const palette = Colors[colorScheme];

  return (
    <View
      style={{
        minWidth: 100,
        flex: 1,
        borderRadius: 22,
        backgroundColor: accent ? palette.badgeStrong : palette.cardSoft,
        padding: 14,
        gap: 4,
      }}
    >
      <Text style={{ color: accent ? palette.heroMuted : palette.muted, fontFamily: Fonts.rounded, fontSize: 12 }}>
        {label}
      </Text>
      <Text
        selectable
        style={{
          color: accent ? palette.heroText : palette.text,
          fontFamily: Fonts.serif,
          fontSize: 20,
          lineHeight: 24,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
