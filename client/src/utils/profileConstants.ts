import { Gender, HerniaType, OperationStage, SurgeryStatus, SurgeryType } from '../types';

// Gender options
export const GENDER_OPTIONS: Array<{ label: string; value: Gender }> = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

// Hernia type options
export const HERNIA_TYPE_OPTIONS: Array<{ label: string; value: HerniaType }> = [
  { label: 'Inguinal', value: 'inguinal' },
  { label: 'Femoral', value: 'femoral' },
  { label: 'Umbilical', value: 'umbilical' },
  { label: 'Incisional', value: 'incisional' },
];

// Surgery status options
export const SURGERY_STATUS_OPTIONS: Array<{ label: string; value: SurgeryStatus }> = [
  { label: 'Not Done', value: 'not-done' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Completed', value: 'completed' },
];

// Surgery type options
export const SURGERY_TYPE_OPTIONS: Array<{ label: string; value: SurgeryType }> = [
  { label: 'Open', value: 'open' },
  { label: 'Laparoscopic', value: 'laparoscopic' },
];

// Derive operation stage from surgery status
export const deriveOperationStage = (
  status: SurgeryStatus | null,
): OperationStage | null => {
  if (!status) return null;
  return status === 'completed' ? 'post-operation' : 'pre-operation';
};

// Format hernia type for display
export const formatHerniaType = (value?: HerniaType | null): string | undefined => {
  if (!value) return undefined;
  const map: Record<HerniaType, string> = {
    inguinal: 'Inguinal',
    femoral: 'Femoral',
    umbilical: 'Umbilical',
    incisional: 'Incisional',
  };
  return map[value];
};

// Format gender for display
export const formatGender = (value?: Gender | null): string | undefined => {
  if (!value) return undefined;
  const map: Record<Gender, string> = {
    male: 'Male',
    female: 'Female',
    other: 'Other',
  };
  return map[value];
};

// Format operation stage for display
export const formatOperationStage = (
  value?: OperationStage | null,
): string | undefined => {
  if (!value) return undefined;
  const map: Record<OperationStage, string> = {
    'pre-operation': 'Pre Operation',
    'post-operation': 'Post Operation',
  };
  return map[value];
};
