import { useState, useEffect, useRef } from "react";

const NOTE_SUGGESTIONS = ["ít đá", "không đá", "nhiều đá", "ít ngọt", "không ngọt", "thêm đường", "không topping", "thêm trân châu"];
const MIN_ORDER = 1; // Giảm xuống 1 để dễ test đa cửa hàng
const fmt = (n) => n?.toLocaleString("vi-VN") + "đ";

const G = "linear-gradient(135deg, #00E5FF 0%, #2979FF 100%)";
const G_SOFT = "linear-gradient(135deg, #e0f7fa 0%, #e3f0ff 100%)";

const globalStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Baloo 2', sans-serif; background: #f5f7fa; -webkit-tap-highlight-color: transparent; }
  :root { --accent: #2979FF; --accent2: #00E5FF; --grad: ${G}; --white: #ffffff; --bg: #f5f7fa; --text: #1a1a2e; --muted: #8892a4; --card: #ffffff; --border: #e8ecf4; --danger: #ff4757; --safe-bottom: env(safe-area-inset-bottom, 16px); }
  .app-shell { width: 100%; max-width: 1500px; margin: 0 auto; min-height: 100dvh; background: var(--bg); position: relative; overflow-x: hidden; }
  .products-grid { display: grid; gap: 10px; grid-template-columns: repeat(2, 1fr); padding: 0 16px; }
  @media (min-width: 768px) { .products-grid { grid-template-columns: repeat(4, 1fr); gap: 30px; } .app-shell { padding: 0 20px; } }
  .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 1450px; background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); border-top: 1px solid var(--border); display: flex; padding-bottom: var(--safe-bottom); z-index: 100; }
  .nav-item { flex: 1; display: flex; flex-direction: column; alignItems: center; justify-content: center; padding: 10px 0 6px; border: none; background: none; cursor: pointer; color: var(--muted); }
  .nav-item.active { color: var(--accent); font-weight: 700; }
  .nav-icon { font-size: 20px; margin-bottom: 2px; }
  .nav-label { font-size: 10px; font-weight: 600; }
  .cart-badge { position: absolute; top: 5px; right: calc(50% - 15px); background: var(--danger); color: white; font-size: 9px; width: 16px; height: 16px; border-radius: 50%; display: flex; alignItems: center; justify-content: center; }
  .btn-grad { background: var(--grad); color: white; border: none; border-radius: 50px; font-family: inherit; font-weight: 700; cursor: pointer; transition: 0.2s; }
  .btn-grad:active { transform: scale(0.95); }
  .input-field { width: 100%; border: 2px solid var(--border); border-radius: 12px; padding: 10px 14px; font-family: inherit; outline: none; }
  .input-field:focus { border-color: var(--accent); }
  .product-card { background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
  .toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #333; color: white; padding: 8px 20px; border-radius: 50px; z-index: 1000; font-size: 14px; }
`;

function Toast({ msg }) { return msg ? <div className="toast">{msg}</div> : null; }

// ─── SPLASH PAGE ──────────────────────────────────────────────────────────────
function SplashPage({ storeName }) {
  return (
    <div style={{ minHeight: "100dvh", background: G, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white" }}>
      <div style={{ fontSize: 60, marginBottom: 20 }}>🍹</div>
      <h1 style={{ fontSize: 32, fontWeight: 800 }}>{storeName}</h1>
      <p style={{ opacity: 0.8 }}>Đang tải dữ liệu...</p>
    </div>
  );
}

// ─── STORE PICKER ─────────────────────────────────────────────────────────────
function StorePicker({ onSelect }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://alo-do-uong.onrender.com/api/stores/")
      .then(r => r.json())
      .then(data => { setStores(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 100, textAlign: "center" }}>Đang tìm các cửa hàng...</div>;

  return (
    <div style={{ padding: "40px 20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: 30, fontWeight: 800 }}>Chọn cửa hàng để mua</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
        {stores.map(s => (
          <div key={s.id} onClick={() => onSelect(s)} style={{ background: "white", padding: 20, borderRadius: 18, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", cursor: "pointer", display: "flex", alignItems: "center", gap: 15 }}>
            <div style={{ width: 50, height: 50, background: G, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🏠</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 17 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{s.address}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ cart, setCart, setToast, setPage, storeData, isOpen }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeData) return;
    fetch(`https://alo-do-uong.onrender.com/api/products/?store=${storeData.id}&active=true`)
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [storeData]);

  const addToCart = (p) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...p, qty: 1 }];
    });
    setToast(`Đã thêm ${p.name}`);
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: 20, background: "white", borderRadius: "0 0 25px 25px", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>{storeData?.name}</h1>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>{isOpen ? "🟢 Đang mở cửa" : "🔴 Tạm nghỉ"}</p>
      </div>

      {loading ? <div style={{ textAlign: "center", padding: 40 }}>Đang tải thực đơn...</div> : (
        <div className="products-grid">
          {products.map(p => (
            <div key={p.id} className="product-card">
              <div style={{ height: 120, background: "#eee" }}>
                <img src={p.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, alignItems: "center" }}>
                  <div style={{ fontWeight: 800, color: "var(--accent)" }}>{fmt(p.price)}</div>
                  <button onClick={() => addToCart(p)} className="btn-grad" style={{ width: 28, height: 28 }}>+</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CART PAGE ────────────────────────────────────────────────────────────────
function CartPage({ cart, setCart, setPage }) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>Giỏ hàng của bạn</h2>
      {cart.map(i => (
        <div key={i.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 15, background: "white", padding: 15, borderRadius: 12 }}>
          <div>
            <div style={{ fontWeight: 700 }}>{i.name}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{fmt(i.price)} x {i.qty}</div>
          </div>
          <div style={{ fontWeight: 800 }}>{fmt(i.price * i.qty)}</div>
        </div>
      ))}
      <div style={{ marginTop: 20, textAlign: "right" }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Tổng: {fmt(total)}</div>
        <button onClick={() => setPage("checkout")} className="btn-grad" style={{ padding: "12px 30px", marginTop: 15 }}>Đặt hàng ngay</button>
      </div>
    </div>
  );
}

// ─── CHECKOUT PAGE ────────────────────────────────────────────────────────────
function CheckoutPage({ cart, storeData, setPage, setToast, setOrders }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOrder = async () => {
    if (!name || !phone || !address) return setToast("Vui lòng điền đủ thông tin!");
    setLoading(true);
    const payload = {
      store: storeData.id,
      customer_name: name,
      customer_phone: phone,
      address: address,
      total_price: cart.reduce((s, i) => s + i.price * i.qty, 0),
      items: cart.map(i => ({ product_name: i.name, quantity: i.qty, price: i.price }))
    };

    try {
      const res = await fetch("https://alo-do-uong.onrender.com/api/orders/create/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        const history = JSON.parse(localStorage.getItem("alo_orders") || "[]");
        const newOrder = { order_code: data.order_code, status: "Chờ xử lý", date: new Date().toLocaleString(), totalPrice: payload.total_price };
        localStorage.setItem("alo_orders", JSON.stringify([newOrder, ...history]));
        setOrders([newOrder, ...history]);
        setPage("history");
        setToast("Đặt hàng thành công!");
      } else {
        setToast(data.error || "Lỗi đặt hàng");
      }
    } catch (e) { setToast("Lỗi kết nối!"); }
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>Thông tin nhận hàng</h2>
      <input className="input-field" style={{ marginBottom: 10 }} placeholder="Tên của bạn" value={name} onChange={e => setName(e.target.value)} />
      <input className="input-field" style={{ marginBottom: 10 }} placeholder="Số điện thoại" value={phone} onChange={e => setPhone(e.target.value)} />
      <input className="input-field" style={{ marginBottom: 20 }} placeholder="Địa chỉ giao hàng" value={address} onChange={e => setAddress(e.target.value)} />
      <button onClick={handleOrder} disabled={loading} className="btn-grad" style={{ width: "100%", padding: 15 }}>{loading ? "Đang xử lý..." : "Xác nhận đặt hàng"}</button>
    </div>
  );
}

// ─── HISTORY PAGE ─────────────────────────────────────────────────────────────
function HistoryPage({ orders }) {
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>Lịch sử mua hàng</h2>
      {orders.map((o, idx) => (
        <div key={idx} style={{ background: "white", padding: 15, borderRadius: 15, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700 }}>Đơn #{o.order_code}</span>
            <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700 }}>{o.status}</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 5 }}>{o.date}</div>
          <div style={{ marginTop: 10, fontWeight: 800 }}>{fmt(o.totalPrice)}</div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [storeData, setStoreData] = useState(null);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState("");
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem("alo_orders") || "[]");
    setOrders(savedOrders);
    
    const savedStoreId = localStorage.getItem("selected_store_id");
    if (savedStoreId) {
      fetch(`https://alo-do-uong.onrender.com/api/stores/${savedStoreId}/`)
        .then(r => r.json())
        .then(data => setStoreData(data));
    }
    setTimeout(() => setShowSplash(false), 2000);
  }, []);

  const handleStoreSelect = (s) => {
    setStoreData(s);
    localStorage.setItem("selected_store_id", s.id);
    setPage("home");
  };

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 2500); };

  const isOpen = () => {
    if (!storeData || !storeData.is_active) return false;
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const [oh, om] = (storeData.opening_time || "07:00").split(":").map(Number);
    const [ch, cm] = (storeData.closing_time || "22:00").split(":").map(Number);
    return cur >= (oh * 60 + om) && cur <= (ch * 60 + cm);
  };

  if (showSplash) return <SplashPage storeName={storeData?.name || "Alo Đồ Uống"} />;
  if (!storeData) return <div className="app-shell"><style>{globalStyle}</style><StorePicker onSelect={handleStoreSelect} /></div>;

  return (
    <div className="app-shell">
      <style>{globalStyle}</style>
      <Toast msg={toast} />
      
      {page === "home" && <HomePage cart={cart} setCart={setCart} setToast={showToast} storeData={storeData} isOpen={isOpen()} />}
      {page === "cart" && <CartPage cart={cart} setCart={setCart} setPage={setPage} />}
      {page === "checkout" && <CheckoutPage cart={cart} storeData={storeData} setPage={setPage} setToast={showToast} setOrders={setOrders} />}
      {page === "history" && <HistoryPage orders={orders} />}

      <nav className="bottom-nav">
        <button className={`nav-item ${page === "home" ? "active" : ""}`} onClick={() => setPage("home")}>
          <span className="nav-icon">🏠</span><span className="nav-label">Trang chủ</span>
        </button>
        <button className={`nav-item ${page === "cart" ? "active" : ""}`} onClick={() => setPage("cart")}>
          <span className="nav-icon">🛒</span><span className="nav-label">Giỏ hàng</span>
          {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
        </button>
        <button className={`nav-item ${page === "history" ? "active" : ""}`} onClick={() => setPage("history")}>
          <span className="nav-icon">📜</span><span className="nav-label">Lịch sử</span>
        </button>
        <button className="nav-item" onClick={() => { localStorage.removeItem("selected_store_id"); setStoreData(null); }}>
          <span className="nav-icon">🔄</span><span className="nav-label">Đổi tiệm</span>
        </button>
      </nav>
    </div>
  );
}
