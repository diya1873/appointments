const mongoose = require('mongoose');


const appointmentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },  // المستخدم الذي أنشأ الموعد
    clientName: { type: String, required: true }, // اسم العميل
    date: { type: String, required: true }, // تاريخ الموعد
    time: { type: String, required: true }, // وقت الموعد
    service: { type: String, required: true }, // نوع الخدمة المطلوبة
    status: { type: String, default: 'Scheduled', enum: ['Scheduled', 'Completed', 'Cancelled'] }, // حالة الموعد
    description: { type: String } // وصف الموعد (اختياري)
});

module.exports = mongoose.model('Appointment', appointmentSchema);