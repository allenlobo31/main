import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import { theme } from '../../src/constants/theme';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';
import { useLanguageStore } from '../../src/store/languageStore';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ActivityScreen() {
  const { isCompact, horizontalPadding } = useResponsiveLayout();
  const { t } = useLanguageStore();

  const [activeCanDoIndex, setActiveCanDoIndex] = useState(0);
  const [activeNotToDoIndex, setActiveNotToDoIndex] = useState(0);

  const fadeCanDoAnim = useRef(new Animated.Value(1)).current;
  const fadeNotToDoAnim = useRef(new Animated.Value(1)).current;

  const canDoSlides = useMemo(() => [
    { id: '1', title: t('activity.canDoSlides.slide1.title'), subtitle: t('activity.canDoSlides.slide1.subtitle'), image: require('../../assets/diet_nutrition.png') },
    { id: '2', title: t('activity.canDoSlides.slide2.title'), subtitle: t('activity.canDoSlides.slide2.subtitle'), image: require('../../assets/can_do_water.png') },
    { id: '3', title: t('activity.canDoSlides.slide3.title'), subtitle: t('activity.canDoSlides.slide3.subtitle'), image: require('../../assets/walking_recovery.png') },
    { id: '4', title: t('activity.canDoSlides.slide4.title'), subtitle: t('activity.canDoSlides.slide4.subtitle'), image: require('../../assets/peaceful_rest.png') },
    { id: '5', title: t('activity.canDoSlides.slide5.title'), subtitle: t('activity.canDoSlides.slide5.subtitle'), image: require('../../assets/can_do_task.png') },
  ], [t]);

  const notToDoSlides = useMemo(() => [
    { id: '1', title: t('activity.notToDoSlides.slide1.title'), subtitle: t('activity.notToDoSlides.slide1.subtitle'), image: require('../../assets/prohibited_junk_food.png') },
    { id: '2', title: t('activity.notToDoSlides.slide2.title'), subtitle: t('activity.notToDoSlides.slide2.subtitle'), image: require('../../assets/prohibited_alcohol.png') },
    { id: '3', title: t('activity.notToDoSlides.slide3.title'), subtitle: t('activity.notToDoSlides.slide3.subtitle'), image: require('../../assets/prohibited_running.png') },
    { id: '4', title: t('activity.notToDoSlides.slide4.title'), subtitle: t('activity.notToDoSlides.slide4.subtitle'), image: require('../../assets/prohibited_lifting.png') },
    { id: '5', title: t('activity.notToDoSlides.slide5.title'), subtitle: t('activity.notToDoSlides.slide5.subtitle'), image: require('../../assets/prohibited_bending.png') },
  ], [t]);

  // Custom helpers to change indices with LayoutAnimation
  const changeCanDoSlideIndex = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveCanDoIndex(index);
  };

  const changeNotToDoSlideIndex = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveNotToDoIndex(index);
  };

  // Auto-play timer for Can Do (2.0 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      changeCanDoSlideIndex(activeCanDoIndex === canDoSlides.length - 1 ? 0 : activeCanDoIndex + 1);
    }, 2000);
    return () => clearInterval(timer);
  }, [activeCanDoIndex, canDoSlides.length]);

  // Auto-play timer for Not To Do (2.0 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      changeNotToDoSlideIndex(activeNotToDoIndex === notToDoSlides.length - 1 ? 0 : activeNotToDoIndex + 1);
    }, 2000);
    return () => clearInterval(timer);
  }, [activeNotToDoIndex, notToDoSlides.length]);

  // Smooth fade-in animation for Can Do
  useEffect(() => {
    fadeCanDoAnim.setValue(0.4);
    Animated.timing(fadeCanDoAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [activeCanDoIndex]);

  // Smooth fade-in animation for Not To Do
  useEffect(() => {
    fadeNotToDoAnim.setValue(0.4);
    Animated.timing(fadeNotToDoAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [activeNotToDoIndex]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingHorizontal: horizontalPadding,
            paddingTop: isCompact ? theme.spacing.lg : theme.spacing.xl,
            paddingBottom: isCompact ? theme.spacing.xxxl : theme.spacing.xxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Core Screen Title */}
        <Text style={styles.pageTitle}>{t('activity.pageTitle')}</Text>

        {/* ======================================================== */}
        {/* PREMIUM NEOBRUTALIST CAROUSEL 1: CAN DO (RECOMMENDED) */}
        {/* ======================================================== */}
        <View style={styles.carouselContainer}>
          {/* Section Header specifying "Can Do" positive list */}
          <View style={styles.carouselHeader}>
            <View style={[styles.iconWrapSuccess, { backgroundColor: '#d1fae5' }]}>
              <CheckCircle2 size={18} color="#059669" strokeWidth={2.5} />
            </View>
            <Text style={[styles.carouselSectionTitle, { color: '#059669' }]}>{t('activity.canDoTitle')}</Text>
          </View>

          <View style={[styles.carouselCard, styles.canDoCardBorder]}>
            <Animated.View style={{ opacity: fadeCanDoAnim, width: '100%', height: '100%' }}>
              <Image
                source={canDoSlides[activeCanDoIndex].image}
                style={styles.carouselImage}
                resizeMode="cover"
              />
              {/* Title & Description Overlay Banner */}
              <View style={[styles.carouselOverlay, styles.canDoOverlay]}>
                <Text style={styles.carouselOverlayTitle}>{canDoSlides[activeCanDoIndex].title}</Text>
                <Text style={[styles.carouselOverlaySubtitle, { color: '#d1fae5' }]}>
                  {canDoSlides[activeCanDoIndex].subtitle}
                </Text>
              </View>
            </Animated.View>
            
            {/* Navigation Overlay Arrows */}
            <TouchableOpacity
              style={[styles.arrowBtn, styles.arrowLeft]}
              activeOpacity={0.8}
              onPress={() => changeCanDoSlideIndex(activeCanDoIndex === 0 ? canDoSlides.length - 1 : activeCanDoIndex - 1)}
            >
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.arrowBtn, styles.arrowRight]}
              activeOpacity={0.8}
              onPress={() => changeCanDoSlideIndex(activeCanDoIndex === canDoSlides.length - 1 ? 0 : activeCanDoIndex + 1)}
            >
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Mini Versions (Thumbnails) Row below */}
          <View style={styles.thumbnailsRow}>
            {canDoSlides.map((slide, index) => {
              const isActive = activeCanDoIndex === index;
              return (
                <TouchableOpacity
                  key={slide.id}
                  style={[
                    styles.thumbnailContainer,
                    isActive ? styles.thumbnailContainerActiveCanDo : styles.thumbnailContainerInactive
                  ]}
                  activeOpacity={0.9}
                  onPress={() => changeCanDoSlideIndex(index)}
                >
                  <Image source={slide.image} style={styles.thumbnailImage} resizeMode="cover" />
                  {isActive && <View style={styles.thumbnailOverlayActiveCanDo} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ======================================================== */}
        {/* PREMIUM NEOBRUTALIST CAROUSEL 2: NOT TO DO (AVOID) */}
        {/* ======================================================== */}
        <View style={[styles.carouselContainer, { marginTop: 16 }]}>
          {/* Section Header specifying "Not To Do" warning list */}
          <View style={styles.carouselHeader}>
            <View style={[styles.iconWrapDanger, { backgroundColor: '#fecaca' }]}>
              <XCircle size={18} color="#dc2626" strokeWidth={2.5} />
            </View>
            <Text style={styles.carouselSectionTitle}>{t('activity.notToDoTitle')}</Text>
          </View>

          <View style={[styles.carouselCard, styles.notToDoCardBorder]}>
            <Animated.View style={{ opacity: fadeNotToDoAnim, width: '100%', height: '100%' }}>
              <Image
                source={notToDoSlides[activeNotToDoIndex].image}
                style={styles.carouselImage}
                resizeMode="cover"
              />
              {/* Title & Description Overlay Banner */}
              <View style={[styles.carouselOverlay, styles.notToDoOverlay]}>
                <Text style={styles.carouselOverlayTitle}>{notToDoSlides[activeNotToDoIndex].title}</Text>
                <Text style={styles.carouselOverlaySubtitle}>
                  {notToDoSlides[activeNotToDoIndex].subtitle}
                </Text>
              </View>
            </Animated.View>
            
            {/* Navigation Overlay Arrows */}
            <TouchableOpacity
              style={[styles.arrowBtn, styles.arrowLeft]}
              activeOpacity={0.8}
              onPress={() => changeNotToDoSlideIndex(activeNotToDoIndex === 0 ? notToDoSlides.length - 1 : activeNotToDoIndex - 1)}
            >
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.arrowBtn, styles.arrowRight]}
              activeOpacity={0.8}
              onPress={() => changeNotToDoSlideIndex(activeNotToDoIndex === notToDoSlides.length - 1 ? 0 : activeNotToDoIndex + 1)}
            >
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Mini Versions (Thumbnails) Row below */}
          <View style={styles.thumbnailsRow}>
            {notToDoSlides.map((slide, index) => {
              const isActive = activeNotToDoIndex === index;
              return (
                <TouchableOpacity
                  key={slide.id}
                  style={[
                    styles.thumbnailContainer,
                    isActive ? styles.thumbnailContainerActiveNotToDo : styles.thumbnailContainerInactive
                  ]}
                  activeOpacity={0.9}
                  onPress={() => changeNotToDoSlideIndex(index)}
                >
                  <Image source={slide.image} style={styles.thumbnailImage} resizeMode="cover" />
                  {isActive && <View style={styles.thumbnailOverlayActiveNotToDo} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    paddingBottom: theme.spacing.xxxl,
  },
  pageTitle: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    fontWeight: '900',
  },
  carouselContainer: {
    marginBottom: theme.spacing.lg,
  },
  carouselCard: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 24,
    width: Dimensions.get('window').width - 120, // Even smaller centered square card
    height: Dimensions.get('window').width - 120, // Perfect square aspect ratio
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    alignSelf: 'center',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  carouselOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1.5,
    borderTopColor: '#000000',
  },
  carouselOverlayTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  carouselOverlaySubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fecaca', // reddish pastel warning tone
    marginTop: 2,
  },
  arrowBtn: {
    position: 'absolute',
    top: '40%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  arrowLeft: {
    left: 12,
  },
  arrowRight: {
    right: 12,
  },
  arrowText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    lineHeight: 24,
    textAlign: 'center',
  },
  carouselHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  carouselSectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#dc2626', // warning red text
  },
  thumbnailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingHorizontal: 4,
  },
  thumbnailContainer: {
    width: (Dimensions.get('window').width - 40 - 44) / 5, // support 5 items
    height: 60,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  canDoCardBorder: {
    borderColor: '#059669', // Recovery green border
  },
  canDoOverlay: {
    backgroundColor: 'rgba(6, 78, 59, 0.85)', // Recovery deep green overlay
  },
  notToDoCardBorder: {
    borderColor: '#dc2626', // Warning red border
  },
  notToDoOverlay: {
    backgroundColor: 'rgba(127, 29, 29, 0.85)', // Warning deep red overlay
  },
  thumbnailContainerActiveCanDo: {
    borderWidth: 2.5,
    borderColor: '#059669', // Active green border
    transform: [{ scale: 1.05 }],
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  thumbnailOverlayActiveCanDo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 150, 105, 0.15)', // Active green tint
  },
  thumbnailContainerActiveNotToDo: {
    borderWidth: 2.5,
    borderColor: '#ef4444', // Warning red active outline
    transform: [{ scale: 1.05 }],
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  thumbnailOverlayActiveNotToDo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.15)', // light red warning tint
  },
  thumbnailContainerInactive: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    opacity: 0.65,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  iconWrapSuccess: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDanger: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
