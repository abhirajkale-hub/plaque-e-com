const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        // Get current date for today's calculations
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Parallel database queries for better performance
        const [
            totalOrders,
            todayOrders,
            totalUsers,
            totalProducts,
            activeProducts,
            pendingOrders,
            monthlyOrders,
            revenueData
        ] = await Promise.all([
            // Total orders count
            Order.countDocuments(),

            // Today's orders count
            Order.countDocuments({
                created_at: { $gte: startOfDay }
            }),

            // Total users count
            User.countDocuments({ deleted_at: null }),

            // Total products count
            Product.countDocuments(),

            // Active products count
            Product.countDocuments({ is_active: true }),

            // Pending orders count
            Order.countDocuments({
                status: { $in: ['new', 'processing'] }
            }),

            // Monthly orders count
            Order.countDocuments({
                created_at: { $gte: startOfMonth }
            }),

            // Revenue data
            Order.aggregate([
                {
                    $match: {
                        payment_status: 'completed'
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$total_amount' },
                        monthlyRevenue: {
                            $sum: {
                                $cond: [
                                    { $gte: ['$created_at', startOfMonth] },
                                    '$total_amount',
                                    0
                                ]
                            }
                        }
                    }
                }
            ])
        ]);

        const revenue = revenueData[0] || { totalRevenue: 0, monthlyRevenue: 0 };
        const averageOrderValue = totalOrders > 0 ? revenue.totalRevenue / totalOrders : 0;

        res.status(200).json({
            success: true,
            data: {
                totalOrders,
                todayOrders,
                totalUsers,
                totalRevenue: revenue.totalRevenue,
                pendingOrders,
                totalProducts,
                activeProducts,
                monthlyRevenue: revenue.monthlyRevenue,
                monthlyOrders,
                averageOrderValue: Math.round(averageOrderValue)
            }
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch dashboard statistics',
                code: 'DASHBOARD_STATS_ERROR'
            }
        });
    }
};

// @desc    Get analytics data
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
    try {
        const { period = 'month' } = req.query;

        // Calculate date range based on period
        const today = new Date();
        let startDate;

        switch (period) {
            case 'week':
                startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'quarter':
                startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
                break;
            case 'year':
                startDate = new Date(today.getFullYear() - 1, today.getMonth(), 1);
                break;
            default: // month
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        }

        // Get dashboard stats
        const dashboardStats = await getDashboardStatsData();

        // Get revenue chart data
        const revenueChart = await getRevenueChartData(startDate);

        // Get order statistics
        const orderStats = await getOrderStatsData();

        // Get top products
        const topProducts = await getTopProductsData(10);

        // Get user statistics
        const userStats = await getUserStatsData();

        // Get recent orders
        const recentOrders = await Order.find()
            .sort({ created_at: -1 })
            .limit(5)
            .populate('user_id', 'full_name email');

        res.status(200).json({
            success: true,
            data: {
                dashboard_stats: dashboardStats,
                revenue_chart: revenueChart,
                order_stats: orderStats,
                top_products: topProducts,
                user_stats: userStats,
                recent_orders: recentOrders
            }
        });

    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch analytics data',
                code: 'ANALYTICS_ERROR'
            }
        });
    }
};

// @desc    Get revenue chart data
// @route   GET /api/admin/revenue-chart
// @access  Private/Admin
const getRevenueChart = async (req, res) => {
    try {
        const { period = 'month' } = req.query;

        const today = new Date();
        let startDate;

        switch (period) {
            case 'week':
                startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'quarter':
                startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
                break;
            case 'year':
                startDate = new Date(today.getFullYear() - 1, today.getMonth(), 1);
                break;
            default:
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        }

        const revenueData = await getRevenueChartData(startDate);

        res.status(200).json({
            success: true,
            data: revenueData
        });

    } catch (error) {
        console.error('Error fetching revenue chart:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch revenue chart data',
                code: 'REVENUE_CHART_ERROR'
            }
        });
    }
};

// @desc    Get order statistics
// @route   GET /api/admin/order-stats
// @access  Private/Admin
const getOrderStatistics = async (req, res) => {
    try {
        const orderStats = await getOrderStatsData();

        res.status(200).json({
            success: true,
            data: orderStats
        });

    } catch (error) {
        console.error('Error fetching order statistics:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch order statistics',
                code: 'ORDER_STATS_ERROR'
            }
        });
    }
};

// @desc    Get top products
// @route   GET /api/admin/top-products
// @access  Private/Admin
const getTopProducts = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const topProducts = await getTopProductsData(parseInt(limit));

        res.status(200).json({
            success: true,
            data: topProducts
        });

    } catch (error) {
        console.error('Error fetching top products:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch top products',
                code: 'TOP_PRODUCTS_ERROR'
            }
        });
    }
};

// @desc    Get user statistics
// @route   GET /api/admin/user-stats
// @access  Private/Admin
const getUserStatistics = async (req, res) => {
    try {
        const userStats = await getUserStatsData();

        res.status(200).json({
            success: true,
            data: userStats
        });

    } catch (error) {
        console.error('Error fetching user statistics:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch user statistics',
                code: 'USER_STATS_ERROR'
            }
        });
    }
};

// @desc    Export data
// @route   GET /api/admin/export/:type
// @access  Private/Admin
const exportData = async (req, res) => {
    try {
        const { type } = req.params;
        const { format = 'csv' } = req.query;

        let data = [];
        let filename = '';

        switch (type) {
            case 'orders':
                data = await Order.find().populate('user_id', 'full_name email');
                filename = `orders_export_${new Date().toISOString().split('T')[0]}`;
                break;
            case 'users':
                data = await User.find({ deleted_at: null }).select('-password');
                filename = `users_export_${new Date().toISOString().split('T')[0]}`;
                break;
            case 'products':
                data = await Product.find();
                filename = `products_export_${new Date().toISOString().split('T')[0]}`;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: { message: 'Invalid export type' }
                });
        }

        if (format === 'csv') {
            const csv = convertToCSV(data);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
            res.send(csv);
        } else {
            res.status(200).json({
                success: true,
                data: data,
                filename: `${filename}.json`
            });
        }

    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to export data',
                code: 'EXPORT_ERROR'
            }
        });
    }
};

// Helper functions
const getDashboardStatsData = async () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalOrders, todayOrders, totalUsers, revenueData] = await Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ created_at: { $gte: startOfDay } }),
        User.countDocuments({ deleted_at: null }),
        Order.aggregate([
            { $match: { payment_status: 'completed' } },
            { $group: { _id: null, totalRevenue: { $sum: '$total_amount' } } }
        ])
    ]);

    return {
        totalOrders,
        todayOrders,
        totalUsers,
        totalRevenue: revenueData[0]?.totalRevenue || 0,
        pendingOrders: await Order.countDocuments({ status: { $in: ['new', 'processing'] } })
    };
};

const getRevenueChartData = async (startDate) => {
    return await Order.aggregate([
        {
            $match: {
                created_at: { $gte: startDate },
                payment_status: 'completed'
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$created_at" }
                },
                revenue: { $sum: '$total_amount' },
                orders: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                date: '$_id',
                revenue: 1,
                orders: 1
            }
        },
        { $sort: { date: 1 } }
    ]);
};

const getOrderStatsData = async () => {
    const totalOrders = await Order.countDocuments();
    const statusCounts = await Order.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    return statusCounts.map(item => ({
        status: item._id,
        count: item.count,
        percentage: totalOrders > 0 ? Math.round((item.count / totalOrders) * 100) : 0
    }));
};

const getTopProductsData = async (limit) => {
    return await Order.aggregate([
        { $unwind: '$items' },
        {
            $group: {
                _id: '$items.product_id',
                product_name: { $first: '$items.product_name' },
                total_sold: { $sum: '$items.quantity' },
                total_revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
            }
        },
        {
            $project: {
                _id: 0,
                product_id: '$_id',
                product_name: 1,
                total_sold: 1,
                total_revenue: 1
            }
        },
        { $sort: { total_revenue: -1 } },
        { $limit: limit }
    ]);
};

const getUserStatsData = async () => {
    const totalUsers = await User.countDocuments({ deleted_at: null });
    const roleCounts = await User.aggregate([
        { $match: { deleted_at: null } },
        {
            $group: {
                _id: '$role',
                count: { $sum: 1 }
            }
        }
    ]);

    return roleCounts.map(item => ({
        role: item._id,
        count: item.count,
        percentage: totalUsers > 0 ? Math.round((item.count / totalUsers) * 100) : 0
    }));
};

const convertToCSV = (data) => {
    if (!data.length) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
            }).join(',')
        )
    ].join('\n');

    return csvContent;
};

module.exports = {
    getDashboardStats,
    getAnalytics,
    getRevenueChart,
    getOrderStatistics,
    getTopProducts,
    getUserStatistics,
    exportData
};