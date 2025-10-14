# My Trade Award - Backend API

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. Clone the repository and navigate to backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration.

4. Start MongoDB (if running locally):

```bash
mongod
```

5. Run the development server:

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

### API Endpoints

#### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Send password reset email
- `POST /api/auth/reset-password` - Reset password with token
- `PUT /api/auth/change-password` - Change password (authenticated)

#### Health Check

- `GET /health` - Server health status

### Testing

Run the test suite:

```bash
npm test
```

### Project Structure

```
src/
├── config/          # Database and other configurations
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic services
├── utils/           # Utility functions
├── validators/      # Request validation schemas
└── server.js        # Main server file
```

### Authentication Flow

1. **Register**: Create new user account
2. **Login**: Authenticate and receive JWT token
3. **Protected Routes**: Include `Authorization: Bearer <token>` header
4. **Token Expiry**: Tokens expire in 7 days (configurable)

### Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation
- CORS protection
- Helmet security headers
- Email verification (optional)
- Password reset functionality

### Error Handling

All API responses follow this format:

**Success Response:**

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Environment Variables

See `.env` file for all required environment variables including:

- Database connection
- JWT secret
- Email configuration
- File upload settings
- Payment gateway keys
- Delhivery integration

### Development Notes

- Use nodemon for development (auto-restart on changes)
- MongoDB connection is established on server start
- Graceful shutdown handling implemented
- Comprehensive logging in development mode
- Rate limiting applied to all API routes

### Next Steps

1. ✅ Authentication APIs (completed)
2. 🔄 User Management APIs
3. ⏳ Product Management APIs
4. ⏳ Order Management APIs
5. ⏳ Shipping Integration
6. ⏳ Payment Integration
7. ⏳ File Upload APIs
8. ⏳ CMS APIs
9. ⏳ Admin Dashboard APIs
