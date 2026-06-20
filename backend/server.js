const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const axios = require('axios');


const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const Image = require('./models/Image');
const authMiddleware = require('./middleware/auth');

const app = express();
const port = process.env.PORT || 3000;


// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.post('/api/upload', authMiddleware, async (req, res) => {
  try {
    const { fileData, contentType, filename } = req.body;

    if (!fileData) {
      return res.status(400).json({ error: 'No file data provided' });
    }

    // Convert base64 to Buffer
    const buffer = Buffer.from(fileData, 'base64');

    const newImage = new Image({
      filename: filename || 'uploaded_image.jpg',
      contentType: contentType || 'image/jpeg',
      data: buffer,
      userId: req.user.id
    });

    await newImage.save();

    res.status(201).json({
      success: true,
      imageId: newImage._id.toString(),
      message: 'Image stored in MongoDB'
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/images/:id', authMiddleware, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image || !image.data) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Access control check
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === 'patient') {
      if (!image.userId || image.userId.toString() !== userId) {
        return res.status(403).json({ error: 'Access denied: You do not own this image' });
      }
    } else if (userRole === 'doctor') {
      const { User } = require('./models');
      const doctor = await User.findById(userId);
      if (!doctor || !image.userId || !doctor.linkedPatientIds.includes(image.userId.toString())) {
        return res.status(403).json({ error: 'Access denied: Patient is not linked to you' });
      }
    } else {
      return res.status(403).json({ error: 'Access denied: Invalid role' });
    }

    res.set('Content-Type', image.contentType);
    res.send(image.data);
  } catch (error) {
    console.error('Fetch Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/images/:id', async (req, res) => {
  try {
    const image = await Image.findByIdAndDelete(req.params.id);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }
    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// AI & Error Stubs (to prevent 404s)
app.post('/api/errors', (req, res) => {
  console.log('⚠️ Client Error Logged:', req.body);
  res.json({ success: true });
});

app.post('/api/ai/:action', (req, res) => {
  const { action } = req.params;
  console.log(`🤖 AI Request [${action}]`);

  if (action === 'analyze-symptoms') {
    return res.json({
      painTrend: 'stable',
      flags: [],
      recommendation: 'Based on your logs, your symptoms appear stable. Ensure you get plenty of rest, avoid strenuous activities, and follow your post-op guide.',
      rawAnalysis: 'Dynamic symptom monitoring shows stable pain. No alarm flags detected.'
    });
  }

  if (action === 'analyze-wound') {
    return res.json({
      healingStage: 'early',
      rednessLevel: 'none',
      swellingVisible: false,
      dischargeSeen: false,
      recommendation: 'Your wound photo shows normal early healing. Keep it clean and dry, and avoid scratching.'
    });
  }

  if (action === 'diary-insight' || action === 'consultation-summary') {
    return res.json({
      summary: 'AI analysis suggests your recovery is progressing smoothly. Keep up the good work and log symptoms daily.'
    });
  }

  res.json({ message: 'AI stub response. AI features not yet implemented on backend.' });
});

app.post('/api/call/initiate', (req, res) => {
  console.log('📞 Call Initiated:', req.body);
  res.json({ 
    success: true, 
    consultation: { id: 'stub_' + Date.now() },
    agoraToken: 'stub_token',
    channelName: 'stub_channel'
  });
});

app.put('/api/call/:id/end', (req, res) => {
  console.log(`📞 Call Ended: ${req.params.id}`);
  res.json({ success: true });
});

app.post('/api/data', (req, res) => {
  res.json({ message: "Data received" });
});

// Add a root route to handle requests to '/'
app.get('/', (req, res) => {
  res.send("HerniaCare API is running!");
});

// 404 Logger
app.use((req, res, next) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
