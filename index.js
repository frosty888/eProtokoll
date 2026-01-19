// index.js
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Use environment variable for MongoDB, fallback to localhost for local dev
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost/eprotokoll';

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(async () => {
        console.log('MongoDB Connected');

        // Initialize protocol counter safely
        const Protocol = require('./models/Protocol');
        const currentYear = new Date().getFullYear();
        const existingProtocol = await Protocol.findOne({ year: currentYear });

        if (!existingProtocol) {
            await Protocol.create({ year: currentYear, counter: 0 });
            console.log(`Protocol counter initialized for ${currentYear}`);
        }
    })
    .catch(err => console.error('MongoDB Error:', err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.use(session({
    secret: process.env.SESSION_SECRET || 'eprotokoll-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // 1 hour
}));

// Set up EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/documents', require('./routes/documents'));
app.use('/users', require('./routes/users'));
app.use('/institutions', require('./routes/institutions'));

// Start server
app.listen(PORT, () => {
    console.log(`eProtokoll Server running on port ${PORT}`);
    if (!process.env.PORT) {
        console.log(`Access locally at: http://localhost:${PORT}`);
    }
});
