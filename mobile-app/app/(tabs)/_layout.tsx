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
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="devices"
        options={{
          title: 'My Garden',
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}
