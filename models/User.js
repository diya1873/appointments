const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    isVerified: { type: Boolean, default: false }, // التحقق من البريد
    role: { type: String, enum: ['User', 'Admin'], default: 'User' },
    avatar: { 
        type: String, 
        default: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460__480.png'  // رابط صورة افتراضية 
    },
    otp: { type: String }, // لتخزين الـ OTP المرسل للمستخدم
    otpExpires: { type: Date }, // لتخزين وقت انتهاء صلاحية الـ OTP
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
