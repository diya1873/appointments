const express = require('express');
const { createAppointment, getAppointments, updateAppointment, deleteAppointment, getAllAppointments, deleteAnyAppointment,updateAnyAppointment, getAppointmentsByUserId } = require('../controllers/appointmentController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');


const router = express.Router();

router.post('/', protect, createAppointment);
router.get('/', protect, getAppointments);
router.put('/:id', protect, updateAppointment);
router.delete('/:id', protect, deleteAppointment);
router.get('/all', protect, isAdmin, getAllAppointments); // فقط الأدمن يرى كل المواعيد
router.delete('/admin/:id', protect, isAdmin, deleteAnyAppointment); // مسموح فقط للأدمن
router.put('/admin/:id', protect, isAdmin, updateAnyAppointment); // فقط الأدمن يمكنه تعديل أي حجز
router.get('/:userId', protect, isAdmin,getAppointmentsByUserId);

module.exports = router;
