import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Package,
  ShoppingCart,
  Upload,
  FileText,
  Tag,
  Settings,
  BarChart,
  Image,
  Video,
  Users,
  TrendingUp,
  DollarSign,
  Clock,
} from "lucide-react";
import { adminService, orderService, type Order } from "@/services";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  totalUsers: number;
  totalRevenue: number;
  pendingOrders: number;
}

const Dashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    todayOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch dashboard statistics
        const dashboardStats = await adminService.getDashboardStats();
        setStats({
          totalOrders: dashboardStats?.totalOrders || 0,
          todayOrders: dashboardStats?.todayOrders || 0,
          totalUsers: dashboardStats?.totalUsers || 0,
          totalRevenue: dashboardStats?.totalRevenue || 0,
          pendingOrders: dashboardStats?.pendingOrders || 0,
        });

        // Fetch recent orders
        const ordersResponse = await orderService.getAllOrders({
          limit: 5,
          sortBy: "created_at",
          sortOrder: "desc",
        });
        setRecentOrders(ordersResponse.orders || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setRecentOrders([]); // Ensure recentOrders is always an array
        setError("Failed to load dashboard data. Please try again.");
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  const statCards = [
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Today's Orders",
      value: stats.todayOrders,
      icon: Clock,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Total Revenue",
      value: `₹${(stats.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: TrendingUp,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
  ];

  const modules = [
    {
      title: "Products",
      description: "Manage products and variants",
      icon: Package,
      href: "/admin/products",
      color: "text-blue-500",
    },
    {
      title: "Orders",
      description: "View and manage orders",
      icon: ShoppingCart,
      href: "/admin/orders",
      color: "text-green-500",
    },
    {
      title: "Gallery Images",
      description: "Manage setup images",
      icon: Image,
      href: "/admin/gallery",
      color: "text-yellow-500",
    },
    {
      title: "Review Videos",
      description: "Manage trader reviews",
      icon: Video,
      href: "/admin/reviews",
      color: "text-red-500",
    },
    {
      title: "Uploads",
      description: "View customer uploads",
      icon: Upload,
      href: "/admin/uploads",
      color: "text-purple-500",
    },
    {
      title: "Pages",
      description: "Edit CMS pages",
      icon: FileText,
      href: "/admin/pages",
      color: "text-orange-500",
    },
    {
      title: "Coupons",
      description: "Manage discount codes",
      icon: Tag,
      href: "/admin/coupons",
      color: "text-pink-500",
    },
    {
      title: "SEO",
      description: "SEO settings",
      icon: BarChart,
      href: "/admin/seo",
      color: "text-cyan-500",
    },
    {
      title: "Settings",
      description: "Site configuration",
      icon: Settings,
      href: "/admin/settings",
      color: "text-gray-500",
    },
    {
      title: "Prop Discounts",
      description: "Manage prop firm discounts",
      icon: Tag,
      href: "/admin/prop-discounts",
      color: "text-emerald-500",
    },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-500/10 text-blue-500",
      artwork_received: "bg-cyan-500/10 text-cyan-500",
      in_print: "bg-yellow-500/10 text-yellow-500",
      packed: "bg-orange-500/10 text-orange-500",
      shipped: "bg-purple-500/10 text-purple-500",
      completed: "bg-green-500/10 text-green-500",
      cancelled: "bg-red-500/10 text-red-500",
    };
    return colors[status] || "bg-muted";
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your My Trade Award store
        </p>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} className="glass-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Orders */}
          <Card className="glass-card mb-8">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders from customers</CardDescription>
            </CardHeader>
            <CardContent>
              {!recentOrders || recentOrders.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No orders yet
                </p>
              ) : (
                <div className="space-y-3">
                  {recentOrders?.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">#{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.shipping_name || "N/A"}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </span>
                        <span className="font-semibold">
                          ₹{Number(order.total_amount).toLocaleString()}
                        </span>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/admin/orders`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.href} to={module.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Icon className={`h-8 w-8 ${module.color}`} />
                    <div>
                      <CardTitle>{module.title}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
