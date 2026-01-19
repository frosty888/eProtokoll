const express = require('express');
const router = express.Router();
const User = require('../models/User');


router.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('login', { error: null });
});

router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('login', { error: null });
});


router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ username, isActive: true });

        if (!user) {
            return res.render('login', { error: 'Invalid username or password' });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.render('login', { error: 'Invalid username or password' });
        }

        req.session.user = {
            id: user._id,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            department: user.department
        };

        res.redirect('/dashboard');
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'An error occurred. Please try again.' });
    }
});


router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router;
