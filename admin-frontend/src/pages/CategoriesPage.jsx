import React, { useState, useEffect } from "react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(true);

  const BASE_URL = "https://alo-do-uong.onrender.com/api/categories/";

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const storeId = localStorage.getItem("store_id");
    if (!storeId) {
      alert("Lỗi: Không tìm thấy ID cửa hàng. Vui lòng đăng xuất và đăng nhập lại!");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}?store=${storeId}`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error("Lỗi lấy danh mục:", error);
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const storeId = localStorage.getItem("store_id");

    if (!storeId) {
      alert("Lỗi: Không tìm thấy ID cửa hàng. Vui lòng ĐĂNG XUẤT và ĐĂNG NHẬP lại!");
      return;
    }

    if (!newName.trim()) {
      alert("Vui lòng nhập tên danh mục!");
      return;
    }

    try {
      const res = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), store: parseInt(storeId) })
      });
      if (res.ok) {
        setNewName("");
        fetchCategories();
      } else {
        const errData = await res.json();
        alert("Lỗi từ máy chủ: " + JSON.stringify(errData));
      }
    } catch (error) {
      alert("❌ Lỗi kết nối máy chủ: " + error.message);
    }

  };


  const handleUpdate = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() })
      });
      if (res.ok) {
        setEditingId(null);
        fetchCategories();
      } else {
        const errData = await res.json();
        alert("❌ Lỗi khi cập nhật: " + JSON.stringify(errData));
      }
    } catch (error) {
      alert("❌ Lỗi kết nối khi cập nhật: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
    try {
      const res = await fetch(`${BASE_URL}${id}/`, { method: "DELETE" });
      if (res.ok) {
        fetchCategories();
      } else {
        alert("❌ Lỗi khi xóa: Không thể xóa danh mục này.");
      }
    } catch (error) {
      alert("❌ Lỗi kết nối khi xóa: " + error.message);
    }
  };


  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "20px" }}>
      <div style={{ marginBottom: 30 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0d1117" }}>Quản lý Danh Mục</h2>
        <p style={{ color: "#8891a4", fontSize: 14 }}>Tạo các nhóm sản phẩm (ví dụ: Cà phê, Trà trái cây...) để khách dễ chọn món.</p>
      </div>

      {/* Form thêm mới */}
      <div style={{ background: "#fff", padding: 24, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", marginBottom: 25, border: "1px solid #e8ecf2" }}>
        <form onSubmit={handleAdd} style={{ display: "flex", gap: 12 }}>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nhập tên danh mục mới... (VD: Sinh Tố)"
            style={{ flex: 1, padding: "14px 18px", borderRadius: 12, border: "2px solid #f0f2f8", outline: "none", fontSize: 15, transition: "border-color 0.2s" }}
          />
          <button type="submit" style={{ padding: "0 28px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #00c896 0%, #00ab80 100%)", color: "#fff", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,200,150,0.2)" }}>
            THÊM NGAY
          </button>
        </form>
      </div>

      {/* Danh sách danh mục */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8ecf2", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#8891a4" }}>Đang tải dữ liệu...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th style={{ padding: "16px 24px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#8891a4", textTransform: "uppercase" }}>Tên Danh Mục</th>
                <th style={{ padding: "16px 24px", textAlign: "right", fontSize: 13, fontWeight: 700, color: "#8891a4", textTransform: "uppercase" }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c, i) => (
                <tr key={c.id} style={{ borderTop: "1px solid #f0f2f8", background: i % 2 === 0 ? "#fff" : "#fcfdff" }}>
                  <td style={{ padding: "18px 24px" }}>
                    {editingId === c.id ? (
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        autoFocus
                        style={{ padding: "8px 12px", borderRadius: 8, border: "2px solid #2563eb", outline: "none", width: "100%" }}
                      />
                    ) : (
                      <span style={{ fontWeight: 700, color: "#1a202c", fontSize: 16 }}>{c.name}</span>
                    )}
                  </td>
                  <td style={{ padding: "18px 24px", textAlign: "right" }}>
                    {editingId === c.id ? (
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button onClick={() => handleUpdate(c.id)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Lưu</button>
                        <button onClick={() => setEditingId(null)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #e8ecf2", background: "#fff", fontWeight: 700, cursor: "pointer" }}>Hủy</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 15, justifyContent: "flex-end" }}>
                        <button onClick={() => { setEditingId(c.id); setEditName(c.name); }} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>Sửa</button>
                        <button onClick={() => handleDelete(c.id)} style={{ background: "none", border: "none", color: "#e84a5f", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>Xóa</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {categories.length === 0 && !loading && (
          <div style={{ padding: 60, textAlign: "center" }}>
            <div style={{ fontSize: 50, marginBottom: 15 }}></div>
            <div style={{ color: "#8891a4", fontWeight: 600 }}>Chưa có danh mục nào. Hãy thêm danh mục đầu tiên nhé!</div>
          </div>
        )}
      </div>

      {/* Debug Info (Dòng này giúp bạn kiểm tra lỗi) */}
      <div style={{ marginTop: 40, padding: 15, background: "#f8fafc", borderRadius: 10, fontSize: 12, color: "#64748b", textAlign: "center", border: "1px dashed #cbd5e1" }}>
        Đang quản lý Cửa hàng ID: <span style={{ fontWeight: 800, color: "#2563eb" }}>{localStorage.getItem("store_id") || "CHƯA CÓ (Hãy đăng nhập lại!)"}</span> | 
        Máy chủ: <span style={{ fontWeight: 600 }}>alo-do-uong.onrender.com</span>
      </div>
    </div>
  );
}

