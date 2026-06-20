import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

function _Avatar({ uri, name, size = 40 }: AvatarProps) {
  const initials = (name ?? '?').trim().charAt(0).toUpperCase() || '?';

  const sanitizedUri = React.useMemo(() => {
    if (uri && typeof uri === 'string') {
      if (uri.includes('api.dicebear.com') && uri.includes('/svg')) {
        return uri.replace('/svg', '/png');
      }
      return uri;
    }
    return null;
  }, [uri]);

  if (sanitizedUri) {
    return (
      <Image
        source={{ uri: sanitizedUri }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fallback: {
    backgroundColor: '#ffffff', // White background
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000000', // Black border
    overflow: 'hidden',
  },
  initials: {
    color: '#000000', // Black color for the letter
    fontWeight: '700',
  },
});

export const Avatar = React.memo(_Avatar);
