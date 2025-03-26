# Off Season Ultimate (OSU) Website

A modern web application for managing and organizing Off Season Ultimate activities. This project uses a Django backend with a SolidJS frontend for a fast, responsive user experience.

## 🚀 Tech Stack

### Backend

- Python 3.11+
- Django 5.1.6
- Poetry for dependency management

### Frontend

- SolidJS
- Vite
- TailwindCSS
- Yarn package manager

## 📋 Prerequisites

- Python 3.11 or higher
- Node.js (Latest LTS version recommended)
- Poetry
- Yarn

## 🛠️ Setup

### Backend Setup

1. Install Poetry if you haven't already:

   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   ```

2. Install backend dependencies:

   ```bash
   poetry install
   ```

3. Activate the virtual environment:

   ```bash
   poetry shell
   ```

4. Run migrations:

   ```bash
   python manage.py migrate
   ```

5. Start the Django development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Start the development server:
   ```bash
   yarn dev
   ```

## 🏃‍♂️ Development

- Backend API runs on `http://localhost:8000`
- Frontend development server runs on `http://localhost:5173`

## 📦 Building for Production

### Frontend Build

```bash
cd frontend
yarn build
```

### Backend Production Setup

Configure your production settings in Django and use a production-grade server like Gunicorn.

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
