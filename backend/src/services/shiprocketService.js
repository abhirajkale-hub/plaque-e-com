const axios = require('axios');
const crypto = require('crypto');
const https = require('https');

class ShiprocketService {
    constructor () {
        this.email = process.env.SHIPROCKET_EMAIL;
        this.password = process.env.SHIPROCKET_PASSWORD;
        this.baseURL = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';
        this.token = null;
        this.tokenExpiry = null;

        // Create axios instance with SSL configuration for development
        this.axiosInstance = axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: process.env.NODE_ENV === 'production'
            }),
            timeout: 30000 // 30 second timeout
        });

        // Validate configuration
        if (!this.email || this.email.includes('your_shiprocket_email')) {
            console.warn('⚠️  Shiprocket email not configured in environment variables');
        }
        if (!this.password || this.password.includes('your_shiprocket_password')) {
            console.warn('⚠️  Shiprocket password not configured in environment variables');
        }

        console.log('Shiprocket Service initialized');
    }

    /**
     * Authenticate with Shiprocket and get access token
     */
    async authenticate() {
        try {
            // Validate credentials before attempting authentication
            if (!this.email || this.email.includes('your_shiprocket_email')) {
                throw new Error('Shiprocket email not configured. Please update SHIPROCKET_EMAIL in .env file');
            }
            if (!this.password || this.password.includes('your_shiprocket_password')) {
                throw new Error('Shiprocket password not configured. Please update SHIPROCKET_PASSWORD in .env file');
            }

            console.log('Authenticating with Shiprocket...');

            const response = await this.axiosInstance.post(`${this.baseURL}/auth/login`, {
                email: this.email,
                password: this.password
            });

            if (response.data && response.data.token) {
                this.token = response.data.token;
                // Token expires in 10 days
                this.tokenExpiry = Date.now() + (10 * 24 * 60 * 60 * 1000);

                console.log('✅ Shiprocket authentication successful');
                return this.token;
            } else {
                throw new Error('Invalid response from Shiprocket authentication');
            }
        } catch (error) {
            console.error('❌ Shiprocket authentication failed:', error.response?.data || error.message);

            // Provide specific error messages for common issues
            if (error.message.includes('not configured')) {
                throw error; // Re-throw configuration errors as-is
            }
            if (error.code === 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY') {
                throw new Error('SSL certificate error. Please ensure you have a stable internet connection.');
            }

            // Handle specific Shiprocket API errors
            if (error.response?.status === 401) {
                throw new Error('Invalid Shiprocket credentials. Please check your email and password.');
            }
            if (error.response?.status === 403) {
                const errorData = error.response?.data;
                if (errorData?.message === 'Inactive User') {
                    throw new Error('Shiprocket account is inactive. Please activate your Shiprocket account or contact Shiprocket support.');
                } else {
                    throw new Error(`Shiprocket access forbidden: ${errorData?.message || 'Account may be suspended or have insufficient permissions'}`);
                }
            }
            if (error.response?.status === 429) {
                throw new Error('Too many requests to Shiprocket API. Please try again later.');
            }

            throw new Error(`Shiprocket authentication failed: ${error.message}`);
        }
    }

    /**
     * Get available pickup locations
     */
    async getPickupLocations() {
        try {
            const headers = await this.getHeaders();
            const response = await this.axiosInstance.get(
                `${this.baseURL}/settings/company/pickup`,
                { headers }
            );

            if (response.data && response.data.data) {
                console.log('Available pickup locations:', response.data.data.shipping_address);
                return response.data.data.shipping_address;
            }
            return [];
        } catch (error) {
            console.error('Failed to get pickup locations:', error.response?.data || error.message);
            return [];
        }
    }

    /**
     * Get authenticated headers for API requests
     */
    async getHeaders() {
        // Check if token exists and is not expired
        if (!this.token || Date.now() >= this.tokenExpiry) {
            await this.authenticate();
        }

        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json'
        };
    }

    /**
     * Create shipment order in Shiprocket
     */
    async createShipment(orderData) {
        try {
            console.log('Creating Shiprocket shipment for order:', orderData.orderNumber);
            console.log('Order data received:', JSON.stringify(orderData, null, 2));

            // Validate required fields
            const requiredFields = [
                'orderNumber', 'shipping_name', 'shipping_phone', 'shipping_address',
                'shipping_city', 'shipping_state', 'shipping_pincode', 'items', 'totalAmount'
            ];

            const missingFields = requiredFields.filter(field => !orderData[field]);
            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            // Validate phone number format (should be 10 digits)
            const phoneRegex = /^[6-9]\d{9}$/;
            if (!phoneRegex.test(orderData.shipping_phone.replace(/[^\d]/g, ''))) {
                console.warn('⚠️  Phone number may not be in correct format:', orderData.shipping_phone);
            }

            // Validate pincode (should be 6 digits)
            const pincodeRegex = /^\d{6}$/;
            if (!pincodeRegex.test(orderData.shipping_pincode)) {
                throw new Error(`Invalid pincode format: ${orderData.shipping_pincode}. Must be 6 digits.`);
            }

            const headers = await this.getHeaders();

            // Get available pickup locations
            const pickupLocations = await this.getPickupLocations();
            let pickupLocation = "Primary";

            if (pickupLocations && pickupLocations.length > 0) {
                // Use the first available pickup location
                pickupLocation = pickupLocations[0].pickup_location || pickupLocations[0].company_name || "Primary";
                console.log('Using pickup location:', pickupLocation);
            } else {
                console.warn('⚠️  No pickup locations found, using default "Primary"');
            }

            // Calculate total weight (assuming weight in grams)
            const totalWeight = orderData.items.reduce((sum, item) => {
                return sum + (item.weight || 500) * item.quantity; // Default 500g per item
            }, 0);

            // Prepare shipment payload according to Shiprocket API
            const shipmentData = {
                order_id: orderData.orderNumber,
                order_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
                pickup_location: pickupLocation, // Use dynamic pickup location
                billing_customer_name: orderData.shipping_name,
                billing_last_name: "",
                billing_address: orderData.shipping_address,
                billing_city: orderData.shipping_city,
                billing_pincode: orderData.shipping_pincode,
                billing_state: orderData.shipping_state,
                billing_country: orderData.shipping_country || "India",
                billing_email: orderData.customer_email || "",
                billing_phone: orderData.shipping_phone,
                shipping_is_billing: true,
                shipping_customer_name: orderData.shipping_name,
                shipping_last_name: "",
                shipping_address: orderData.shipping_address,
                shipping_city: orderData.shipping_city,
                shipping_pincode: orderData.shipping_pincode,
                shipping_country: orderData.shipping_country || "India",
                shipping_state: orderData.shipping_state,
                shipping_email: orderData.customer_email || "",
                shipping_phone: orderData.shipping_phone,
                order_items: orderData.items.map(item => ({
                    name: item.name,
                    sku: item.sku || item.name.toLowerCase().replace(/\s+/g, '-'),
                    units: item.quantity,
                    selling_price: item.price,
                    discount: 0,
                    tax: 0,
                    hsn: item.hsn || 0
                })),
                payment_method: "Prepaid", // Assuming payment is already done
                sub_total: orderData.totalAmount,
                length: 10, // Default dimensions in cm
                breadth: 10,
                height: 10,
                weight: totalWeight / 1000 // Convert to kg
            };

            console.log('Shiprocket payload:', JSON.stringify(shipmentData, null, 2));

            const response = await this.axiosInstance.post(
                `${this.baseURL}/orders/create/adhoc`,
                shipmentData,
                { headers }
            );

            if (response.data && response.data.order_id) {
                const orderData = response.data;
                console.log('✅ Shiprocket shipment created successfully:', orderData.shipment_id);

                return {
                    orderId: orderData.order_id,
                    shipmentId: orderData.shipment_id,
                    awb: orderData.awb_code || '',
                    courierCompany: orderData.courier_company_id || 'Shiprocket',
                    courierName: orderData.courier_name || 'Shiprocket',
                    trackingUrl: `https://shiprocket.in/tracking/${orderData.awb_code}`,
                    estimatedDelivery: orderData.etd || null,
                    status: 'created'
                };
            } else {
                throw new Error('Invalid response from Shiprocket shipment creation');
            }
        } catch (error) {
            console.error('❌ Shiprocket shipment creation failed:');
            console.error('Status:', error.response?.status);
            console.error('Data:', JSON.stringify(error.response?.data, null, 2));
            console.error('Message:', error.message);

            // If it's a 422 error, log validation errors from Shiprocket
            if (error.response?.status === 422) {
                const validationErrors = error.response?.data?.errors || error.response?.data?.message || 'Validation failed';
                console.error('❌ Shiprocket validation errors:', JSON.stringify(validationErrors, null, 2));
                throw new Error(`Shiprocket validation failed: ${JSON.stringify(validationErrors)}`);
            }

            throw new Error(`Shiprocket shipment creation failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Track shipment using AWB number
     */
    async trackShipment(awb) {
        try {
            console.log('Tracking Shiprocket shipment:', awb);

            const headers = await this.getHeaders();

            const response = await this.axiosInstance.get(
                `${this.baseURL}/courier/track/awb/${awb}`,
                { headers }
            );

            if (response.data && response.data.tracking_data) {
                const trackingData = response.data.tracking_data;

                return {
                    awb: awb,
                    status: trackingData.track_status || 'Unknown',
                    courierName: trackingData.courier_name || 'Shiprocket',
                    trackingUrl: `https://shiprocket.in/tracking/${awb}`,
                    currentLocation: trackingData.current_status || '',
                    estimatedDelivery: trackingData.etd || null,
                    trackingHistory: trackingData.shipment_track || []
                };
            } else {
                throw new Error('Invalid response from Shiprocket tracking');
            }
        } catch (error) {
            console.error('❌ Shiprocket tracking failed:', error.response?.data || error.message);
            throw new Error(`Shiprocket tracking failed: ${error.message}`);
        }
    }

    /**
     * Get all shipments for an order
     */
    async getOrderShipments(orderId) {
        try {
            const headers = await this.getHeaders();

            const response = await this.axiosInstance.get(
                `${this.baseURL}/orders/show/${orderId}`,
                { headers }
            );

            return response.data;
        } catch (error) {
            console.error('❌ Failed to get order shipments:', error.response?.data || error.message);
            throw new Error(`Failed to get order shipments: ${error.message}`);
        }
    }

    /**
     * Cancel a shipment
     */
    async cancelShipment(awb) {
        try {
            console.log('Cancelling Shiprocket shipment:', awb);

            const headers = await this.getHeaders();

            const response = await this.axiosInstance.post(
                `${this.baseURL}/orders/cancel`,
                {
                    awbs: [awb]
                },
                { headers }
            );

            return response.data;
        } catch (error) {
            console.error('❌ Shiprocket shipment cancellation failed:', error.response?.data || error.message);
            throw new Error(`Shiprocket shipment cancellation failed: ${error.message}`);
        }
    }

    /**
     * Get available couriers for a shipment
     */
    async getAvailableCouriers(shipmentData) {
        try {
            const headers = await this.getHeaders();

            const response = await this.axiosInstance.get(
                `${this.baseURL}/courier/serviceability/`,
                {
                    headers,
                    params: {
                        pickup_postcode: shipmentData.pickup_pincode,
                        delivery_postcode: shipmentData.delivery_pincode,
                        weight: shipmentData.weight,
                        cod: shipmentData.cod || 0
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('❌ Failed to get available couriers:', error.response?.data || error.message);
            throw new Error(`Failed to get available couriers: ${error.message}`);
        }
    }

    /**
     * Verify webhook signature
     */
    verifyWebhook(payload, signature, secret) {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');

        return signature === expectedSignature;
    }

    /**
     * Process webhook data
     */
    processWebhook(webhookData) {
        try {
            const { awb, current_status, delivered_date, track_status } = webhookData;

            return {
                awb,
                status: track_status || current_status,
                deliveredDate: delivered_date,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Webhook processing failed:', error.message);
            throw new Error(`Webhook processing failed: ${error.message}`);
        }
    }

    /**
     * Get shipping rates
     */
    async getShippingRates(shipmentData) {
        try {
            const headers = await this.getHeaders();

            const response = await this.axiosInstance.get(
                `${this.baseURL}/courier/serviceability/`,
                {
                    headers,
                    params: {
                        pickup_postcode: shipmentData.pickup_pincode,
                        delivery_postcode: shipmentData.delivery_pincode,
                        weight: shipmentData.weight,
                        cod: shipmentData.cod || 0
                    }
                }
            );

            if (response.data && response.data.data) {
                return response.data.data.available_courier_companies.map(courier => ({
                    courierId: courier.courier_company_id,
                    courierName: courier.courier_name,
                    rate: courier.rate,
                    etd: courier.etd,
                    cod: courier.cod
                }));
            }

            return [];
        } catch (error) {
            console.error('❌ Failed to get shipping rates:', error.response?.data || error.message);
            throw new Error(`Failed to get shipping rates: ${error.message}`);
        }
    }

    /**
     * Create pickup request
     */
    async createPickup(pickupData) {
        try {
            const headers = await this.getHeaders();

            const response = await this.axiosInstance.post(
                `${this.baseURL}/orders/create/pickup`,
                pickupData,
                { headers }
            );

            return response.data;
        } catch (error) {
            console.error('❌ Pickup creation failed:', error.response?.data || error.message);
            throw new Error(`Pickup creation failed: ${error.message}`);
        }
    }
}

// Export singleton instance
module.exports = new ShiprocketService();