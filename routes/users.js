// User Management Routes


const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Middleware
function isAuthenticated(req, res, next) {
    if (req.session.user) return next();
    res.redirect('/login');
}

function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'ADMIN') return next();
    res.status(403).send('Access denied');
}

// List users
router.get('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.render('users/list', {
            user: req.session.user,
            users
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error loading users');
    }
});

// Add user form
router.get('/add', isAuthenticated, isAdmin, (req, res) => {
    res.render('users/add', {
        user: req.session.user,
        error: null
    });
});

// Create user
router.post('/add', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { username, password, fullName, role, department, email } = req.body;

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.render('users/add', {
                user: req.session.user,
                error: 'Username already exists'
            });
        }

        const newUser = new User({
            username,
            password,
            fullName,
            role,
            department,
            email
        });

        await newUser.save();
        res.redirect('/users');
    } catch (error) {
        console.error('Error:', error);
        res.render('users/add', {
            user: req.session.user,
            error: 'Error creating user'
        });
    }
});

// Edit user form
router.get('/edit/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const editUser = await User.findById(req.params.id);
        if (!editUser) {
            return res.status(404).send('User not found');
        }
        res.render('users/edit', {
            user: req.session.user,
            editUser,
            error: null
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error loading user');
    }
});

// Update user
router.post('/edit/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { fullName, role, department, email, isActive } = req.body;

        await User.findByIdAndUpdate(req.params.id, {
            fullName,
            role,
            department,
            email,
            isActive: isActive === 'true'
        });

        res.redirect('/users');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error updating user');
    }
});

// Delete user
router.post('/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.redirect('/users');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error deleting user');
    }
});

module.exports = router;
