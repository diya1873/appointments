const Appointment = require('../models/Appointment');


// إنشاء موعد جديد
exports.createAppointment = async (req, res) => {
    try {
        const { date, clientName, time, service, description } = req.body;

        // التأكد من أن الحقول المطلوبة موجودة
        if (!date || !clientName || !time || !service) {
            return res.status(400).json({ message: 'All fields (date, clientName, time, service) are required' });
        }

        // إنشاء الموعد الجديد وربطه بالمستخدم الحالي
        const appointment = new Appointment({
            user: req.user.id, // ربط الموعد بالمستخدم
            date,
            clientName,
            time,
            service,
            description, // إذا كان الوصف موجود
        });

        // حفظ الموعد في قاعدة البيانات
        await appointment.save();
        res.status(201).json(appointment); // رد مع الموعد المضاف
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error, please try again later' });
    }
};

// جلب المواعيد الخاصة بالمستخدم الحالي
// جلب المواعيد الخاصة بالمستخدم الحالي
exports.getAppointments = async (req, res) => {
    try {
      console.log('User ID from token:', req.user.id);
  
      const appointments = await Appointment.find({ user: req?.user?.id })
        .populate('user', 'name email role avatar');
  
      if (!appointments.length) {
        return res.status(404).json({ message: 'No appointments found' });
      }
  
      // تحقق لو اليوزر المحذوف
      const userDeleted = appointments.some(app => !app.user);
      if (userDeleted) {
        return res.status(410).json({ message: 'The user account associated with these appointments has been deleted.' });
      }
  
      res.json(appointments);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error, please try again later' });
    }
  };
  



// تحديث موعد معين
exports.updateAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
 
        // التأكد من وجود الموعد
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // التحقق من أن المستخدم يملك الموعد
        if (appointment.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // استخراج الحقول التي يتم تحديثها
        const { date, clientName, time, service, description, status } = req.body;

        // التأكد من أن الحقول المطلوبة موجودة
        if (!date || !clientName || !time || !service) {
            return res.status(400).json({ message: 'All fields (date, clientName, time, service) are required' });
        }

        // تحديث الموعد
        appointment.date = date;
        appointment.clientName = clientName;
        appointment.time = time;
        appointment.service = service;
        appointment.description = description || appointment.description; // إذا لم يوجد وصف جديد يتم استخدام القديم
        appointment.status = status || appointment.status; // إذا لم يتم تغيير الحالة، يتم استخدام الحالة القديمة

        // حفظ التغييرات
        await appointment.save();
        res.json(appointment); // رد مع الموعد بعد التحديث
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error, please try again later' });
    }
};

// حذف موعد معين
exports.deleteAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        // التأكد من وجود الموعد
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // التحقق من أن المستخدم يملك الموعد
        if (appointment.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // حذف الموعد
        await appointment.deleteOne();
        res.json({ message: 'Appointment deleted' }); // رد مع رسالة تأكيد الحذف
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error, please try again later' });
    }
};

//---------------------------------------------------للاـــــدمن داشبـــــورد-------------------------------------//

//عرض جميع المواعيد فقط للادمن 
exports.getAllAppointments = async (req, res) => {
    const appointments = await Appointment.find().populate('user', 'name email role avatar'); // عشان تشوف بيانات صاحب الموعد
    res.json(appointments);
};


//حذف المواعيد بالنسبة للادمن 
exports.deleteAnyAppointment = async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    await appointment.deleteOne();
    res.json({ message: 'Appointment deleted successfully' });
};



//تعديل المواعيد بالنسبة للادمن
exports.updateAnyAppointment = async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const oldStatus = appointment.status; // حفظ حالة الموعد القديمة قبل التعديل
    const newStatus = req.body.status; // حالة الموعد الجديدة

    // تحديث بيانات الحجز بأي بيانات جديدة قادمة من الـ body
    Object.assign(appointment, req.body);
    await appointment.save();

    // إذا كانت حالة الموعد قد تغيرت، نرسل إشعار
    if (oldStatus !== newStatus) {
        // إرسال إشعار لصاحب الموعد عبر WebSocket
        req.io.emit('receiveNotification', {
            message: `Your appointment status has been updated to ${newStatus}`,
            appointmentId: appointment._id
        });
    }

    res.json({ message: 'Appointment updated successfully', appointment });
};





// جلب المواعيد حسب معرف المستخدم
exports.getAppointmentsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;  // أخذ الـ userId من الـ route parameters

        // البحث عن جميع المواعيد التي تخص المستخدم المحدد
        const appointments = await Appointment.find({ user: userId }).populate('user', 'name email role avatar');;

        if (appointments.length === 0) {
            return res.status(404).json({ message: 'No appointments found for this user.' });
        }

        // إرجاع المواعيد
        res.json({ appointments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
