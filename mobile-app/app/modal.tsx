import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBackendSnapshot } from '@/hooks/use-backend-snapshot';
import { useAuth } from '@/providers/auth-provider';

export default function ModalScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const palette = Colors[colorScheme];
  const { user, signOut } = useAuth();
  const snapshot = useBackendSnapshot();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        padding: 20,
        gap: 18,
      }}
      style={{ flex: 1, backgroundColor: palette.background }}
    >
      <View
        style={{
          borderRadius: 28,
          backgroundColor: palette.card,
          borderWidth: 1,
          borderColor: palette.line,
          padding: 20,
          gap: 14,
        }}
      >
        <Text
          style={{
            color: palette.accent,
            fontFamily: Fonts.rounded,
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Профиль
        </Text>
        <Text
          style={{
            color: palette.text,
            fontFamily: Fonts.serif,
            fontSize: 28,
            lineHeight: 32,
          }}
        >
          Аккаунт и спокойный контроль.
        </Text>
        <Text
          selectable
          style={{
            color: palette.muted,
            fontFamily: Fonts.rounded,
            fontSize: 14,
            lineHeight: 21,
          }}
        >
          Здесь можно быстро проверить, всё ли обновляется, и выйти из аккаунта, если вы передаёте телефон другому
          человеку.
        </Text>
      </View>

      <View
        style={{
          borderRadius: 24,
          backgroundColor: palette.cardSoft,
          padding: 18,
          gap: 10,
        }}
      >
        <Text style={{ color: palette.muted, fontFamily: Fonts.rounded, fontSize: 12 }}>Оператор</Text>
        <Text selectable style={{ color: palette.text, fontFamily: Fonts.serif, fontSize: 24 }}>
          {user?.email ?? 'Не авторизован'}
        </Text>
        <Text style={{ color: palette.muted, fontFamily: Fonts.rounded, fontSize: 13 }}>
          Статус приложения: {snapshot.source === 'remote' ? 'данные обновляются' : 'временный показ сохранённых данных'}
        </Text>
        <Text style={{ color: palette.muted, fontFamily: Fonts.rounded, fontSize: 13 }}>
          Последняя проверка: {snapshot.updatedLabel}
        </Text>
      </View>

      <View
        style={{
          borderRadius: 24,
          backgroundColor: palette.cardSoft,
          padding: 18,
          gap: 10,
        }}
      >
        <Text style={{ color: palette.muted, fontFamily: Fonts.rounded, fontSize: 12 }}>Что можно сделать</Text>
        <Text selectable style={{ color: palette.text, fontFamily: Fonts.rounded, fontSize: 14, lineHeight: 21 }}>
          1. Проверить, все ли теплицы на связи.
          {'\n'}2. Обновить данные свайпом вниз на любом экране.
          {'\n'}3. Открыть нужную теплицу и включить свет или полив.
          {'\n'}4. Посмотреть историю последних действий.
        </Text>
      </View>

      <Pressable
        onPress={signOut}
        style={{
          borderRadius: 18,
          backgroundColor: palette.warning,
          paddingVertical: 16,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: palette.background, fontFamily: Fonts.rounded, fontSize: 15 }}>Выйти из аккаунта</Text>
      </Pressable>

      <Link
        href="/"
        dismissTo
        style={{
          color: palette.accent,
          fontFamily: Fonts.rounded,
          fontSize: 15,
        }}
      >
        Вернуться к пульту
      </Link>
    </ScrollView>
  );
}
