const express = require('express');
const path = require('path');
const xlsx = require('xlsx'); // Подключаем библиотеку для работы с Excel

const app = express();
const port = 3000;

// Указываем путь к статическим файлам
app.use(express.static(path.join(__dirname, 'public')));

// Путь к Excel-файлу
const excelFilePath = path.join(__dirname, 'raspisanie_v4.xlsx');

// Функция для чтения данных из Excel
function readExcelData(day) {
    // Читаем Excel-файл
    const workbook = xlsx.readFile(excelFilePath);
    
    // Получаем данные из листа, соответствующего дню недели
    const sheetName = day; // Например, "Пн", "Вт" и т.д.
    const worksheet = workbook.Sheets[sheetName];
    
    // Определяем диапазон данных: A1:F13
    const range = xlsx.utils.decode_range("A1:F13");
    
    // Преобразуем данные в JSON
    const data = xlsx.utils.sheet_to_json(worksheet, { range, header: 1 });
    
    // Обрабатываем данные
    const headers = data[0]; // Заголовки из первой строки (A1:F1)
    const processedData = data.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] || ''; // Если данные отсутствуют, используем пустую строку
        });
        return obj;
    });
    
    return processedData;
}

// Маршрут для получения данных по дням недели
app.get('/data/:day', (req, res) => {
    const day = req.params.day;
    
    try {
        // Читаем данные из Excel
        const data = readExcelData(day);
        
        // Отправляем данные на клиент
        res.json(data);
    } catch (error) {
        console.error('Ошибка при чтении данных из Excel:', error);
        res.status(500).send('Ошибка при чтении данных');
    }
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});