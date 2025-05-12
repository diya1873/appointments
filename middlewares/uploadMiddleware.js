const multer = require('multer');
const path = require('path');
const fs = require('fs');

// تحديد المجلد الذي سيتم حفظ الصور فيه
const uploadDir = path.join(__dirname, '..', 'uploads');

// إنشاء المجلد إذا لم يكن موجودًا
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // حفظ الملفات في مجلد "uploads"
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only images are allowed'), false);
    }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
