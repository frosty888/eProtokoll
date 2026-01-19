// Institution Management Routes


const express = require('express');
const router = express.Router();
const Institution = require('../models/Institution');

// Middleware
function isAuthenticated(req, res, next) {
    if (req.session.user) return next();
    res.redirect('/login');
}

function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'ADMIN') return next();
    res.status(403).send('Access denied');
}

// List institutions
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const institutions = await Institution.find().sort({ name: 1 });
        res.render('institutions/list', {
            user: req.session.user,
            institutions
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error loading institutions');
    }
});

// Add institution form
router.get('/add', isAuthenticated, isAdmin, (req, res) => {
    res.render('institutions/add', {
        user: req.session.user,
        error: null
    });
});

// Create institution
router.post('/add', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { name, type, address, phone, email, contactPerson, notes } = req.body;

        const existing = await Institution.findOne({ name });
        if (existing) {
            return res.render('institutions/add', {
                user: req.session.user,
                error: 'Institution with this name already exists'
            });
        }

        const institution = new Institution({
            name,
            type,
            address,
            phone,
            email,
            contactPerson,
            notes
        });

        await institution.save();
        res.redirect('/institutions');
    } catch (error) {
        console.error('Error:', error);
        res.render('institutions/add', {
            user: req.session.user,
            error: 'Error creating institution'
        });
    }
});

// Edit institution form
router.get('/edit/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const institution = await Institution.findById(req.params.id);
        if (!institution) {
            return res.status(404).send('Institution not found');
        }
        res.render('institutions/edit', {
            user: req.session.user,
            institution,
            error: null
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error loading institution');
    }
});

// Update institution
router.post('/edit/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { name, type, address, phone, email, contactPerson, notes, isActive } = req.body;

        await Institution.findByIdAndUpdate(req.params.id, {
            name,
            type,
            address,
            phone,
            email,
            contactPerson,
            notes,
            isActive: isActive === 'true'
        });

        res.redirect('/institutions');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error updating institution');
    }
});

// Delete institution
router.post('/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        await Institution.findByIdAndDelete(req.params.id);
        res.redirect('/institutions');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error deleting institution');
    }
});

module.exports = router;
