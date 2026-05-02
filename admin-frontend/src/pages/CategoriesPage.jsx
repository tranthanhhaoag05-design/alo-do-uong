import React, { useState, useEffect } from "react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const storeId = localStorage.getItem("store_id");
    try {
      const res = await fetch(`https://alo-do-uong-xzcc.onrender.com/api/categories/?store=${storeId}`);
      const data = await res.json();
      setCategories(data);
      setLoading(false);
    } catch (error) {
      console.error("Lỗi lấy danh mục:", error);
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName) return;
    const storeId = localStorage.getItem("store_id");
    
    try {
      const res = await fetch("https://alo-do-uong-xzcc.onrender.com/api/categories/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, store: storeId })
      });
      if (res.ok) {
        setNewName("");
        fetchCategories();
      }
    } catch (error) {
      alert("Lỗi thêm danh mục");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa danh mục này?")) return;
    try {
      await fetch(`https://alo-do-uong-xzcc.onrender.com/api/categories/${id}/`, { method: "DELETE" });
      fetchCategories();
    } catch (error) {
      alert("Lỗi xóa danh mục");
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 800 }}>Quản lý Danh Mục</h2>
      
      {/* Form thêm mới */}
      <div style={{ background: "#fff", padding: 20, borderRadius: 14, border: "1px solid #e8ecf2", marginBottom: 20 }}>
        <form onSubmit={handleAdd} style={{ display: "flex", gap: 10 }}>
          <input 
            type="text" 
            value={newName} 
            onChange={e => setNewName(e.target.value)}
            placeholder="Tên danh mục mới (ví dụ: Trà Trái Cây)"
            style={{ flex: 1, padding: "12px", borderRadius: 8, border: "1px solid #c3cfe0", outline: "none" }}
          />
          <button type="submit" style={{ padding: "0 20px", borderRadius: 8, border: "none", background: "#00c896", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
            Thêm
          </button>
        </form>
      </div>

      {/* Danh sách */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8ecf2", overflow: "hidden" }}>
        {loading ? <div style={{ padding: 20, textAlign: "center" }}>Đang tải...</div> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, color: "#8891a4" }}>Tên Danh Mục</th>
                <th style={{ padding: "12px 20px", textAlign: "right", fontSize: 12, color: "#8891a4" }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id} style={{ borderTop: "1px solid #f0f2f8" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: "14px 20px", textAlign: "right" }}>
                    <button onClick={() => handleDelete(c.id)} style={{ background: "none", border: "none", color: "#e84a5f", cursor: "pointer", fontWeight: 600 }}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {categories.length === 0 && !loading && <div style={{ padding: 30, textAlign: "center", color: "#8891a4" }}>Chưa có danh mục nào</div>}
      </div>
    </div>
  );
}
