require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Настройка раздачи статических файлов
app.use(express.static(__dirname));

// Создаем директорию для загрузок, если она не существует
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Настройка Multer для загрузки файлов
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Подключение к MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fileshare';
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Схема для файлов
const fileSchema = new mongoose.Schema({
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    uploadDate: { type: Date, default: Date.now }
});

const File = mongoose.model('File', fileSchema);

// Маршруты API
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }

        const file = new File({
            filename: req.file.filename,
            originalName: req.file.originalname,
            path: req.file.path,
            size: req.file.size
        });

        await file.save();
        res.json({
            message: 'Файл успешно загружен',
            file: {
                id: file._id,
                name: file.originalName,
                size: file.size,
                url: `/uploads/${file.filename}`
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при загрузке файла' });
    }
});

app.get('/api/files', async (req, res) => {
    try {
        const files = await File.find().sort({ uploadDate: -1 });
        res.json(files.map(file => ({
            id: file._id,
            name: file.originalName,
            size: file.size,
            url: `/uploads/${file.filename}`,
            uploadDate: file.uploadDate
        })));
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении списка файлов' });
    }
});

app.delete('/api/files/:id', async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ error: 'Файл не найден' });
        }

        // Удаляем файл с диска
        fs.unlinkSync(file.path);
        
        // Удаляем запись из базы данных
        await File.deleteOne({ _id: req.params.id });
        
        res.json({ message: 'Файл успешно удален' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при удалении файла' });
    }
});

// Маршрут для корневой страницы
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 