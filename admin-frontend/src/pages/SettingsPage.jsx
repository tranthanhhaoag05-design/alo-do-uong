import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";

export default function SettingsPage() {
  const { setStoreName } = useOutletContext();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [openingTime, setOpeningTime] = useState("07:00");
  const [closingTime, setClosingTime] = useState("22:00");
  const [isOpen, setIsOpen] = useState(true);
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/stores/1/") // Giả định ID cửa hàng là 1
      .then(res => res.json())
      .then(data => {
        setName(data.name || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
        setDescription(data.description || "");
        setOpeningTime(data.opening_time?.substring(0, 5) || "07:00");
        setClosingTime(data.closing_time?.substring(0, 5) || "22:00");
        setIsOpen(data.is_active ?? true);
        if (data.qr_payment_url) {
          setQrPreview(data.qr_payment_url);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy thông tin cửa hàng:", err);
        setLoading(false);
      });
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQrFile(file);
      setQrPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("address", address);
    formData.append("description", description);
    formData.append("opening_time", openingTime);
    formData.append("closing_time", closingTime);
    formData.append("is_active", isOpen);
    if (qrFile) {
      formData.append("qr_payment_url", qrFile);
    }

    try {
      const res = await fetch("http://localhost:8000/api/stores/1/", {
        method: "PUT",
        body: formData,
      });

      if (res.ok) {
        setStoreName(name); // Cập nhật tên ở sidebar ngay lập tức
        alert("Cập nhật cài đặt thành công! 🎉");
      } else {
        alert("Có lỗi xảy ra khi lưu!");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ!");
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Đang tải cấu hình...</div>;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h2 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 800, color: "#0d1117" }}>Cài đặt Cửa hàng</h2>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8ecf2", padding: 32 }}>
        <form style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontWeight: 700, fontSize: 14, color: "#1a202c" }}>Tên Cửa Hàng</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #c3cfe0", outline: "none", fontSize: 14 }} 
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontWeight: 700, fontSize: 14, color: "#1a202c" }}>Trạng thái quán</label>
              <select 
                value={isOpen} 
                onChange={e => setIsOpen(e.target.value === "true")}
                style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #c3cfe0", outline: "none", fontSize: 14, background: isOpen ? "#d4f5e9" : "#ffe0e0", color: isOpen ? "#0a6e47" : "#b02020", fontWeight: 700 }}
              >
                <option value="true">Đang Mở Cửa</option>
                <option value="false">Tạm Nghỉ</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontWeight: 700, fontSize: 14, color: "#1a202c" }}>Lời giới thiệu / Tagline</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              placeholder="Ví dụ: Ngon · Nhanh · Tận nơi 🚀"
              style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #c3cfe0", outline: "none", fontSize: 14, minHeight: 80, fontFamily: "inherit" }} 
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontWeight: 700, fontSize: 14, color: "#1a202c" }}>Giờ mở cửa</label>
              <input type="time" value={openingTime} onChange={e => setOpeningTime(e.target.value)} style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #c3cfe0", outline: "none", fontSize: 14 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontWeight: 700, fontSize: 14, color: "#1a202c" }}>Giờ đóng cửa</label>
              <input type="time" value={closingTime} onChange={e => setClosingTime(e.target.value)} style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #c3cfe0", outline: "none", fontSize: 14 }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontWeight: 700, fontSize: 14, color: "#1a202c" }}>SĐT Nhận Đơn (Zalo)</label>
              <input 
                type="text" 
                value={phone} 
                onChange={e => setPhone(e.target.value)}
                style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #c3cfe0", outline: "none", fontSize: 14 }} 
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontWeight: 700, fontSize: 14, color: "#1a202c" }}>Địa chỉ</label>
              <input 
                type="text" 
                value={address} 
                onChange={e => setAddress(e.target.value)}
                style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #c3cfe0", outline: "none", fontSize: 14 }} 
              />
            </div>
          </div>

          <div style={{ borderTop: "1px solid #e8ecf2", paddingTop: 20, marginTop: 10, display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button 
              type="button"
              onClick={handleSave}
              style={{ padding: "12px 32px", borderRadius: 8, border: "none", background: "#00c896", color: "#fff", fontWeight: 700, cursor: "pointer" }}
            >
              Lưu Thay Đổi
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
