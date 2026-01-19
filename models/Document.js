const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    protocolNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    documentType: {
        type: String,
        enum: ['INCOMING', 'OUTGOING', 'INTERNAL'],
        required: true
    },

    
    receivedFrom: String,      
    sentTo: String,            
    fromDepartment: String,    
    toDepartment: String,      
    externalAddress: String,   

    classification: {
        type: String,
        enum: ['PUBLIC', 'RESTRICTED', 'SECRET'],
        default: 'PUBLIC'
    },
    fileName: String,
    filePath: String,
    fileSize: Number,
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    department: String,
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED'],
        default: 'PENDING'
    },
    deadline: {
        type: Date
    },
    routing: [{
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        to: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        action: String,
        remarks: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});


documentSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});


documentSchema.virtual('isOverdue').get(function () {
    if (!this.deadline) return false;
    return new Date() > this.deadline && this.status === 'PENDING';
});

module.exports = mongoose.model('Document', documentSchema);