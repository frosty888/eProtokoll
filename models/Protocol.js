


const mongoose = require('mongoose');

const protocolSchema = new mongoose.Schema({
    year: {
        type: Number,
        required: true,
        unique: true
    },
    counter: {
        type: Number,
        default: 0
    },
    prefix: {
        type: String,
        default: 'PROT'
    }
});


protocolSchema.statics.getNextProtocolNumber = async function () {
    const currentYear = new Date().getFullYear();

    let protocol = await this.findOne({ year: currentYear });

    if (!protocol) {
        protocol = await this.create({
            year: currentYear,
            counter: 0
        });
    }

    protocol.counter += 1;
    await protocol.save();

    const paddedCounter = String(protocol.counter).padStart(4, '0');
    return `${protocol.prefix}-${currentYear}-${paddedCounter}`;
};

module.exports = mongoose.model('Protocol', protocolSchema);
