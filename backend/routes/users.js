const express = require('express');
const router = express.Router();
const { User, Symptom, Diary } = require('../models');
const authMiddleware = require('../middleware/auth');

// Get all doctors
router.get('/doctors', authMiddleware, async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('-password');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const userObj = await User.findById(req.user.id);
    if (!userObj) return res.status(404).json({ message: 'User not found' });

    const editableFields = [
      'name', 'gender', 'herniaType', 'operationStage', 'surgeryStatus',
      'surgeryType', 'scheduledSurgeryDate', 'phoneNumber', 'address',
      'hospitalAddress', 'specialty', 'bio', 'availableAtHospital', 'experience',
      'avatarUrl', 'expoPushToken', 'isActive', 'isOnline'
    ];

    let update = {};

    // Whitelist top-level editable fields
    editableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        update[field] = req.body[field];
      }
    });

    // Whitelist XP & Level updates from gamification
    if (req.body.xp !== undefined) update.xp = req.body.xp;
    if (req.body.level !== undefined) update.level = req.body.level;
    if (req.body.streakDays !== undefined) update.streakDays = req.body.streakDays;

    // Whitelist update operators
    if (req.body.$addToSet) {
      update.$addToSet = {};
      if (req.body.$addToSet.tasksCompletedToday) {
        update.$addToSet.tasksCompletedToday = req.body.$addToSet.tasksCompletedToday;
      }
      if (req.body.$addToSet.badges) {
        update.$addToSet.badges = req.body.$addToSet.badges;
      }
    }

    // Check if it's a new day to reset completed tasks
    if (userObj.lastTaskResetDate !== todayStr) {
      if (!update.$set) update.$set = {};
      update.$set.tasksCompletedToday = [];
      update.$set.lastTaskResetDate = todayStr;

      // If the incoming update was pushing a completed task, convert it to a set of that single task
      if (update.$addToSet && update.$addToSet.tasksCompletedToday) {
        update.$set.tasksCompletedToday = [update.$addToSet.tasksCompletedToday];
        delete update.$addToSet.tasksCompletedToday;
        if (Object.keys(update.$addToSet).length === 0) {
          delete update.$addToSet;
        }
      }
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select('-password');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update specific user (used by push service or specific field updates)
router.patch('/:uid', authMiddleware, async (req, res) => {
  try {
    const { uid } = req.params;
    // Ensure user can only update themselves or doctor can update patient? 
    // For now, allow self-update or if uid matches req.user.id
    if (uid !== req.user.id) {
      // Check if doctor is linked to this patient
      const doctor = await User.findById(req.user.id);
      if (doctor.role !== 'doctor' || !doctor.linkedPatientIds.includes(uid)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const user = await User.findByIdAndUpdate(uid, req.body, { new: true }).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Symptoms
router.post('/symptoms', authMiddleware, async (req, res) => {
  try {
    const symptom = new Symptom({ ...req.body, userId: req.user.id });
    await symptom.save();
    res.json(symptom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/symptoms', authMiddleware, async (req, res) => {
  try {
    const symptoms = await Symptom.find({ userId: req.user.id }).sort({ timestamp: -1 });
    res.json(symptoms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Diary
router.post('/diary', authMiddleware, async (req, res) => {
  try {
    const diary = new Diary({ ...req.body, userId: req.user.id });
    await diary.save();
    res.json(diary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/diary', authMiddleware, async (req, res) => {
  try {
    const diaryLines = await Diary.find({ userId: req.user.id }).sort({ timestamp: -1 });
    res.json(diaryLines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Gamification / Profile shorthand
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Daily task refresh check
    const todayStr = new Date().toISOString().split('T')[0];
    let needsSave = false;

    if (user.lastTaskResetDate !== todayStr) {
      user.tasksCompletedToday = [];
      user.lastTaskResetDate = todayStr;
      needsSave = true;
    }

    // Daily streak reset check (if they missed yesterday, reset streak to 0 until they check in today)
    if (user.lastCheckIn) {
      const lastCheckInDate = new Date(user.lastCheckIn);
      const lastCheckInMidnight = new Date(lastCheckInDate.getFullYear(), lastCheckInDate.getMonth(), lastCheckInDate.getDate());
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const diffTime = today.getTime() - lastCheckInMidnight.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 1 && user.streakDays !== 1) {
        user.streakDays = 1;
        needsSave = true;
      }
    }

    if (needsSave) {
      await user.save();
    }

    const userJson = user.toObject();
    delete userJson.password;
    res.json(userJson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific patient data (for doctors)
router.get('/patients/:uid', authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    if (requester.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied.' });
    }
    const { uid } = req.params;
    const patient = await User.findById(uid).select('-password');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    const symptoms = await Symptom.find({ userId: uid }).sort({ timestamp: -1 }).limit(50);
    const diary = await Diary.find({ userId: uid }).sort({ timestamp: -1 }).limit(50);
    res.json({
      patient,
      symptoms,
      diary,
      reports: patient.reports || [],
      gamification: {
        level: patient.level || 1,
        xp: patient.xp || 0,
        streak: patient.streakDays || 0,
        nextLevelXp: (patient.level || 1) * 100,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all linked/pending patients for a doctor
router.get('/my-patients', authMiddleware, async (req, res) => {
  try {
    const doctor = await User.findById(req.user.id);
    if (doctor.role !== 'doctor') return res.status(403).json({ message: 'Not a doctor' });

    const pendingIds = doctor.pendingPatientIds || [];
    const linkedIds = doctor.linkedPatientIds || [];
    const allIds = [...new Set([...pendingIds, ...linkedIds])];

    const patients = await User.find({ _id: { $in: allIds } }).select('-password');
    
    // Get latest symptom for each patient
    const summaries = await Promise.all(patients.map(async (p) => {
      const latestSymptom = await Symptom.findOne({ userId: p._id }).sort({ timestamp: -1 });
      return {
        user: p,
        latestSymptom: latestSymptom,
        hasFlag: latestSymptom?.aiFlag || false,
        isPending: pendingIds.includes(p._id.toString())
      };
    }));

    res.json(summaries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Gamification: Check streak
router.post('/check-streak', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (user.lastCheckIn) {
      const lastCheckInDate = new Date(user.lastCheckIn);
      const lastCheckInMidnight = new Date(lastCheckInDate.getFullYear(), lastCheckInDate.getMonth(), lastCheckInDate.getDate());
      
      const diffTime = today.getTime() - lastCheckInMidnight.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Logged in on consecutive calendar days (yesterday and today)
        user.streakDays += 1;
        user.lastCheckIn = now;
      } else if (diffDays > 1) {
        // Missed a calendar day completely, reset streak to 1
        user.streakDays = 1;
        user.lastCheckIn = now;
      } else {
        // Checked in today already, leave streak and lastCheckIn untouched (or just keep as is)
        user.lastCheckIn = now;
      }
    } else {
      // First check-in
      user.streakDays = 1;
      user.lastCheckIn = now;
    }
    
    await user.save();
    res.json({ streakDays: user.streakDays });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reports management
router.get('/reports', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.reports || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reports', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const newReport = {
      ...req.body,
      uploadedAt: new Date()
    };
    user.reports.push(newReport);
    await user.save();
    res.json(newReport);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/reports/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const reportToDelete = user.reports.find(r => r._id.toString() === req.params.id);

    if (reportToDelete && reportToDelete.fileUrl) {
      const urlParts = reportToDelete.fileUrl.split('/images/');
      if (urlParts.length > 1) {
        const imageId = urlParts[1];
        const Image = require('../models/Image');
        await Image.findByIdAndDelete(imageId);
        console.log(`🧹 Cleaned up orphaned image binary: ${imageId}`);
      }
    }

    user.reports = user.reports.filter(r => r._id.toString() !== req.params.id);
    await user.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept patient
router.post('/patients/:uid/accept', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied: Only doctors can accept patients' });
    }
    const doctorId = req.user.id;
    const { uid: patientId } = req.params;

    // 1. Find patient to retrieve other pending requests
    const patient = await User.findById(patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const otherPendingDoctorIds = (patient.pendingDoctorIds || []).filter(id => id !== doctorId);

    // 2. Pull patient ID from all other pending doctors' pending lists
    if (otherPendingDoctorIds.length > 0) {
      await User.updateMany(
        { _id: { $in: otherPendingDoctorIds } },
        { $pull: { pendingPatientIds: patientId } }
      );
    }

    // 3. Remove patient from the current accepting doctor's pending list, and add to linked list
    await User.findByIdAndUpdate(doctorId, {
      $pull: { pendingPatientIds: patientId },
      $addToSet: { linkedPatientIds: patientId }
    });

    // 4. Update the patient:
    // - Add current doctor to linked list
    // - Clear ALL pending requests (since one has been accepted)
    await User.findByIdAndUpdate(patientId, {
      $set: { pendingDoctorIds: [] },
      $addToSet: { linkedDoctorIds: doctorId }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Patient applying to doctor
router.post('/apply/:doctorId', authMiddleware, async (req, res) => {
  try {
    const patientId = req.user.id;
    const { doctorId } = req.params;

    console.log(`📩 Connection Request: Patient[${patientId}] -> Doctor[${doctorId}]`);

    if (!doctorId || doctorId === 'undefined') {
      return res.status(400).json({ error: 'Invalid Doctor ID' });
    }

    // 1. Add patient to doctor's pending list
    const doctor = await User.findByIdAndUpdate(doctorId, {
      $addToSet: { pendingPatientIds: patientId }
    }, { new: true });

    if (!doctor) {
      console.log('❌ Doctor not found');
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // 2. Add doctor to patient's pending list
    await User.findByIdAndUpdate(patientId, {
      $addToSet: { pendingDoctorIds: doctorId }
    });

    console.log('✅ Connection request stored');
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Apply Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove doctor connection
router.post('/remove-doctor/:doctorId', authMiddleware, async (req, res) => {
  try {
    const patientId = req.user.id;
    const { doctorId } = req.params;

    await User.findByIdAndUpdate(patientId, {
      $pull: { 
        linkedDoctorIds: doctorId,
        pendingDoctorIds: doctorId
      }
    });

    await User.findByIdAndUpdate(doctorId, {
      $pull: { 
        linkedPatientIds: patientId,
        pendingPatientIds: patientId
      }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Book an appointment
router.post('/appointments', authMiddleware, async (req, res) => {
  try {
    const patientId = req.user.id;
    const { doctorId, date, time } = req.body;

    if (!doctorId || !date || !time) {
      return res.status(400).json({ error: 'Missing doctorId, date, or time' });
    }

    const patient = await User.findById(patientId);
    const doctor = await User.findById(doctorId);

    if (!patient || !doctor) {
      return res.status(404).json({ error: 'Patient or Doctor not found' });
    }

    const appointment = {
      patientId: patient._id.toString(),
      patientName: patient.name,
      doctorId: doctor._id.toString(),
      doctorName: doctor.name,
      date,
      time,
      createdAt: new Date()
    };

    // Push to both patient and doctor arrays
    await User.findByIdAndUpdate(patientId, { $push: { appointments: appointment } });
    await User.findByIdAndUpdate(doctorId, { $push: { appointments: appointment } });

    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;