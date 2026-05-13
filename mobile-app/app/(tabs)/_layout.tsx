import { Tabs } from 'expo-router';
import React from 'react';

import { AppToolbar } from '@/components/app-toolbar';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'dark'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.tint,
        tabBarInactiveTintColor: palette.tabIconDefault,
        tabBarButton: HapticTab,
        headerRight: () => <AppToolbar />,
        headerTitleStyle: {
          fontFamily: Fonts.serif,
          fontSize: 22,
        },
        headerStyle: {
          backgroundColor: palette.chrome,
        },
        headerShadowVisible: false,
        headerTintColor: palette.text,
        tabBarStyle: {
          backgroundColor: palette.chrome,
          borderTopWidth: 0,
          height: 82,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.rounded,
          fontSize: 12,
        },
        sceneStyle: {
          backgroundColor: palette.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главная',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="leaf.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="devices"
        options={{
          title: 'Теплицы',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="dot.radiowaves.left.and.right" color={color} />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'История',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="clock.arrow.trianglehead.counterclockwise.rotate.90" color={color} />,
        }}
      />
    </Tabs>
  );
}
