import React, { useState, useEffect } from "react";

const STATUS_OPTIONS = ["Chờ xử lý", "Chờ xác nhận", "Đang xử lý", "Đang giao", "Hoàn thành", "Đã hủy"];

const STATUS_STYLE = {
  "Chờ xử lý": { bg: "#deeeff", color: "#0d4a8a" },
  "Chờ xác nhận": { bg: "#deeeff", color: "#0d4a8a" },
  "Đang xử lý": { bg: "#f3e8ff", color: "#6b21a8" },
  "Đang giao": { bg: "#fff0cc", color: "#8a5d00" },
  "Hoàn thành": { bg: "#d4f5e9", color: "#0a6e47" },
  "Đã hủy": { bg: "#ffe0e0", color: "#b02020" },
};


export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("Tất cả");

  useEffect(() => {
    fetchOrders();
    // Auto refresh orders every 5 seconds to get new ones
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`https://alo-do-uong.onrender.com/api/orders/?store=${localStorage.getItem("store_id")}`);
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Lỗi khi tải đơn hàng:", error);
    }
  };

  const updateStatus = async (id, newStatus) => {
    // Functional update to avoid stale state
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    
    // API call
    try {
      const res = await fetch(`https://alo-do-uong.onrender.com/api/orders/${id}/status/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Update failed");
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
      alert("⚠️ Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại!");
      fetchOrders(); // Revert on failure
    }
  };

  const filteredOrders = filter === "Tất cả" ? orders : orders.filter(o => o.status === filter);

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8ecf2", overflow: "hidden" }}>
      {/* Header & Filters */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0f2f8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0d1117" }}>Quản lý Đơn hàng</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e8ecf2", outline: "none", fontWeight: 600, color: "#4a5568", background: "#f9fafb" }}
          >
            <option value="Tất cả">Lọc trạng thái: Tất cả</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              {["Mã Đơn", "Ngày Đặt", "Khách Hàng", "SĐT", "Sản Phẩm", "Tổng Tiền", "Trạng Thái", "Thao Tác"].map((h) => (
                <th key={h} style={{ padding: "14px 20px", fontSize: 12, fontWeight: 700, color: "#8891a4", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((o, i) => (
              <tr key={o.id} style={{ borderTop: "1px solid #f0f2f8", background: i % 2 === 0 ? "#fff" : "#fcfdff" }}>
                <td style={{ padding: "16px 20px", fontSize: 13, fontWeight: 800, color: "#2563eb" }}>#{o.order_code || o.id}</td>
                <td style={{ padding: "16px 20px", fontSize: 13, color: "#4a5568" }}>{new Date(o.created_at).toLocaleString('vi-VN')}</td>
                <td style={{ padding: "16px 20px", fontSize: 13, fontWeight: 600, color: "#1a202c" }}>{o.customer_name}</td>
                <td style={{ padding: "16px 20px", fontSize: 13, color: "#4a5568" }}>{o.customer_phone}</td>
                <td style={{ padding: "16px 20px", fontSize: 13, color: "#4a5568" }}>
                  {o.items?.map(item => `${item.product_name} x${item.quantity}`).join(", ")}
                </td>
                <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 800, color: "#0d1117" }}>{o.total_price?.toLocaleString()}₫</td>
                <td style={{ padding: "16px 20px" }}>
                  <span style={{ borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700, background: STATUS_STYLE[o.status]?.bg, color: STATUS_STYLE[o.status]?.color, whiteSpace: "nowrap" }}>
                    {o.status}
                  </span>
                </td>
                <td style={{ padding: "16px 20px" }}>
                  <select 
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #e8ecf2", outline: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", background: "#fff" }}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredOrders.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", color: "#8891a4", fontWeight: 500 }}>
            Không tìm thấy đơn hàng nào!
          </div>
        )}
      </div>
    </div>
  );
}
