import React, { useState } from "react";

export default function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Kiểm tra đuôi email
    if (!email.endsWith("@admin.com")) {
      setError("Email đăng nhập Admin phải có đuôi @admin.com");
      return;
    }

    if (isRegister) {
      // Giả lập đăng ký: Lưu vào localStorage
      const users = JSON.parse(localStorage.getItem("admin_users") || "[]");
      if (users.find(u => u.email === email)) {
        setError("Tài khoản này đã tồn tại!");
        return;
      }
      const newUser = { email, password, phone };
      users.push(newUser);
      localStorage.setItem("admin_users", JSON.stringify(users));
      alert("Đăng ký thành công! Hãy đăng nhập.");
      setIsRegister(false);
    } else {
      // Đăng nhập
      const users = JSON.parse(localStorage.getItem("admin_users") || "[]");
      // Mặc định cho phép admin@admin.com / admin123 nếu chưa có user nào
      if (email === "admin@admin.com" && password === "admin123") {
        loginSuccess({ email, phone: "0901234567" });
        return;
      }

      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        loginSuccess(user);
      } else {
        setError("Email hoặc mật khẩu không chính xác!");
      }
    }
  };

  const loginSuccess = (user) => {
    localStorage.setItem("admin_token", "authenticated_token_123");
    localStorage.setItem("admin_user", JSON.stringify(user));
    onLogin(user);
  };

  return (
    <div style={{ 
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", 
      background: "#0d1117", fontFamily: "'Segoe UI', sans-serif" 
    }}>
      <div style={{ 
        width: "100%", maxWidth: 400, padding: 40, background: "#161b22", 
        borderRadius: 20, boxShadow: "0 20px 50px rgba(0,0,0,0.3)", border: "1px solid #30363d" 
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ 
            width: 60, height: 60, background: "linear-gradient(135deg, #00c896 0%, #00a877 100%)",
            borderRadius: 15, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30, margin: "0 auto 16px"
          }}>🧉</div>
          <h2 style={{ color: "#fff", margin: 0, fontSize: 24, fontWeight: 800 }}>Alo Đồ Uống</h2>
          <p style={{ color: "#8b949e", marginTop: 8, fontSize: 14 }}>
            {isRegister ? "Đăng ký tài khoản Admin mới" : "Chào mừng trở lại, Admin!"}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ color: "#c9d1d9", fontSize: 13, fontWeight: 600 }}>Gmail (kết thúc bằng @admin.com)</label>
            <input 
              type="email" required placeholder="example@admin.com" 
              value={email} onChange={e => setEmail(e.target.value)}
              style={{ 
                padding: "12px 16px", borderRadius: 8, border: "1px solid #30363d", 
                background: "#0d1117", color: "#fff", outline: "none", fontSize: 14 
              }} 
            />
          </div>

          {isRegister && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ color: "#c9d1d9", fontSize: 13, fontWeight: 600 }}>Số điện thoại</label>
              <input 
                type="tel" required placeholder="090..." 
                value={phone} onChange={e => setPhone(e.target.value)}
                style={{ 
                  padding: "12px 16px", borderRadius: 8, border: "1px solid #30363d", 
                  background: "#0d1117", color: "#fff", outline: "none", fontSize: 14 
                }} 
              />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ color: "#c9d1d9", fontSize: 13, fontWeight: 600 }}>Mật khẩu</label>
            <input 
              type="password" required placeholder="••••••••" 
              value={password} onChange={e => setPassword(e.target.value)}
              style={{ 
                padding: "12px 16px", borderRadius: 8, border: "1px solid #30363d", 
                background: "#0d1117", color: "#fff", outline: "none", fontSize: 14 
              }} 
            />
          </div>

          {error && <div style={{ color: "#ff7b72", fontSize: 13, textAlign: "center" }}>{error}</div>}

          <button 
            type="submit"
            style={{ 
              padding: "14px", borderRadius: 8, border: "none", background: "#00c896", 
              color: "#0d1117", fontWeight: 800, cursor: "pointer", marginTop: 10, fontSize: 15
            }}
          >
            {isRegister ? "Đăng ký ngay" : "Đăng nhập hệ thống"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 14 }}>
          <span style={{ color: "#8b949e" }}>
            {isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản Admin?"} 
          </span>
          <button 
            onClick={() => setIsRegister(!isRegister)}
            style={{ 
              background: "none", border: "none", color: "#58a6ff", 
              cursor: "pointer", fontWeight: 600, marginLeft: 6 
            }}
          >
            {isRegister ? "Đăng nhập" : "Tạo tài khoản"}
          </button>
        </div>
      </div>
    </div>
  );
}
