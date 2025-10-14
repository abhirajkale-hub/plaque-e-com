# Plaque E-Commerce Platform

A full-stack e-commerce platform for customizable plaques and awards, built with modern web technologies.

## 🚀 Tech Stack

### Frontend

- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI Components**: Radix UI with Shadcn
- **State Management**: React Query (TanStack Query)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form
- **Date Handling**: date-fns

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt
- **File Upload**: Multer & Cloudinary
- **Payment Gateway**: Razorpay
- **Email Service**: Nodemailer
- **Logging**: Winston
- **API Security**: Helmet, CORS, Rate Limiting

## 🏗️ Project Structure

```
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Application pages/routes
│   │   ├── services/      # API service integrations
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
│
├── backend/                # Node.js backend application
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
│   ├── tests/             # Test files
│   └── uploads/           # File upload directory
```

## ✨ Features

- 🛠️ Product customization builder
- 🛍️ Shopping cart management
- 💳 Secure payment processing
- 📦 Order tracking and management
- 👥 User authentication and profiles
- 📱 Responsive design
- 🌐 Integration with Shiprocket for shipping
- 📊 Admin dashboard
- 💬 WhatsApp chat integration
- 🎯 Affiliate marketing system

## 🚀 Getting Started

### Prerequisites

- Node.js >= 14
- MongoDB
- npm or Bun package manager
- Supabase account
- Razorpay account (for payments)
- Shiprocket account (for shipping)

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/abhirajkale-hub/plaque-e-com.git
   cd plaque-e-com
   \`\`\`

2. Install backend dependencies:
   \`\`\`bash
   cd backend
   npm install
   cp .env.example .env

# Configure your .env file

\`\`\`

3. Install frontend dependencies:
   \`\`\`bash
   cd ../frontend
   npm install
   cp .env.example .env

# Configure your .env file

\`\`\`

### Development

1. Start the backend server:
   \`\`\`bash
   cd backend
   npm run dev
   \`\`\`

2. Start the frontend development server:
   \`\`\`bash
   cd frontend
   npm run dev
   \`\`\`

### Seeding Data

The backend includes several seed scripts for populating the database:

\`\`\`bash
cd backend
npm run seed:all # Run all seed scripts
npm run seed:products # Seed only products
npm run seed:users # Seed only users

# ... other seed commands available

\`\`\`

## 🧪 Testing

- Backend tests:
  \`\`\`bash
  cd backend
  npm test
  \`\`\`

## 📝 Environment Variables

### Backend (.env)

- \`MONGODB_URI\`: MongoDB connection string
- \`JWT_SECRET\`: Secret key for JWT
- \`RAZORPAY_KEY_ID\`: Razorpay API key
- \`RAZORPAY_KEY_SECRET\`: Razorpay secret key
- \`SHIPROCKET_API_KEY\`: Shiprocket API key
- \`CLOUDINARY\_\*\`: Cloudinary configuration

### Frontend (.env)

- \`VITE_API_URL\`: Backend API URL
- \`VITE_SUPABASE_URL\`: Supabase project URL
- \`VITE_SUPABASE_ANON_KEY\`: Supabase anonymous key
- \`VITE_RAZORPAY_KEY_ID\`: Razorpay public key

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- [Abhiraj Kale](https://github.com/abhirajkale-hub)
