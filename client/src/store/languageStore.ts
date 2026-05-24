import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LanguageCode = 'en' | 'kn' | 'hi';

const translations = {
  en: {
    common: {
      cancel: 'Cancel',
      close: 'Close',
      save: 'Save',
      pending: 'Pending',
      connected: 'Connected',
      connect: 'Connect',
      confirm: 'Confirm',
    },
    dashboard: {
      hello: 'Hello, {{name}}',
      helloThere: 'Hello, there',
      countdownLabel: 'Surgery Countdown',
      totalXp: 'Total XP',
      badges: 'Badges',
      badgesEarned: 'Badges earned',
      todaysTasks: "Today's tasks",
      allCompletedTitle: 'All Daily Tasks Completed!',
      allCompletedSubtitle: "Amazing job! You've earned all XP and completed your daily streak check-in. Keep up the excellent work!",
      completedBtn: 'Completed',
      tasksCompletedToday: 'Tasks completed today',
      noTasksCompleted: 'No tasks completed yet.',
      dailyStreak: 'Daily Streak',
      streakDays: '{{count}} Days',
      phases: {
        preop: 'Pre-Op Preparation',
        postop: 'Post-Op Recovery',
        recovery: 'Recovery Phase',
        setup: 'Setup Phase',
      },
      tasks: {
        medication_logged: 'Log Medications',
        medication_logged_desc: "Mark today's pain killers/prescribed medicines as taken",
        daily_logging: 'Daily Login',
        daily_logging_desc: 'Open HerniaCare daily to maintain recovery sequence',
        wound_photo: 'Upload Wound Photo',
        wound_photo_desc: 'Take a clear photo of your wound area to monitor healing progress',
        symptoms_logging: 'Log Symptoms',
        symptoms_logging_desc: 'Check in on your pain level and other surgical symptoms',
        autoCompleteHint: 'Auto-completes when you log data',
      }
    },
    activity: {
      pageTitle: 'Care Plan',
      canDoTitle: 'Can Do (Recommended)',
      notToDoTitle: 'Not To Do (Avoid)',
      canDoSlides: {
        slide1: {
          title: 'Eat High Fiber',
          subtitle: 'Fruit, vegetables, oats, and whole grains keep digestion safe',
        },
        slide2: {
          title: 'Hydrate Well',
          subtitle: 'Keep sipping water throughout the day to support cellular recovery',
        },
        slide3: {
          title: 'Gentle Walking',
          subtitle: 'A calm walk keeps your body active and improves blood circulation',
        },
        slide4: {
          title: 'Bed Rest',
          subtitle: 'Ensure plenty of restful sleep in a comfortable bed with pillows',
        },
        slide5: {
          title: 'Light Chores',
          subtitle: 'Do small, safe tasks like watering a plant without lifting weight',
        },
      },
      notToDoSlides: {
        slide1: {
          title: 'Avoid Junk Food',
          subtitle: 'Chips, fried snacks, and heavy meals slow down your digestion',
        },
        slide2: {
          title: 'Avoid Alcohol',
          subtitle: 'Alcohol dehydrates your body and delays wound healing',
        },
        slide3: {
          title: 'Avoid Running',
          subtitle: 'Strenuous running exerts unsafe pressure on surgical repair',
        },
        slide4: {
          title: 'Avoid Heavy Lifting',
          subtitle: 'Do not lift objects over 5 lbs to prevent abdominal wall hernia tear',
        },
        slide5: {
          title: 'Avoid Bending Over',
          subtitle: 'Do not bend at the waist; bend knees instead to protect wound',
        },
      },
    },
    diary: {
      pageTitle: 'Recovery Diary',
      empty: 'No entries yet. Add your first diary entry below.',
      loadMore: 'Load more',
      addTodayEntry: "+ Add today's entry",
      placeholder: 'Write about how you feel today...',
      saveXp: 'Save +15 XP',
      selectMood: 'Select Mood',
      selectMoodAlertTitle: 'Select Mood',
      selectMoodAlertDesc: 'Please pick how you are feeling today.',
      tooShortAlertTitle: 'Too Short',
      tooShortAlertDesc: 'Please write at least 10 characters.',
      entryAddedAlertTitle: 'Entry Added ✅',
      entryAddedAlertDesc: '+15 XP earned!',
    },
    experts: {
      pageTitle: 'Find Doctors',
      careTeamTitle: 'Care Team',
      emptyDoctors: 'No doctors matching your search or none available.',
      searchPlaceholder: 'Search by name or phone...',
      hospitalLocation: 'Hospital Location',
      confirmBooking: 'Confirm Booking',
      bookAppointment: 'Book Appointment',
      specialistSubtitle: 'Hernia Specialist',
      rating: 'Rating',
      reviews: 'reviews',
      consultationFee: 'Consultation Fee',
      experience: 'Experience',
      years: 'years',
      location: 'Location',
      aboutDoctor: 'About Doctor',
      removeConnection: 'Remove Connection',
      removeConnectionDesc: 'Are you sure you want to remove connection with Dr. {{name}}?',
      removePendingDesc: 'Are you sure you want to cancel the connection request to Dr. {{name}}?',
      appointmentBooked: 'Appointment Booked! ✅',
      appointmentBookedDesc: 'Your appointment request has been scheduled successfully.',
      noDoctorsFound: 'No Doctors Found',
      noDoctorsAvailable: 'No Doctors Available',
      noDoctorsFoundDesc: 'No doctors match your search. Try a different name or phone number.',
      noDoctorsAvailableDesc: 'There are no new doctors to connect with at the moment. Please check back later.',
      viewProfile: 'View Profile →',
      loadingDoctors: 'Loading doctors...',
      connectWithSpecialist: 'Connect with a Specialist',
      connectWithSpecialistDesc: 'Connect with a hernia care specialist to share your symptom logs, daily diaries, and wound health photos for active medical monitoring.',
      connectWithDoctorBtn: 'Connect with Doctor',
      requestsPending: 'Requests Pending',
      requestsPendingDesc: "Your connection requests have been sent. Once a doctor accepts, you'll be able to schedule appointments and share recovery details.",
      pendingRequestsLabel: 'Pending Requests ({{count}})',
      profileBtn: 'Profile',
      requestSentTitle: 'Request Sent 📩',
      requestSentDesc: 'Your connection request has been sent successfully. The doctor will review your profile shortly.',
      errorTitle: 'Error',
      sendRequestError: 'Could not send request. Please try again.',
    }
  },
  kn: {
    common: {
      cancel: 'ರದ್ದುಮಾಡಿ',
      close: 'ಮುಚ್ಚಿ',
      save: 'ಉಳಿಸಿ',
      pending: 'ಬಾಕಿ ಇದೆ',
      connected: 'ಸಂಪರ್ಕಿಸಲಾಗಿದೆ',
      connect: 'ಸಂಪರ್ಕಿಸಿ',
      confirm: 'ಖಚಿತಪಡಿಸಿ',
    },
    dashboard: {
      hello: 'ನಮಸ್ಕಾರ, {{name}}',
      helloThere: 'ನಮಸ್ಕಾರ',
      countdownLabel: 'ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಯ ಕೌಂಟ್‌ಡೌನ್',
      totalXp: 'ಒಟ್ಟು XP',
      badges: 'ಬ್ಯಾಡ್ಜ್‌ಗಳು',
      badgesEarned: 'ಗಳಿಸಿದ ಬ್ಯಾಡ್ಜ್‌ಗಳು',
      todaysTasks: 'ಇಂದಿನ ಕೆಲಸಗಳು',
      allCompletedTitle: 'ಎಲ್ಲಾ ದಿನನಿತ್ಯದ ಕೆಲಸಗಳು ಪೂರ್ಣಗೊಂಡಿವೆ!',
      allCompletedSubtitle: 'ಅದ್ಭುತ ಕೆಲಸ! ನೀವು ಎಲ್ಲಾ XP ಗಳಿಸಿದ್ದೀರಿ ಮತ್ತು ನಿಮ್ಮ ದೈನಂದಿನ ಸ್ಟ್ರೀಕ್ ಚೆಕ್-ಇನ್ ಅನ್ನು ಪೂರ್ಣಗೊಳಿಸಿದ್ದೀರಿ. ಹೀಗೆಯೇ ಮುಂದುವರಿಸಿ!',
      completedBtn: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
      tasksCompletedToday: 'ಇಂದು ಪೂರ್ಣಗೊಂಡ ಕೆಲಸಗಳು',
      noTasksCompleted: 'ಇನ್ನೂ ಯಾವುದೇ ಕೆಲಸಗಳು ಪೂರ್ಣಗೊಂಡಿಲ್ಲ.',
      dailyStreak: 'ದೈನಂದಿನ ಸರಣಿ (Streak)',
      streakDays: '{{count}} ದಿನಗಳು',
      phases: {
        preop: 'ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಗೆ ಮುನ್ನ ತಯಾರಿ',
        postop: 'ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಯ ನಂತರದ ಚೇತರಿಕೆ',
        recovery: 'ಚೇತರಿಕೆಯ ಹಂತ',
        setup: 'ಸ್ಥಾಪನೆ ಹಂತ',
      },
      tasks: {
        medication_logged: 'ಔಷಧಿಗಳನ್ನು ದಾಖಲಿಸಿ',
        medication_logged_desc: 'ಇಂದಿನ ನೋವು ನಿವಾರಕಗಳು/ಸೂಚಿಸಿದ ಔಷಧಿಗಳನ್ನು ಸೇವಿಸಿದ್ದೀರಿ ಎಂದು ಗುರುತು ಮಾಡಿ',
        daily_logging: 'ದೈನಂದಿನ ಲಾಗಿನ್',
        daily_logging_desc: 'ಚೇತರಿಕೆಯ ಪ್ರಕ್ರಿಯೆಯನ್ನು ನಿರ್ವಹಿಸಲು ಪ್ರತಿದಿನ ಹರ್ನಿಯಾಕೇರ್ ತೆರೆಯಿರಿ',
        wound_photo: 'ಗಾಯದ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
        wound_photo_desc: 'ಗಾಯದ ವಾಸಿಯಾಗುವ ಪ್ರಕ್ರಿಯೆಯನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಲು ಸ್ಪಷ್ಟವಾದ ಗಾಯದ ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಿ',
        symptoms_logging: 'ರೋಗಲಕ್ಷಣಗಳನ್ನು ದಾಖಲಿಸಿ',
        symptoms_logging_desc: 'ನಿಮ್ಮ ನೋವಿನ ಮಟ್ಟ ಮತ್ತು ಇತರ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಯ ರೋಗಲಕ್ಷಣಗಳನ್ನು ಪರಿಶೀಲಿಸಿ',
        autoCompleteHint: 'ನೀವು ಡೇಟಾವನ್ನು ದಾಖಲಿಸಿದಾಗ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಪೂರ್ಣಗೊಳ್ಳುತ್ತದೆ',
      }
    },
    activity: {
      pageTitle: 'ಆರೈಕೆ ಯೋಜನೆ',
      canDoTitle: 'ಮಾಡಬಹುದು (ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ)',
      notToDoTitle: 'ಮಾಡಬಾರದು (ತಪ್ಪಿಸಿ)',
      canDoSlides: {
        slide1: {
          title: 'ಹೆಚ್ಚು ನಾರಿನ ಆಹಾರ ಸೇವಿಸಿ',
          subtitle: 'ಹಣ್ಣುಗಳು, ತರಕಾರಿಗಳು, ಓಟ್ಸ್ ಮತ್ತು ಧಾನ್ಯಗಳು ಜೀರ್ಣಕ್ರಿಯೆಯನ್ನು ಸುರಕ್ಷಿತವಾಗಿರಿಸುತ್ತವೆ',
        },
        slide2: {
          title: 'ಚೆನ್ನಾಗಿ ನೀರು ಕುಡಿಯಿರಿ',
          subtitle: 'ಕೋಶಗಳ ಚೇತರಿಕೆಗೆ ಬೆಂಬಲ ನೀಡಲು ಇಡೀ ದಿನ ನೀರು ಕುಡಿಯುತ್ತಿರಿ',
        },
        slide3: {
          title: 'ಸೌಮ್ಯವಾದ ನಡಿಗೆ',
          subtitle: 'ಶಾಂತವಾದ ನಡಿಗೆಯು ನಿಮ್ಮ ದೇಹವನ್ನು ಸಕ್ರಿಯವಾಗಿರಿಸುತ್ತದೆ ಮತ್ತು ರಕ್ತ ಪರಿಚಲನೆಯನ್ನು ಸುಧಾರಿಸುತ್ತದೆ',
        },
        slide4: {
          title: 'ಹಾಸಿಗೆ ವಿಶ್ರಾಂತಿ',
          subtitle: 'ದಿಂಬುಗಳೊಂದಿಗೆ ಆರಾಮದಾಯಕ ಹಾಸಿಗೆಯಲ್ಲಿ ಸಾಕಷ್ಟು ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ',
        },
        slide5: {
          title: 'ಹಗುರವಾದ ಕೆಲಸಗಳು',
          subtitle: 'ಭಾರ ಎತ್ತದೆ ಗಿಡಕ್ಕೆ ನೀರುಣಿಸುವಂತಹ ಸಣ್ಣ ಮತ್ತು ಸುರಕ್ಷಿತ ಕೆಲಸಗಳನ್ನು ಮಾಡಿ',
        },
      },
      notToDoSlides: {
        slide1: {
          title: 'ಜಂಕ್ ಫುಡ್ ತಪ್ಪಿಸಿ',
          subtitle: 'ಚಿಪ್ಸ್, ಕರಿದ ತಿಂಡಿಗಳು ಮತ್ತು ಭಾರಿ ಊಟ ಜೀರ್ಣಕ್ರಿಯೆಯನ್ನು ನಿಧಾನಗೊಳಿಸುತ್ತವೆ',
        },
        slide2: {
          title: 'ಮದ್ಯಪಾನ ತಪ್ಪಿಸಿ',
          subtitle: 'ಮದ್ಯಪಾನವು ನಿಮ್ಮ ದೇಹವನ್ನು ನಿರ್ಜಲೀಕರಣಗೊಳಿಸುತ್ತದೆ ಮತ್ತು ಗಾಯ ಗುಣವಾಗುವುದನ್ನು ವಿಳಂಬಗೊಳಿಸುತ್ತದೆ',
        },
        slide3: {
          title: 'ಓಡುವುದನ್ನು ತಪ್ಪಿಸಿ',
          subtitle: 'ಕಠಿಣ ಓಟವು ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಯ ದುರಸ್ತಿ ಮೇಲೆ ಅಸುರಕ್ಷಿತ ಒತ್ತಡವನ್ನು ಬೀರುತ್ತದೆ',
        },
        slide4: {
          title: 'ಭಾರವಾದ ವಸ್ತುಗಳನ್ನು ಎತ್ತುವುದನ್ನು ತಪ್ಪಿಸಿ',
          subtitle: 'ಕಿಬ್ಬೊಟ್ಟೆಯ ಹರ್ನಿಯಾ ಹರಿದುಹೋಗುವುದನ್ನು ತಡೆಯಲು 5 ಪೌಂಡ್‌ಗಿಂತ ಹೆಚ್ಚು ಭಾರದ ವಸ್ತುಗಳನ್ನು ಎತ್ತಬೇಡಿ',
        },
        slide5: {
          title: 'ಮುಂದಕ್ಕೆ ಬಗ್ಗಬೇಡಿ',
          subtitle: 'ಸೊಂಟದ ಹತ್ತಿರ ಬಗ್ಗಬೇಡಿ; ಗಾಯವನ್ನು ರಕ್ಷಿಸಲು ಮೊಣಕಾಲುಗಳನ್ನು ಬಗ್ಗಿಸಿ',
        },
      },
    },
    diary: {
      pageTitle: 'ಚೇತರಿಕೆ ದಿನಚರಿ',
      empty: 'ಇನ್ನೂ ಯಾವುದೇ ದಿನಚರಿ ಇಲ್ಲ. ಕೆಳಗೆ ನಿಮ್ಮ ಮೊದಲ ದಿನಚರಿಯನ್ನು ಬರೆಯಿರಿ.',
      loadMore: 'ಇನ್ನೂ ಲೋಡ್ ಮಾಡಿ',
      addTodayEntry: 'ಇಂದಿನ ದಿನಚರಿ ಬರೆಯಿರಿ',
      placeholder: 'ಇಂದು ನಿಮಗೆ ಹೇಗನಿಸುತ್ತಿದೆ ಎಂದು ಬರೆಯಿರಿ...',
      saveXp: 'ಉಳಿಸಿ +15 XP',
      selectMood: 'ಮನಸ್ಥಿತಿ ಆಯ್ಕೆಮಾಡಿ',
      selectMoodAlertTitle: 'ಮನಸ್ಥಿತಿ ಆಯ್ಕೆಮಾಡಿ',
      selectMoodAlertDesc: 'ದಯವಿಟ್ಟು ಇಂದು ನಿಮಗೆ ಹೇಗನಿಸುತ್ತಿದೆ ಎಂಬುದನ್ನು ಆಯ್ಕೆ ಮಾಡಿ.',
      tooShortAlertTitle: 'ಬಹಳ ಚಿಕ್ಕದಾಗಿದೆ',
      tooShortAlertDesc: 'ದಯವಿಟ್ಟು ಕನಿಷ್ಠ 10 ಅಕ್ಷರಗಳನ್ನು ಬರೆಯಿರಿ.',
      entryAddedAlertTitle: 'ದಿನಚರಿ ಸೇರಿಸಲಾಗಿದೆ ✅',
      entryAddedAlertDesc: '+15 XP ಗಳಿಸಲಾಗಿದೆ!',
    },
    experts: {
      pageTitle: 'ವೈದ್ಯರನ್ನು ಹುಡುಕಿ',
      careTeamTitle: 'ಆರೈಕೆ ತಂಡ',
      emptyDoctors: 'ನಿಮ್ಮ ಹುಡುಕಾಟಕ್ಕೆ ಹೊಂದಿಕೆಯಾಗುವ ವೈದ್ಯರು ಇಲ್ಲ.',
      searchPlaceholder: 'ಹೆಸರು ಅಥವಾ ಫೋನ್ ಮೂಲಕ ಹುಡುಕಿ...',
      hospitalLocation: 'ಆಸ್ಪತ್ರೆಯ ಸ್ಥಳ',
      confirmBooking: 'ಬುಕ್ಕಿಂಗ್ ಖಚಿತಪಡಿಸಿ',
      bookAppointment: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ',
      specialistSubtitle: 'ಹರ್ನಿಯಾ ತಜ್ಞರು',
      rating: 'ರೇಟಿಂಗ್',
      reviews: 'ವಿಮರ್ಶೆಗಳು',
      consultationFee: 'ಸಮಾಲೋಚನೆ ಶುಲ್ಕ',
      experience: 'ಅನುಭವ',
      years: 'ವರ್ಷಗಳು',
      location: 'ಸ್ಥಳ',
      aboutDoctor: 'ವೈದ್ಯರ ಬಗ್ಗೆ',
      removeConnection: 'ಸಂಪರ್ಕ ಕಡಿತಗೊಳಿಸಿ',
      removeConnectionDesc: 'ನೀವು ನಿಜವಾಗಿಯೂ ಡಾ. {{name}} ಅವರೊಂದಿಗೆ ಸಂಪರ್ಕ ಕಡಿತಗೊಳಿಸಲು ಬಯಸುವಿರಾ?',
      removePendingDesc: 'ಡಾ. {{name}} ಅವರಿಗೆ ಕಳುಹಿಸಿದ ಸಂಪರ್ಕ ವಿನಂತಿಯನ್ನು ರದ್ದುಗೊಳಿಸಲು ನೀವು ಬಯಸುವಿರಾ?',
      appointmentBooked: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ! ✅',
      appointmentBookedDesc: 'ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ವಿನಂತಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.',
      noDoctorsFound: 'ಯಾವುದೇ ವೈದ್ಯರು ಕಂಡುಬಂದಿಲ್ಲ',
      noDoctorsAvailable: 'ಯಾವುದೇ ವೈದ್ಯರು ಲಭ್ಯವಿಲ್ಲ',
      noDoctorsFoundDesc: 'ನಿಮ್ಮ ಹುಡುಕಾಟಕ್ಕೆ ಯಾವುದೇ ವೈದ್ಯರು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ. ಬೇರೆ ಹೆಸರು ಅಥವಾ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ಪ್ರಯತ್ನಿಸಿ.',
      noDoctorsAvailableDesc: 'ಪ್ರಸ್ತುತ ಸಂಪರ್ಕಿಸಲು ಯಾವುದೇ ಹೊಸ ವೈದ್ಯರು ಇಲ್ಲ. ದಯವಿಟ್ಟು ನಂತರ ಪರಿಶೀಲಿಸಿ.',
      viewProfile: 'ಪ್ರೊಫೈಲ್ ವೀಕ್ಷಿಸಿ →',
      loadingDoctors: 'ವೈದ್ಯರನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...',
      connectWithSpecialist: 'ತಜ್ಞರೊಂದಿಗೆ ಸಂಪರ್ಕ ಸಾಧಿಸಿ',
      connectWithSpecialistDesc: 'ಸಕ್ರಿಯ ವೈದ್ಯಕೀಯ ಮೇಲ್ವಿಚಾರಣೆಗಾಗಿ ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳ ದಾಖಲೆಗಳು, ದೈನಂದಿನ ದಿನಚರಿಗಳು ಮತ್ತು ಗಾಯದ ಆರೋಗ್ಯ ಫೋಟೋಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಲು ಹರ್ನಿಯಾ ಆರೈಕೆ ತಜ್ಞರೊಂದಿಗೆ ಸಂಪರ್ಕ ಸಾಧಿಸಿ.',
      connectWithDoctorBtn: 'ವೈದ್ಯರೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಿ',
      requestsPending: 'ವಿನಂತಿಗಳು ಬಾಕಿ ಇವೆ',
      requestsPendingDesc: 'ನಿಮ್ಮ ಸಂಪರ್ಕ ವಿನಂತಿಗಳನ್ನು ಕಳುಹಿಸಲಾಗಿದೆ. ವೈದ್ಯರು ಒಪ್ಪಿಕೊಂಡ ನಂತರ, ನೀವು ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲು ಮತ್ತು ಚೇತರಿಕೆಯ ವಿವರಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಲು ಸಾಧ್ಯವಾಗುತ್ತದೆ.',
      pendingRequestsLabel: 'ಬಾಕಿ ವಿನಂತಿಗಳು ({{count}})',
      profileBtn: 'ಪ್ರೊಫೈಲ್',
      requestSentTitle: 'ವಿನಂತಿ ಕಳುಹಿಸಲಾಗಿದೆ 📩',
      requestSentDesc: 'ನಿಮ್ಮ ಸಂಪರ್ಕ ವಿನಂತಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಕಳುಹಿಸಲಾಗಿದೆ. ವೈದ್ಯರು ಶೀಘ್ರದಲ್ಲೇ ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಅನ್ನು ಪರಿಶೀಲಿಸುತ್ತಾರೆ.',
      errorTitle: 'ದೋಷ',
      sendRequestError: 'ವಿನಂತಿಯನ್ನು ಕಳುಹಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.',
    }
  },
  hi: {
    common: {
      cancel: 'रद्द करें',
      close: 'बंद करें',
      save: 'सहेजें',
      pending: 'लंबित',
      connected: 'जुड़े हुए',
      connect: 'जुड़ें',
      confirm: 'पुष्टि करें',
    },
    dashboard: {
      hello: 'नमस्कार, {{name}}',
      helloThere: 'नमस्कार',
      countdownLabel: 'सर्जरी उलटी गिनती',
      totalXp: 'कुल XP',
      badges: 'बैज',
      badgesEarned: 'अर्जित बैज',
      todaysTasks: 'आज के कार्य',
      allCompletedTitle: 'सभी दैनिक कार्य पूरे हुए!',
      allCompletedSubtitle: 'शानदार काम! आपने सभी XP अर्जित कर लिए हैं और अपना दैनिक स्ट्रीक चेक-इन पूरा कर लिया है। इसे जारी रखें!',
      completedBtn: 'पूरा हुआ',
      tasksCompletedToday: 'आज पूरे किए गए कार्य',
      noTasksCompleted: 'अभी तक कोई कार्य पूरा नहीं हुआ है।',
      dailyStreak: 'दैनिक स्ट्रीक',
      streakDays: '{{count}} दिन',
      phases: {
        preop: 'सर्जरी-पूर्व तैयारी',
        postop: 'सर्जरी के बाद सुधार',
        recovery: 'रिकवरी चरण',
        setup: 'सेटअप चरण',
      },
      tasks: {
        medication_logged: 'दवाएं दर्ज करें',
        medication_logged_desc: 'चिह्नित करें कि आज की दर्द निवारक/निर्धारित दवाएं ले ली गई हैं',
        daily_logging: 'दैनिक लॉगिन',
        daily_logging_desc: 'रिकवरी प्रक्रिया को बनाए रखने के लिए रोजाना हर्नियाकेयर खोलें',
        wound_photo: 'घाव की फोटो अपलोड करें',
        wound_photo_desc: 'घाव के ठीक होने की प्रक्रिया की निगरानी के लिए एक साफ फोटो लें',
        symptoms_logging: 'लक्षणों को दर्ज करें',
        symptoms_logging_desc: 'अपने दर्द के स्तर और अन्य सर्जिकल लक्षणों की जांच करें',
        autoCompleteHint: 'डेटा दर्ज करने पर स्वचालित रूप से पूरा हो जाता है',
      }
    },
    activity: {
      pageTitle: 'देखभाल योजना',
      canDoTitle: 'कर सकते हैं (अनुशंसित)',
      notToDoTitle: 'नहीं करना है (बचें)',
      canDoSlides: {
        slide1: {
          title: 'उच्च फाइबर खाएं',
          subtitle: 'फल, सब्जियां, ओट्स और साबुत अनाज पाचन को सुरक्षित रखते हैं',
        },
        slide2: {
          title: 'अच्छी तरह हाइड्रेट रहें',
          subtitle: 'कोशिकाओं के ठीक होने में मदद के लिए दिनभर पानी पीते रहें',
        },
        slide3: {
          title: 'हल्की सैर',
          subtitle: 'शांत सैर आपके शरीर को सक्रिय रखती है और रक्त परिसंचरण में सुधार करती है',
        },
        slide4: {
          title: 'बिस्तर पर आराम',
          subtitle: 'तकिए के साथ आरामदायक बिस्तर पर पर्याप्त आराम सुनिश्चित करें',
        },
        slide5: {
          title: 'हल्के काम',
          subtitle: 'बिना वजन उठाए पौधे को पानी देने जैसे छोटे, सुरक्षित काम करें',
        },
      },
      notToDoSlides: {
        slide1: {
          title: 'जंक फूड से बचें',
          subtitle: 'चिप्स, तले हुए स्नैक्स और भारी भोजन आपके पाचन को धीमा करते हैं',
        },
        slide2: {
          title: 'शराब पीने से बचें',
          subtitle: 'शराब आपके शरीर को निर्जलित करती है और घाव भरने में देरी करती है',
        },
        slide3: {
          title: 'दौड़ने से बचें',
          subtitle: 'तेज दौड़ने से सर्जिकल रिपेयर पर असुरक्षित दबाव पड़ता है',
        },
        slide4: {
          title: 'भारी सामान उठाने से बचें',
          subtitle: 'पेट की दीवार के हर्निया को फटने से बचाने के लिए 5 पाउंड से अधिक वजन न उठाएं',
        },
        slide5: {
          title: 'आगे झुकने से बचें',
          subtitle: 'कमर से न झुकें; घाव की सुरक्षा के लिए घुटनों को मोड़ें',
        },
      },
    },
    diary: {
      pageTitle: 'रिकवरी डायरी',
      empty: 'अभी तक कोई प्रविष्टि नहीं है। नीचे अपनी पहली डायरी प्रविष्टि जोड़ें।',
      loadMore: 'और लोड करें',
      addTodayEntry: 'आज की प्रविष्टि जोड़ें',
      placeholder: 'लिखें कि आज आप कैसा महसूस कर रहे हैं...',
      saveXp: 'सहेजें +15 XP',
      selectMood: 'मनोदशा चुनें',
      selectMoodAlertTitle: 'मनोदशा चुनें',
      selectMoodAlertDesc: 'कृपया चुनें कि आज आप कैसा महसूस कर रहे हैं।',
      tooShortAlertTitle: 'बहुत छोटा',
      tooShortAlertDesc: 'कृपया कम से कम 10 वर्ण लिखें।',
      entryAddedAlertTitle: 'प्रविष्टि जोड़ी गई ✅',
      entryAddedAlertDesc: '+15 XP अर्जित किया गया!',
    },
    experts: {
      pageTitle: 'डॉक्टरों को खोजें',
      careTeamTitle: 'देखभाल टीम',
      emptyDoctors: 'आपकी खोज से मेल खाता कोई डॉक्टर नहीं मिला।',
      searchPlaceholder: 'नाम या फोन से खोजें...',
      hospitalLocation: 'अस्पताल का स्थान',
      confirmBooking: 'बुकिंग की पुष्टि करें',
      bookAppointment: 'अपॉइंटमेंट बुक करें',
      specialistSubtitle: 'हर्निया विशेषज्ञ',
      rating: 'रेटिंग',
      reviews: 'समीक्षाएं',
      consultationFee: 'परामर्श शुल्क',
      experience: 'अनुभव',
      years: 'वर्ष',
      location: 'स्थान',
      aboutDoctor: 'डॉक्टर के बारे में',
      removeConnection: 'संपर्क हटाएं',
      removeConnectionDesc: 'क्या आप वाकई डॉ. {{name}} के साथ संपर्क हटाना चाहते हैं?',
      removePendingDesc: 'क्या आप डॉ. {{name}} को भेजी गई संपर्क सूची रद्द करना चाहते हैं?',
      appointmentBooked: 'अपॉइंटमेंट बुक हो गया! ✅',
      appointmentBookedDesc: 'अपांइटमेंट सफलतापूर्वक निर्धारित हो गया है।',
      noDoctorsFound: 'कोई डॉक्टर नहीं मिला',
      noDoctorsAvailable: 'कोई डॉक्टर उपलब्ध नहीं है',
      noDoctorsFoundDesc: 'आपकी खोज से मेल खाता कोई डॉक्टर नहीं मिला। दूसरा नाम या फोन नंबर आज़माएं।',
      noDoctorsAvailableDesc: 'इस समय जुड़ने के लिए कोई नए डॉक्टर उपलब्ध नहीं हैं। कृपया बाद में दोबारा जांचें।',
      viewProfile: 'प्रोफ़ाइल देखें →',
      loadingDoctors: 'डॉक्टरों को लोड किया जा रहा है...',
      connectWithSpecialist: 'किसी विशेषज्ञ से जुड़ें',
      connectWithSpecialistDesc: 'सक्रिय चिकित्सा निगरानी के लिए अपने लक्षण लॉग, दैनिक डायरी और घाव स्वास्थ्य फ़ोटो साझा करने के लिए हर्निया देखभाल विशेषज्ञ से जुड़ें।',
      connectWithDoctorBtn: 'डॉक्टर से जुड़ें',
      requestsPending: 'अनुरोध लंबित हैं',
      requestsPendingDesc: 'आपके कनेक्शन अनुरोध भेज दिए गए हैं। एक बार डॉक्टर द्वारा स्वीकार किए जाने के बाद, आप अपॉइंटमेंट शेड्यूल करने और रिकवरी विवरण साझा करने में सक्षम होंगे।',
      pendingRequestsLabel: 'लंबित अनुरोध ({{count}})',
      profileBtn: 'प्रोफ़ाइल',
      requestSentTitle: 'अनुरोध भेजा गया 📩',
      requestSentDesc: 'आपका कनेक्शन अनुरोध सफलतापूर्वक भेज दिया गया है। डॉक्टर जल्द ही आपकी प्रोफ़ाइल की समीक्षा करेंगे।',
      errorTitle: 'त्रुटि',
      sendRequestError: 'अनुरोध नहीं भेजा जा सका। कृपया पुनः प्रयास करें।',
    }
  }
};

export interface LanguageState {
  language: LanguageCode;
}

export interface LanguageActions {
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

export const useLanguageStore = create<LanguageState & LanguageActions>()(
  persist(
    (set, get) => ({
      language: 'en',

      setLanguage: (lang) => set({ language: lang }),

      t: (key, replacements) => {
        const lang = get().language;
        const dict = translations[lang] || translations.en;
        
        // Resolve nested keys using dot notation
        const parts = key.split('.');
        let current: any = dict;
        for (const part of parts) {
          if (current && current[part] !== undefined) {
            current = current[part];
          } else {
            // Fallback to English dictionary
            let engFallback: any = translations.en;
            for (const p of parts) {
              if (engFallback && engFallback[p] !== undefined) {
                engFallback = engFallback[p];
              } else {
                return key;
              }
            }
            current = engFallback;
            break;
          }
        }

        if (typeof current !== 'string') {
          return key;
        }

        // Apply replacements if provided
        let text = current;
        if (replacements) {
          Object.entries(replacements).forEach(([k, v]) => {
            text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
          });
        }

        return text;
      },
    }),
    {
      name: 'herniacare-language',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
