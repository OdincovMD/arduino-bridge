import { Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type DeviceStatusPillProps = {
  connected: boolean;
  inverted?: boolean;
};

export function DeviceStatusPill({ connected, inverted = false }: DeviceStatusPillProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const palette = Colors[colorScheme];
  const backgroundColor = inverted ? 'rgba(255,255,255,0.12)' : palette.badge;

  return (
    <View
      style={{
        borderRadius: 999,
        backgroundColor,
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
    >
      <Text
        style={{
          color: connected ? palette.accent : palette.warning,
          fontFamily: Fonts.rounded,
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        {connected ? 'на связи' : 'не в сети'}
      </Text>
    </View>
  );
}
