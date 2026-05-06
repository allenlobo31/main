const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const Image = require('./models/Image');

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

app.post('/api/upload', async (req, res) => {
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
      data: buffer
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

app.get('/api/images/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image || !image.data) {
      return res.status(404).json({ error: 'Image not found' });
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

// 404 Logger
app.use((req, res, next) => {
  console.log(`❓ 404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Route not found' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.get('/', (req, res) => {
  res.status(200).send('Server is up and running!');
});