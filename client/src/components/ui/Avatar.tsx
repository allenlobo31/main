import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

export function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const initials = (name ?? '?').trim().charAt(0).toUpperCase() || '?';

  if (uri) {
    return (
      <Image
        source={{ uri }}
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
    backgroundColor: '#DBEAFE', // Light blue background
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#22C55E', // Green border
    overflow: 'hidden',
  },
  initials: {
    color: '#1E3A8A', // Dark blue color for the letter
    fontWeight: '700',
  },
});
