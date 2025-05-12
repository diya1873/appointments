const express = require('express');
const { registerUser, loginUser, getProfile, getAllUsers, updateProfile, deleteProfile, deleteUser, forgotPassword, resetPasswordWithOTP, verifyEmail } = require('../controllers/userController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware'); // استدعاء Multer Middleware

const router = express.Router();

router.post('/register', registerUser);
router.get('/verify-email', verifyEmail);
router.post('/login', loginUser);
router.get('/profile', protect, getProfile);
router.get('/all', protect, isAdmin, getAllUsers); // فقط الأدمن يمكنه رؤية جميع المستخدمين
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.delete('/profile', protect, deleteProfile);
router.delete('/delete/:id',protect, isAdmin, deleteUser);
// نسيت كلمة المرور - ارسال OTP للبريد الإلكتروني
router.post('/forgot-password', forgotPassword);
// إعادة تعيين كلمة المرور باستخدام OTP
router.post('/reset-password-with-otp', resetPasswordWithOTP);
module.exports = router;
