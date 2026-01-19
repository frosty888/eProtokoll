const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        enum: ['GOVERNMENT', 'PRIVATE', 'NGO', 'INTERNATIONAL', 'OTHER'],
        default: 'OTHER'
    },
    address: String,
    phone: String,
    email: String,
    contactPerson: String,
    notes: String,
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Institution', institutionSchema);
