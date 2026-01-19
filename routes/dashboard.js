const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const User = require('../models/User');


function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
}


router.get('/', isAuthenticated, async (req, res) => {
    try {
        const totalDocuments = await Document.countDocuments();
        const pendingDocuments = await Document.countDocuments({ status: 'PENDING' });
        const totalUsers = await User.countDocuments({ isActive: true });

        const recentDocuments = await Document.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('uploadedBy', 'fullName');

        res.render('dashboard', {
            user: req.session.user,
            stats: {
                totalDocuments,
                pendingDocuments,
                totalUsers
            },
            recentDocuments: recentDocuments || [] 
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        
        res.render('dashboard', {
            user: req.session.user,
            stats: {
                totalDocuments: 0,
                pendingDocuments: 0,
                totalUsers: 0
            },
            recentDocuments: []
        });
    }
});

module.exports = router;
