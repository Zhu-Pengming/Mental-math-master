// ============================================================================
// USER MODEL - 用户数据模型
// ============================================================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    
    // User Profile
    displayName: {
        type: String,
        default: function() { return this.username; }
    },
    avatar: {
        type: String,
        default: null
    },
    language: {
        type: String,
        enum: ['en', 'zh'],
        default: 'en'
    },
    
    // Learning Statistics
    totalSessions: {
        type: Number,
        default: 0
    },
    totalQuestions: {
        type: Number,
        default: 0
    },
    totalCorrect: {
        type: Number,
        default: 0
    },
    
    // Preferences
    preferences: {
        targetAccuracy: {
            type: Number,
            default: 0.75,
            min: 0.5,
            max: 1.0
        },
        maxDifficulty: {
            type: Number,
            default: 5,
            min: 1,
            max: 5
        },
        hintPreference: {
            type: String,
            enum: ['never', 'adaptive', 'always'],
            default: 'adaptive'
        }
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLoginAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Update last login
UserSchema.methods.updateLastLogin = function() {
    this.lastLoginAt = Date.now();
    return this.save();
};

module.exports = mongoose.model('User', UserSchema);
