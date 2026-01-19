const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eprotokoll';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'MANAGER', 'STAFF'], default: 'STAFF' },
    department: { type: String, required: true },
    email: String,
    createdAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
});

const User = mongoose.model('User', userSchema);

async function seed() {
    try {
        console.log('Duke u lidhur me MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Lidhja u krye');

        const users = [
            {
                username: 'administrator',
                password: await bcrypt.hash('admin123', 10),
                fullName: 'Administrator',
                role: 'ADMIN',
                department: 'IT'
            },
            {
                username: 'ervin',
                password: await bcrypt.hash('Test', 10),
                fullName: 'Ervin Tartaraj',
                role: 'ADMIN',
                department: 'IT'
            },
            {
                username: 'test',
                password: await bcrypt.hash('Test', 10),
                fullName: 'Test User',
                role: 'STAFF',
                department: 'Operacione'
            },
            {
                username: 'test2',
                password: await bcrypt.hash('Test', 10),
                fullName: 'Test Manager',
                role: 'MANAGER',
                department: 'Menaxhimi'
            }
        ];

        for (const userData of users) {
            const exists = await User.findOne({ username: userData.username });
            if (exists) {
                console.log(userData.username + ' ekziston');
            } else {
                await User.create(userData);
                console.log('U krijua: ' + userData.username);
            }
        }

        console.log('Perfundoi');
        process.exit(0);
    } catch (error) {
        console.error('Gabim:', error.message);
        process.exit(1);
    }
}

seed();
