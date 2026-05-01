import React, { useState, useEffect } from "react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/customers/")
      .then(res => res.json())
      .then(data => {
        setCustomers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy danh sách khách hàng:", err);
        setLoading(false);
      });
  }, []);

  const fmt = (n) => n?.toLocaleString("vi-VN") + "₫";

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#8891a4" }}>Đang tải dữ liệu khách hàng...</div>;

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8ecf2", overflow: "hidden" }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0f2f8" }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0d1117" }}>Khách Hàng Thân Thiết</h2>
        <p style={{ margin: 0, fontSize: 13, color: "#8891a4", marginTop: 4 }}>Dữ liệu tự động thu thập từ SĐT khách đặt hàng.</p>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              {["Tên Khách Hàng", "Số Điện Thoại", "Địa Chỉ", "Số Đơn", "Tổng Chi Tiêu", "Ngày Đơn Cuối"].map((h) => (
                <th key={h} style={{ padding: "14px 20px", fontSize: 12, fontWeight: 700, color: "#8891a4", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.map((c, i) => (
              <tr key={c.id} style={{ borderTop: "1px solid #f0f2f8", background: i % 2 === 0 ? "#fff" : "#fcfdff" }}>
                <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 800, color: "#0d1117" }}>{c.name}</td>
                <td style={{ padding: "16px 20px", fontSize: 13, color: "#4a5568", fontWeight: 600 }}>{c.phone}</td>
                <td style={{ padding: "16px 20px", fontSize: 13, color: "#8891a4", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.address || "---"}</td>
                <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 800, color: "#2563eb" }}>{c.total_orders} đơn</td>
                <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 800, color: "#00c896" }}>{fmt(c.total_spent)}</td>
                <td style={{ padding: "16px 20px", fontSize: 13, color: "#8891a4" }}>
                  {new Date(c.last_order_date).toLocaleDateString("vi-VN")}
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: 40, textAlign: "center", color: "#8891a4" }}>Chưa có dữ liệu khách hàng.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
