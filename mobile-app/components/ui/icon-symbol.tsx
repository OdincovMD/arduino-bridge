import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps } from 'react';
import { OpaqueColorValue, StyleProp, TextStyle } from 'react-native';

export type IconSymbolName =
  | 'leaf.fill'
  | 'dot.radiowaves.left.and.right'
  | 'clock.arrow.trianglehead.counterclockwise.rotate.90'
  | 'chevron.right'
  | 'slider.horizontal.3'
  | 'drop.fill'
  | 'bolt.fill';

type IconMapping = Record<IconSymbolName, ComponentProps<typeof MaterialIcons>['name']>;

const MAPPING: IconMapping = {
  'leaf.fill': 'eco',
  'dot.radiowaves.left.and.right': 'settings-input-antenna',
  'clock.arrow.trianglehead.counterclockwise.rotate.90': 'history',
  'chevron.right': 'chevron-right',
  'slider.horizontal.3': 'tune',
  'drop.fill': 'water-drop',
  'bolt.fill': 'bolt',
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
