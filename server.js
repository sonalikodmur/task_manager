require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const goalRoutes = require('./routes/goals');
const settingsRoutes = require('./routes/settings');
const profileRoutes = require('./routes/profile');

const app = express();

app.use(cors({
  origin: ['http://localhost:5000', 'http://127.0.0.1:5000', 'http://localhost:8000', 'http://127.0.0.1:8000'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '.')));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/profile', profileRoutes);

app.get('/test', (req, res) => {
  res.send('Server is working!');
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
