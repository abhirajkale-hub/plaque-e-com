// Mock settings data
export const mockSettings = {
  id: '1',
  currency: 'INR',
  tax_rate: 0,
  contact_email: 'support@mytradeaward.com',
  contact_phone: '+91 9876543210',
  contact_address: '123 Business Street, Mumbai, India',
  gst_number: 'GST1234567890',
  shipping_india_text: 'India: 7–10 business days',
  shipping_international_text: 'International: 10–15 business days',
  razorpay_key_id: 'rzp_test_1234567890',
  razorpay_key_secret: 'secret_key',
  ga4_id: '',
  meta_pixel_id: '',
  updated_at: new Date().toISOString()
};

// Get settings
export const getSettings = () => {
  return mockSettings;
};

// Update settings (in real app this would persist)
export const updateSettings = (updates: Partial<typeof mockSettings>) => {
  Object.assign(mockSettings, updates);
  return mockSettings;
};
