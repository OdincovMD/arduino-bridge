import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type SectionCardProps = {
  title: string;
  children: ReactNode;
  compact?: boolean;
};

export function SectionCard({ title, children, compact = false }: SectionCardProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const palette = Colors[colorScheme];

  return (
    <View
      style={{
        borderRadius: compact ? 22 : 28,
        backgroundColor: palette.card,
        borderWidth: 1,
        borderColor: palette.line,
        padding: compact ? 14 : 18,
        gap: 14,
        boxShadow: `0 16px 32px ${palette.shadow}`,
      }}
    >
      <Text
        style={{
          color: palette.text,
          fontFamily: Fonts.rounded,
          fontSize: 13,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}
