import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Spinner, Table, Form } from 'react-bootstrap';
import { FaDollarSign, FaUtensils, FaUsers, FaChartLine, FaCrown } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';
import AdminHeader from '../../Header/AdminHeader';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalMenuItems: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    bestSellers: [],
    monthlyGrowth: 0,
    dailyRevenue: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth, selectedYear]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      let newDashboardData = {
        totalRevenue: 0,
        totalOrders: 0,
        totalUsers: 0,
        totalMenuItems: 0,
        todayRevenue: 0,
        monthlyRevenue: 0,
        bestSellers: [],
        monthlyGrowth: 0,
        dailyRevenue: []
      };

      // Gọi API song song (loại bỏ monthly comparison và recent orders)
      const apiCalls = [
        // Best Sellers
        axios.get('http://localhost:8080/api/order-items/bestsellers?limit=5',
          { headers, withCredentials: true }),

        // Monthly Revenue Statistics
        axios.get('http://localhost:8080/api/orders/revenue/statistics?period=month',
          { headers, withCredentials: true }),

        // Today Revenue
        axios.get('http://localhost:8080/api/orders/revenue/statistics?period=today',
          { headers, withCredentials: true }),

        // Daily Revenue in Month
        axios.get(`http://localhost:8080/api/orders/revenue/daily-in-month?month=${selectedMonth}&year=${selectedYear}`,
          { headers, withCredentials: true }),

        // Users count
        axios.get('http://localhost:8080/api/user',
          { headers, withCredentials: true }),

        // Menu items count
        axios.get('http://localhost:8080/api/menu-items',
          { headers, withCredentials: true }),

        // Categories 
        axios.get('http://localhost:8080/api/menu-categories',
          { headers, withCredentials: true })
      ];

      const results = await Promise.allSettled(apiCalls);

      let categoryMap = {};
      if (results[6].status === 'fulfilled') {
        const categories = results[6].value.data || [];
        categoryMap = categories.reduce((acc, cat) => {
          acc[cat._id] = cat.name;
          return acc;
        }, {});
      }
       // Process results
       if (results[0].status === 'fulfilled') {
        const bestSellersData = results[0].value.data?.data || [];
        // Map category names cho best sellers
        newDashboardData.bestSellers = bestSellersData.map(item => ({
          ...item,
          categoryName: categoryMap[item.categoryId] || 
                       categoryMap[item.menuItem?.categoryId] || 
                       categoryMap[item.category] || 
                       'Không có danh mục'
        }));
      }

      

      if (results[1].status === 'fulfilled') {
        const monthlyData = results[1].value.data?.data || {};
        newDashboardData.monthlyRevenue = monthlyData.totalRevenue || 0;
        newDashboardData.totalOrders = monthlyData.totalOrders || 0;
        newDashboardData.totalRevenue = monthlyData.totalRevenue || 0;
      }

      if (results[2].status === 'fulfilled') {
        newDashboardData.todayRevenue = results[2].value.data?.data?.totalRevenue || 0;
      }

      if (results[3].status === 'fulfilled') {
        const dailyData = results[3].value.data?.data?.dailyBreakdown || [];
        newDashboardData.dailyRevenue = dailyData.map(day => ({
          day: day.day,
          revenue: day.dailyRevenue,
          orders: day.orderCount,
          date: new Date(day.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
        }));
      }

      if (results[4].status === 'fulfilled') {
        newDashboardData.totalUsers = results[4].value.data?.length || 0;
      }

      if (results[5].status === 'fulfilled') {
        newDashboardData.totalMenuItems = results[5].value.data?.length || 0;
      }

      // Calculate growth từ daily data thay vì monthly comparison
      if (newDashboardData.dailyRevenue.length >= 2) {
        const recentDays = newDashboardData.dailyRevenue.slice(-7); // Lấy 7 ngày gần nhất
        const firstHalf = recentDays.slice(0, Math.floor(recentDays.length / 2));
        const secondHalf = recentDays.slice(Math.floor(recentDays.length / 2));

        const firstHalfAvg = firstHalf.reduce((sum, day) => sum + day.revenue, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, day) => sum + day.revenue, 0) / secondHalf.length;

        if (firstHalfAvg > 0) {
          newDashboardData.monthlyGrowth = (
            ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
          ).toFixed(1);
        }
      }

      setDashboardData(newDashboardData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Colors for charts
  const COLORS = [
    '#667eea', // Purple Blue
    '#11998e', // Teal Green  
    '#f093fb', // Pink Purple
    '#4facfe', // Light Blue
    '#fdbb2d'  // Yellow Orange
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <Spinner animation="border" size="lg" />
        <p className="mt-3">Đang tải dữ liệu dashboard...</p>
      </div>
    );
  }

  return (
    <>

      <Container fluid className="admin-dashboard">
        <Row className="mb-5">
          <Col>
            <div className="text-center">
              <h1 className="dashboard-title">
                <FaChartLine className="me-3" />
                Admin Dashboard
              </h1>
              <p className="text-muted fs-5">Tổng quan về hoạt động nhà hàng</p>
            </div>
          </Col>
        </Row>

        {error && (
          <Row className="mb-4">
            <Col>
              <Alert variant="danger" className="text-center">
                <strong>Lỗi!</strong> {error}
              </Alert>
            </Col>
          </Row>
        )}

        {/* Statistics Cards */}
        <Row className="mb-5">
          <Col lg={3} md={6} className="mb-4">
            <Card className="stat-card revenue-card h-100">
              <Card.Body>
                <div className="stat-content">
                  <div className="stat-icon">
                    <FaDollarSign />
                  </div>
                  <div className="stat-info">
                    <h3>{formatCurrency(dashboardData.totalRevenue)}</h3>
                    <p>Tổng Doanh Thu Tháng</p>
                    <small className={`fw-bold ${dashboardData.monthlyGrowth >= 0 ? 'text-success' : 'text-danger'}`}>
                      {dashboardData.monthlyGrowth >= 0 ? '📈 +' : '📉 '}{Math.abs(dashboardData.monthlyGrowth)}% so với tuần trước
                    </small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <Card className="stat-card orders-card h-100">
              <Card.Body>
                <div className="stat-content">
                  <div className="stat-icon">
                    <FaUtensils />
                  </div>
                  <div className="stat-info">
                    <h3>{dashboardData.totalOrders}</h3>
                    <p>Đơn Hàng Tháng Này</p>
                    <small className="text-info fw-bold">
                       Hôm nay: {formatCurrency(dashboardData.todayRevenue)}
                    </small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <Card className="stat-card users-card h-100">
              <Card.Body>
                <div className="stat-content">
                  <div className="stat-icon">
                    <FaUsers />
                  </div>
                  <div className="stat-info">
                    <h3>{dashboardData.totalUsers}</h3>
                    <p>Tổng Người Dùng</p>
                    <small className="text-primary fw-bold">
                       Khách hàng đã đăng ký
                    </small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <Card className="stat-card menu-card h-100">
              <Card.Body>
                <div className="stat-content">
                  <div className="stat-icon">
                    <FaUtensils />
                  </div>
                  <div className="stat-info">
                    <h3>{dashboardData.totalMenuItems}</h3>
                    <p>Món Ăn</p>
                    <small className="text-warning fw-bold">
                       Tổng số món trong menu
                    </small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Daily Revenue Chart - Full Width */}
        <Row className="mb-5">
          <Col>
            <Card className="chart-card">
              <Card.Header className="bg-primary text-white">
                <Row className="align-items-center">
                  <Col>
                    <h5 className="mb-0 fw-bold">
                      <FaChartLine className="me-3" />
                       Doanh Thu Theo Ngày
                    </h5>
                    <small className="opacity-75">Theo dõi doanh thu hàng ngày trong tháng</small>
                  </Col>
                  <Col xl={3} lg={4} md={5}>
                    <Row>
                      <Col>
                        <Form.Select
                          size="sm"
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                          className="fw-bold"
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              Tháng {i + 1}
                            </option>
                          ))}
                        </Form.Select>
                      </Col>
                      <Col>
                        <Form.Select
                          size="sm"
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                          className="fw-bold"
                        >
                          {Array.from({ length: 3 }, (_, i) => (
                            <option key={2024 + i} value={2024 + i}>
                              {2024 + i}
                            </option>
                          ))}
                        </Form.Select>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={dashboardData.dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e6ed" />
                    <XAxis
                      dataKey="date"
                      stroke="#7f8c8d"
                      fontSize={12}
                      tick={{ fill: '#7f8c8d' }}
                    />
                    <YAxis
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      stroke="#7f8c8d"
                      fontSize={12}
                      tick={{ fill: '#7f8c8d' }}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(value) : value,
                        name === 'revenue' ? 'Doanh thu' : 'Số đơn hàng'
                      ]}
                      contentStyle={{
                        background: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="url(#colorRevenue)"
                      strokeWidth={3}
                      dot={{ fill: '#667eea', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: '#667eea', strokeWidth: 2 }}
                    />
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#764ba2" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>

     {/* Best Sellers - Full Width */}
<Row className="mb-4">
  <Col>
    <Card className="best-sellers-card">
      <Card.Header>
        <h5 className="mb-0 fw-bold text-white">
          <FaCrown className="me-3" />
           Top 5 Món Ăn Bán Chạy
        </h5>
        <small className="text-white opacity-75">Những món ăn được yêu thích nhất</small>
      </Card.Header>
      <Card.Body>
        {dashboardData.bestSellers.length > 0 ? (
          <Row>
            {/* Table Section */}
            <Col xl={8} lg={7}>
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead>
                    <tr>
                      <th className="text-center text-dark">#</th>
                      <th className="text-dark">Món Ăn</th>
                      <th className="text-center text-dark">Giá</th>
                      <th className="text-center text-dark">Số Lượng</th>
                      <th className="text-center text-dark">Doanh Thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.bestSellers.map((item, index) => (
                      <tr key={item.id}>
                        <td className="text-center">
                          <span className={`rank-badge rank-${index + 1}`}>
                            {index + 1}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="item-image me-3"
                              />
                            )}
                            <div>
                              <strong className="d-block text-dark">{item.name}</strong>
                              <small className="text-muted">
                                {item.categoryName}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td className="text-center fw-bold" style={{color: '#007bff'}}>
                          {formatCurrency(item.price)}
                        </td>
                        <td className="text-center">
                          <span className="quantity-badge">
                            {item.totalQuantity}
                          </span>
                        </td>
                        <td className="text-center">
                          <strong className="text-success fs-6">
                            {formatCurrency(item.totalRevenue)}
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Col>
                    {/* Pie Chart Section */}
                    <Col xl={4} lg={5}>
                      <div className="h-100 d-flex flex-column">
                        <h6 className="fw-bold mb-3 text-center"> Phân bố doanh thu</h6>
                        <div className="flex-grow-1">
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={dashboardData.bestSellers}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="totalRevenue"
                              >
                                {dashboardData.bestSellers.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value) => formatCurrency(value)}
                                contentStyle={{
                                  background: 'white',
                                  border: 'none',
                                  borderRadius: '10px',
                                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </Col>
                  </Row>
                ) : (
                  <div className="text-center py-5">
                    <FaUtensils size={48} className="text-muted mb-3" />
                    <p className="text-muted fs-5">Chưa có dữ liệu bán hàng</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default AdminDashboard;