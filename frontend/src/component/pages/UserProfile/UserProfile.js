import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarAlt,
  faClock,
  faUser,
  faUtensils,
  faPhone,
  faEnvelope,
  faCheckCircle,
  faTimesCircle,
  faHourglassHalf,
} from "@fortawesome/free-solid-svg-icons";
import "./css/UserProfile.css";

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile"); // 'profile', 'password', 'reservations'
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    fullName: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [updating, setUpdating] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Lấy thông tin user từ localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setFormData({
        username: parsedUser.username || "",
        email: parsedUser.email || "",
        phone: parsedUser.phone || "",
        fullName: parsedUser.fullName || "",
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Fetch reservations when reservations tab is active
    if (activeTab === "reservations" && user?._id) {
      fetchReservations();
    }
  }, [activeTab, user?._id]);

  const fetchReservations = async () => {
    if (!user?._id) return;

    try {
      setLoadingReservations(true);
      const response = await axios.get(
        `http://localhost:8080/api/reservation?userId=${user._id}&limit=50`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data && response.data.reservations) {
        setReservations(response.data.reservations);
      } else {
        setReservations([]);
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
      setReservations([]);
      showMessage("error", "Không thể tải lịch sử đặt bàn");
    } finally {
      setLoadingReservations(false);
    }
  };

  const handleCancelReservation = async (reservationId, reservationName) => {
    // Confirm before canceling
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn hủy đặt bàn "${reservationName}" không?`,
      )
    ) {
      return;
    }

    try {
      // Update status to 'cancelled' instead of deleting
      const response = await axios.put(
        `http://localhost:8080/api/reservation/${reservationId}`,
        { status: "cancelled" },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data) {
        showMessage("success", "Đã hủy đặt bàn thành công");
        // Refresh reservations list
        fetchReservations();
      }
    } catch (error) {
      console.error("Error canceling reservation:", error);
      showMessage(
        "error",
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Không thể hủy đặt bàn",
      );
    }
  };

  const canCancelReservation = (reservation) => {
    // Cannot cancel if already cancelled or expired
    if (
      reservation.status === "cancelled" ||
      reservation.status === "expired"
    ) {
      return false;
    }

    // Cannot cancel if already confirmed
    if (reservation.status === "confirmed") {
      return false;
    }

    // Only allow canceling if status is 'pending' and the reservation date is in the future
    const reservationDate = new Date(reservation.reservationDate);
    const now = new Date();
    return true;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => {
      setMessage({ type: "", text: "" });
    }, 5000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    // Format time from HH:mm to HH:mm
    return timeString;
  };

  const formatDateTime = (dateString, timeString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const timeStr = timeString || "";
    if (timeStr) {
      return `${dateStr} lúc ${timeStr}`;
    }
    return dateStr;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return { icon: faCheckCircle, color: "#28a745", text: "Đã xác nhận" };
      case "pending":
        return {
          icon: faHourglassHalf,
          color: "#ffc107",
          text: "Chờ xác nhận",
        };
      case "cancelled":
        return { icon: faTimesCircle, color: "#dc3545", text: "Đã hủy" };
      case "expired":
        return { icon: faTimesCircle, color: "#6c757d", text: "Đã hết hạn" };
      default:
        return { icon: faHourglassHalf, color: "#6c757d", text: status };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const goToHomePage = () => {
    const userRole = user?.role;
    switch (userRole) {
      case "admin":
        navigate("/admin");
        break;
      case "waiter":
        navigate("/waiter/tables");
        break;
      case "chef":
        navigate("/chef/orders");
        break;
      case "staff":
        navigate("/staff/reservations");
        break;
      default:
        navigate("/home");
    }
  };

  const handleSaveProfile = async () => {
    try {
      setUpdating(true);

      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:8080/api/user/updateUser/${user._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      // Update localStorage
      const updatedUser = { ...user, ...formData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setEditing(false);

      showMessage("success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      showMessage(
        "error",
        error.response?.data?.message || "Error updating profile",
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    // Validate password inputs
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      showMessage("error", "Please fill in all password fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage("error", "New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showMessage("error", "New password must be at least 6 characters long");
      return;
    }

    try {
      setUpdating(true);

      const token = localStorage.getItem("token");
      // Fixed API endpoint for change password
      await axios.put(
        `http://localhost:8080/api/user/change-password/${user._id}`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      // Reset password form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setActiveTab("profile");

      showMessage("success", "Password changed successfully!");
    } catch (error) {
      console.error("Error changing password:", error);
      showMessage(
        "error",
        error.response?.data?.message || "Error changing password",
      );
    } finally {
      setUpdating(false);
    }
  };

  const resetPasswordForm = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setActiveTab("profile");
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Navigation Header */}
      <div className="profile-nav-header">
        <div className="nav-left">
          <button className="nav-btn back-btn" onClick={goToHomePage}>
            ← Back to Dashboard
          </button>
        </div>

        <div className="nav-center">
          <h1 className="nav-title">👤 User Profile</h1>
        </div>

        <div className="nav-right">
          <span className="user-info">
            {user?.username} ({user?.role})
          </span>
          <button className="nav-btn logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="profile-header">
        <p>Manage your account information and security</p>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <div className="profile-content">
        <div
          className={`profile-card ${activeTab === "reservations" ? "profile-card-wide" : ""}`}
        >
          <div className="profile-avatar">
            <div className="avatar-circle">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <h2>{user?.username || "User"}</h2>
            <span className="user-role">{user?.role || "User"}</span>
          </div>

          <div className="profile-tabs">
            <button
              className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              📝 Profile Information
            </button>
            <button
              className={`tab-btn ${activeTab === "password" ? "active" : ""}`}
              onClick={() => setActiveTab("password")}
            >
              🔒 Change Password
            </button>
            <button
              className={`tab-btn ${activeTab === "reservations" ? "active" : ""}`}
              onClick={() => setActiveTab("reservations")}
            >
              📅 Lịch Sử Đặt Bàn
            </button>
          </div>

          {activeTab === "profile" && (
            // Profile Information Form
            <div className="profile-form">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={!editing}
                  className={editing ? "editable" : "readonly"}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!editing}
                  className={editing ? "editable" : "readonly"}
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!editing}
                  className={editing ? "editable" : "readonly"}
                />
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  disabled={!editing}
                  className={editing ? "editable" : "readonly"}
                />
              </div>

              <div className="form-actions">
                {!editing ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => setEditing(true)}
                  >
                    ✏️ Edit Profile
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button
                      className="btn btn-success"
                      onClick={handleSaveProfile}
                      disabled={updating}
                    >
                      {updating ? "💾 Saving..." : "💾 Save Changes"}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditing(false);
                        // Reset form data
                        setFormData({
                          username: user?.username || "",
                          email: user?.email || "",
                          phone: user?.phone || "",
                          fullName: user?.fullName || "",
                        });
                      }}
                      disabled={updating}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "password" && (
            // Change Password Form
            <div className="password-form">
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter your current password"
                  className="editable"
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password (min 6 characters)"
                  className="editable"
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm your new password"
                  className="editable"
                />
              </div>

              <div className="password-requirements">
                <h4>Password Requirements:</h4>
                <ul>
                  <li
                    className={
                      passwordData.newPassword.length >= 6 ? "valid" : "invalid"
                    }
                  >
                    At least 6 characters long
                  </li>
                  <li
                    className={
                      passwordData.newPassword ===
                        passwordData.confirmPassword && passwordData.newPassword
                        ? "valid"
                        : "invalid"
                    }
                  >
                    Passwords match
                  </li>
                </ul>
              </div>

              <div className="form-actions">
                <div className="edit-actions">
                  <button
                    className="btn btn-warning"
                    onClick={handleChangePassword}
                    disabled={
                      updating ||
                      !passwordData.currentPassword ||
                      !passwordData.newPassword ||
                      passwordData.newPassword !== passwordData.confirmPassword
                    }
                  >
                    {updating ? "🔒 Changing..." : "🔒 Change Password"}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={resetPasswordForm}
                    disabled={updating}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reservations" && (
            // Reservation History
            <div className="reservation-history">
              <h3 className="reservation-history-title">Lịch Sử Đặt Bàn</h3>

              {loadingReservations ? (
                <div className="loading-reservations">
                  <div className="loading-spinner"></div>
                  <p>Đang tải lịch sử đặt bàn...</p>
                </div>
              ) : reservations.length === 0 ? (
                <div className="no-reservations">
                  <FontAwesomeIcon icon={faCalendarAlt} size="3x" />
                  <p>Bạn chưa có lịch sử đặt bàn nào.</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate("/booking")}
                  >
                    Đặt Bàn Ngay
                  </button>
                </div>
              ) : (
                <div className="reservations-table-container">
                  <table className="reservations-table">
                    <thead>
                      <tr className="table-header">
                        <th>PHONE</th>
                        <th>EMAIL</th>
                        <th>NAME</th>
                        <th>DATE</th>
                        <th>TIME</th>
                        <th>GUESTS</th>
                        <th>STATUS</th> {/* ← add this */}
                        <th>ACTION</th> {/* ← add this */}
                      </tr>
                    </thead>
                    <tbody>
                      {reservations.map((reservation) => {
                        const statusBadge = getStatusBadge(reservation.status);
                        return (
                          <tr key={reservation._id} className="table-row">
                            <td>{reservation.phone || "N/A"}</td>
                            <td>{reservation.email || "N/A"}</td>
                            <td>{reservation.name}</td>
                            <td>
                              {formatDateShort(reservation.reservationDate)}
                            </td>
                            <td>{formatTime(reservation.reservationTime)}</td>
                            <td>{reservation.guestCount}</td>
                            <td>
                              <span
                                style={{
                                  color: statusBadge.color,
                                  fontWeight: "bold",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                }}
                              >
                                <FontAwesomeIcon icon={statusBadge.icon} />
                                {statusBadge.text}
                              </span>
                            </td>
                            <td>
                              {canCancelReservation(reservation) ? (
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() =>
                                    handleCancelReservation(
                                      reservation._id,
                                      reservation.name,
                                    )
                                  }
                                  style={{
                                    padding: "5px 12px",
                                    fontSize: "0.85rem",
                                    borderRadius: "4px",
                                    border: "none",
                                    cursor: "pointer",
                                  }}
                                >
                                  Hủy
                                </button>
                              ) : (
                                <span
                                  style={{ color: "#999", fontSize: "0.85rem" }}
                                >
                                  Không thể hủy
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
