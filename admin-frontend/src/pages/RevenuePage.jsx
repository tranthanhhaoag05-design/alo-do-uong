import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function RevenuePage() {
  const [timeRange, setTimeRange] = useState("week");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState({
    metrics: [],
    chart_data: [],
    detailed_stats: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [timeRange, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    const storeId = localStorage.getItem("store_id");
    let url = `https://alo-do-uong.onrender.com/api/revenue/?time_range=${timeRange}&store=${storeId}`;
    if (timeRange === "custom" && startDate && endDate) {
      url += `&start_date=${startDate}&end_date=${endDate}`;
    }

    
    try {
      const res = await fetch(url);
      const result = await res.json();
      if (res.ok) {
        setData({
          metrics: result.metrics || [],
          chart_data: result.chart_data || [],
          detailed_stats: result.detailed_stats || []
        });
      }
    } catch (err) {
      console.error("Lỗi lấy dữ liệu doanh thu:", err);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header & Filters */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#0d1117" }}>Báo cáo Doanh thu & Lợi nhuận</h2>
          <p style={{ margin: 0, fontSize: 13, color: "#8891a4" }}>Dữ liệu được cập nhật theo thời gian thực</p>
        </div>
        
        <div style={{ display: "flex", gap: 12, alignItems: "center", background: "#fff", padding: "8px 12px", borderRadius: 10, border: "1px solid #e8ecf2" }}>
          <select 
            value={timeRange}
            onChange={e => setTimeRange(e.target.value)}
            style={{ border: "none", outline: "none", fontSize: 13, fontWeight: 600, color: "#1a202c", cursor: "pointer", background: "transparent" }}
          >
            <option value="today">Hôm nay</option>
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
            <option value="year">Năm nay</option>
            <option value="custom">Tùy chỉnh (Từ ngày - Đến ngày)</option>
          </select>
          {timeRange === "custom" && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", borderLeft: "1px solid #e8ecf2", paddingLeft: 12 }}>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ border: "1px solid #c3cfe0", borderRadius: 6, padding: "4px 8px", fontSize: 12, outline: "none" }} />
              <span style={{ fontSize: 12, color: "#8891a4" }}>-</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ border: "1px solid #c3cfe0", borderRadius: 6, padding: "4px 8px", fontSize: 12, outline: "none" }} />
            </div>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#8891a4", fontWeight: 600 }}>Đang tải dữ liệu...</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {data.metrics.map((m) => (
              <div key={m.label} style={{ background: "#fff", borderRadius: 14, padding: "20px", border: "1px solid #e8ecf2" }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, color: "#8891a4", fontWeight: 600, textTransform: "uppercase" }}>{m.label}</p>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#0d1117" }}>{m.value}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
                  <span style={{ background: m.up ? "#d4f5e9" : "#ffe0e0", color: m.up ? "#0a6e47" : "#b02020", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                    {m.up ? "▲" : "▼"} {m.delta}
                  </span>
                  <span style={{ fontSize: 11, color: "#8891a4", fontWeight: 500 }}>
                    so với {timeRange === "today" ? "hôm qua" : timeRange === "week" ? "tuần trước" : timeRange === "month" ? "tháng trước" : "cùng kỳ"}
                  </span>
                </div>
              </div>
            ))}
          </div>

      {/* Chart */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8ecf2", padding: "24px 24px 16px" }}>
        <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 800, color: "#0d1117" }}>Biểu đồ Lợi nhuận</h3>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={data.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00c896" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00c896" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f2f8" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8891a4" }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8891a4" }} tickFormatter={(val) => `${val / 1000000}M`} />
              <Tooltip 
                contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                formatter={(value) => [`${value.toLocaleString()}₫`, "Lợi nhuận"]}
              />
              <Area type="monotone" dataKey="value" stroke="#00c896" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown Table */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8ecf2", overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f0f2f8" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0d1117" }}>Bảng thống kê chi tiết</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["Ngày", "Doanh thu", "Chi phí vốn", "Lợi nhuận ròng", "Biên lợi nhuận"].map((h) => (
                  <th key={h} style={{ padding: "12px 20px", fontSize: 12, fontWeight: 700, color: "#8891a4", textAlign: "left", textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.detailed_stats.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: "40px", textAlign: "center", color: "#8891a4" }}>Chưa có dữ liệu</td>
                </tr>
              ) : (
                data.detailed_stats.map((row, i) => (
                  <tr key={row.date} style={{ borderTop: "1px solid #f0f2f8" }}>
                    <td style={{ padding: "16px 20px", fontSize: 13, fontWeight: 600, color: "#4a5568" }}>{row.date}</td>
                    <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 800, color: "#0d1117" }}>{row.revenue}</td>
                    <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 600, color: "#e84a5f" }}>{row.cost}</td>
                    <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 800, color: "#00c896" }}>{row.profit}</td>
                    <td style={{ padding: "16px 20px", fontSize: 13, fontWeight: 700, color: "#2563eb" }}>{row.margin}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
