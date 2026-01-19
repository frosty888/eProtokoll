// seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGO_URI; // no fallback to localhost in production

if (!MONGODB_URI) {
    console.error("MONGO_URI environment variable not set. Exiting.");
    process.exit(1);
}

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'MANAGER', 'STAFF'], default: 'STAFF' },
    department: { type: String, required: true },
    email: String,
    createdAt: { type: Date, default: Date.now },s
    isActive: { type: Boolean, default: true }
});

const User = mongoose.model('User', userSchema);

async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected');

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
                console.log(userData.username + ' already exists');
            } else {
                await User.create(userData);
                console.log('Created: ' + userData.username);
            }
        }

        console.log('Seeding complete');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

seed();
