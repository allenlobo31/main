import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../constants/theme';
import { MoodType } from '../../types';
import { Laugh, Smile, Meh, Frown, Annoyed } from 'lucide-react-native';
import { useLanguageStore } from '../../store/languageStore';

const ICONS: Record<string, any> = { Laugh, Smile, Meh, Frown, Annoyed };

interface MoodPickerProps {
  selected: MoodType | null;
  onSelect: (mood: MoodType) => void;
}

function _MoodPicker({ selected, onSelect }: MoodPickerProps) {
  const { language, t } = useLanguageStore();

  const getMoodLabel = (mood: MoodType) => {
    switch (mood) {
      case 'great':
        return language === 'kn' ? 'ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ' : language === 'hi' ? 'बहुत बढ़िया' : 'Great';
      case 'good':
        return language === 'kn' ? 'ಚೆನ್ನಾಗಿದೆ' : language === 'hi' ? 'अच्छा' : 'Good';
      case 'okay':
        return language === 'kn' ? 'ಪರವಾಗಿಲ್ಲ' : language === 'hi' ? 'ठीक-ठाक' : 'Okay';
      case 'bad':
        return language === 'kn' ? 'ಬೇಸರವಾಗಿದೆ' : language === 'hi' ? 'खराब' : 'Bad';
      case 'terrible':
        return language === 'kn' ? 'ಬಹಳ ಬೇಸರವಾಗಿದೆ' : language === 'hi' ? 'बहुत खराब' : 'Terrible';
      default:
        return mood;
    }
  };

  const getTitle = () => {
    return language === 'kn' ? 'ನಿಮಗೆ ಹೇಗನಿಸುತ್ತಿದೆ?' : language === 'hi' ? 'आप कैसा महसूस कर रहे हैं?' : 'How are you feeling?';
  };

  const moodsList: Array<{ value: MoodType; iconName: string }> = [
    { value: 'great', iconName: 'Laugh' },
    { value: 'good', iconName: 'Smile' },
    { value: 'okay', iconName: 'Meh' },
    { value: 'bad', iconName: 'Frown' },
    { value: 'terrible', iconName: 'Annoyed' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{getTitle()}</Text>
      <View style={styles.row}>
        {moodsList.map((m) => (
          <TouchableOpacity
            key={m.value}
            style={[styles.option, selected === m.value && styles.selected]}
            onPress={() => onSelect(m.value)}
            activeOpacity={0.7}
          >
            {ICONS[m.iconName] && React.createElement(ICONS[m.iconName], { size: 24, strokeWidth: 1.5, color: selected === m.value ? theme.colors.primaryLight : theme.colors.textMuted, style: { marginBottom: 4 } })}
            <Text style={[styles.optLabel, selected === m.value && styles.optLabelSelected]}>
              {getMoodLabel(m.value)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: theme.spacing.md },
  label: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
  option: {
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexBasis: '18%',
    flexGrow: 1,
    minWidth: 86,
    backgroundColor: theme.colors.surfaceAlt,
  },
  selected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}22`,
  },
  optLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  optLabelSelected: { color: theme.colors.primaryLight },
});

export const MoodPicker = React.memo(_MoodPicker);
