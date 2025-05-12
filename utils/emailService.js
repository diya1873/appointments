const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'd.khasawneh@knooz.com',
        pass: 'qycd ddqw pjvx jmci' // استخدم App Password إذا كنت مفعّل المصادقة الثنائية
    }
});

// دالة لإرسال البريد الإلكتروني
const sendEmail = async (to, subject, text,html) => {
    const mailOptions = {
        from: 'd.khasawneh@knooz.com',
        to,
        subject,
        text,
        html
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true, message: 'تم إرسال البريد الإلكتروني بنجاح' };
    } catch (error) {
        console.error('خطأ في إرسال البريد:', error);
        return { success: false, message: 'فشل في إرسال البريد الإلكتروني' };
    }
};

module.exports = sendEmail;
