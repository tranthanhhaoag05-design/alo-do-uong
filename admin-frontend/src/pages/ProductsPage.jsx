import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("https://alo-do-uong.onrender.com/api/products/");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Lỗi lấy sản phẩm:", error);
    }
  };

  const getStatusBadge = (stock) => {
    if (stock <= 0) return <span style={{ borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700, background: "#ffe0e0", color: "#b02020" }}>Hết hàng</span>;
    if (stock < 10) return <span style={{ borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700, background: "#fff0cc", color: "#8a5d00" }}>Sắp hết</span>;
    return <span style={{ borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700, background: "#d4f5e9", color: "#0a6e47" }}>Đang bán</span>;
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này không?")) return;
    try {
      const res = await fetch(`https://alo-do-uong.onrender.com/api/products/${id}/`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchProducts();
      } else {
        alert("Xóa sản phẩm thất bại!");
      }
    } catch (error) {
      console.error("Lỗi xóa sản phẩm:", error);
    }
  };

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8ecf2", overflow: "hidden" }}>
      {/* Header & Actions */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0f2f8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0d1117" }}>Danh sách Sản Phẩm</h2>
        <div style={{ display: "flex", gap: 12 }}>
          <Link to="/products/new" style={{ textDecoration: "none", padding: "10px 16px", borderRadius: 8, background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: 14 }}>
            + Thêm Sản Phẩm Mới
          </Link>
        </div>
      </div>

      {/* Table */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f9fafb" }}>
            {["Mã SP", "Tên Sản Phẩm", "Danh Mục", "Giá Nhập", "Giá Bán", "Tồn Kho", "Trạng Thái", "Thao Tác"].map((h) => (
              <th key={h} style={{ padding: "14px 20px", fontSize: 12, fontWeight: 700, color: "#8891a4", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => (
            <tr key={p.id} style={{ borderTop: "1px solid #f0f2f8", background: i % 2 === 0 ? "#fff" : "#fcfdff" }}>
              <td style={{ padding: "16px 20px", fontSize: 13, fontWeight: 700, color: "#8891a4" }}>P{String(p.id).padStart(3, '0')}</td>
              <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 800, color: "#0d1117" }}>{p.name}</td>
              <td style={{ padding: "16px 20px", fontSize: 13, color: "#4a5568", fontWeight: 600 }}>{p.category_name || "Trà Sữa"}</td>
              <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 800, color: "#e84a5f" }}>{p.cost_price?.toLocaleString()}₫</td>
              <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 800, color: "#2563eb" }}>{p.price?.toLocaleString()}₫</td>
              <td style={{ padding: "16px 20px", fontSize: 13, color: "#4a5568", fontWeight: 700 }}>{p.stock}</td>
              <td style={{ padding: "16px 20px" }}>{getStatusBadge(p.stock)}</td>
              <td style={{ padding: "16px 20px" }}>
                <Link to={`/products/${p.id}`} style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none", marginRight: 12 }}>Sửa</Link>
                <button onClick={() => handleDelete(p.id)} style={{ color: "#e84a5f", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {products.length === 0 && (
        <div style={{ padding: "40px", textAlign: "center", color: "#8891a4", fontWeight: 500 }}>
          Chưa có sản phẩm nào!
        </div>
      )}
    </div>
  );
}
