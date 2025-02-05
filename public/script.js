let currentDay = getCurrentDay(); // Текущий день
let selectedDay = currentDay; // Выбранный день (по умолчанию — текущий)
let inactivityTimer; // Таймер для возврата к текущему дню
let currentModal = null; // Текущее модальное окно

// Функция для определения текущего дня
function getCurrentDay() {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const today = new Date().getDay(); // 0 (воскресенье) - 6 (суббота)
    return days[today]; // Возвращаем "Пн", "Вт" и т.д.
}

// Функция для обновления подсветки вкладок
function updateTabs() {
    const buttons = document.querySelectorAll('#days-nav button');
    buttons.forEach(button => {
        const dayDiv = button.querySelector('.day-name');
        const day = Object.entries({
            'Понедельник': 'Пн',
            'Вторник': 'Вт',
            'Среда': 'Ср',
            'Четверг': 'Чт',
            'Пятница': 'Пт',
            'Суббота': 'Сб'
        }).find(([full, short]) => full === dayDiv.textContent)[1];

        if (day === currentDay) {
            button.style.backgroundColor = 'green';
        } else if (day === selectedDay) {
            button.style.backgroundColor = 'yellow';
        } else {
            button.style.backgroundColor = '';
        }
    });
}

// Функция для загрузки данных и обновления вкладок
function loadDay(day) {
    selectedDay = day; // Обновляем выбранный день
    updateTabs(); // Обновляем подсветку вкладок
    resetInactivityTimer(); // Сбрасываем таймер бездействия

    fetch(`/data/${day}`)
        .then(response => response.json())
        .then(data => {
            const table = document.getElementById('schedule-table');
            table.innerHTML = ''; // Очищаем таблицу

            // Если данных нет, выводим сообщение
            if (data.length === 0) {
                const messageRow = document.createElement('tr');
                const messageCell = document.createElement('td');
                messageCell.colSpan = 6; // Количество столбцов
                messageCell.textContent = 'Данные отсутствуют';
                messageRow.appendChild(messageCell);
                table.appendChild(messageRow);
                return;
            }

			// Создаем заголовок таблицы
			const headerRow = document.createElement('tr');
			
			// Явно задаем порядок заголовков
			const headers = ['Аудитория', 'Группа', 'Профессия, курс', 'Преподаватель', 'Куратор', 'Форма занятия'];
			headers.forEach(headerText => {
				const header = document.createElement('th');
				header.textContent = headerText;
				headerRow.appendChild(header);
			});
			table.appendChild(headerRow);

            // Заполняем таблицу данными
            data.forEach(row => {
                const tr = document.createElement('tr');
                let isFull = true; // Флаг для проверки, заполнена ли строка полностью
				
				// Порядок столбцов: Аудитория, Группа, Профессия, курс, Преподаватель, Куратор, Форма занятия
				const headers = ['Аудитория', 'Группа', 'Профессия, курс', 'Преподаватель', 'Куратор', 'Форма занятия'];

                headers.forEach(header => {
                    const td = document.createElement('td');
                    td.textContent = row[header] || ''; 	// Если данные отсутствуют, используем пустую строку
				
                    // Проверяем, заполнена ли строка полностью
                    if (!row[header]) {
                        isFull = false;
                    }

                    // Устанавливаем атрибуты для ячейки "Форма занятия"
                    if (header === 'Форма занятия') {
                        td.setAttribute('data-form', row[header]);
                    }

                    // Добавляем обработчик клика на ячейку
                    td.addEventListener('click', () => showDetails(row));

                    tr.appendChild(td);
                });

                // Устанавливаем атрибут data-full
                tr.setAttribute('data-full', isFull);
                table.appendChild(tr);
            });
        })
        .catch(error => console.error('Ошибка загрузки данных:', error));
}

// Функция для генерации дат недели
function getWeekDates() {
    const today = new Date();
    const currentDayIndex = today.getDay(); // 0 (воскресенье) - 6 (суббота)
    const monday = new Date(today);
    
    // Корректировка для недели с понедельника
    const diff = currentDayIndex === 0 ? 6 : currentDayIndex - 1;
    monday.setDate(today.getDate() - diff);

    const days = [];
    for (let i = 0; i < 6; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        days.push({
            day: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][i],
            date: date
        });
    }
    return days;
}

// Функция для создания кнопок с датами
function createDayButtons() {
    const daysNav = document.getElementById('days-nav');
    if (!daysNav) {
        console.error('Элемент days-nav не найден!');
        return;
    }
    
    try {
        const weekDays = getWeekDates();
        daysNav.innerHTML = '';
        
        weekDays.forEach(({day, date}) => {
            const button = document.createElement('button');
            const formattedDate = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear().toString().slice(-2)}`;
            
            button.innerHTML = `
                <div class="day-name">${getFullDayName(day)}</div>
                <div class="day-date">${formattedDate}</div>
            `;
            
            button.onclick = () => {
                selectedDay = day;
                loadDay(day);
            };
            daysNav.appendChild(button);
        });
    } catch (error) {
        console.error('Ошибка создания кнопок:', error);
    }
}

// Функция для получения полного названия дня
function getFullDayName(shortDay) {
    const days = {
        'Пн': 'Понедельник',
        'Вт': 'Вторник',
        'Ср': 'Среда',
        'Чт': 'Четверг',
        'Пт': 'Пятница',
        'Сб': 'Суббота'
    };
    return days[shortDay];
}




// Функция для загрузки изображения
async function loadImage(imagePath, defaultImage) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = imagePath;
        img.onload = () => resolve(imagePath); // Если изображение загружено
        img.onerror = () => resolve(defaultImage); // Если изображение не найдено
    });
}

// Функция для отображения деталей мероприятия
async function showDetails(row) {
    // Закрываем предыдущее модальное окно, если оно есть
    if (currentModal) {
        currentModal.remove();
    }

    // Получаем фамилии преподавателя и куратора
    const tutorLastName = row['Преподаватель'].split(' ')[0]; // Берём первую часть ФИО
    const curatorLastName = row['Куратор'].split(' ')[0]; // Берём первую часть ФИО

    // Пути к фотографиям с кодировкой URL
    const tutorImagePath = `/avatar/${encodeURIComponent(tutorLastName)}.png`;
    const curatorImagePath = `/avatar/${encodeURIComponent(curatorLastName)}.png`;

    // Пути к аватарам по умолчанию
    const defaultTutorImage = '/avatar/tutor.png';
    const defaultCuratorImage = '/avatar/kurator.png';

    // Загружаем изображения преподавателя и куратора
    const tutorImageSrc = await loadImage(tutorImagePath, defaultTutorImage);
    const curatorImageSrc = await loadImage(curatorImagePath, defaultCuratorImage);

    // Путь к схеме кабинета
// Путь к схеме кабинета
const audience = row['Аудитория']; // Номер аудитории
const schemeImagePath = `/scheme/${audience}.png`; // Путь к схеме
const defaultSchemeImage = '/scheme/default.png'; // Схема по умолчанию (если нет файла)

// Загружаем схему кабинета
const schemeImageSrc = await loadImage(schemeImagePath, defaultSchemeImage);

// Создаем новое модальное окно
const modal = document.createElement('div');
modal.classList.add('modal');
modal.innerHTML = `
    <h2>Детали мероприятия</h2>
    <div class="modal-info">
        <div>
            <p><strong>Аудитория:</strong> ${audience}</p>
            <p><strong>Профессия, курс:</strong> ${row['Профессия, курс']}</p>
            <p><strong>Группа:</strong> ${row['Группа']}</p>
        </div>
        <div>
            <p><strong>Преподаватель:</strong> ${row['Преподаватель']}</p>
            <p><strong>Куратор:</strong> ${row['Куратор']}</p>
            <p><strong>Форма занятия:</strong> ${row['Форма занятия']}</p>
        </div>
        <div class="modal-image">
            <p><strong>Преподаватель</strong></p>
            <img src="${tutorImageSrc}" alt="Преподаватель">
        </div>
        <div class="modal-image">
            <p><strong>Куратор</strong></p>
            <img src="${curatorImageSrc}" alt="Куратор">
        </div>
        <div class="modal-scheme">
            <p><strong>Схема кабинета</strong></p>
            <img src="${schemeImageSrc}" alt="Схема кабинета ${audience}">
        </div>
    </div>
    <button onclick="closeModal()">Закрыть</button>
`;

    // Добавляем модальное окно на страницу
    document.body.appendChild(modal);

    // Добавляем затемнение фона
    const overlay = document.createElement('div');
    overlay.classList.add('modal-overlay');
    document.body.appendChild(overlay);

    // Закрываем модальное окно при клике на затемнение
    overlay.addEventListener('click', closeModal);

    // Сохраняем ссылку на текущее модальное окно
    currentModal = modal;
}

// Функция для закрытия модального окна
function closeModal() {
    if (currentModal) {
        currentModal.remove();
        currentModal = null;
    }
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Функция для сброса таймера бездействия
function resetInactivityTimer() {
    clearTimeout(inactivityTimer); // Сбрасываем предыдущий таймер
    inactivityTimer = setTimeout(() => {
        selectedDay = currentDay; // Возвращаемся к текущему дню
        loadDay(currentDay); // Загружаем данные текущего дня
    }, 30000); // 30 секунд
}

// Обновим обработчик загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
    createDayButtons();
    // Даем время на отрисовку кнопок перед обновлением
    setTimeout(() => {
        loadDay(currentDay);
        updateTabs();
        resetInactivityTimer();
        loadTickerText();
    }, 50);
});


// Функция для Бегущей строки
// Функция для загрузки текста из файла
async function loadTickerText() {
    try {
        const response = await fetch('/message.txt'); // Путь к файлу
        if (!response.ok) {
            throw new Error('Файл не найден');
        }
        const text = await response.text(); // Читаем текст из файла
        console.log('Текст загружен:', text); // Отладочное сообщение
        const tickerText = document.getElementById('ticker-text');
        tickerText.textContent = text; // Вставляем текст в бегущую строку
    } catch (error) {
        console.error('Ошибка загрузки текста для бегущей строки:', error);
        const tickerText = document.getElementById('ticker-text');
        tickerText.textContent = 'Нет данных для отображения'; // Сообщение об ошибке
    }
}

// Загружаем текст для бегущей строки при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
   console.log('Страница загружена, начинаем загрузку текста...'); // Отладочное сообщение
   loadTickerText(); // Загружаем текст для бегущей строки
});




// Функция для изменения стилей бегущей строки
function setTickerStyle(styles) {
    const tickerText = document.getElementById('ticker-text');
    Object.assign(tickerText.style, styles); // Применяем стили
}

// Пример использования:
setTickerStyle({
    fontSize: '24px', // Размер шрифта
    color: 'red',     // Цвет текста
    fontWeight: 'bold' // Жирный шрифт
});

// Функция для обновления даты и времени
// ================== Дата и время ==================
function updateDateTime() {
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    };
    
    const formatter = new Intl.DateTimeFormat('ru-RU', options);
    const parts = formatter.formatToParts(new Date()).reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
    }, {});

    document.getElementById('datetime-widget').innerHTML = `
        <div style="font-weight: 600; margin-bottom: 3px;">${parts.weekday}</div>
        <div>${parts.day} ${parts.month} ${parts.year}</div>
        <div style="font-size: 1.2em; margin-top: 5px; color: #27ae60;">
            ${parts.hour}:${parts.minute}:${parts.second}
        </div>
    `;
}

// Первый запуск
updateDateTime();

// Обновление каждую секунду
setInterval(updateDateTime, 1000);

// Обновление при восстановлении вкладки
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) updateDateTime();
});

// Функция, которая каждые 15 минут скрывать и показывать виджет
function animateWidget() {
    const widget = document.getElementById('datetime-widget');
    
    // Первая фаза: плавное исчезновение с анимацией
    widget.classList.add('hidden');
    
    // Вторая фаза: плавное появление через 2 секунды
    setTimeout(() => {
        widget.classList.remove('hidden');
    }, 2000); 
}

// Запуск каждые 15 минут (900000ms) + случайный интервал ±30 секунд
setInterval(() => {
    animateWidget();
}, 30000 + Math.random() * 10000);

// Возможно следующая функция и не нужна

// function toggleWidgetVisibility() {
//    const widget = document.getElementById('datetime-widget');

    // Плавно скрываем виджет
//    widget.classList.add('hidden');

    // Через 1 секунду (время анимации) показываем его снова
 //   setTimeout(() => {
 //       widget.classList.remove('hidden');
 //   }, 3500); // (1000) = 1 секунда — время анимации
// }

// Запускаем анимацию каждые 15 минут (900 000 миллисекунд)
//setInterval(toggleWidgetVisibility, 20000);

// Первый запуск через 15 минут после загрузки страницы
//setTimeout(toggleWidgetVisibility, 20000);

// Конфигурация праздников
const holidays = [
  {
    name: '23 февраля',
    start: new Date('2024-02-16'),
    end: new Date('2024-02-23'),
    bg: 'url(assets/holidays/backgrounds/feb23.jpg)',
    icon: 'url(assets/holidays/icons/ribbon.png)'
  },
  {
    name: '8 марта',
    start: new Date('2024-03-01'),
    end: new Date('2024-03-08'),
    bg: 'url(assets/holidays/backgrounds/mar8.jpg)',
    icon: 'url(assets/holidays/icons/flower.png)'
  },
  {
    name: 'День Победы',
    start: new Date('2024-05-03'),
    end: new Date('2024-05-09'),
    bg: 'url(assets/holidays/backgrounds/may9.jpg)',
    icon: 'url(assets/holidays/icons/star.png)'
  }
];

// Проверка активного праздника
function checkHoliday() {
  const today = new Date();
  const activeHoliday = holidays.find(holiday => 
    today >= holiday.start && today <= holiday.end
  );

  const body = document.body;
  const widget = document.getElementById('datetime-widget');

  if (activeHoliday) {
    // Применяем праздничный стиль
    body.style.setProperty('--holiday-bg', activeHoliday.bg);
    widget.style.setProperty('--holiday-icon', activeHoliday.icon);
    
    // Добавляем класс для анимации
    body.classList.add('holiday-mode');
  } else {
    // Возвращаем обычный стиль
    body.classList.remove('holiday-mode');
    body.style.removeProperty('--holiday-bg');
    widget.style.removeProperty('--holiday-icon');
  }
}

// Обновляем оформление каждый день
setInterval(checkHoliday, 86400000); // 24 часа
checkHoliday(); // Проверяем при загрузке