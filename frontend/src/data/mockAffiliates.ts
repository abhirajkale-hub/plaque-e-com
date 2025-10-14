// Mock affiliate data stored in localStorage

export interface MockAffiliate {
  id: string;
  user_id: string;
  affiliate_code: string;
  commission_rate: number;
  total_earnings: number;
  total_orders: number;
  is_active: boolean;
  created_at: string;
}

export interface MockAffiliateOrder {
  id: string;
  order_id: string;
  affiliate_id: string;
  commission_amount: number;
  commission_paid: boolean;
  created_at: string;
  orders: {
    order_number: string;
    total_amount: number;
    status: string;
  };
}

const STORAGE_KEY_AFFILIATES = 'mockAffiliates';
const STORAGE_KEY_ORDERS = 'mockAffiliateOrders';

// Initialize with some demo data
const initializeMockData = () => {
  if (!localStorage.getItem(STORAGE_KEY_AFFILIATES)) {
    localStorage.setItem(STORAGE_KEY_AFFILIATES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEY_ORDERS)) {
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify([]));
  }
};

export const getAffiliateByUserId = (userId: string): MockAffiliate | null => {
  initializeMockData();
  const affiliates: MockAffiliate[] = JSON.parse(localStorage.getItem(STORAGE_KEY_AFFILIATES) || '[]');
  return affiliates.find(a => a.user_id === userId) || null;
};

export const createAffiliate = (userId: string, affiliateCode: string): MockAffiliate => {
  initializeMockData();
  const affiliates: MockAffiliate[] = JSON.parse(localStorage.getItem(STORAGE_KEY_AFFILIATES) || '[]');
  
  const newAffiliate: MockAffiliate = {
    id: `affiliate-${Date.now()}`,
    user_id: userId,
    affiliate_code: affiliateCode,
    commission_rate: 10,
    total_earnings: 0,
    total_orders: 0,
    is_active: true,
    created_at: new Date().toISOString()
  };
  
  affiliates.push(newAffiliate);
  localStorage.setItem(STORAGE_KEY_AFFILIATES, JSON.stringify(affiliates));
  return newAffiliate;
};

export const generateAffiliateCode = (baseCode: string): string => {
  initializeMockData();
  const affiliates: MockAffiliate[] = JSON.parse(localStorage.getItem(STORAGE_KEY_AFFILIATES) || '[]');
  
  let finalCode = baseCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
  let counter = 0;
  
  while (affiliates.some(a => a.affiliate_code === finalCode)) {
    counter++;
    finalCode = baseCode.toUpperCase().replace(/[^A-Z0-9]/g, '') + counter;
  }
  
  return finalCode;
};

export const getAffiliateOrders = (affiliateId: string): MockAffiliateOrder[] => {
  initializeMockData();
  const orders: MockAffiliateOrder[] = JSON.parse(localStorage.getItem(STORAGE_KEY_ORDERS) || '[]');
  return orders.filter(o => o.affiliate_id === affiliateId);
};

export const createAffiliateOrder = (affiliateId: string, orderData: {
  order_number: string;
  total_amount: number;
  commission_amount: number;
}): MockAffiliateOrder => {
  initializeMockData();
  const orders: MockAffiliateOrder[] = JSON.parse(localStorage.getItem(STORAGE_KEY_ORDERS) || '[]');
  
  const newOrder: MockAffiliateOrder = {
    id: `aff-order-${Date.now()}`,
    order_id: `order-${Date.now()}`,
    affiliate_id: affiliateId,
    commission_amount: orderData.commission_amount,
    commission_paid: false,
    created_at: new Date().toISOString(),
    orders: {
      order_number: orderData.order_number,
      total_amount: orderData.total_amount,
      status: 'processing'
    }
  };
  
  orders.push(newOrder);
  localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
  
  // Update affiliate stats
  const affiliates: MockAffiliate[] = JSON.parse(localStorage.getItem(STORAGE_KEY_AFFILIATES) || '[]');
  const affiliateIndex = affiliates.findIndex(a => a.id === affiliateId);
  
  if (affiliateIndex !== -1) {
    affiliates[affiliateIndex].total_orders += 1;
    affiliates[affiliateIndex].total_earnings += orderData.commission_amount;
    localStorage.setItem(STORAGE_KEY_AFFILIATES, JSON.stringify(affiliates));
  }
  
  return newOrder;
};
