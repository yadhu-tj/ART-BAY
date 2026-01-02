# ART-BAY

A robust, full-stack marketplace platform connecting digital artists with collectors. Built on Python (Flask) and MySQL, it features role-based access control, secure transactions, and a premium, immersive user interface.

## System Overview

Art-Bay is architected as a server-side rendered application leveraging the Flask microframework. It implements a layered architecture separating business logic, database interaction, and presentation concerns, now featuring immersive V2 design aesthetics.

### Key Capabilities

*   **Immersive Art Experience**: A dedicated Art Details page featuring a split-screen stage, 3D perspective-tilt interactions, and ambient lighting effects.
*   **Role-Based Access Control (RBAC)**: Distinct permissions for Customers, Artists, and Administrators.
*   **Secure Authentication**: Implementation of Bcrypt hashing, email-based OTP verification, and session management.
*   **E-Commerce Engine**: Persistent cart management, shipping logic, order creation, and mock payment gateway integration.
*   **Content Management**: Artist dashboards for portfolio management, inventory control, and pricing strategy.
*   **Administrative Control**: Centralized panel for user moderation, platform analytics, global system settings (commission rates, shipping fees), and maintenance mode.

## Technical Architecture

### Backend Stack
*   **Framework**: Flask (Python 3.13+)
*   **Database**: MySQL 8.0 with `mysql-connector-python` utilizing connection pooling.
*   **Authentication**: Custom session-based auth with `flask-session` and `werkzeug.security`.
*   **Testing**: Pytest-driven test suite for security, logic, and UI routing.

### Frontend Stack
*   **Templating**: Jinja2
*   **Styling**: Custom CSS3 utilizing advanced variables, glassmorphism, and cinematic animations.
*   **Interaction**: Vanilla JavaScript (ES6+) for DOM manipulation, parallax effects, and AJAX-based cart interactions.

## Directory Structure

```
ART-BAY/
├── app.py                  # Application entry point and configuration
├── blueprints/             # Modular route handlers (Auth, Art, Admin, Dashboard, Cart)
├── models/                 # Data access layer and SQL abstractions
├── services/               # Shared business logic (Email, File Handling)
├── static/                 # Client-side assets (CSS, JS, Images, Uploads)
├── templates/              # Jinja2 HTML templates
├── tests/                  # Pytest test suite (Security, Logic, UI)
└── config/                 # Environment-specific configuration
```

## Setup & Installation

### Prerequisites
*   Python 3.8 or higher (3.13 recommended)
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

5.  **Initialization & Launch**
    Run the application to initialize the server:
    ```bash
    python app.py
    ```
    The server will start on `http://127.0.0.1:5000`.

## Testing

The project includes a comprehensive test suite covering routing, security, and database logic.

**Run all tests:**
```bash
python -m pytest
```

**Run specific Art Details tests:**
```bash
python -m pytest tests/test_art_details.py
```

## API Documentation

The application exposes RESTful endpoints for key operations:

*   **Auth**: `/auth/login`, `/auth/register`, `/auth/verify_otp`
*   **Art**: `/art/view/<id>` (Immersive Page), `/gallery`, `/art/filter`
*   **Cart**: `/cart/add`, `/cart/count`
*   **Admin**: `/admin/dashboard`, `/admin/users/update`, `/admin/settings`

## Development

*   **UI/UX**: Prioritizes immersive and cinematic design using CSS-only solutions where possible.
*   **Security**: All database inputs are parameterized to prevent SQL injection.
*   **Maintenance**: Built-in maintenance mode via the Admin panel.

## License

MIT License