import { useWindowDimensions } from 'react-native';

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isCompact = width < 380;
  const isMedium = width >= 380 && width < 768;
  const isWide = width >= 768;

  return {
    width,
    height,
    isCompact,
    isMedium,
    isWide,
    horizontalPadding: isCompact ? 16 : 20,
    sectionSpacing: isCompact ? 12 : 16,
    cardPadding: isCompact ? 14 : 16,
    inputPadding: isCompact ? 14 : 16,
    maxContentWidth: isWide ? 560 : width,
  };
}