// ============================================================================
// DATABASE INITIALIZATION SCRIPT - 数据库初始化脚本
// ============================================================================

const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB connected successfully');
        
        // Drop existing indexes and recreate
        console.log('📊 Cleaning up old indexes...');
        
        const User = require('../models/User');
        const LessonProgress = require('../models/LessonProgress');
        const PerformanceHistory = require('../models/PerformanceHistory');
        
        try {
            await User.collection.dropIndexes();
            console.log('  • Dropped User indexes');
        } catch (e) {
            // Ignore if no indexes exist
        }
        
        try {
            await LessonProgress.collection.dropIndexes();
            console.log('  • Dropped LessonProgress indexes');
        } catch (e) {
            // Ignore if no indexes exist
        }
        
        try {
            await PerformanceHistory.collection.dropIndexes();
            console.log('  • Dropped PerformanceHistory indexes');
        } catch (e) {
            // Ignore if no indexes exist
        }
        
        console.log('📊 Creating new indexes...');
        
        await User.createIndexes();
        console.log('  • User indexes created');
        
        await LessonProgress.createIndexes();
        console.log('  • LessonProgress indexes created');
        
        await PerformanceHistory.createIndexes();
        console.log('  • PerformanceHistory indexes created');
        
        console.log('✅ Indexes created successfully');
        console.log('🎉 Database initialization complete!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Database initialization error:', error.message);
        process.exit(1);
    }
};

connectDB();
