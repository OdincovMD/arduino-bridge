import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { bloomPalette } from '@/constants/bloom';

const TAB_META: Record<string, React.ComponentProps<typeof MaterialIcons>['name']> = {
  index: 'dashboard',
  devices: 'grid-view',
  activity: 'query-stats',
  settings: 'manage-accounts',
};

function TabGlyph({
  focused,
  icon,
}: {
  focused: boolean;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
}) {
  return (
    <View
      style={{
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MaterialIcons
        name={icon}
        size={23}
        color={focused ? bloomPalette.primary : bloomPalette.mutedText}
      />
      {focused ? (
        <View
          style={{
            position: 'absolute',
            bottom: -2,
            width: 7,
            height: 7,
            borderRadius: 999,
            backgroundColor: bloomPalette.primary,
          }}
        />
      ) : null}
    </View>
  );
}

export function BloomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const routeName = state.routes[state.index]?.name;

  if (routeName === 'settings') {
    return null;
  }

  const leftRoutes = state.routes.filter((route) => route.name === 'index' || route.name === 'devices');
  const rightRoutes = state.routes.filter((route) => route.name === 'activity' || route.name === 'settings');

  function renderTab(routeNameValue: string) {
    const routeIndex = state.routes.findIndex((route) => route.name === routeNameValue);
    const route = state.routes[routeIndex];
    const focused = state.index === routeIndex;

    if (!route) {
      return null;
    }

    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityLabel={descriptors[route.key]?.options.tabBarAccessibilityLabel}
        onPress={() => navigation.navigate(route.name)}
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <TabGlyph focused={focused} icon={TAB_META[route.name]} />
      </Pressable>
    );
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 20,
        paddingBottom: Math.max(insets.bottom, 12),
      }}
    >
      <View
        style={{
          height: 86,
          borderRadius: 34,
          backgroundColor: bloomPalette.surface,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          paddingHorizontal: 26,
          paddingBottom: 14,
          boxShadow: `0 -8px 28px ${bloomPalette.shadow}`,
        }}
      >
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', marginRight: 44 }}>
          {leftRoutes.map((route) => renderTab(route.name))}
        </View>
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', marginLeft: 44 }}>
          {rightRoutes.map((route) => renderTab(route.name))}
        </View>
      </View>

      <View
        style={{
          position: 'absolute',
          alignSelf: 'center',
          top: -2,
          width: 68,
          height: 68,
          borderRadius: 999,
          backgroundColor: bloomPalette.primary,
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 24px rgba(31, 105, 75, 0.38)',
        }}
      >
        <MaterialIcons name="sensors" size={28} color={bloomPalette.surface} />
      </View>
    </View>
  );
}
