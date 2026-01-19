const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;


mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/eprotokoll', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log('MongoDB Connected');
        
        const Protocol = require('./models/Protocol');
        const currentYear = new Date().getFullYear();
        Protocol.findOne({ year: currentYear }).then(p => {
            if (!p) {
                Protocol.create({ year: currentYear, counter: 0 });
                console.log(`Protocol counter initialized for ${currentYear}`);
            }
        });
    })
    .catch(err => console.log('MongoDB Error:', err));

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


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.use('/', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/documents', require('./routes/documents'));
app.use('/users', require('./routes/users'));
app.use('/institutions', require('./routes/institutions'));

app.listen(PORT, () => {
    console.log(`eProtokoll Server running on port ${PORT}`);
    console.log(`Access at: http://localhost:${PORT}`);
});
