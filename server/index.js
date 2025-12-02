require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const attendeeRoutes = require('./routes/attendees');
const registrationRoutes = require('./routes/registrations');

app.use('/api', attendeeRoutes);
app.use('/api', registrationRoutes);

app.get('/', (req, res) => {
    res.send('Hackathon Registration API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
