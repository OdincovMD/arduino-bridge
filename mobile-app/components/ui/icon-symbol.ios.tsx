import { Image } from 'expo-image';
import { ImageStyle, StyleProp } from 'react-native';

import { IconSymbolName } from './icon-symbol';

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string;
  style?: StyleProp<ImageStyle>;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
}) {
  return (
    <Image
      source={`sf:${name}`}
      contentFit="contain"
      tintColor={color}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}
