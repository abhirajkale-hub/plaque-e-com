// Mock admin dashboard data
export const mockDashboardStats = {
  totalOrders: 156,
  todayOrders: 8,
  totalUsers: 432,
  totalRevenue: 458000,
  pendingOrders: 12
};

export const mockRecentOrders = [
  {
    id: '1',
    order_number: 'ORD-2024-001',
    created_at: new Date().toISOString(),
    total_amount: 2999,
    status: 'new',
    shipping_name: 'John Doe'
  }
];

// Gallery uploads mock data
export const mockGalleryUploads = [
  {
    id: '1',
    image_url: '/placeholder.svg',
    caption: 'Sample Award',
    is_approved: true,
    is_featured: false,
    created_at: new Date().toISOString(),
    user_id: null
  }
];

// Certificate uploads mock data
export const mockCertificateUploads = [
  {
    id: '1',
    file_name: 'certificate.pdf',
    file_url: '/placeholder.pdf',
    created_at: new Date().toISOString(),
    order_item_id: '1'
  }
];
