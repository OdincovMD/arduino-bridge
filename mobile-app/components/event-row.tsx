import { Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ActivityItem } from '@/lib/mock-data';

type EventRowProps = {
  item: ActivityItem;
};

export function EventRow({ item }: EventRowProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const palette = Colors[colorScheme];

  return (
    <View
      style={{
        borderRadius: 22,
        borderWidth: 1,
        borderColor: palette.line,
        backgroundColor: palette.cardSoft,
        padding: 14,
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
        <Text style={{ color: palette.text, fontFamily: Fonts.rounded, fontSize: 13 }}>{item.title}</Text>
        <Text style={{ color: palette.muted, fontFamily: Fonts.mono, fontSize: 11 }}>{item.time}</Text>
      </View>
      <Text selectable style={{ color: palette.muted, fontFamily: Fonts.rounded, fontSize: 13, lineHeight: 20 }}>
        {item.description}
      </Text>
    </View>
  );
}
