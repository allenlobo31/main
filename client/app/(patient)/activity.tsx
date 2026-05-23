import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const slides = useMemo(() => [
    { id: '1', title: 'Gentle Walk', subtitle: 'Step towards active recovery', image: require('../../assets/walking_recovery.png') },
    { id: '2', title: 'Healthy Diet', subtitle: 'Nourish your body daily with nutrition', image: require('../../assets/diet_nutrition.png') },
    { id: '3', title: 'Rest & Heal', subtitle: 'Pillows, comfort, and peaceful sleep', image: require('../../assets/peaceful_rest.png') },
    { id: '4', title: 'Soft Stretch', subtitle: 'Gentle breathing exercises and stretch', image: require('../../assets/gentle_stretch.png') },
  ], []);

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

        {/* Premium Neobrutalist Image Carousel */}
        <View style={styles.carouselContainer}>
          <View style={styles.carouselCard}>
            <Image
              source={slides[activeSlideIndex].image}
              style={styles.carouselImage}
              resizeMode="cover"
            />
            {/* Title & Description Overlay Banner */}
            <View style={styles.carouselOverlay}>
              <Text style={styles.carouselOverlayTitle}>{slides[activeSlideIndex].title}</Text>
              <Text style={styles.carouselOverlaySubtitle}>{slides[activeSlideIndex].subtitle}</Text>
            </View>
            
            {/* Navigation Overlay Arrows */}
            <TouchableOpacity
              style={[styles.arrowBtn, styles.arrowLeft]}
              activeOpacity={0.8}
              onPress={() => setActiveSlideIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
            >
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.arrowBtn, styles.arrowRight]}
              activeOpacity={0.8}
              onPress={() => setActiveSlideIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1))}
            >
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Mini Versions (Thumbnails) Row below */}
          <View style={styles.thumbnailsRow}>
            {slides.map((slide, index) => {
              const isActive = activeSlideIndex === index;
              return (
                <TouchableOpacity
                  key={slide.id}
                  style={[
                    styles.thumbnailContainer,
                    isActive ? styles.thumbnailContainerActive : styles.thumbnailContainerInactive
                  ]}
                  activeOpacity={0.9}
                  onPress={() => setActiveSlideIndex(index)}
                >
                  <Image source={slide.image} style={styles.thumbnailImage} resizeMode="cover" />
                  {isActive && <View style={styles.thumbnailOverlayActive} />}
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
    height: 220,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
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
    color: '#d1fae5',
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
  thumbnailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingHorizontal: 4,
  },
  thumbnailContainer: {
    width: (Dimensions.get('window').width - 40 - 36) / 4,
    height: 60,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  thumbnailContainerActive: {
    borderWidth: 2.5,
    borderColor: '#000000',
    transform: [{ scale: 1.05 }],
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
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
  thumbnailOverlayActive: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(254, 240, 138, 0.15)', // light gold overlay tint
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
