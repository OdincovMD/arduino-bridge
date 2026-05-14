import { Tabs } from 'expo-router';
import React from 'react';

import { BloomTabBar } from '@/components/bloom-tab-bar';
import { bloomPalette } from '@/constants/bloom';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <BloomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: bloomPalette.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Пульт',
        }}
      />
      <Tabs.Screen
        name="devices"
        options={{
          title: 'Зоны',
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Пульс',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Профиль',
        }}
      />
    </Tabs>
  );
}
