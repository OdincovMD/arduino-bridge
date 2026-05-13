import { Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ShellHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function ShellHeader({ eyebrow, title, description }: ShellHeaderProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const palette = Colors[colorScheme];

  return (
    <View style={{ gap: 10 }}>
      <Text
        style={{
          color: palette.accent,
          fontFamily: Fonts.rounded,
          fontSize: 12,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        }}
      >
        {eyebrow}
      </Text>
      <Text
        selectable
        style={{
          color: palette.text,
          fontFamily: Fonts.serif,
          fontSize: 34,
          lineHeight: 38,
        }}
      >
        {title}
      </Text>
      <Text
        selectable
        style={{
          color: palette.muted,
          fontFamily: Fonts.rounded,
          fontSize: 15,
          lineHeight: 22,
          maxWidth: 420,
        }}
      >
        {description}
      </Text>
    </View>
  );
}
