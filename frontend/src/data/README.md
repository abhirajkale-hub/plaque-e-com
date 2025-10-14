# Mock Data Structure

This folder contains all mock/dummy data for the frontend. Replace these with your own backend API calls.

## Files

### `mockProducts.ts`
- Product catalog (Gold & Platinum awards)
- Product variants (sizes & pricing)
- CMS pages (Privacy, Terms, Refund Policy)
- Orders data
- Coupons
- Site settings

### `mockAuth.ts`
- Authentication logic (login/signup/logout)
- User management
- Role-based access (admin/customer)

## Demo Credentials

**Admin Access:**
- Email: `admin@test.com`
- Password: `password123`

**Customer Access:**
- Any email with password length >= 6 characters

## Backend Integration

When ready to integrate your backend:

1. **Authentication** (`src/contexts/AuthContext.tsx`):
   - Replace mock functions with your API calls
   - Update login/signup/logout logic

2. **Products** (`src/pages/Products.tsx`, `src/pages/ProductDetail.tsx`):
   - Replace `mockProducts` imports with API fetch calls

3. **Cart & Checkout**:
   - Currently uses localStorage
   - Replace with backend cart management

4. **Orders**:
   - Add API endpoints for order creation/retrieval
   - Implement Razorpay payment integration

5. **Admin Panel**:
   - Connect all CRUD operations to your backend
   - Add file upload for certificates to your storage

## API Endpoints You'll Need

```
POST   /api/auth/login
POST   /api/auth/signup
POST   /api/auth/logout
GET    /api/products
GET    /api/products/:slug
POST   /api/orders
GET    /api/orders/:id
POST   /api/upload/certificate
GET    /api/cms/:slug
POST   /api/checkout/razorpay
```

## Data Models

See the existing mock data structure for the expected JSON format for each entity.