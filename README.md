# ART&BAY - Art Marketplace Platform

A modern, full-featured art marketplace built with Flask that connects artists with art enthusiasts. Features a dark-themed UI with comprehensive user management, cart functionality, and secure checkout system.

## 🌟 Features

### **User Management**
- **User Registration & Login**: Secure authentication with email verification
- **OTP Verification**: Two-step verification for enhanced security
- **Artist Dashboard**: Dedicated space for artists to manage their artwork
- **Admin Panel**: Comprehensive admin interface for platform management

### **Art Gallery & Shopping**
- **Art Gallery**: Browse and discover artwork from various artists
- **Shopping Cart**: Add, remove, and manage items in cart
- **Secure Checkout**: Multi-step checkout process with payment processing
- **Order Management**: Complete order tracking and confirmation

### **Artist Features**
- **Art Upload**: Artists can upload and manage their artwork
- **Price Management**: Set and edit artwork prices
- **Portfolio Management**: Organize and showcase artwork collections

### **Technical Features**
- **Dark Theme UI**: Modern, elegant dark-themed interface
- **Responsive Design**: Works seamlessly across all devices
- **Session Management**: Secure user session handling
- **Database Integration**: MySQL database with optimized queries
- **File Upload**: Secure image upload and management

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- MySQL 8.0+
- pip (Python package manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my_flask_project
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Database Setup**
   ```sql
   -- Create database
   CREATE DATABASE art_bay;
   USE art_bay;
   
   -- Import database schema
   -- (Database schema files will be provided separately)
   ```

5. **Environment Configuration**
   ```bash
   # Copy environment template
   cp dotenv.env.example .env
   
   # Edit .env with your database credentials
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=art_bay
   ```

6. **Run the application**
   ```bash
   python app.py
   ```

7. **Access the application**
   - Open browser and navigate to `http://localhost:5000`
   - Register a new account or login with existing credentials

## 📁 Project Structure

```
my_flask_project/
├── app.py                          # Main Flask application
├── blueprints/                     # Route blueprints
│   ├── auth/                      # Authentication routes
│   ├── admin_routes.py            # Admin panel routes
│   ├── art_routes.py              # Art gallery routes
│   ├── artist_routes.py           # Artist management routes
│   ├── cart_routes.py             # Shopping cart routes
│   └── checkout_routes.py         # Checkout and payment routes
├── models/                        # Database models and queries
│   ├── database.py                # Database connection
│   ├── user_queries.py            # User management queries
│   ├── art_queries.py             # Art-related queries
│   ├── cart_queries.py            # Cart management queries
│   └── checkout_queries.py        # Order and checkout queries
├── static/                        # Static assets
│   ├── css/                       # Stylesheets
│   ├── js/                        # JavaScript files
│   ├── images/                    # Image assets
│   └── uploads/                   # User uploaded files
├── templates/                     # HTML templates
│   ├── auth/                      # Authentication templates
│   ├── base.html                  # Base template
│   └── [other templates]
├── services/                      # Business logic services
│   └── email_service.py           # Email functionality
└── config/                        # Configuration files
    └── config.py                  # App configuration
```

## 🔧 Configuration

### Database Configuration
The application uses MySQL database. Configure your database connection in `config/config.py`:

```python
DATABASE_CONFIG = {
    'host': 'localhost',
    'user': 'your_username',
    'password': 'your_password',
    'database': 'art_bay'
}
```

### Email Configuration
Configure email settings for OTP verification in `services/email_service.py`:

```python
EMAIL_CONFIG = {
    'smtp_server': 'smtp.gmail.com',
    'smtp_port': 587,
    'email': 'your_email@gmail.com',
    'password': 'your_app_password'
}
```

## 🎨 Features in Detail

### **User Authentication**
- **Registration**: Users can register with email, password, and personal details
- **OTP Verification**: Email-based OTP verification for account activation
- **Login/Logout**: Secure session-based authentication
- **Password Recovery**: Email-based password reset functionality

### **Art Gallery**
- **Browse Artwork**: View artwork from various artists
- **Search & Filter**: Find specific artwork by category, price, or artist
- **Art Details**: Detailed view of individual artwork with descriptions
- **Add to Cart**: One-click add to shopping cart functionality

### **Shopping Cart**
- **Cart Management**: Add, remove, and update item quantities
- **Price Calculation**: Automatic calculation of subtotal, tax, and shipping
- **Cart Persistence**: Cart items saved in database and session
- **Checkout Integration**: Seamless transition to checkout process

### **Checkout System**
- **Multi-step Process**: Shipping information → Payment → Confirmation
- **Payment Processing**: Simulated payment gateway integration
- **Order Creation**: Automatic order and order items creation
- **Cart Clearing**: Automatic cart clearing after successful payment

### **Artist Dashboard**
- **Artwork Management**: Upload, edit, and delete artwork
- **Price Management**: Set and update artwork prices
- **Portfolio View**: Overview of all uploaded artwork
- **Sales Tracking**: View order history and sales data

### **Admin Panel**
- **User Management**: View and manage all registered users
- **Order Management**: Track and manage all orders
- **Artwork Moderation**: Approve or reject uploaded artwork
- **Platform Analytics**: View platform statistics and metrics

## 🛠️ API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/verify_otp` - OTP verification
- `GET /auth/logout` - User logout

### Art Gallery
- `GET /gallery` - Browse artwork
- `GET /art/<id>` - View specific artwork
- `POST /art/add_to_cart` - Add artwork to cart

### Cart Management
- `GET /cart` - View cart
- `POST /cart/add` - Add item to cart
- `POST /cart/remove` - Remove item from cart
- `POST /cart/update` - Update item quantity

### Checkout
- `GET /checkout` - Checkout page
- `POST /checkout/process_shipping` - Process shipping information
- `POST /checkout/process_payment` - Process payment
- `GET /order_confirmation/<id>` - Order confirmation

### Artist Dashboard
- `GET /artist/dashboard` - Artist dashboard
- `POST /artist/upload_art` - Upload artwork
- `POST /artist/edit_price` - Edit artwork price
- `GET /artist/orders` - View artist orders

## 🎯 User Roles

### **Regular User**
- Browse artwork gallery
- Add items to cart
- Complete checkout process
- View order history
- Manage profile

### **Artist**
- All regular user features
- Upload artwork
- Manage artwork portfolio
- Set artwork prices
- View sales analytics

### **Admin**
- All user and artist features
- Manage all users
- Moderate artwork
- View platform analytics
- Manage orders

## 🔒 Security Features

- **Session Management**: Secure session handling with Flask-Session
- **Password Hashing**: Bcrypt password hashing for security
- **OTP Verification**: Email-based two-factor authentication
- **Input Validation**: Comprehensive form validation
- **SQL Injection Prevention**: Parameterized queries
- **File Upload Security**: Secure file upload with validation

## 🎨 UI/UX Features

### **Dark Theme Design**
- Modern dark color scheme
- Orange accent colors for highlights
- Consistent typography with Google Fonts
- Smooth animations and transitions

### **Responsive Design**
- Mobile-first approach
- Responsive grid layouts
- Touch-friendly interface
- Cross-browser compatibility

### **User Experience**
- Intuitive navigation
- Clear call-to-action buttons
- Loading states and feedback
- Error handling and validation messages

## 🚀 Deployment

### **Development**
```bash
python app.py
```

### **Production**
For production deployment, consider:
- Using Gunicorn or uWSGI as WSGI server
- Setting up Nginx as reverse proxy
- Configuring SSL certificates
- Setting up proper logging
- Using environment variables for sensitive data

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common issues

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added OTP verification and enhanced security
- **v1.2.0** - Improved checkout system and cart management
- **v1.3.0** - Added artist dashboard and admin panel

---

**ART&BAY** - Connecting artists with art enthusiasts through a modern, secure, and user-friendly platform. 