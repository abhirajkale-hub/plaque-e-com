export const mockProducts = [
  {
    id: '1',
    name: 'My Trade Gold Award',
    slug: 'my-trade-gold-award',
    description: 'Premium award for celebrating your trading achievements',
    material: '25mm Premium Clear Acrylic',
    is_active: true,
    meta_title: 'My Trade Gold Award - Premium Trading Achievement Award',
    meta_description: 'Celebrate your trading milestones with our premium 25mm acrylic Gold Award. UV printed for lasting quality.',
    product_variants: [
      {
        id: 'v1',
        product_id: '1',
        size: '15×15 cm',
        sku: 'GOLD-15X15',
        price: 2499.00,
        compare_at_price: 3499.00,
        is_available: true
      },
      {
        id: 'v2',
        product_id: '1',
        size: '13×18 cm',
        sku: 'GOLD-13X18',
        price: 2799.00,
        compare_at_price: 3799.00,
        is_available: true
      }
    ]
  },
  {
    id: '2',
    name: 'My Trade Platinum Award',
    slug: 'my-trade-platinum-award',
    description: 'Premium award for celebrating your platinum trading achievements',
    material: '25mm Premium Clear Acrylic',
    is_active: true,
    meta_title: 'My Trade Platinum Award - Premium Trading Achievement Award',
    meta_description: 'Honor your exceptional trading success with our premium 25mm acrylic Platinum Award. UV printed for lasting quality.',
    product_variants: [
      {
        id: 'v3',
        product_id: '2',
        size: '20×20 cm',
        sku: 'PLAT-20X20',
        price: 3999.00,
        compare_at_price: 5499.00,
        is_available: true
      },
      {
        id: 'v4',
        product_id: '2',
        size: '20×15 cm',
        sku: 'PLAT-20X15',
        price: 3499.00,
        compare_at_price: 4799.00,
        is_available: true
      }
    ]
  }
];

export const mockCMSPages = [
  {
    id: 'p1',
    slug: 'privacy-policy',
    title: 'Privacy Policy – My Trade Award',
    content: `<div class="prose prose-sm max-w-none">
      <p><strong>Effective Date:</strong> 03-10-2025</p>
      
      <p>At My Trade Award, we value your privacy and are committed to protecting your personal information. By using our website and services, you agree to the collection and use of information as described in this policy.</p>
      
      <h2>1. Information We Collect</h2>
      <ul>
        <li>Personal details (name, email, phone, address) when you place an order.</li>
        <li>Payment details (processed securely via trusted gateways like Cashfree, Crypto in future).</li>
        <li>Technical information (IP address, browser type, cookies, analytics data).</li>
      </ul>
      
      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To process and deliver your orders.</li>
        <li>To provide customer support.</li>
        <li>To improve our website experience through analytics and tracking tools.</li>
        <li>To send promotional updates (only if you subscribe).</li>
      </ul>
      
      <h2>3. Sharing of Data</h2>
      <ul>
        <li>We do not sell or rent your personal data.</li>
        <li>Data may be shared with trusted third parties such as payment processors, logistics providers, and analytics tools.</li>
      </ul>
      
      <h2>4. Data Security</h2>
      <p>We implement strict measures to protect your personal information. However, we cannot guarantee 100% security as no online transmission is fully secure.</p>
      
      <h2>5. Your Rights</h2>
      <p>You can request access, correction, or deletion of your personal data by contacting us at <a href="mailto:support@mytradeaward.com">support@mytradeaward.com</a>.</p>
    </div>`,
    meta_title: 'Privacy Policy – My Trade Award',
    meta_description: 'Learn how My Trade Award collects, uses, and protects your personal information'
  },
  {
    id: 'p2',
    slug: 'terms-and-conditions',
    title: 'Terms & Conditions – My Trade Award',
    content: `<div class="prose prose-sm max-w-none">
      <p><strong>Effective Date:</strong> 03-10-2025</p>
      
      <p>Welcome to My Trade Award. By accessing or using our website, you agree to the following terms:</p>
      
      <h2>1. Orders & Payments</h2>
      <ul>
        <li>All products are custom-made.</li>
        <li>100% payment in advance is required before production begins.</li>
        <li>Payment gateways: Cashfree, Razorpay/UPI, and Crypto (coming soon).</li>
      </ul>
      
      <h2>2. Delivery</h2>
      <ul>
        <li>Standard delivery timeline: 7–10 business days within India, 10–15 business days for international orders.</li>
        <li>Delivery times may vary due to customs or courier delays.</li>
      </ul>
      
      <h2>3. Customization Responsibility</h2>
      <ul>
        <li>Customers are responsible for providing accurate logos, text, and details.</li>
        <li>If incorrect details are provided and the product is already printed, no refund/replacement will be offered.</li>
      </ul>
      
      <h2>4. Returns & Damages</h2>
      <ul>
        <li>No return/refund unless the product is damaged in transit and verified through inspection.</li>
        <li>In such cases, a replacement will be issued after the damaged product is returned.</li>
      </ul>
      
      <h2>5. Intellectual Property</h2>
      <p>All designs, logos, and website content belong to My Trade Award. Unauthorized use is prohibited.</p>
      
      <h2>6. Limitation of Liability</h2>
      <p>We are not responsible for indirect damages (loss of profit, emotional loss, etc.) caused by using our products or services.</p>
      
      <h2>7. Governing Law</h2>
      <p>These terms shall be governed by and interpreted under the laws of India.</p>
      
      <h2>📌 Contact Us:</h2>
      <p><strong>My Trade Award</strong><br/>
      NSG Crown Society, Shop No. 1, Vadgaon Budruk, Pune 411041<br/>
      Email: <a href="mailto:support@mytradeaward.com">support@mytradeaward.com</a><br/>
      Phone: <a href="tel:+918261065806">+91 8261065806</a></p>
    </div>`,
    meta_title: 'Terms & Conditions – My Trade Award',
    meta_description: 'Terms and conditions for ordering custom trading awards from My Trade Award'
  },
  {
    id: 'p3',
    slug: 'refund-return-policy',
    title: 'Refund & Return Policy – My Trade Award',
    content: `<div class="prose prose-sm max-w-none">
      <p><strong>Effective Date:</strong> January 2025</p>
      
      <p>Our products are custom-made and personalized, so we follow a strict no-refund policy once the order has been processed and printed.</p>
      
      <h2>1. No Refund / Cancellation</h2>
      <ul>
        <li>Once an order is confirmed and customization is done, it cannot be canceled or refunded.</li>
        <li>Incorrect designs/logos/text provided by the customer are their responsibility, and no refund will be issued.</li>
      </ul>
      
      <h2>2. Damaged or Defective Products</h2>
      <ul>
        <li>If your product arrives damaged, you must notify us within 48 hours of delivery with photos/videos.</li>
        <li>After inspection, if approved, you can return the damaged product, and we will provide a replacement at no additional cost.</li>
        <li>Refunds will only be issued if replacement is not possible.</li>
      </ul>
      
      <h2>3. Shipping & Returns</h2>
      <ul>
        <li>Customers are responsible for securely packaging the product for return in case of damage claims.</li>
        <li>Replacement/refund will only be processed once the returned product is received and inspected by us.</li>
      </ul>
    </div>`,
    meta_title: 'Refund & Return Policy – My Trade Award',
    meta_description: 'Our strict no-refund policy for custom-made trading awards and damaged product handling'
  }
];

export const mockOrders = [
  {
    id: 'order1',
    order_number: 'MTA123456',
    user_id: 'user1',
    status: 'new',
    total_amount: 2499.00,
    shipping_name: 'John Doe',
    shipping_email: 'john@example.com',
    shipping_phone: '+91 98765 43210',
    shipping_address: '123 Trading Street',
    shipping_city: 'Mumbai',
    shipping_state: 'Maharashtra',
    shipping_pincode: '400001',
    shipping_country: 'India',
    payment_status: null,
    payment_id: null,
    tracking_number: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [
      {
        id: 'item1',
        product_name: 'My Trade Gold Award',
        variant_size: '15×15 cm',
        price: 2499.00,
        quantity: 1,
        trader_name: 'John Doe',
        achievement_title: 'Funded Trader',
        payout_amount: '₹50,000',
        payout_date: '2024-01-15',
        production_notes: null
      }
    ]
  }
];

export const mockCoupons = [
  {
    id: 'c1',
    code: 'WELCOME10',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 10,
    min_order_amount: 2000,
    max_discount_amount: 500,
    usage_limit: 100,
    times_used: 15,
    is_active: true,
    starts_at: '2024-01-01',
    expires_at: '2024-12-31',
    created_at: new Date().toISOString()
  }
];

export const mockSettings = {
  id: 's1',
  currency: 'INR',
  tax_rate: 0,
  gst_number: '',
  shipping_india_text: 'India: 7–10 business days',
  shipping_international_text: 'International: 10–15 business days',
  contact_email: 'support@mytradeaward.com',
  contact_phone: '+91 8261065806',
  contact_address: 'NSG Crown Society Shop No 1, Vadgaon Budruk, Pune 411041',
  store_name: 'My Trade Award',
  cashfree_app_id: '',
  cashfree_secret_key: '',
  cashfree_env: 'TEST',
  ga4_id: '',
  meta_pixel_id: ''
};