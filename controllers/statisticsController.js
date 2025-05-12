// controllers/statisticsController.js

const Appointment = require('../models/Appointment');

// إحصائيات المواعيد
exports.getAppointmentStatistics = async (req, res) => {
    try {
        // عدد المواعيد المجدولة
        const scheduledAppointments = await Appointment.countDocuments({ status: 'Scheduled' });

        // عدد المواعيد المكتملة
        const completedAppointments = await Appointment.countDocuments({ status: 'Completed' });

        // عدد المواعيد الملغاة
        const cancelledAppointments = await Appointment.countDocuments({ status: 'Cancelled' });

        // نسبة المواعيد المكتملة إلى المواعيد المجدولة
        const completionRate = scheduledAppointments === 0
        ? 0
        : Math.round((completedAppointments / scheduledAppointments) * 100).toFixed(2);

        // إحصائيات عدد المواعيد لكل مستخدم
        const userAppointments = await Appointment.aggregate([
            { $group: { _id: "$user", totalAppointments: { $sum: 1 } } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userDetails' } },
            { $unwind: "$userDetails" },
            { $project: { userName: "$userDetails.name", totalAppointments: 1 } }
        ]);

        // إرسال النتيجة في الاستجابة
        res.json({
            scheduledAppointments,
            completedAppointments,
            cancelledAppointments,
            completionRate,
            userAppointments
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching statistics' });
    }
};
