import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/providers/auth-provider';

export function AppToolbar() {
  const colorScheme = useColorScheme() ?? 'dark';
  const palette = Colors[colorScheme];
  const { user } = useAuth();
  const displayName = user?.email ? user.email.split('@')[0] : 'гость';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
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
          {displayName}
        </Text>
      </View>

      <Link href="/modal" asChild>
        <Pressable
          style={{
            borderRadius: 999,
            backgroundColor: palette.cardSoft,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: palette.text, fontFamily: Fonts.rounded, fontSize: 12 }}>Профиль</Text>
        </Pressable>
      </Link>
    </View>
  );
}
