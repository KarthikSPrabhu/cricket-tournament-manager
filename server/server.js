const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.log('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Cricket Tournament API is running' });
});

// Import routes (will create these later)
// const adminRoutes = require('./routes/admin');
// const teamRoutes = require('./routes/teams');
// const matchRoutes = require('./routes/matches');
// const playerRoutes = require('./routes/players');

// Use routes
// app.use('/api/admin', adminRoutes);
// app.use('/api/teams', teamRoutes);
// app.use('/api/matches', matchRoutes);
// app.use('/api/players', playerRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});