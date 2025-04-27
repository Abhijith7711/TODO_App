# Real-Time Todo Application

A full-stack Todo application built with Django and React, featuring real-time updates using WebSocket. The application allows users to manage tasks with instant updates.

## Features

- **Authentication**
  - User registration and login
  - JWT token-based authentication
  - Secure password handling

- **Task Management**
  - Create, read, update, and delete tasks
  - Mark tasks as complete/incomplete
  - Task description support
  - Real-time updates using WebSocket
  - Search tasks by title or description
  - Filter tasks (Pending/Completed)

## Tech Stack

### Backend
- Django 
- Django REST Framework 
- Django Channels
- Redis (for WebSocket)
- JWT Authentication

### Database
- PostgreSQL

### Frontend
- React
- Material-UI
- React Router
- React-Toastify
- WebSocket client

## Prerequisites

Before setting up the project, ensure you have the following installed:

1. **Python** (3.8 or higher)
   ```bash
   python --version
   ```

2. **Node.js** (14 or higher)
   ```bash
   node --version
   ```

3. **PostgreSQL**
   - [Download PostgreSQL](https://www.postgresql.org/download/)
   - Create a database named 'todo_db'

4. **Docker** (for Redis)
   - [Download Docker](https://www.docker.com/products/docker-desktop/)

## Installation and Setup

### 1. Clone the Repository
```bash
git clone https://github.com/abhijith7711/ToDo-app.git
cd todo-app
```

### 2. Backend Setup

1. **Create and activate virtual environment:**
   ```bash
   cd todo-backend
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   Create `.env` file in todo-backend directory:
   ```env
   DEBUG=True
   SECRET_KEY=your_secret_key_here
   DATABASE_URL=your_database_connection_string_here
   
   ```

### 3. Frontend Setup

1. **Install dependencies:**
   ```bash
   cd todo-frontend
   npm install
   ```


   ```

## Running the Application

1. **Start Redis** (Required for WebSocket)
   ```bash
   # Using Docker
   docker start redis
   # or for first time setup
   docker run -d -p 6379:6379 --name redis redis
   ```

2. **Start Django Backend**
   ```bash
   cd APP
   # Important: Use Daphne for WebSocket support
   daphne todo_project.asgi:application
   ```
   > **Note:** This project requires Daphne instead of `runserver` for proper WebSocket functionality
   > Daphne is an ASGI server that enables handling both HTTP and WebSocket protocols, making it essential for real-time features in this application.

3. **Start React Frontend**
   ```bash
   cd todo-frontend
   npm start
   ```

The application will be available at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`






