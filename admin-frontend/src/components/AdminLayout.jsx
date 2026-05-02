import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { id: "/", label: "Tổng quan", icon: "⬛" },
  { id: "/orders", label: "Đơn hàng", icon: "📋" },
  { id: "/products", label: "Sản phẩm", icon: "🧃" },
  { id: "/customers", label: "Khách hàng", icon: "👤" },
  { id: "/revenue", label: "Doanh thu", icon: "📈" },

  { id: "/settings", label: "Cài đặt", icon: "⚙️" },
];

function Sidebar({ collapsed, setCollapsed, storeName }) {
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    window.location.reload(); // Refresh to trigger redirect to login
  };

  return (
    <aside
      style={{
        width: collapsed ? 64 : 220,
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "#0d1117",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s cubic-bezier(.4,0,.2,1)",
        overflow: "hidden",
        flexShrink: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? "24px 0" : "24px 20px",
          borderBottom: "1px solid #1e2531",
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg, #00c896 0%, #00a877 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: 18,
            marginLeft: collapsed ? "auto" : 0,
            marginRight: collapsed ? "auto" : 0,
          }}
        >
          🧉
        </div>
        {!collapsed && (
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, letterSpacing: "-0.3px" }}>
              {storeName}
            </div>
            <div style={{ color: "#4a9e80", fontSize: 10, letterSpacing: "0.8px", textTransform: "uppercase", fontWeight: 600 }}>
              Admin Panel
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.id;
          return (
            <Link
              key={item.id}
              to={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: collapsed ? "10px 0" : "10px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                background: isActive ? "#00c896" : "transparent",
                color: isActive ? "#0d1117" : "#8891a4",
                fontWeight: isActive ? 700 : 400,
                fontSize: 13.5,
                textDecoration: "none",
                transition: "all 0.15s",
                width: "100%",
                whiteSpace: "nowrap",
                position: "relative",
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge && (
                <span
                  style={{
                    marginLeft: "auto",
                    background: isActive ? "#0d1117" : "#00c896",
                    color: isActive ? "#00c896" : "#0d1117",
                    fontSize: 10,
                    fontWeight: 800,
                    borderRadius: 20,
                    padding: "1px 7px",
                    minWidth: 20,
                    textAlign: "center",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User with Logout Menu */}
      <div style={{ position: "relative" }}>
        {showMenu && (
          <div 
            style={{
              position: "absolute",
              bottom: "calc(100% + 10px)",
              left: 10,
              right: 10,
              background: "rgba(22, 27, 34, 0.95)",
              backdropFilter: "blur(10px)",
              border: "1px solid #30363d",
              borderRadius: 12,
              padding: "8px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              zIndex: 200,
            }}
          >
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "10px",
                textAlign: "left",
                background: "transparent",
                border: "none",
                color: "#ff7b72",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 10,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 123, 114, 0.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span>🚪</span> Đăng xuất
            </button>
          </div>
        )}

        <div
          onClick={() => setShowMenu(!showMenu)}
          style={{
            padding: collapsed ? "16px 0" : "16px 16px",
            borderTop: "1px solid #1e2531",
            display: "flex",
            alignItems: "center",
            gap: 10,
            justifyContent: collapsed ? "center" : "flex-start",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#161b22")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #4f9cf9, #2563eb)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            AD
          </div>
          {!collapsed && (
            <div style={{ flex: 1 }}>
              <div style={{ color: "#e6eaf3", fontSize: 12.5, fontWeight: 600 }}>Admin chính</div>
              <div style={{ color: "#4a5568", fontSize: 11 }}>Quản lý hệ thống</div>
            </div>
          )}
          {!collapsed && (
            <span style={{ color: "#8891a4", fontSize: 10 }}>{showMenu ? "▼" : "▲"}</span>
          )}
        </div>
      </div>
    </aside>
  );
}


export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [storeName, setStoreName] = useState("Alo Đồ Uống");

  useEffect(() => {
    fetch("https://alo-do-uong.onrender.com/api/stores/1/")
      .then(res => res.json())
      .then(data => {
        if (data.name) setStoreName(data.name);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f4f6fb",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} storeName={storeName} />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>


        {/* Content Area */}
        <div style={{ padding: "24px 28px", flex: 1, overflowY: "auto" }}>
          <Outlet context={{ storeName, setStoreName }} />
        </div>
      </main>
    </div>
  );
}
