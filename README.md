# ВКР Кочетков Александр Евгеньевич

FEFU Drive - это система управления поездками и водителями для Дальневосточного федерального университета.

Автор: Кочетков Александр Евгеньевич<br>
Тема: ПРИЛОЖЕНИЕ ДЛЯ ПОИСКА ПОПУТЧИКОВ<br>
Группа: Б9121-09.03.04 Программная инженерия<br>
Научный руководитель: Крестникова Ольга Александровна

## 🚀 Технологии

### Frontend
- React 18
- Material-UI (MUI) 5
- React Router 6
- Formik + Yup для валидации форм
- Axios для HTTP-запросов
- Socket.io-client для реального времени
- Framer Motion для анимаций

### Backend
- Node.js
- Express.js
- MySQL
- JWT для аутентификации
- Bcrypt для хеширования паролей
- CORS для междоменных запросов

### ML-сервис (предсказание времени в пути)
- Python 3.10+
- FastAPI
- scikit-learn, pandas, numpy и др.

## 📦 Установка

### Предварительные требования
- Node.js (версия 14 или выше)
- MySQL
- Python 3.10 или выше (для ML-сервиса)

### Инициализация базы данных
1. Создайте базу данных MySQL
2. Запустите скрипт инициализации:
```bash
mysql -u your_username -p your_database_name < backend/src/config/init.sql
```

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

### ML-сервис (FastAPI)
```bash
cd model
python -m venv venv
source venv/bin/activate  # или venv\Scripts\activate для Windows
pip install -r requirements.txt
```

## 🛠️ Запуск

### Backend
```bash
cd backend
npm run dev
```

### Frontend
```bash
cd frontend
npm start
```

### ML-сервис (FastAPI)
```bash
cd model
source venv/bin/activate  # или venv\Scripts\activate для Windows
uvicorn ml_api:app --reload
```

ML-сервис будет доступен по адресу: http://127.0.0.1:8000

## 🔧 Интеграция ML-сервиса
- Node.js backend автоматически обращается к ML-сервису для предсказания времени в пути при создании поездки.
- ML-сервис должен быть запущен до старта backend!
- Если порт или адрес ML-сервиса отличается, проверьте настройки в backend/src/services/mlPredictor.js

## 🔧 Настройка окружения

### Backend
Создайте файл `.env` в директории backend со следующими переменными:
```
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=fefu_drive
JWT_SECRET=your_jwt_secret
PORT=5000
ADMIN_PASSWORD=your_admin_password
```

### Frontend
Создайте файл `.env` в директории frontend:
```
REACT_APP_API_URL=http://localhost:5000
```

## 🔐 Доступ администратора

Для входа в систему администратора используйте следующие учетные данные:
- Логин: `admin`
- Пароль: значение переменной `ADMIN_PASSWORD` из файла `.env` (по умолчанию: `123`)

## 📝 Функциональность

### Для пассажира
- Регистрация и авторизация
- Просмотр доступных поездок
- Просмотр статистики поездок
- Управление профилем

### Для водителей
- Подача заявки на получение статуса водителя
- Управление своими поездками
- Просмотр и обновление информации о себе
- Взаимодействие с пассажирами через чат

### Для администратора
- Управление пользователями и водителями
- Рассмотрение заявок на получение статуса водителя
- Управление поездками
- Просмотр статистики и аналитики
- Модерация запросов на изменение информации о водителях
- Администрирование системы