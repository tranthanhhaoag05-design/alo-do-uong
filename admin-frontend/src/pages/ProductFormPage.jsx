import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function ProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // Lấy ID từ URL
  
  const [name, setName] = useState("");
  const [category, setCategory] = useState("1"); // ID category mặc định
  const [costPrice, setCostPrice] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [categories, setCategories] = useState([]);

  // Load danh mục
  useEffect(() => {
    fetch(`https://alo-do-uong.onrender.com/api/stores/?store=${localStorage.getItem("store_id")}`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          // Lấy categories của store đầu tiên (id=1)
          fetch(`https://alo-do-uong.onrender.com/api/products/?store=1`) // Giả định store id=1
          // Thực ra nên có API lấy danh mục riêng, nhưng tạm thời dùng mock hoặc fetch từ Product
        }
      });
    
    // FETCH DANH MỤC THẬT (Nếu có API) - Tạm thời tôi sẽ cho phép nhập ID hoặc để mặc định 1
  }, []);

  // Load dữ liệu khi vào trang sửa (Edit mode)
  useEffect(() => {
    if (id) {
      fetch(`https://alo-do-uong.onrender.com/api/products/${id}/`)
        .then(res => res.json())
        .then(product => {
          if (product) {
            setName(product.name);
            setCategory(product.category?.toString() || "1");
            setCostPrice(product.cost_price?.toString() || "");
            setPrice(product.price?.toString() || "");
            setStock(product.stock?.toString() || "0");
            setIsActive(product.is_active);
            if (product.image_url) {
              setPreviewUrl(product.image_url);
            }
          }
        });
    }
  }, [id]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!name || !price || !costPrice) return alert("Vui lòng điền đủ thông tin bắt buộc!");
    
    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", category);
    formData.append("store", 1);
    formData.append("cost_price", costPrice);
    formData.append("price", price);
    formData.append("stock", stock || 0);
    formData.append("is_active", isActive);
    if (imageFile) {
      formData.append("image_url", imageFile);
    }

    try {
      const url = id 
        ? `https://alo-do-uong.onrender.com/api/products/${id}/`
        : `https://alo-do-uong.onrender.com/api/products/`;

      const method = id ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method: method,
        body: formData
      });
      
      if (res.ok) {
        alert("Lưu sản phẩm thành công! 🎉");
        navigate("/products");
      } else {
        const errData = await res.json();
        alert("Lỗi: " + JSON.stringify(errData));
      }
    } catch (error) {
      alert("Lỗi kết nối máy chủ!");
      console.error("Lỗi lưu sản phẩm:", error);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24, gap: 12 }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ background: "#fff", border: "1px solid #e8ecf2", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontWeight: 600 }}
        >
          ← Quay lại
        </button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0d1117" }}>{id ? "Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}</h2>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8ecf2", padding: 32 }}>
        <form style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontWeight: 700, fontSize: 14, color: "#1a202c" }}>Tên sản phẩm *</label>
              <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder="Nhập tên sản phẩm..." style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #c3cfe0", outline: "none", fontSize: 14 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontWeight: 700, fontSize: 14, color: "#1a202c" }}>Danh mục *</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #c3cfe0", outline: "none", fontSize: 14, background: "#fff" }}>
                <option value="1">Trà Sữa</option>
                <option value="2">Cà Phê</option>
                <option value="3">Sinh Tố</option>
                <option value="4">Nước Ép</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontWeight: 700, fontSize: 14, color: "#1a202c" }}>Giá nhập (VNĐ) *</label>
              <input value={costPrice} onChange={e => setCostPrice(e.target.value)} type="number" placeholder="15000" style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #c3cfe0", outline: "none", fontSize: 14 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontWeight: 700, fontSize: 14, color: "#1a202c" }}>Giá bán (VNĐ) *</label>
              <input value={price} onChange={e => setPrice(e.target.value)} type="number" placeholder="25000" style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #c3cfe0", outline: "none", fontSize: 14 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontWeight: 700, fontSize: 14, color: "#1a202c" }}>Tồn kho (Số lượng) *</label>
              <input value={stock} onChange={e => setStock(e.target.value)} type="number" min="1" placeholder="100" style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #c3cfe0", outline: "none", fontSize: 14 }} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontWeight: 700, fontSize: 14, color: "#1a202c" }}>Ảnh Sản Phẩm (Tải lên từ máy)</label>
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ padding: "10px", borderRadius: 8, border: "1px dashed #c3cfe0", outline: "none", fontSize: 14, cursor: "pointer" }} />
            {previewUrl && (
              <div style={{ marginTop: 8, borderRadius: 8, overflow: "hidden", width: 100, height: 100, border: "1px solid #e8ecf2" }}>
                <img src={previewUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
            <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ width: 18, height: 18 }} />
            <label htmlFor="isActive" style={{ fontWeight: 600, fontSize: 14, color: "#1a202c", cursor: "pointer" }}>Đang mở bán</label>
          </div>

          <div style={{ borderTop: "1px solid #e8ecf2", paddingTop: 20, marginTop: 10, display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button 
              type="button"
              onClick={() => navigate(-1)}
              style={{ padding: "12px 24px", borderRadius: 8, border: "1px solid #c3cfe0", background: "#fff", fontWeight: 700, cursor: "pointer" }}
            >
              Hủy bỏ
            </button>
            <button 
              type="button"
              onClick={handleSave}
              style={{ padding: "12px 32px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, cursor: "pointer" }}
            >
              Lưu Sản Phẩm
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
