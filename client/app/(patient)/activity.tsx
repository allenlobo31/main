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

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import {
  Apple,
  Bath,
  BedDouble,
  Bike,
  Carrot,
  Coffee,
  HeartPulse,
  Salad,
  ShieldAlert,
  Soup,
  StretchHorizontal,
  UtensilsCrossed,
  Footprints,
  Dumbbell,
  Cigarette,
  Beer,
  CalendarDays,
  Activity,
  Waves,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { Card } from '../../src/components/ui/Card';
import { theme } from '../../src/constants/theme';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';

type ActivityPhase = 'pre-op' | 'post-op';

type TipCard = {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  tone: 'mint' | 'sky' | 'peach' | 'lavender';
};

const preOpDietToDo: TipCard[] = [
  { title: 'High fiber foods', description: 'Fruit, vegetables, oats, and whole grains keep the tummy happy.', icon: Salad, tone: 'mint' },
  { title: 'Drink enough water', description: 'Keep sipping water through the day.', icon: Waves, tone: 'sky' },
];

const preOpDietNotToDo: TipCard[] = [
  { title: 'Junk food', description: 'Chips, fried snacks, and heavy fast food are not the best choice.', icon: UtensilsCrossed, tone: 'peach' },
  { title: 'Low-fiber food', description: 'Too much white bread, sweets, and low-fiber meals can slow digestion.', icon: Apple, tone: 'lavender' },
  { title: 'Drinking alcohol', description: 'Avoid drinks that can upset your body and recovery.', icon: Beer, tone: 'peach' },
];

const preOpActivityToDo: TipCard[] = [
  { title: 'Walking', description: 'A calm walk keeps your body active without stress.', icon: Footprints, tone: 'sky' },
  { title: 'Small work', description: 'Do small tasks that do not strain your body.', icon: Activity, tone: 'mint' },
];

const preOpActivityNotToDo: TipCard[] = [
  { title: 'Heavy lifting', description: 'Do not lift heavy things.', icon: Dumbbell, tone: 'peach' },
  { title: 'Running or straining', description: 'Avoid rough movement that pushes your tummy too hard.', icon: ShieldAlert, tone: 'lavender' },
];

const postOpTimeline: TipCard[] = [
  { title: 'Week 1', description: 'Minimal movement. Bed rest is recommended.', icon: BedDouble, tone: 'peach' },
  { title: 'Week 2', description: 'Light walking only.', icon: Footprints, tone: 'sky' },
  { title: 'Week 3', description: 'Walking and normal daily activities slowly.', icon: Activity, tone: 'mint' },
  { title: 'Week 4 to 6', description: 'No heavy lifting or straining your body.', icon: ShieldAlert, tone: 'lavender' },
];

const postOpDietToDo: TipCard[] = [
  { title: 'Soft diet', description: 'Choose soft foods that are easy to chew and digest.', icon: Soup, tone: 'mint' },
  { title: 'High fiber meals', description: 'Add fruits, vegetables, and gentle fiber foods.', icon: Carrot, tone: 'sky' },
  { title: 'Adequate fluids', description: 'Drink enough water and clear fluids each day.', icon: Waves, tone: 'lavender' },
];

const postOpAvoid: TipCard[] = [
  { title: 'Heavy lifting', description: 'No lifting heavy objects.', icon: Dumbbell, tone: 'peach' },
  { title: 'Straining the body', description: 'Do not push your body too hard.', icon: StretchHorizontal, tone: 'lavender' },
  { title: 'Coughing hard / outdoor heavy activity', description: 'Avoid strong coughing fits and rough outside activities.', icon: Cigarette, tone: 'peach' },
];

function getActivityPhase(status?: string | null): ActivityPhase {
  return status === 'completed' ? 'post-op' : 'pre-op';
}

function getPhaseCopy(phase: ActivityPhase) {
  if (phase === 'post-op') {
    return {
      badge: 'Post-Op',
      title: 'Post-Op Care Plan',
      subtitle: 'Think of this as your gentle recovery story.',
      heroIcon: BedDouble,
      heroTone: 'peach' as const,
    };
  }

  return {
    badge: 'Pre-Op',
    title: 'Pre-Op Care Plan',
    subtitle: 'Simple steps to keep your body ready and calm.',
    heroIcon: HeartPulse,
    heroTone: 'sky' as const,
  };
}

export default function ActivityScreen() {
  const { user } = useAuthStore();
  const { isCompact, horizontalPadding } = useResponsiveLayout();
  const phase = useMemo(() => getActivityPhase(user?.surgeryStatus), [user?.surgeryStatus]);
  const copy = getPhaseCopy(phase);

  const [activeCanDoIndex, setActiveCanDoIndex] = useState(0);
  const [activeNotToDoIndex, setActiveNotToDoIndex] = useState(0);

  const fadeCanDoAnim = useRef(new Animated.Value(1)).current;
  const fadeNotToDoAnim = useRef(new Animated.Value(1)).current;

  const canDoSlides = useMemo(() => [
    { id: '1', title: 'Eat High Fiber', subtitle: 'Fruit, vegetables, oats, and whole grains keep digestion safe', image: require('../../assets/diet_nutrition.png') },
    { id: '2', title: 'Hydrate Well', subtitle: 'Keep sipping water throughout the day to support cellular recovery', image: require('../../assets/can_do_water.png') },
    { id: '3', title: 'Gentle Walking', subtitle: 'A calm walk keeps your body active and improves blood circulation', image: require('../../assets/walking_recovery.png') },
    { id: '4', title: 'Bed Rest', subtitle: 'Ensure plenty of restful sleep in a comfortable bed with pillows', image: require('../../assets/peaceful_rest.png') },
    { id: '5', title: 'Light Chores', subtitle: 'Do small, safe tasks like watering a plant without lifting weight', image: require('../../assets/can_do_task.png') },
  ], []);

  const notToDoSlides = useMemo(() => [
    { id: '1', title: 'Avoid Junk Food', subtitle: 'Chips, fried snacks, and heavy meals slow down your digestion', image: require('../../assets/prohibited_junk_food.png') },
    { id: '2', title: 'Avoid Drinking Alcohol', subtitle: 'Alcohol dehydrates your body and delays wound healing', image: require('../../assets/prohibited_alcohol.png') },
    { id: '3', title: 'Avoid Running', subtitle: 'Strenuous running exerts unsafe pressure on surgical repair', image: require('../../assets/prohibited_running.png') },
    { id: '4', title: 'Avoid Heavy Lifting', subtitle: 'Do not lift objects over 5 lbs to prevent abdominal wall hernia tear', image: require('../../assets/prohibited_lifting.png') },
    { id: '5', title: 'Avoid Bending Over', subtitle: 'Do not bend at the waist; bend knees instead to protect wound', image: require('../../assets/prohibited_bending.png') },
  ], []);

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

  const phaseContent = useMemo(() => {
    if (phase === 'post-op') {
      return {
        mainCards: postOpTimeline,
        doTitle: 'Diet - To Do',
        doCards: postOpDietToDo,
        notTitle: 'To Avoid',
        notCards: postOpAvoid,
      };
    }

    return {
      mainCards: [],
      doTitle: 'Diet - To Do',
      doCards: preOpDietToDo,
      notTitle: 'Diet - Not To Do',
      notCards: preOpDietNotToDo,
      activityDoTitle: 'Daily Activity - Can Do',
      activityDoCards: preOpActivityToDo,
      activityNotTitle: 'Daily Activity - Not To Do',
      activityNotCards: preOpActivityNotToDo,
    };
  }, [phase]);

  const HeroIcon = copy.heroIcon;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingHorizontal: horizontalPadding,
            paddingTop: isCompact ? theme.spacing.xxxl : theme.spacing.xxl,
            paddingBottom: isCompact ? theme.spacing.xxxl + theme.spacing.md : theme.spacing.xxxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={[styles.heroCard, styles[`${copy.heroTone}Hero`]]} bordered>
          <View style={styles.heroTopRow}>
            <View style={[styles.heroIconWrap, styles[`${copy.heroTone}IconWrap`]]}>
              <HeroIcon size={30} color={theme.colors.textPrimary} strokeWidth={2.2} />
            </View>
            <View style={styles.heroTextBlock}>
              <Text style={styles.badge}>{copy.badge}</Text>
              <Text style={styles.title}>{copy.title}</Text>
              <Text style={styles.subtitle}>{copy.subtitle}</Text>
            </View>
          </View>
        </Card>

        {/* ======================================================== */}
        {/* PREMIUM NEOBRUTALIST CAROUSEL 1: CAN DO (RECOMMENDED) */}
        {/* ======================================================== */}
        <View style={styles.carouselContainer}>
          {/* Section Header specifying "Can Do" positive list */}
          <View style={styles.carouselHeader}>
            <View style={[styles.iconWrapSuccess, { backgroundColor: '#d1fae5' }]}>
              <CheckCircle2 size={18} color="#059669" strokeWidth={2.5} />
            </View>
            <Text style={[styles.carouselSectionTitle, { color: '#059669' }]}>Can Do (Recommended)</Text>
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
            <Text style={styles.carouselSectionTitle}>Not To Do (Things to Avoid)</Text>
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

        {phase === 'post-op' ? (
          <Card style={[styles.sectionCard, styles.timelineCard, styles.lavenderSection]} bordered>
            <View style={styles.sectionHeader}>
              <View style={styles.iconWrapSky}>
                <CalendarDays size={18} color={theme.colors.textPrimary} strokeWidth={2.2} />
              </View>
              <Text style={styles.sectionTitle}>Recovery Timeline</Text>
            </View>

            {phaseContent.mainCards.map((item) => (
              <TipRow key={item.title} item={item} variant="neutral" />
            ))}
          </Card>
        ) : null}

        <Card style={[styles.sectionCard, styles.toDoCard]} bordered>
          <View style={styles.sectionHeader}>
            <View style={styles.iconWrapSuccess}>
              <CheckCircle2 size={18} color={theme.colors.textPrimary} strokeWidth={2.2} />
            </View>
            <Text style={styles.sectionTitle}>{phaseContent.doTitle}</Text>
          </View>

          {phaseContent.doCards.map((item) => (
            <TipRow key={item.title} item={item} variant="do" />
          ))}
        </Card>

        <Card style={[styles.sectionCard, styles.notToDoCard]} bordered>
          <View style={styles.sectionHeader}>
            <View style={styles.iconWrapDanger}>
              <XCircle size={18} color={theme.colors.textPrimary} strokeWidth={2.2} />
            </View>
            <Text style={styles.sectionTitle}>{phaseContent.notTitle}</Text>
          </View>

          {phaseContent.notCards.map((item) => (
            <TipRow key={item.title} item={item} variant="notDo" />
          ))}
        </Card>

        {phase === 'pre-op' ? (
          <Card style={[styles.sectionCard, styles.timelineCard, styles.skySection]} bordered>
            <View style={styles.sectionHeader}>
              <View style={styles.iconWrapDanger}>
                <Bike size={18} color={theme.colors.textPrimary} strokeWidth={2.2} />
              </View>
              <Text style={styles.sectionTitle}>Daily Activity</Text>
            </View>

            <View style={styles.twoColumnWrap}>
              <View style={styles.twoColumnCard}>
                <Text style={styles.smallHeader}>Can Do</Text>
                {preOpActivityToDo.map((item) => (
                  <TipRow key={item.title} item={item} compact variant="do" />
                ))}
              </View>
              <View style={styles.twoColumnCard}>
                <Text style={styles.smallHeader}>Not To Do</Text>
                {preOpActivityNotToDo.map((item) => (
                  <TipRow key={item.title} item={item} compact variant="notDo" />
                ))}
              </View>
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function TipRow({
  item,
  compact = false,
  variant = 'neutral',
}: {
  item: TipCard;
  compact?: boolean;
  variant?: 'do' | 'notDo' | 'neutral';
}) {
  const Icon = item.icon;
  const rowTone =
    variant === 'do'
      ? 'mint'
      : variant === 'notDo'
        ? 'peach'
        : item.tone;
  return (
    <View style={[styles.tipRow, compact && styles.tipRowCompact, styles[`${rowTone}TipRow`]]}>
      <View style={[styles.tipIconWrap, styles[`${rowTone}TipIconWrap`]]}>
        <Icon size={18} color={theme.colors.textPrimary} strokeWidth={2.2} />
      </View>
      <View style={styles.tipTextBlock}>
        <Text style={styles.tipTitle}>{item.title}</Text>
        <Text style={styles.itemText}>{item.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Premium Neobrutalist Image Carousel Styles
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
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

  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
  },
  heroCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  mintHero: {
    backgroundColor: '#f4faf7',
  },
  skyHero: {
    backgroundColor: '#f3f8fc',
  },
  peachHero: {
    backgroundColor: '#fdf6f1',
  },
  lavenderHero: {
    backgroundColor: '#f8f4fc',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  heroIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  mintIconWrap: {
    backgroundColor: '#d9f1e6',
  },
  skyIconWrap: {
    backgroundColor: '#dbe9f7',
  },
  peachIconWrap: {
    backgroundColor: '#f7e4d7',
  },
  lavenderIconWrap: {
    backgroundColor: '#ebdef8',
  },
  heroTextBlock: {
    flex: 1,
  },
  badge: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '700',
    marginBottom: 2,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  sectionCard: {
    marginBottom: theme.spacing.md,
  },
  toDoCard: {
    backgroundColor: '#eef9ef',
  },
  notToDoCard: {
    backgroundColor: '#fcefee',
  },
  timelineCard: {
    backgroundColor: '#f7f7fb',
  },
  skySection: {
    backgroundColor: '#f3f8fc',
  },
  lavenderSection: {
    backgroundColor: '#f8f4fc',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  iconWrapSuccess: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#d9f1e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDanger: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f7e4d7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSky: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#dbe9f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceAlt,
  },
  tipRowCompact: {
    marginBottom: theme.spacing.xs,
  },
  tipTextBlock: {
    flex: 1,
  },
  tipIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  mintTipIconWrap: {
    backgroundColor: '#d9f1e6',
  },
  skyTipIconWrap: {
    backgroundColor: '#dbe9f7',
  },
  peachTipIconWrap: {
    backgroundColor: '#f7e4d7',
  },
  lavenderTipIconWrap: {
    backgroundColor: '#ebdef8',
  },
  mintTipRow: {
    backgroundColor: '#f8fff8',
  },
  skyTipRow: {
    backgroundColor: '#f8fbff',
  },
  peachTipRow: {
    backgroundColor: '#fff8f8',
  },
  lavenderTipRow: {
    backgroundColor: '#fbf8ff',
  },
  tipTitle: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: 2,
  },
  itemText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  smallHeader: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  twoColumnWrap: {
    gap: theme.spacing.sm,
  },
  twoColumnCard: {
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceAlt,
    marginBottom: theme.spacing.sm,
  },
});
