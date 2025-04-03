document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const filesGrid = document.getElementById('filesGrid');
    const noFiles = document.getElementById('noFiles');
    const themeToggle = document.getElementById('theme-toggle');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = uploadProgress.querySelector('.progress-fill');
    const progressPercent = document.getElementById('progressPercent');
    const API_URL = 'http://localhost:3000/api';

    let currentCategory = 'all';
    let allFiles = [];

    // Инициализация темы
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.checked = savedTheme === 'dark';

    // Обработчики событий для темы
    themeToggle.addEventListener('change', () => {
        const theme = themeToggle.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    });

    // Обработчики для категорий
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.category-btn.active').classList.remove('active');
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            filterAndDisplayFiles();
        });
    });

    // Обработчики для поиска и сортировки
    searchInput.addEventListener('input', filterAndDisplayFiles);
    sortSelect.addEventListener('change', filterAndDisplayFiles);

    // Загрузка файлов при старте
    loadFiles();

    // Обработка drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('highlight');
    }

    function unhighlight(e) {
        dropZone.classList.remove('highlight');
    }

    // Обработка dropped файлов
    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    // Обработка выбранных файлов через input
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    async function handleFiles(files) {
        uploadProgress.style.display = 'block';
        let totalProgress = 0;
        
        for (const file of files) {
            await uploadFile(file);
            totalProgress += (100 / files.length);
            updateProgress(totalProgress);
        }
        
        setTimeout(() => {
            uploadProgress.style.display = 'none';
            progressFill.style.width = '0%';
            progressPercent.textContent = '0%';
        }, 1000);
        
        loadFiles();
    }

    function updateProgress(percent) {
        progressFill.style.width = `${percent}%`;
        progressPercent.textContent = `${Math.round(percent)}%`;
    }

    async function uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Ошибка при загрузке файла');
            }

            const result = await response.json();
            console.log('Файл загружен:', result);
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка при загрузке файла');
        }
    }

    async function loadFiles() {
        try {
            const response = await fetch(`${API_URL}/files`);
            allFiles = await response.json();
            filterAndDisplayFiles();
        } catch (error) {
            console.error('Ошибка при загрузке списка файлов:', error);
        }
    }

    function filterAndDisplayFiles() {
        let filteredFiles = [...allFiles];
        
        // Фильтрация по категории
        if (currentCategory !== 'all') {
            filteredFiles = filteredFiles.filter(file => {
                const extension = file.name.split('.').pop().toLowerCase();
                return getFileCategory(extension) === currentCategory;
            });
        }
        
        // Фильтрация по поиску
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filteredFiles = filteredFiles.filter(file => 
                file.name.toLowerCase().includes(searchTerm)
            );
        }
        
        // Сортировка
        const [sortBy, sortOrder] = sortSelect.value.split('-');
        filteredFiles.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'date':
                    comparison = new Date(a.uploadDate) - new Date(b.uploadDate);
                    break;
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'size':
                    comparison = a.size - b.size;
                    break;
            }
            return sortOrder === 'desc' ? -comparison : comparison;
        });
        
        // Отображение файлов
        displayFiles(filteredFiles);
    }

    function displayFiles(files) {
        filesGrid.innerHTML = '';
        
        if (files.length === 0) {
            noFiles.style.display = 'block';
            return;
        }
        
        noFiles.style.display = 'none';
        files.forEach(file => {
            createFileCard(file);
        });
    }

    function createFileCard(file) {
        const fileCard = document.createElement('div');
        fileCard.className = 'file-card';
        
        const fileIcon = document.createElement('i');
        fileIcon.className = getFileIcon(file.name);
        
        const fileName = document.createElement('h3');
        fileName.textContent = file.name;
        
        const fileSize = document.createElement('p');
        fileSize.textContent = formatFileSize(file.size);
        
        const fileDate = document.createElement('p');
        fileDate.textContent = new Date(file.uploadDate).toLocaleDateString();
        
        const downloadBtn = document.createElement('a');
        downloadBtn.href = `${API_URL}${file.url}`;
        downloadBtn.download = file.name;
        downloadBtn.className = 'download-btn';
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Скачать';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.onclick = async () => {
            if (confirm('Вы уверены, что хотите удалить этот файл?')) {
                try {
                    const response = await fetch(`${API_URL}/files/${file.id}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        fileCard.remove();
                        allFiles = allFiles.filter(f => f.id !== file.id);
                        filterAndDisplayFiles();
                    }
                } catch (error) {
                    console.error('Ошибка при удалении файла:', error);
                }
            }
        };
        
        fileCard.appendChild(fileIcon);
        fileCard.appendChild(fileName);
        fileCard.appendChild(fileSize);
        fileCard.appendChild(fileDate);
        fileCard.appendChild(downloadBtn);
        fileCard.appendChild(deleteBtn);
        
        filesGrid.appendChild(fileCard);
    }

    function getFileCategory(extension) {
        const categories = {
            'images': ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
            'documents': ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'],
            'audio': ['mp3', 'wav', 'ogg', 'm4a', 'flac'],
            'video': ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'],
            'archives': ['zip', 'rar', '7z', 'tar', 'gz']
        };
        
        for (const [category, extensions] of Object.entries(categories)) {
            if (extensions.includes(extension)) {
                return category;
            }
        }
        
        return 'other';
    }

    function getFileIcon(fileName) {
        const extension = fileName.split('.').pop().toLowerCase();
        const iconClass = 'fas fa-file';
        
        const iconMap = {
            'jpg': 'fa-file-image',
            'jpeg': 'fa-file-image',
            'png': 'fa-file-image',
            'gif': 'fa-file-image',
            'bmp': 'fa-file-image',
            'webp': 'fa-file-image',
            'mp4': 'fa-file-video',
            'avi': 'fa-file-video',
            'mov': 'fa-file-video',
            'wmv': 'fa-file-video',
            'flv': 'fa-file-video',
            'mkv': 'fa-file-video',
            'mp3': 'fa-file-audio',
            'wav': 'fa-file-audio',
            'ogg': 'fa-file-audio',
            'm4a': 'fa-file-audio',
            'flac': 'fa-file-audio',
            'pdf': 'fa-file-pdf',
            'doc': 'fa-file-word',
            'docx': 'fa-file-word',
            'txt': 'fa-file-alt',
            'rtf': 'fa-file-alt',
            'odt': 'fa-file-alt',
            'xls': 'fa-file-excel',
            'xlsx': 'fa-file-excel',
            'ppt': 'fa-file-powerpoint',
            'pptx': 'fa-file-powerpoint',
            'zip': 'fa-file-archive',
            'rar': 'fa-file-archive',
            '7z': 'fa-file-archive',
            'tar': 'fa-file-archive',
            'gz': 'fa-file-archive'
        };
        
        return `fas ${iconMap[extension] || iconClass}`;
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
});
