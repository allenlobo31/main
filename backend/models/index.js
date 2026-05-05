const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor'], required: true },
  avatarUrl: String,
  gender: String,
  herniaType: String,
  operationStage: String,
  surgeryStatus: String,
  surgeryType: String,
  scheduledSurgeryDate: Date,
  profileSetupCompleted: { type: Boolean, default: false },
  phoneNumber: String,
  address: String,
  hospitalAddress: String,
  specialty: String,
  bio: String,
  linkedDoctorIds: [String],
  pendingDoctorIds: [String],
  linkedPatientIds: [String],
  pendingPatientIds: [String],
  expoPushToken: String,
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streakDays: { type: Number, default: 0 },
  lastCheckIn: Date,
  badges: [String],
  phase: { type: String, enum: ['pre-op', 'post-op', 'recovery'], default: 'pre-op' },
  tasksCompletedToday: [String],
  reports: [{
    title: String,
    type: { type: String, enum: ['scan', 'discharge', 'wound_photo', 'lab', 'other'] },
    fileUrl: String,
    uploadedAt: { type: Date, default: Date.now },
    aiWoundAnalysis: String
  }],
  isActive: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
}, { timestamps: true });

const SymptomSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  intensity: Number,
  painLevel: Number,
  location: String,
  notes: String,
  swelling: String,
  fever: Boolean,
  nausea: Boolean,
  woundCondition: String,
  additionalNotes: String,
  date: Date,
  timestamp: { type: Date, default: Date.now },
});

const DiarySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: String,
  text: String,
  mood: String,
  date: Date,
  aiSummary: String,
  timestamp: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);
const Symptom = mongoose.model('Symptom', SymptomSchema);
const Diary = mongoose.model('Diary', DiarySchema);

module.exports = { User, Symptom, Diary };