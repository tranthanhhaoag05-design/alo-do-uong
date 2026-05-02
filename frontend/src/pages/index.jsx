import { useState, useEffect, useRef } from "react";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 1, icon: "🧋", label: "Trà Sữa" },
  { id: 2, icon: "☕", label: "Cà Phê" },
  { id: 3, icon: "🥤", label: "Sinh Tố" },
  { id: 4, icon: "🍦", label: "Nước Ép" },

];


const NOTE_SUGGESTIONS = ["ít đá", "không đá", "nhiều đá", "ít ngọt", "không ngọt", "thêm đường", "không topping", "thêm trân châu"];

const MIN_ORDER = 5;
const fmt = (n) => n?.toLocaleString("vi-VN") + "đ";

// ─── CSS IN JS / GLOBAL STYLES ────────────────────────────────────────────────
const G = "linear-gradient(135deg, #00E5FF 0%, #2979FF 100%)";
const G_SOFT = "linear-gradient(135deg, #e0f7fa 0%, #e3f0ff 100%)";

const globalStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Baloo 2', sans-serif;
    background: #f5f7fa;
    -webkit-tap-highlight-color: transparent;
    overscroll-behavior: none;
  }

  :root {
    --accent: #2979FF;
    --accent2: #00E5FF;
    --grad: ${G};
    --white: #ffffff;
    --bg: #f5f7fa;
    --text: #1a1a2e;
    --muted: #8892a4;
    --card: #ffffff;
    --border: #e8ecf4;
    --danger: #ff4757;
    --safe-bottom: env(safe-area-inset-bottom, 16px);
  }

  .app-shell {
    width: 100%;
    max-width: 1500px;
    margin: 0 auto;
    min-height: 100dvh;
    background: var(--bg);
    position: relative;
    overflow-x: hidden;
  }
    .products-grid {
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(2, 1fr); 
  }
    @media (min-width: 768px) {
    .products-grid {
      grid-template-columns: repeat(4, 1fr); 
      gap: 30px;
    }
    
    .app-shell {
      padding: 0 20px; /* Thêm lề hai bên cho Laptop */
    }
  }

  /* Splash */
  @keyframes zoomIn {
    0% { transform: scale(0.3); opacity: 0; }
    60% { transform: scale(1.08); opacity: 1; }
    100% { transform: scale(1); }
  }
  @keyframes fadeUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes pulse-dot {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40% { transform: scale(1); opacity: 1; }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes bounceIn {
    0% { transform: scale(0); }
    50% { transform: scale(1.15); }
    100% { transform: scale(1); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .splash-logo { animation: zoomIn 0.8s cubic-bezier(.36,.07,.19,.97) both; }
  .splash-text { animation: fadeUp 0.6s 0.5s ease both; }
  .splash-tagline { animation: fadeUp 0.6s 0.7s ease both; }

  .dot-loader span {
    display: inline-block;
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--grad);
    animation: pulse-dot 1.4s ease infinite;
  }
  .dot-loader span:nth-child(2) { animation-delay: 0.2s; }
  .dot-loader span:nth-child(3) { animation-delay: 0.4s; }

  .page-enter { animation: slideIn 0.3s ease both; }

  /* Scrollbar hide */
  .no-scroll::-webkit-scrollbar { display: none; }
  .no-scroll { -ms-overflow-style: none; scrollbar-width: none; }

  /* Bottom Nav */
  .bottom-nav {
    position: fixed;
    bottom: 0; 
    left: 50%;
    transform: translateX(-50%);
    width: 100%; 
    max-width: 1450px;
    
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(20px);
    border-top: 1px solid var(--border);
    display: flex;
    padding-bottom: var(--safe-bottom);
    z-index: 100;
    transition: max-width 0.3s ease;
  }
  @media (min-width: 1001px) {
    .bottom-nav {
      border-left: 1px solid var(--border);
      border-right: 1px solid var(--border);
      border-radius: 20px 20px 0 0;
    }
  }

  .nav-item {
    flex: 1;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 10px 0 6px;
    border: none; background: none; cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }

  .nav-item.active .nav-icon {
    background: var(--grad);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .nav-item.active .nav-label {
    background: var(--grad);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 700;
  }

  .nav-icon { font-size: 22px; line-height: 1; transition: transform 0.2s; }
  .nav-item.active .nav-icon { transform: translateY(-2px) scale(1.1); }
  .nav-label { font-family: 'Baloo 2', sans-serif; font-size: 10px; font-weight: 600; color: var(--muted); margin-top: 2px; }

  .cart-badge {
    position: absolute;
    top: 6px; right: calc(50% - 18px);
    background: var(--grad);
    color: white;
    font-size: 9px; font-weight: 800;
    width: 16px; height: 16px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    animation: bounceIn 0.3s ease;
  }

  /* Cards */
  .product-card {
    background: var(--card);
    border-radius: 20px;
    box-shadow: 0 2px 12px rgba(41,121,255,0.08);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
    cursor: pointer;
  }
  .product-card:active { transform: scale(0.97); box-shadow: 0 1px 6px rgba(41,121,255,0.12); }

  .btn-grad {
    background: var(--grad);
    color: white;
    border: none;
    border-radius: 50px;
    font-family: 'Baloo 2', sans-serif;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.3px;
  }
  .btn-grad:active { transform: scale(0.96); filter: brightness(1.1); }

  .btn-outline {
    background: transparent;
    color: var(--accent);
    border: 2px solid var(--accent);
    border-radius: 50px;
    font-family: 'Baloo 2', sans-serif;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .input-field {
    width: 100%;
    border: 2px solid var(--border);
    border-radius: 14px;
    padding: 12px 16px;
    font-family: 'Baloo 2', sans-serif;
    font-size: 15px;
    color: var(--text);
    background: white;
    outline: none;
    transition: border-color 0.2s;
  }
  .input-field:focus { border-color: var(--accent2); }

  .section-title {
    font-size: 18px; font-weight: 800;
    color: var(--text);
    letter-spacing: -0.3px;
  }

  .grad-text {
    background: var(--grad);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .tag-pill {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 6px 14px;
    border-radius: 50px;
    font-family: 'Baloo 2', sans-serif;
    font-size: 13px; font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }

  .warning-box {
    background: #fff3cd;
    border: 1.5px solid #ffc107;
    border-radius: 14px;
    padding: 12px 16px;
    font-size: 14px; font-weight: 600;
    color: #856404;
    display: flex; align-items: center; gap: 8px;
  }

  .history-card {
    background: white;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    margin-bottom: 12px;
  }

  .status-badge {
    padding: 4px 12px;
    border-radius: 50px;
    font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.5px;
  }

  .qty-btn {
    width: 30px; height: 30px;
    border-radius: 50%;
    border: none;
    font-size: 18px; font-weight: 700;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }

  .toast {
    position: fixed;
    top: 20px; left: 50%;
    transform: translateX(-50%);
    background: rgba(30,30,50,0.92);
    color: white;
    padding: 10px 20px;
    border-radius: 50px;
    font-size: 14px; font-weight: 600;
    z-index: 999;
    animation: fadeUp 0.3s ease both;
    white-space: nowrap;
    backdrop-filter: blur(10px);
  }

  /* Scrollable content with bottom nav space */
  .page-content {
    padding-bottom: calc(100px + var(--safe-bottom));
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }
`;

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ msg }) {
  if (!msg) return null;
  return <div className="toast">{msg}</div>;
}

// ─── SPLASH PAGE ──────────────────────────────────────────────────────────────
function SplashPage({ storeName, tagline }) {
  return (
    <div style={{
      minHeight: "100dvh",
      background: G,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 0,
    }}>
      <div className="splash-logo" style={{ marginBottom: 24 }}>
        <div style={{
          width: 110, height: 110,
          background: "rgba(255,255,255,0.18)",
          borderRadius: 32,
          backdropFilter: "blur(10px)",
          border: "2px solid rgba(255,255,255,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 52,
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        }}>🧋</div>
      </div>

      <div className="splash-text" style={{ textAlign: "center" }}>
        <div style={{
          fontSize: 34, fontWeight: 800, color: "white",
          letterSpacing: "-1px", lineHeight: 1.1,
          textShadow: "0 2px 12px rgba(0,0,0,0.15)",
        }}>
          {storeName}
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 6, fontWeight: 500 }}>
          {tagline || "Ngon · Nhanh · Tận nơi 🚀"}
        </div>
      </div>

      <div className="splash-tagline dot-loader" style={{
        marginTop: 60, display: "flex", gap: 6,
      }}>
        <span /><span /><span />
      </div>
    </div>
  );
}

function HomePage({ cart, setCart, setToast, setPage, storeName, storeData, isOpen }) {
  const [activeCat, setActiveCat] = useState(0);
  const [address, setAddress] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("https://alo-do-uong.onrender.com/api/products/?active=true")
      .then(r => r.json())
      .then(data => setProducts(data))
      .catch(e => console.error(e));
  }, []);

  const filtered = activeCat === 0 ? products : products.filter(p => p.category === activeCat);

  const addToCart = (product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          setToast(`Kho chỉ còn ${product.stock} ly!`);
          return prev;
        }
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1, note: "" }];
    });
    setToast(`Đã thêm ${product.name} 🎉`);
    setPage("cart"); // Tự động chuyển sang trang giỏ hàng
  };

  const getLocation = () => {
    setLocLoading(true);
    navigator?.geolocation?.getCurrentPosition(
      (pos) => {
        setAddress(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setLocLoading(false);
      },
      () => {
        setAddress("Không thể lấy vị trí");
        setLocLoading(false);
      }
    );
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="page-content page-enter">
      {/* Header */}
      <div style={{ padding: "20px 16px 0", background: "white", borderRadius: "0 0 24px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>Xin chào 👋</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 8 }}>
              {storeName}
              <span style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 20,
                background: isOpen ? "#d4f5e9" : "#ffe0e0",
                color: isOpen ? "#0a6e47" : "#b02020",
                fontWeight: 800, textTransform: "uppercase"
              }}>
                {isOpen ? "Đang mở" : "Tạm nghỉ"}
              </span>
            </div>
          </div>
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: G_SOFT,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22,
          }}>🧋</div>
        </div>

        {/* Address Input */}
        <div style={{
          background: "var(--bg)",
          borderRadius: 18,
          padding: "6px 6px 6px 14px",
          display: "flex", alignItems: "center", gap: 8,
          marginBottom: 16,
          border: "1.5px solid var(--border)",
        }}>
          <span style={{ fontSize: 18 }}>📍</span>
          <input
            className="input-field"
            style={{ border: "none", background: "transparent", padding: "6px 0", flex: 1, fontSize: 13 }}
            placeholder="Nhập địa chỉ giao hàng..."
            value={address}
            onChange={e => setAddress(e.target.value)}
          />
          <button
            className="btn-grad"
            style={{ padding: "8px 14px", fontSize: 12, flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}
            onClick={getLocation}
            disabled={locLoading}
          >
            {locLoading ? <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span> : "📡"}
            {locLoading ? "Đang lấy..." : "GPS"}
          </button>
        </div>

        {/* Banner */}
        <div style={{
          background: G,
          borderRadius: 18, padding: "14px 18px",
          marginBottom: 16,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 500 }}>Khuyến mãi hôm nay</div>
            <div style={{ color: "white", fontSize: 16, fontWeight: 800, marginTop: 2 }}>Đặt 10 ly, tặng 1 ly! 🎁</div>
          </div>
          <div style={{ fontSize: 40 }}>🎊</div>
        </div>

        {/* Categories */}
        <div style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 10, fontSize: 15 }}>Danh mục</div>
          <div className="no-scroll" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            <button
              className="tag-pill"
              style={{
                background: activeCat === 0 ? G : "var(--bg)",
                color: activeCat === 0 ? "white" : "var(--text)",
                border: activeCat === 0 ? "none" : "1.5px solid var(--border)",
              }}
              onClick={() => setActiveCat(0)}
            >
              🌟 Tất cả
            </button>
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                className="tag-pill"
                style={{
                  background: activeCat === c.id ? G : "var(--bg)",
                  color: activeCat === c.id ? "white" : "var(--text)",
                  border: activeCat === c.id ? "none" : "1.5px solid var(--border)",
                }}
                onClick={() => setActiveCat(c.id)}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="products-grid">
        {filtered.map(p => {
          const inCart = cart.find(i => i.id === p.id);
          return (
            <div key={p.id} className="product-card">
              <div style={{
                height: 140, // Tăng chiều cao ảnh lên một chút cho Laptop đẹp hơn
                background: G_SOFT,
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", // Để ảnh không tràn khỏi card
                position: "relative",
              }}>
                <img
                  src={p.image_url || "https://via.placeholder.com/150?text=Drink"}
                  alt={p.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", opacity: p.stock <= 0 ? 0.4 : 1 }}
                  onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=Drink'}
                />
                {p.stock <= 0 && (
                  <div style={{ position: "absolute", background: "rgba(0,0,0,0.6)", color: "white", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 800 }}>HẾT HÀNG</div>
                )}
                {inCart && (
                  <div style={{
                    position: "absolute", top: 8, right: 8,
                    background: G, color: "white",
                    width: 24, height: 24, borderRadius: "50%",
                    fontSize: 12, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                  }}>{inCart.qty}</div>
                )}
              </div>
              <div style={{ padding: "12px" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4, lineHeight: 1.2 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500, marginBottom: 10, height: "16px", overflow: "hidden" }}>{p.category_name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: p.stock <= 0 ? "var(--muted)" : "var(--accent)" }} className={p.stock > 0 ? "grad-text" : ""}>{fmt(p.price)}</div>
                  <button
                    className="btn-grad"
                    style={{ width: 32, height: 32, fontSize: 20, lineHeight: 1, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: p.stock <= 0 ? "#e8ecf4" : G, color: p.stock <= 0 ? "#a0aabf" : "white", cursor: p.stock <= 0 ? "not-allowed" : "pointer" }}
                    onClick={() => addToCart(p)}
                    disabled={p.stock <= 0}
                  >+</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CART PAGE ────────────────────────────────────────────────────────────────
function CartPage({ cart, setCart, setPage, setToast }) {
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.qty * i.price, 0);

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));
  };

  const updateNote = (id, note) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, note } : i));
  };

  const addSuggestion = (id, s) => {
    setCart(prev => prev.map(i => {
      if (i.id !== id) return i;
      const cur = i.note || "";
      if (cur.includes(s)) {
        const updatedNote = cur
          .split(", ")
          .filter(part => part !== s)
          .join(", ");
        return { ...i, note: updatedNote };
      }
      return { ...i, note: cur ? cur + ", " + s : s };
    }));
  };

  if (cart.length === 0) return (
    <div className="page-content page-enter" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ fontSize: 80, marginBottom: 16 }}>🛒</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Giỏ hàng trống</div>
      <div style={{ fontSize: 14, color: "var(--muted)", textAlign: "center" }}>Thêm món vào giỏ hàng để bắt đầu đặt nhé!</div>
    </div>
  );

  return (
    <div className="page-content page-enter" style={{ padding: "20px 16px 0" }}>
      <div className="section-title" style={{ marginBottom: 16 }}>🛒 Giỏ hàng <span style={{ fontSize: 14, color: "var(--muted)", fontWeight: 600 }}>({totalQty} ly)</span></div>

      {totalQty < MIN_ORDER && (
        <div className="warning-box" style={{ marginBottom: 14 }}>
          ⚠️ Cần tối thiểu {MIN_ORDER} ly để đặt đơn. Còn thiếu {MIN_ORDER - totalQty} ly nữa!
        </div>
      )}

      {cart.map(item => (
        <div key={item.id} style={{
          background: "white", borderRadius: 20,
          padding: 14,
          marginBottom: 12,
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          border: "1px solid #f0f0f0"
        }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{
              width: 65,
              height: 65,
              borderRadius: 16,
              background: G_SOFT,
              overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, flexShrink: 0,
            }}>
              <img
                src={item.image_url || "https://via.placeholder.com/150?text=Drink"}
                alt={item.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=Drink'} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{item.name}</div>
              <div className="grad-text" style={{ fontSize: 14, fontWeight: 800 }}>{fmt(item.price)} / ly</div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                <button className="qty-btn" style={{ background: "#f0f4ff", color: "var(--accent)" }} onClick={() => updateQty(item.id, -1)}>−</button>
                <span style={{ fontSize: 16, fontWeight: 800, minWidth: 24, textAlign: "center" }}>{item.qty}</span>
                <button className="qty-btn" style={{ background: G, color: "white" }} onClick={() => updateQty(item.id, +1)}>+</button>
                <span style={{ marginLeft: "auto", fontSize: 15, fontWeight: 800 }} className="grad-text">{fmt(item.qty * item.price)}</span>
              </div>
            </div>
          </div>

          {/* Smart notes */}
          <div style={{ marginTop: 12, borderTop: "1.5px solid var(--border)", paddingTop: 10 }}>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginBottom: 6 }}>📝 Ghi chú thông minh:</div>
            <div className="no-scroll" style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 8 }}>
              {NOTE_SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => addSuggestion(item.id, s)}
                  style={{
                    padding: "4px 10px", borderRadius: 50, whiteSpace: "nowrap",
                    border: "1.5px solid var(--border)", background: item.note?.includes(s) ? G_SOFT : "white",
                    fontSize: 11, fontWeight: 600, color: "var(--text)", cursor: "pointer",
                    borderColor: item.note?.includes(s) ? "var(--accent2)" : "var(--border)",
                  }}
                >{s}</button>
              ))}
            </div>
            <input
              className="input-field"
              style={{ fontSize: 13, padding: "8px 12px" }}
              placeholder="Ghi chú khác..."
              value={item.note || ""}
              onChange={e => updateNote(item.id, e.target.value)}
            />
          </div>
        </div>
      ))}

      {/* Summary */}
      <div style={{ background: "white", borderRadius: 20, padding: 16, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ color: "var(--muted)", fontWeight: 600 }}>Tổng số ly</span>
          <span style={{ fontWeight: 800 }}>{totalQty} ly</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: 17 }}>Tổng tiền</span>
          <span className="grad-text" style={{ fontWeight: 800, fontSize: 20 }}>{fmt(totalPrice)}</span>
        </div>
      </div>

      <button
        className="btn-grad"
        style={{
          width: "100%", padding: "16px", fontSize: 16,
          opacity: totalQty < MIN_ORDER ? 0.5 : 1,
          marginTop: "20px",
          marginBottom: "100px",
        }}
        disabled={totalQty < MIN_ORDER}
        onClick={() => totalQty >= MIN_ORDER && setPage("checkout")}
      >
        {totalQty < MIN_ORDER ? `⚠️ Cần thêm ${MIN_ORDER - totalQty} ly nữa` : "✅ Tiến hành đặt hàng"}
      </button>
    </div>
  );
}

// ─── CHECKOUT PAGE ────────────────────────────────────────────────────────────
function CheckoutPage({ cart, setCart, setPage, setToast, setOrders, storeData, isOpen }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gps, setGps] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [distance, setDistance] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [done, setDone] = useState(false);
  const [orderCode, setOrderCode] = useState("");

  const calculateDistance = (userLat, userLng) => {
    if (!storeData || !storeData.latitude) return 1;
    const R = 6371;
    const dLat = (userLat - storeData.latitude) * Math.PI / 180;
    const dLon = (userLng - storeData.longitude) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(storeData.latitude * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getLocation = () => {
    navigator?.geolocation?.getCurrentPosition(pos => {
      const d = calculateDistance(pos.coords.latitude, pos.coords.longitude);
      setDistance(d);
      setShippingFee(d < 5 ? 0 : Math.round(d * 3000));
      setGps(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
    });
  };

  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const finalTotal = total + shippingFee;

  const handleSubmit = async () => {
    if (!isOpen) {
      setToast("⚠️ Quán hiện đang tạm nghỉ hoặc ngoài giờ làm việc. Vui lòng quay lại sau!");
      return;
    }
    if (totalQty < MIN_ORDER) return setToast(`⚠️ Bạn cần đặt tối thiểu ${MIN_ORDER} ly!`);
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setToast("⚠️ Vui lòng điền tên, SĐT và địa chỉ!");
      return;
    }
    localStorage.setItem("alo_name", name);
    localStorage.setItem("alo_phone", phone);
    localStorage.setItem("alo_address", address);

    // Sync back to localStorage for other pages if needed
    // (though Checkout is usually the last stop)


    setLoading(true);

    const payload = {
      store: 1,
      customer_name: name,
      customer_phone: phone,
      address: `${address} (GPS: ${gps})`,
      note: "Đặt từ Zalo App",
      total_price: finalTotal,
      items: cart.map(item => ({
        product_name: item.name,
        quantity: item.qty,
        price: item.price
      }))
    };

    try {
      // Thêm Timeout cho Fetch (10 giây)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch("https://alo-do-uong.onrender.com/api/orders/create/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = null;
      }

      if (!res.ok) {
        let errorMsg = "Có lỗi xảy ra!";
        if (data) {
          errorMsg = data.error || Object.values(data).flat()[0] || errorMsg;
        } else {
          errorMsg = "Lỗi máy chủ (500)";
        }
        setToast("⚠️ " + errorMsg);
        setLoading(false);
        return;
      }

      setOrderCode(data.order_code || "N/A");
      setDone(true);

      // Lưu vào lịch sử cục bộ
      const localOrders = JSON.parse(localStorage.getItem("alo_orders") || "[]");
      const newOrder = {
        order_code: data.order_code,
        items: cart,
        totalPrice: finalTotal, totalQty,
        status: data.status,
        date: new Date(data.created_at || new Date()).toLocaleString('vi-VN')
      };
      const updatedOrders = [newOrder, ...localOrders].slice(0, 20);
      localStorage.setItem("alo_orders", JSON.stringify(updatedOrders));
      setOrders(updatedOrders);

    } catch (err) {
      if (err.name === 'AbortError') {
        setToast("❌ Hết thời gian: Máy chủ phản hồi quá chậm!");
      } else {
        setToast("❌ Lỗi: " + err.message);
      }
    }
    setLoading(false);
  };

  if (done) return (
    <div className="page-content page-enter" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
      <div style={{ fontSize: 80, marginBottom: 16, animation: "bounceIn 0.5s ease" }}></div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Đặt hàng thành công!</div>
      <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16, lineHeight: 1.6 }}>
        Cảm ơn bạn! Đơn hàng của bạn đã được gửi đến quán.
      </div>
      <div style={{ background: "white", padding: "16px 32px", borderRadius: 16, border: "2px dashed var(--accent)", marginBottom: 28 }}>
        <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Mã đơn của bạn</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: "var(--accent)", letterSpacing: "2px" }}>{orderCode}</div>
      </div>
      <button
        className="btn-grad"
        style={{ padding: "14px 32px", fontSize: 16, width: "100%", marginBottom: 14 }}
        onClick={() => { setCart([]); setPage("history"); setDone(false); }}
      >Theo dõi đơn hàng 📍</button>
      <button
        className="btn-outline"
        style={{ padding: "12px 28px", fontSize: 15, width: "100%" }}
        onClick={() => { setCart([]); setPage("home"); setDone(false); }}
      >Về trang chủ 🏠</button>
    </div>
  );

  return (
    <div className="page-content page-enter" style={{ padding: "20px 16px 100px" }}>
      <div className="section-title" style={{ marginBottom: 6 }}>Thông tin đặt hàng</div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20, fontWeight: 500 }}>Điền thông tin để hoàn tất đơn hàng</div>

      <div style={{ background: "white", borderRadius: 20, padding: 16, marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, marginBottom: 6 }}>👤 Tên khách hàng</div>
        <input className="input-field" placeholder="Nguyễn Văn A..." value={name} onChange={e => setName(e.target.value)} />
        <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, marginBottom: 6, marginTop: 12 }}>📱 Số điện thoại</div>
        <input className="input-field" type="tel" placeholder="0901234567" value={phone} onChange={e => setPhone(e.target.value)} />
        <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, marginBottom: 6, marginTop: 12 }}>📍 Vị trí GPS </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="input-field"
            placeholder="Chưa có định vị..."
            value={gps}
            readOnly
            style={{ flex: 1, background: "#f8fafc", color: "var(--accent)", fontWeight: 700 }}
          />
          <button
            type="button"
            onClick={getLocation}
            className="btn-grad"
            style={{ padding: "0 14px", borderRadius: 14, fontSize: 12, flexShrink: 0 }}
          >
            📍 Lấy GPS
          </button>
        </div>

        <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, marginBottom: 6, marginTop: 12 }}>🏠 Địa chỉ nhận hàng</div>
        <input
          className="input-field"
          placeholder="Số nhà, tên đường, phường/xã..."
          value={address}
          onChange={e => setAddress(e.target.value)}
        />
      </div>

      {/* Order summary */}
      <div style={{ background: "white", borderRadius: 20, padding: 16, marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Tóm tắt đơn hàng</div>
        {cart.map(i => (
          <div key={i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, color: "var(--text)" }}>
            <span>{i.emoji} {i.name} x{i.qty}</span>
            <span style={{ fontWeight: 700 }}>{fmt(i.qty * i.price)}</span>
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 10, color: "var(--muted)" }}>
          <span>Phí giao hàng ({distance > 0 ? `${distance.toFixed(1)} km` : "Đang tính..."})</span>
          <span style={{ fontWeight: 700, color: (shippingFee === 0 && distance > 0) ? "#00c896" : "var(--text)" }}>
            {distance > 0 ? (shippingFee === 0 ? "Miễn phí" : fmt(shippingFee)) : "0đ"}
          </span>
        </div>

        <div style={{ borderTop: "1.5px solid var(--border)", marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Tổng cộng</span>
          <span className="grad-text" style={{ fontWeight: 800, fontSize: 17 }}>{fmt(finalTotal)}</span>
        </div>
      </div>

      <button
        className="btn-grad"
        style={{
          width: "100%", padding: "16px", fontSize: 16, marginBottom: 12,
          opacity: (!isOpen || loading) ? 0.6 : 1,
          background: !isOpen ? "#8892a4" : G
        }}
        onClick={handleSubmit}
        disabled={loading || !isOpen}
      >
        {!isOpen ? "🚫 Quán tạm đóng cửa" : (loading ? "Đang xử lý..." : " Đặt hàng ngay")}
      </button>
    </div>
  );
}

// ─── lịch sử PAGE ─────────────────────────────────────────────────────────────
function HistoryPage({ orders }) {
  const [loading, setLoading] = useState(false);
  // We remove the internal fetch because App handles the data now
  // but we keep loading state for UI consistency if needed

  const statusColor = (s) => {
    if (s?.includes("hoàn") || s?.includes("xong")) return { bg: "#d4edda", color: "#155724" };
    if (s?.includes("hủy")) return { bg: "#f8d7da", color: "#721c24" };
    return { bg: "#fff3cd", color: "#856404" };
  };

  if (loading) return (
    <div className="page-content page-enter" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="dot-loader" style={{ display: "flex", gap: 6 }}>
        <span /><span /><span />
      </div>
    </div>
  );

  if (orders.length === 0) return (
    <div className="page-content page-enter" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
      <div style={{ fontSize: 72, marginBottom: 14 }}>📭</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Chưa có đơn nào</div>
      <div style={{ fontSize: 14, color: "var(--muted)" }}>Đặt đơn đầu tiên ngay nào! 🚀</div>
    </div>
  );

  return (
    <div className="page-content page-enter" style={{ padding: "30px 1px 100px" }}>
      <div className="section-title" style={{ marginBottom: 16 }}>📜 Lịch sử đơn hàng</div>

      {orders.map((order, idx) => {
        const sc = statusColor(order?.status || order?.trang_thai);
        const items = order?.items || order?.chi_tiet || [];
        const total = order?.totalPrice || order?.tong_tien || 0;
        const qty = order?.totalQty || order?.so_luong || 0;
        const status = order?.status || order?.trang_thai || "Đang xử lý";
        const date = order?.date || order?.ngay_dat || "";
        const id = order?.id || idx + 1;

        return (
          <div key={id} className="history-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>Đơn #{order.order_code}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{date}</div>
              </div>
              <span className="status-badge" style={{ background: sc.bg, color: sc.color }}>{status}</span>
            </div>

            <div style={{ borderTop: "1.5px solid var(--border)", paddingTop: 8 }}>
              {items?.slice(0, 3).map((item, i) => (
                <div key={i} style={{ fontSize: 13, color: "var(--text)", marginBottom: 3, display: "flex", gap: 6 }}>
                  <span>{item.emoji || "🧋"}</span>
                  <span>{item.name || item.ten} x{item.qty || item.so_luong}</span>
                </div>
              ))}
              {items?.length > 3 && <div style={{ fontSize: 12, color: "var(--muted)" }}>+{items.length - 3} món khác</div>}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 8, borderTop: "1.5px solid var(--border)" }}>
              <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>{qty} ly</span>
              <span className="grad-text" style={{ fontWeight: 800, fontSize: 16 }}>{fmt(total)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("splash");
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState("");
  const [orders, setOrders] = useState([]);
  const [storeData, setStoreData] = useState(null);

  useEffect(() => {
    fetch("https://alo-do-uong.onrender.com/api/stores/1/")
      .then(res => res.json())
      .then(data => {
        setStoreData(data);
      })
      .catch(err => console.error(err));
  }, []);

  const checkIsOpen = () => {
    if (!storeData) return true;
    if (!storeData.is_active) return false;
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    return timeStr >= storeData.opening_time && timeStr <= storeData.closing_time;
  };
  const isOpen = checkIsOpen();
  const toastTimer = useRef(null);

  // Load orders from localStorage on mount
  useEffect(() => {
    const local = JSON.parse(localStorage.getItem("alo_orders") || "[]");
    setOrders(local);
  }, []);

  // Auto-clear toast
  useEffect(() => {
    if (toast) {
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(""), 3000);
    }
  }, [toast]);

  // Polling Real-time Status Sync (Orders & Store Status)
  useEffect(() => {
    const pollInterval = setInterval(() => {
      // 1. Cập nhật trạng thái Quán (Mở/Đóng cửa)
      fetch("https://alo-do-uong.onrender.com/api/stores/1/")
        .then(res => res.json())
        .then(data => setStoreData(data))
        .catch(err => console.error("Lỗi cập nhật trạng thái quán:", err));

      // 2. Cập nhật trạng thái Đơn hàng
      const localOrders = JSON.parse(localStorage.getItem("alo_orders") || "[]");
      let changed = false;
      const checkPromises = localOrders.map(async (order) => {
        if (!order.order_code || ["Hoàn thành", "Đã hủy"].includes(order.status)) return order;
        try {
          const res = await fetch(`https://alo-do-uong.onrender.com/api/orders/track/${order.order_code}/`);
          if (res.ok) {
            const data = await res.json();
            if (data.status && data.status !== order.status) {
              setToast(`🔔 Đơn ${order.order_code} đã chuyển sang: ${data.status}`);
              changed = true;
              return { ...order, status: data.status };
            }
          }
        } catch (e) {
          console.error("Lỗi tracking đơn:", e);
        }
        return order;
      });

      Promise.all(checkPromises).then(updatedOrders => {
        if (changed) {
          localStorage.setItem("alo_orders", JSON.stringify(updatedOrders));
          setOrders(updatedOrders);
        }
      });
    }, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  // Splash auto-navigate
  useEffect(() => {
    if (page === "splash") {
      const t = setTimeout(() => setPage("home"), 2600);
      return () => clearTimeout(t);
    }
  }, [page]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const navItems = [
    { id: "home", icon: "🏠", label: "Trang Chủ" },
    { id: "cart", icon: "🛒", label: "Giỏ Hàng" },
    { id: "checkout", icon: "✅", label: "Đặt Hàng" },
    { id: "history", icon: "📜", label: "Lịch Sử" },
  ];

  return (
    <>
      <style>{globalStyle}</style>
      <div className="app-shell">
        <Toast msg={toast} />

        {page === "splash" && <SplashPage storeName={storeData?.name || "Alo Đồ Uống"} tagline={storeData?.description} />}

        {page === "home" && <HomePage cart={cart} setCart={setCart} setToast={setToast} setPage={setPage} storeName={storeData?.name || "Alo Đồ Uống"} storeData={storeData} isOpen={isOpen} />}
        {page === "cart" && <CartPage cart={cart} setCart={setCart} setPage={setPage} setToast={setToast} />}
        {page === "checkout" && <CheckoutPage cart={cart} setCart={setCart} setPage={setPage} setToast={setToast} setOrders={setOrders} storeData={storeData} isOpen={isOpen} />}
        {page === "history" && <HistoryPage orders={orders} />}

        {page !== "splash" && (
          <nav className="bottom-nav">
            {navItems.map(item => (
              <button
                key={item.id}
                className={`nav-item ${page === item.id ? "active" : ""}`}
                onClick={() => setPage(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.id === "cart" && cartCount > 0 && (
                  <span className="cart-badge">{cartCount > 9 ? "9+" : cartCount}</span>
                )}
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </>
  );
}
