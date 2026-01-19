const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const Protocol = require('../models/Protocol');
const User = require('../models/User');


function isAuthenticated(req, res, next) {
    if (req.session.user) return next();
    res.redirect('/login');
}

function canViewDocument(doc, user) {
    if (user.role === 'ADMIN') return true;
    if (doc.classification === 'PUBLIC') return true;
    if (doc.classification === 'RESTRICTED' && (user.role === 'MANAGER' || user.role === 'ADMIN')) return true;
    if (doc.classification === 'SECRET' && user.role === 'ADMIN') return true;
    if (doc.uploadedBy.toString() === user.id) return true;
    return false;
}


if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.jpg', '.jpeg', '.png'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});


router.get('/', isAuthenticated, async (req, res) => {
    try {
        let query = {};
        const user = req.session.user;


        if (user.role === 'STAFF') {
            query.$or = [
                { classification: 'PUBLIC' },
                { uploadedBy: user.id }
            ];
        } else if (user.role === 'MANAGER') {
            query.$or = [
                { classification: { $in: ['PUBLIC', 'RESTRICTED'] } },
                { uploadedBy: user.id }
            ];
        }


        const documents = await Document.find(query)
            .sort({ createdAt: -1 })
            .populate('uploadedBy', 'fullName');

        res.render('documents/list', {
            user: req.session.user,
            documents
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error loading documents');
    }
});


router.get('/upload', isAuthenticated, async (req, res) => {
    try {
        const Institution = require('../models/Institution');
        const institutions = await Institution.find({ isActive: true }).sort({ name: 1 });

        res.render('documents/upload', {
            user: req.session.user,
            institutions: institutions,
            error: null
        });
    } catch (error) {
        console.error('Error loading institutions:', error);
        res.render('documents/upload', {
            user: req.session.user,
            institutions: [],
            error: null
        });
    }
});

// Lista e dokumenteve te deleguar tek une (DUHET PARA /:id)
router.get('/assigned/to-me', isAuthenticated, async (req, res) => {
    try {
        const user = req.session.user;

        const documents = await Document.find({
            assignedTo: user.id,
            status: 'PENDING'
        })
            .sort({ deadline: 1, createdAt: -1 })
            .populate('uploadedBy', 'fullName department');

        res.render('documents/assigned-to-me', {
            user: req.session.user,
            documents
        });
    } catch (error) {
        console.error('Assigned docs error:', error);
        res.status(500).send('Gabim ne ngarkim');
    }
});



router.post('/upload', isAuthenticated, upload.single('document'), async (req, res) => {
    try {
        const {
            title,
            description,
            documentType,
            department,
            classification,
            deadline,
            receivedFrom,
            sentTo,
            fromDepartment,
            toDepartment,
            externalAddress
        } = req.body;


        const protocolNumber = await Protocol.getNextProtocolNumber();

        const document = new Document({
            protocolNumber,
            title,
            description,
            documentType,
            department,
            classification: classification || 'PUBLIC',
            deadline: deadline || null,
            receivedFrom: documentType === 'INCOMING' ? receivedFrom : undefined,
            sentTo: documentType === 'OUTGOING' ? sentTo : undefined,
            fromDepartment: documentType === 'INTERNAL' ? fromDepartment : undefined,
            toDepartment: documentType === 'INTERNAL' ? toDepartment : undefined,
            externalAddress: (documentType === 'INCOMING' || documentType === 'OUTGOING') ? externalAddress : undefined,
            fileName: req.file.originalname,
            filePath: req.file.path,
            fileSize: req.file.size,
            uploadedBy: req.session.user.id
        });

        await document.save();
        res.redirect('/documents');
    } catch (error) {
        console.error('Upload error:', error);
        res.render('documents/upload', {
            user: req.session.user,
            error: 'Error uploading document'
        });
    }
});

router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id)
            .populate('uploadedBy', 'fullName department')
            .populate('routing.from', 'fullName')
            .populate('routing.to', 'fullName')
            .populate('assignedTo', 'fullName');

        if (!document) {
            return res.status(404).send('Document not found');
        }


        if (!canViewDocument(document, req.session.user)) {
            return res.status(403).send('Access denied - insufficient clearance level');
        }

        res.render('documents/view', {
            user: req.session.user,
            document
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error loading document');
    }
});


router.get('/download/:id', isAuthenticated, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id).populate('uploadedBy');
        if (!document) {
            return res.status(404).send('Document not found');
        }

        if (!canViewDocument(document, req.session.user)) {
            return res.status(403).send('Access denied');
        }

        res.download(document.filePath, document.fileName);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).send('Error downloading document');
    }
});


router.get('/reports/protocol-book', isAuthenticated, async (req, res) => {
    try {
        const year = req.query.year || new Date().getFullYear();

        const documents = await Document.find({
            protocolNumber: { $exists: true, $ne: null },
            createdAt: {
                $gte: new Date(year, 0, 1),
                $lt: new Date(parseInt(year) + 1, 0, 1)
            }
        })
            .sort({ protocolNumber: 1 })
            .populate('uploadedBy', 'fullName department');

        res.render('documents/protocol-book', {
            user: req.session.user,
            documents,
            year
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error loading protocol book');
    }
});


router.get('/reports/deadlines', isAuthenticated, async (req, res) => {
    try {
        const documents = await Document.find({
            deadline: { $exists: true, $ne: null },
            status: 'PENDING'
        })
            .sort({ deadline: 1 })
            .populate('uploadedBy', 'fullName');

        res.render('documents/deadlines', {
            user: req.session.user,
            documents
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error loading deadlines');
    }
});

// Raporte Statistikor
router.get('/reports/statistics', isAuthenticated, async (req, res) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year + 1, 0, 1);

        // Statistika te pergjithshme
        const allDocs = await Document.find({
            createdAt: { $gte: startDate, $lt: endDate }
        });

        const stats = {
            total: allDocs.length,
            incoming: allDocs.filter(d => d.documentType === 'INCOMING').length,
            outgoing: allDocs.filter(d => d.documentType === 'OUTGOING').length,
            internal: allDocs.filter(d => d.documentType === 'INTERNAL').length,
            pending: allDocs.filter(d => d.status === 'PENDING').length,
            approved: allDocs.filter(d => d.status === 'APPROVED').length,
            rejected: allDocs.filter(d => d.status === 'REJECTED').length,
            overdue: allDocs.filter(d => d.deadline && new Date(d.deadline) < new Date() && d.status === 'PENDING').length,
            dueSoon: allDocs.filter(d => {
                if (!d.deadline || d.status !== 'PENDING') return false;
                const daysLeft = Math.ceil((new Date(d.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                return daysLeft >= 0 && daysLeft <= 3;
            }).length
        };

        // Statistika mujore
        const monthlyStats = [];
        for (let month = 0; month < 12; month++) {
            const monthStart = new Date(year, month, 1);
            const monthEnd = new Date(year, month + 1, 1);
            const monthDocs = allDocs.filter(d => {
                const date = new Date(d.createdAt);
                return date >= monthStart && date < monthEnd;
            });
            monthlyStats.push({
                incoming: monthDocs.filter(d => d.documentType === 'INCOMING').length,
                outgoing: monthDocs.filter(d => d.documentType === 'OUTGOING').length,
                internal: monthDocs.filter(d => d.documentType === 'INTERNAL').length
            });
        }

        res.render('documents/statistics', {
            user: req.session.user,
            stats,
            monthlyStats,
            year
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error loading statistics');
    }
});

router.post('/:id/change-status', isAuthenticated, async (req, res) => {
    try {
        const { status, remarks } = req.body;
        const user = req.session.user;

        if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
            return res.status(403).send('Access denied');
        }

        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).send('Document not found');
        }

        document.status = status;


        document.routing.push({
            from: user.id,
            to: document.uploadedBy,
            action: status === 'APPROVED' ? 'Miratoi dokumentin' : 'Refuzoi dokumentin',
            remarks: remarks || '',
            date: new Date()
        });

        await document.save();

        res.redirect(`/documents/${req.params.id}`);
    } catch (error) {
        console.error('Status change error:', error);
        res.status(500).send('Error changing status');
    }
});






router.get('/:id/delegate', isAuthenticated, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id)
            .populate('uploadedBy', 'fullName');

        if (!document) {
            return res.status(404).send('Dokumenti nuk u gjet');
        }

        // Vetem ADMIN dhe MANAGER mund te delegojne
        if (req.session.user.role === 'STAFF') {
            return res.status(403).send('Nuk keni te drejte te delegoni dokumente');
        }

        // Merr listen e punonjesve per delegim
        const users = await User.find({ isActive: true })
            .select('fullName username department role')
            .sort({ fullName: 1 });

        res.render('documents/delegate', {
            user: req.session.user,
            document,
            users,
            error: null
        });
    } catch (error) {
        console.error('Delegate form error:', error);
        res.status(500).send('Gabim ne ngarkim');
    }
});


router.post('/:id/delegate', isAuthenticated, async (req, res) => {
    try {
        const { delegateTo, action, remarks, responseDeadline } = req.body;
        const user = req.session.user;

        // Kontrollo permisionin
        if (user.role === 'STAFF') {
            return res.status(403).send('Nuk keni te drejte te delegoni dokumente');
        }

        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).send('Dokumenti nuk u gjet');
        }

        const targetUser = await User.findById(delegateTo);
        if (!targetUser) {
            return res.status(404).send('Perdoruesi nuk u gjet');
        }

        // Shto ne routing
        document.routing.push({
            from: user.id,
            to: delegateTo,
            action: action || 'Deleguar per pergjigje',
            remarks: remarks || '',
            date: new Date()
        });

        // Nese ka afat te ri per pergjigje, perditeso
        if (responseDeadline) {
            document.deadline = new Date(responseDeadline);
        }

        // Shto punonjesin e deleguar ne listen e te autorizuarve (per akses)
        if (!document.assignedTo) {
            document.assignedTo = [];
        }
        if (!document.assignedTo.includes(delegateTo)) {
            document.assignedTo.push(delegateTo);
        }

        await document.save();

        res.redirect(`/documents/${req.params.id}`);
    } catch (error) {
        console.error('Delegate error:', error);
        res.status(500).send('Gabim gjate delegimit');
    }
});

// Punonjesi kthen pergjigje per dokumentin e deleguar
router.post('/:id/respond', isAuthenticated, async (req, res) => {
    try {
        const { response, remarks } = req.body;
        const user = req.session.user;

        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).send('Dokumenti nuk u gjet');
        }

        // Kontrollo nese ky user ka te drejte te pergjigjet
        const isAssigned = document.assignedTo && document.assignedTo.some(id => id.toString() === user.id);
        const isUploader = document.uploadedBy.toString() === user.id;

        if (!isAssigned && !isUploader && user.role === 'STAFF') {
            return res.status(403).send('Nuk keni te drejte te pergjigjeni per kete dokument');
        }

        // Shto pergjigjen ne routing
        document.routing.push({
            from: user.id,
            to: null, // Pergjigje e pergjithshme
            action: response || 'Ktheu pergjigje',
            remarks: remarks || '',
            date: new Date()
        });

        await document.save();

        res.redirect(`/documents/${req.params.id}`);
    } catch (error) {
        console.error('Response error:', error);
        res.status(500).send('Gabim gjate pergjigjes');
    }
});

// Lista e dokumenteve te deleguar tek une

// Historiku i plote i gjurmimit per nje dokument
router.get('/:id/tracking-history', isAuthenticated, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id)
            .populate('uploadedBy', 'fullName department')
            .populate('routing.from', 'fullName department role')
            .populate('routing.to', 'fullName department role')
            .populate('assignedTo', 'fullName department');

        if (!document) {
            return res.status(404).send('Dokumenti nuk u gjet');
        }

        res.render('documents/tracking-history', {
            user: req.session.user,
            document
        });
    } catch (error) {
        console.error('Tracking history error:', error);
        res.status(500).send('Gabim ne ngarkim');
    }
});

module.exports = router;