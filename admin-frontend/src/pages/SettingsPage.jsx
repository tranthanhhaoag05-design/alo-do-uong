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
  const [lat, setLat] = useState(10.762622);
  const [lng, setLng] = useState(106.660172);
  
  // --- 1. THÊM STATE ĐỂ LƯU LINK ẢNH QR ---
  const [qrImage, setQrImage] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [locLoading, setLocLoading] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isTimeOpen = () => {
    const cur = currentTime.getHours() * 60 + currentTime.getMinutes();
    const [oh, om] = (openingTime || "07:00").split(":").map(Number);
    const [ch, cm] = (closingTime || "22:00").split(":").map(Number);
    const openMin = (oh || 0) * 60 + (om || 0);
    const closeMin = (ch || 0) * 60 + (cm || 0);
    
    if (closeMin < openMin) {
        return cur >= openMin || cur < closeMin;
    }
    return cur >= openMin && cur < closeMin;
  };

  const isActuallyOpen = isOpen && isTimeOpen();

  useEffect(() => {
    const storeId = localStorage.getItem("store_id");
    if (!storeId) {
      alert("Không tìm thấy thông tin cửa hàng. Vui lòng đăng nhập lại!");
      setLoading(false);
      return;
    }
    fetch(`https://alo-do-uong.onrender.com/api/stores/${storeId}/`)
      .then(res => res.json())
      .then(data => {
        setName(data.name || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
        setDescription(data.description || "");
        setOpeningTime(data.opening_time?.substring(0, 5) || "07:00");
        setClosingTime(data.closing_time?.substring(0, 5) || "22:00");
        setIsOpen(data.is_active ?? true);
        setLat(data.latitude || 10.762622);
        setLng(data.longitude || 106.660172);
        
        // --- 2. LẤY LINK QR CŨ TỪ BỘ NHỚ LÊN (NẾU CÓ) ---
        // Sếp lưu ý: Phải check xem Backend Sếp đặt tên biến là qr_image hay qr_code nhé!
        setQrImage(data.qr_image || data.qr_code || "");
        
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy thông tin cửa hàng:", err);
        setLoading(false);
      });
  }, []);

  const handleGetLocation = () => {
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocLoading(false);
        alert("Đã xác định vị trí quán thành công! 📍");
      },
      (err) => {
        alert("Không thể lấy vị trí. Hãy bật GPS trên trình duyệt.");
        setLocLoading(false);
      }
    );
  };

  const handleSave = async () => {
    const storeId = localStorage.getItem("store_id");
    const formData = new FormData();
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("address", address);
    formData.append("description", description);
    formData.append("opening_time", openingTime);
    formData.append("closing_time", closingTime);
    formData.append("is_active", isOpen);
    formData.append("latitude", lat);
    formData.append("longitude", lng);
    
    // --- 3. ĐÓNG GÓI LINK QR ĐỂ GỬI LÊN SERVER ---
    // QUAN TRỌNG: Sếp đổi chữ "qr_image" dưới đây cho trùng với tên cột trong Database Django nhé!
    formData.append("qr_image", qrImage);

    try {
      const res = await fetch(`https://alo-do-uong.onrender.com/api/stores/${storeId}/`, {
        method: "PUT",
        body: formData,
      });

      if (res.ok) {
        setStoreName(name);
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

      <div style={{ padding: 18, borderRadius: 12, marginBottom: 24, background: isActuallyOpen ? "#d4f5e9" : "#ffe0e0", border: `2px solid ${isActuallyOpen ? "#00c896" : "#ff4d4f"}` }}>
        <div style={{ fontSize: 13, color: isActuallyOpen ? "#0a6e47" : "#b02020", fontWeight: 700, textTransform: "uppercase" }}>Trạng thái thực tế trên Web Khách lúc này:</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: isActuallyOpen ? "#0a6e47" : "#b02020", marginTop: 4 }}>
          {isActuallyOpen ? "🟢 ĐANG MỞ CỬA NHẬN ĐƠN" : "🔴 ĐÃ ĐÓNG CỬA (Không nhận đơn)"}
        </div>
        {!isActuallyOpen && isOpen && (
            <div style={{ fontSize: 13, marginTop: 8, color: "#b02020", fontWeight: 600 }}>
              * Lý do: Bây giờ là {currentTime.toLocaleTimeString('vi-VN')}, đã ngoài khung giờ hoạt động ({openingTime} - {closingTime}), hệ thống tự động chốt đơn nghỉ.
            </div>
        )}
        {!isActuallyOpen && !isOpen && (
            <div style={{ fontSize: 13, marginTop: 8, color: "#b02020", fontWeight: 600 }}>* Lý do: Quán đang tắt công tắc trạng thái bên dưới.</div>
        )}
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8ecf2", padding: 32, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        <form style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontWeight: 700, fontSize: 14, color: "#1a202c" }}>Tên Cửa Hàng</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #c3cfe0", outline: "none" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontWeight: 700, fontSize: 14, color: "#1a202c" }}>Trạng thái</label>
              <select value={isOpen} onChange={e => setIsOpen(e.target.value === "true")} style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #c3cfe0", background: isOpen ? "#d4f5e9" : "#ffe0e0", color: isOpen ? "#0a6e47" : "#b02020", fontWeight: 700 }}>
                <option value="true">Đang Mở Cửa</option>
                <option value="false">Tạm Nghỉ</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontWeight: 700, fontSize: 14, color: "#1a202c" }}>Lời giới thiệu / Tagline</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Ngon · Nhanh · Tận nơi 🚀" style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #c3cfe0", minHeight: 60, fontFamily: "inherit" }} />
          </div>

          {/* --- 4. GIAO DIỆN NHẬP LINK QR VÀ XEM TRƯỚC --- */}
          <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px dashed #cbd5e1" }}>
            <label style={{ fontWeight: 700, fontSize: 14, color: "#1a202c", display: "block", marginBottom: 8 }}>Mã QR Thanh Toán (Chuyển khoản)</label>
            <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>Upload ảnh mã QR của bạn lên Postimages.org rồi copy "Liên kết trực tiếp" (.jpg/.png) dán vào đây.</p>
            <input 
              type="text" 
              value={qrImage} 
              onChange={e => setQrImage(e.target.value)} 
              placeholder="Ví dụ: https://i.postimg.cc/xxx/momo.jpg"
              style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "1px solid #c3cfe0", marginBottom: 12 }} 
            />
            {/* Khung xem trước (Preview) */}
            {qrImage && (
              <div style={{ textAlign: "center", padding: 10, background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#10b981", marginBottom: 8 }}>✅ Hình ảnh hợp lệ (Xem trước):</p>
                <img src={qrImage} alt="QR Preview" style={{ maxWidth: 150, height: "auto", borderRadius: 8, boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }} />
              </div>
            )}
          </div>
          {/* ------------------------------------------- */}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontWeight: 700, fontSize: 14, color: "#1a202c" }}>Giờ mở cửa</label>
              <input type="time" value={openingTime} onChange={e => setOpeningTime(e.target.value)} style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #c3cfe0" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontWeight: 700, fontSize: 14, color: "#1a202c" }}>Giờ đóng cửa</label>
              <input type="time" value={closingTime} onChange={e => setClosingTime(e.target.value)} style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #c3cfe0" }} />
            </div>
          </div>

          <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <label style={{ fontWeight: 700, fontSize: 14, color: "#1a202c", display: "block", marginBottom: 12 }}>Định vị quán (Để tính phí ship tự động)</label>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>VĨ ĐỘ</span>
                <input type="text" value={lat} readOnly style={{ width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", fontSize: 13 }} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>KINH ĐỘ</span>
                <input type="text" value={lng} readOnly style={{ width: "100%", padding: "10px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", fontSize: 13 }} />
              </div>
              <button type="button" onClick={handleGetLocation} disabled={locLoading} style={{ alignSelf: "flex-end", padding: "10px 16px", borderRadius: 6, border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                {locLoading ? "Đang lấy..." : "📍 Lấy vị trí GPS"}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontWeight: 700, fontSize: 14, color: "#1a202c" }}>SĐT Nhận Đơn</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #c3cfe0" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontWeight: 700, fontSize: 14, color: "#1a202c" }}>Địa chỉ hiển thị</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #c3cfe0" }} />
            </div>
          </div>

          <button type="button" onClick={handleSave} style={{ marginTop: 10, padding: "16px", borderRadius: 8, border: "none", background: "#00c896", color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,200,150,0.2)" }}>
            CẬP NHẬT CÀI ĐẶT
          </button>

        </form>
      </div>
    </div>
  );
}