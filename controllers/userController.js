const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sendEmail = require('../utils/emailService');
const Reservation = require('../models/Appointment'); // تأكد تستورد الموديل تبع الحجوزات

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

// ⏬ إرسال OTP إلى البريد الإلكتروني ⏬
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpires = Date.now() + 5 * 60 * 1000; // صلاحية OTP لمدة 5 دقائق
        await user.save();

        const emailResponse = await sendEmail(
            user.email,
            'رمز إعادة تعيين كلمة المرور',
            `رمز OTP الخاص بك هو: ${otp}. ينتهي خلال 5 دقائق.`
        );

        if (!emailResponse.success) {
            return res.status(500).json({ message: 'فشل في إرسال OTP' });
        }

        res.json({ message: 'تم إرسال OTP إلى البريد الإلكتروني' });
    } catch (error) {
        console.error('خطأ في نسيان كلمة المرور:', error);
        res.status(500).json({ message: 'حدث خطأ، حاول مرة أخرى لاحقًا.' });
    }
};


// ⏬ تأكيد OTP وتحديث كلمة المرور ⏬
exports.resetPasswordWithOTP = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

        // تحقق من صحة الـ OTP وصلاحيته
        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'OTP غير صالح أو منتهي الصلاحية' });
        }

        // **إذا لم يتم إرسال كلمة المرور، فقط تحقق من صحة الـ OTP**
        if (!newPassword) {
            return res.json({ message: 'OTP صحيح، يمكنك الآن إدخال كلمة مرور جديدة', otpVerified: true });
        }

        // **إذا كان OTP صحيح وتم إرسال كلمة مرور، قم بتحديثها**
        user.password = await bcrypt.hash(newPassword, 10);
        user.otp = undefined; // مسح الـ OTP بعد الاستخدام
        user.otpExpires = undefined;
        await user.save();

        res.json({ message: 'تم تحديث كلمة المرور بنجاح، يمكنك الآن تسجيل الدخول' });
    } catch (error) {
        console.error('خطأ في إعادة تعيين كلمة المرور:', error);
        res.status(500).json({ message: 'حدث خطأ، حاول مرة أخرى لاحقًا.' });
    }
};




exports.registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // تحقق إذا كان المستخدم موجودًا بالفعل
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already registered' });
        }

        // تشفير كلمة المرور
        const hashedPassword = await bcrypt.hash(password, 10);

        // إنشاء مستخدم جديد مع `isVerified: false`
        const user = new User({ name, email, password: hashedPassword, isVerified: false });
        await user.save();

        // إنشاء توكن التحقق
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // رابط التحقق
        const verificationLink = `https://frontappo-utmd.vercel.app/verify-email?token=${token}`;

        // إرسال البريد الإلكتروني
        const emailResponse = await sendEmail(
            user.email,
    'Verify Your Email',
    '',
    `<div style="font-family: Arial, sans-serif; text-align: center;">
        <p>Click the button below to verify your account:</p>
        <a href="${verificationLink}" 
           style="display: inline-block; padding: 12px 20px; font-size: 16px; font-weight: bold; 
                  color: white; background-color: #007bff; text-decoration: none; 
                  border-radius: 5px;">
            Verify Email
        </a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${verificationLink}" style="word-break: break-all;">${verificationLink}</a></p>
    </div>`
        );

        if (!emailResponse.success) {
            return res.status(500).json({ message: 'Failed to send verification email' });
        }

        res.json({ message: 'Registration successful! Please check your email to verify your account.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

//للتحقق من التوكين بالرابط عشان تقدر تعمل لوج ان 
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findOne({ email: decoded.email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // ✅ تأكدنا إنه غير مفعّل
        if (!user.isVerified) {
            user.isVerified = true;
            await user.save();
            return res.json({ message: 'Account verified successfully! You can now log in.' });
        }

        // ✅ الحالة الوحيدة اللي يوصلها هون هي إذا فعلاً مفعّل
        return res.json({ message: 'Account already verified' });

    } catch (error) {
        console.error('Verification error:', error);
        return res.status(400).json({ message: 'Invalid or expired token' });
    }
};





exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // التحقق مما إذا كان الحساب مفعلاً عبر البريد الإلكتروني
        if (!user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email before logging in.' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful', // رسالة النجاح
            token,
            user: { 
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar.startsWith('http') ? user.avatar : `${process.env.BASE_URL}/uploads/${user.avatar}`
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};





//جلب اليوزر بروفايل المسجل دخوله
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        // إذا كانت الصورة الافتراضية، لا تحتاج لتعديل
        if (user.avatar && user.avatar !== 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460__480.png') {
            // إضافة المسار الكامل للصورة من السيرفر المحلي
            user.avatar = `/uploads/${user.avatar}`;
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

//  to do: غيرها لفورم داتا  لانك رح تغير الصورة  او اعمل اي بي اي لتغيير الصورة 
//تعديل البروفايل لليوزر المسجل بدون ايدي 



exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // تحديث البيانات فقط إذا تم إرسالها في الـ body
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;

        // تحديث كلمة المرور إذا أدخل المستخدم كلمة مرور جديدة
        if (req.body.password) {
            user.password = await bcrypt.hash(req.body.password, 10);
        }

        // تحديث الصورة الشخصية إذا تم تحميل صورة جديدة
        if (req.file) {
            // تحقق إذا كانت الصورة القديمة موجودة وقم بحذفها
            if (user.avatar && user.avatar !== 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460__480.png') {
                const oldAvatarPath = path.join(__dirname, '..', 'uploads', user.avatar);
                
                // تحقق من وجود الصورة القديمة قبل محاولة حذفها
                if (fs.existsSync(oldAvatarPath)) {
                    fs.unlinkSync(oldAvatarPath);
                }
            }
            user.avatar = req.file.filename; // حفظ اسم الملف فقط
        }

        await user.save();

        // إرسال الاستجابة مع صورة الـ avatar الجديدة
        res.json({
            message: 'Profile updated successfully',
            user: {
                id:user.id,
                name: user.name,
                isVerified:user.isVerified,
                email: user.email,
                role: user.role,
             avatar: `${process.env.BASE_URL}/uploads/${user.avatar}`, // إضافة الدومين مع المسار
                createdAt:user.createdAt,
                updatedAt:user.updatedAt
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

//حذف البروفايل لليوزر المسجل بدون ايدي 

exports.deleteProfile = async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // احذف اليوزر
    await user.deleteOne();

    // احذف الحجوزات المتعلقة باليوزر
    await Reservation.deleteMany({ user: req.user.id });

    res.json({ message: 'Your account and related reservations have been deleted successfully' });
};



/////------------------------------------------------ only admin ------------------------------------------------------//

//جلب جميع المستخدمين فقط مسموح للادمن 
// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
    try {
      const query = req.query.query;
      let users;
  
      const baseFilter = { role: { $ne: 'Admin' } }; // exclude Admins
  
      if (query) {
        users = await User.find({
          ...baseFilter,
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
            { role: { $regex: query, $options: 'i' } }
          ]
        }).select('-password');
      } else {
        users = await User.find(baseFilter).select('-password');
      }
  
      res.json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  


//حذف مستخدمين بناء على الايدي فقط الادمن 

exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // التحقق مما إذا كان المستخدم موجودًا
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // حذف المستخدم
        await User.findByIdAndDelete(userId);
         // احذف الحجوزات المتعلقة باليوزر
    await Reservation.deleteMany({ user: userId });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
