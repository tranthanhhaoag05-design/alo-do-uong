import React, { useState, useEffect } from "react";

const STATUS_STYLE = {
  "Hoàn thành": { bg: "#d4f5e9", color: "#0a6e47" },
  "Đang giao": { bg: "#fff0cc", color: "#8a5d00" },
  "Chờ xác nhận": { bg: "#deeeff", color: "#0d4a8a" },
  "Chờ xử lý": { bg: "#deeeff", color: "#0d4a8a" },
  "Đã hủy": { bg: "#ffe0e0", color: "#b02020" },
};

function MiniBarChart({ values, days }) {
  if (!values || values.length === 0) return null;
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80, padding: "8px 0 0" }}>
      {values.map((v, i) => {
        const h = Math.round((v / max) * 72);
        const isToday = i === values.length - 1;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div
              style={{
                width: "100%",
                height: Math.max(h, 4),
                background: isToday ? "#00c896" : "#e0f7f0",
                borderRadius: "4px 4px 0 0",
                transition: "height 0.4s ease",
              }}
            />
            <span style={{ fontSize: 10, color: isToday ? "#00c896" : "#aaa", fontWeight: isToday ? 700 : 400 }}>
              {days[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://alo-do-uong-xzcc.onrender.com/api/dashboard-stats/?store=${localStorage.getItem("store_id")}`)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy thống kê tổng quan:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#8891a4" }}>Đang tải thông tin tổng quan...</div>;
  
  // Kiểm tra an toàn dữ liệu
  if (!stats || stats.error || !stats.metrics) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <div style={{ fontSize: 50, marginBottom: 20 }}>⚠️</div>
        <h2 style={{ color: "#0d1117", marginBottom: 10 }}>Không thể hiển thị dữ liệu</h2>
        <p style={{ color: "#8891a4" }}>{stats?.error || "Dữ liệu không đúng định dạng. Vui lòng thử lại sau."}</p>
        <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: 20, padding: "10px 20px", background: "#00c896", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}
        >
            Tải lại trang
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Metrics row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {stats.metrics.map((m) => (

          <div
            key={m.label}
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "20px 20px 16px",
              border: "1px solid #e8ecf2",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: m.color,
                borderRadius: "14px 14px 0 0",
              }}
            />
            <p style={{ margin: 0, fontSize: 11.5, color: "#8891a4", fontWeight: 600, letterSpacing: "0.4px", textTransform: "uppercase" }}>
              {m.label}
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: "#0d1117", letterSpacing: "-0.5px" }}>
                {m.value}
              </span>
              <span style={{ fontSize: 14, color: "#8891a4" }}>{m.unit}</span>
            </div>
            <div
              style={{
                marginTop: 8,
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                background: m.up ? "#d4f5e9" : "#ffe0e0",
                color: m.up ? "#0a6e47" : "#b02020",
                borderRadius: 20,
                padding: "2px 8px",
                fontSize: 11.5,
                fontWeight: 700,
              }}
            >
              {m.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Middle row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Chart card */}
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: "20px 24px",
            border: "1px solid #e8ecf2",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0d1117" }}>Doanh thu tuần này</p>
              <p style={{ margin: 0, fontSize: 12, color: "#8891a4" }}>Dựa trên các đơn hàng gần nhất</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#0d1117" }}>{(stats.weekly?.total || 0).toLocaleString("vi-VN")}₫</span>
            <span
              style={{
                background: "#d4f5e9",
                color: "#0a6e47",
                borderRadius: 20,
                padding: "2px 8px",
                fontSize: 11.5,
                fontWeight: 700,
              }}
            >
              Tuần qua
            </span>
          </div>
          <MiniBarChart values={stats.weekly?.values || []} days={stats.weekly?.days || []} />

        </div>

        {/* Top products */}
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: "20px 24px",
            border: "1px solid #e8ecf2",
          }}
        >
          <p style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800, color: "#0d1117" }}>Top sản phẩm</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {stats.top_products.map((p, i) => (
              <div key={p.name}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        background: i === 0 ? "#00c896" : i === 1 ? "#f5a623" : "#e8ecf2",
                        color: i < 2 ? "#fff" : "#8891a4",
                        fontSize: 10,
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "#1a202c" }}>{p.name}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "#8891a4", fontWeight: 600 }}>{p.sales}</span>
                </div>
                <div style={{ height: 5, background: "#f4f6fb", borderRadius: 10 }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${p.pct}%`,
                      background: i === 0 ? "#00c896" : i === 1 ? "#f5a623" : "#c3cfe0",
                      borderRadius: 10,
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
              </div>
            ))}
            {stats.top_products.length === 0 && <div style={{ fontSize: 12, color: "#8891a4", textAlign: "center" }}>Chưa có dữ liệu bán hàng.</div>}
          </div>
        </div>
      </div>

      {/* Orders table */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          border: "1px solid #e8ecf2",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #f0f2f8",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0d1117" }}>Đơn hàng gần đây</p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["Mã đơn", "Khách hàng", "Sản phẩm", "SL", "Tổng tiền", "Trạng thái"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 20px",
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: "#8891a4",
                      textAlign: "left",
                      letterSpacing: "0.4px",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recent_orders.map((o, i) => (
                <tr
                  key={o.id}
                  style={{
                    borderTop: "1px solid #f0f2f8",
                    background: i % 2 === 0 ? "#fff" : "#fcfdff",
                    transition: "background 0.15s",
                  }}
                >
                  <td style={{ padding: "13px 20px", fontSize: 13, fontWeight: 700, color: "#2563eb" }}>{o.id}</td>
                  <td style={{ padding: "13px 20px", fontSize: 13, color: "#1a202c", fontWeight: 500 }}>{o.customer}</td>
                  <td style={{ padding: "13px 20px", fontSize: 13, color: "#4a5568" }}>{o.product}</td>
                  <td style={{ padding: "13px 20px", fontSize: 13, color: "#4a5568", textAlign: "center" }}>{o.qty}</td>
                  <td style={{ padding: "13px 20px", fontSize: 13, fontWeight: 700, color: "#0d1117", whiteSpace: "nowrap" }}>{o.total}</td>
                  <td style={{ padding: "13px 20px" }}>
                    <span
                      style={{
                        borderRadius: 20,
                        padding: "3px 10px",
                        fontSize: 11.5,
                        fontWeight: 700,
                        background: STATUS_STYLE[o.status]?.bg || "#eee",
                        color: STATUS_STYLE[o.status]?.color || "#666",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
              {stats.recent_orders.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: 40, textAlign: "center", color: "#8891a4" }}>Chưa có đơn hàng nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
