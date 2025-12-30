# ART-BAY

A robust, full-stack marketplace platform connecting digital artists with collectors. Built on Python (Flask) and MySQL, it features role-based access control, secure transactions, and a responsive, high-fidelity user interface.

## System Overview

Art-Bay is architected as a server-side rendered application leveraging the Flask microframework. It implements a layered architecture separating business logic, database interaction, and presentation concerns.

### Key Capabilities

*   **Role-Based Access Control (RBAC)**: Distinct permissions for Customers, Artists, and Administrators.
*   **Secure Authentication**: Implementation of Bcrypt hashing, email-based OTP verification, and session management.
*   **E-Commerce Engine**: persistent cart management, shipping logic, order creation, and mock payment gateway integration.
*   **Content Management**: Artist dashboards for portfolio management, inventory control, and pricing strategy.
*   **Administrative Control**: Centralized panel for user moderation, platform analytics, global system settings (commission rates, shipping fees), and maintenance mode.

## Technical Architecture

### Backend Stack
*   **Framework**: Flask (Python 3.8+)
*   **Database**: MySQL 8.0 with `mysql-connector-python` utilizing connection pooling.
*   **Authentication**: Custom session-based auth with `flask-session` and `werkzeug.security`.
*   **Environment**: Dotenv for configuration management.

### Frontend Stack
*   **Templating**: Jinja2
*   **Styling**: Custom CSS3 utilizing CSS Variables for theming (Dark Mode/Glassmorphism).
*   **Interaction**: Vanilla JavaScript (ES6+) for DOM manipulation and AJAX requests.

## Directory Structure

```
ART-BAY/
├── app.py                  # Application entry point and configuration
├── blueprints/             # Modular route handlers (Auth, Admin, Artist, Cart, Shop)
├── models/                 # Data access layer and SQL abstractions
├── services/               # Shared business logic (Email, File Handling)
├── static/                 # Client-side assets (CSS, JS, Images, Uploads)
├── templates/              # Jinja2 HTML templates
└── config/                 # Environment-specific configuration
```

## Setup & Installation

### Prerequisites
*   Python 3.8 or higher
*   MySQL Server 8.0 or higher

### Installation Steps

1.  **Clone the Repository**
    ```bash
    git clone [repository-url]
    cd ART-BAY
    ```

2.  **Environment Setup**
    Create and activate a virtual environment:
    ```bash
    python -m venv venv
    # Windows
    venv\Scripts\activate
    # Linux/Mac
    source venv/bin/activate
    ```

3.  **Dependencies**
    Install required Python packages:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Database Configuration**
    Create a MySQL database named `art_bay`.
    Configure the `.env` file in the root directory:
    ```
    DB_HOST=localhost
    DB_USER=[your_db_user]
    DB_PASSWORD=[your_db_password]
    DB_NAME=art_bay
    SECRET_KEY=[your_secret_key]
    ```

5.  **Initialization**
    Run the application to initialize the server:
    ```bash
    python app.py
    ```
    The server will start on `http://127.0.0.1:5000`.

## API Documentation

The application exposes RESTful endpoints for key operations:

*   **Auth**: `/auth/login`, `/auth/register`, `/auth/verify_otp`
*   **Shop**: `/gallery`, `/cart/add`, `/checkout/proccess`
*   **Admin**: `/admin/dashboard`, `/admin/users/update`, `/admin/settings`

## Development

*   **Code Style**: Adheres to PEP 8 standards for Python.
*   **Security**: All database inputs are parameterized to prevent SQL injection.
*   **Logging**: structured logging is implemented for error tracking and debugging.

## License

MIT License