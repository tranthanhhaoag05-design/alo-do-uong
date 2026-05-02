import { useState, useEffect, useRef } from "react";

const NOTE_SUGGESTIONS = ["ít đá", "không đá", "nhiều đá", "ít ngọt", "không ngọt", "thêm đường", "không topping", "thêm trân châu"];
const MIN_ORDER = 1;
const fmt = (n) => n?.toLocaleString("vi-VN") + "đ";

const G = "linear-gradient(135deg, #00E5FF 0%, #2979FF 100%)";
const G_SOFT = "linear-gradient(135deg, #e0f7fa 0%, #e3f0ff 100%)";

const globalStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Baloo 2', sans-serif; background: #f5f7fa; -webkit-tap-highlight-color: transparent; overscroll-behavior: none; }
  :root { --accent: #2979FF; --accent2: #00E5FF; --grad: ${G}; --white: #ffffff; --bg: #f5f7fa; --text: #1a1a2e; --muted: #8892a4; --card: #ffffff; --border: #e8ecf4; --danger: #ff4757; --safe-bottom: env(safe-area-inset-bottom, 16px); }
  
  .app-shell { width: 100%; max-width: 1500px; margin: 0 auto; min-height: 100dvh; background: var(--bg); position: relative; overflow-x: hidden; }
  .products-grid { display: grid; gap: 12px; grid-template-columns: repeat(2, 1fr); padding: 0 16px; }
  @media (min-width: 768px) { .products-grid { grid-template-columns: repeat(4, 1fr); gap: 30px; } .app-shell { padding: 0 20px; } }
  
  .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 1450px; background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); border-top: 1px solid var(--border); display: flex; padding-bottom: var(--safe-bottom); z-index: 100; }
  .nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px 0 8px; border: none; background: none; cursor: pointer; transition: all 0.2s ease; position: relative; }
  .nav-item.active .nav-icon { background: var(--grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .nav-item.active .nav-label { color: var(--accent); font-weight: 800; }
  .nav-icon { font-size: 24px; transition: transform 0.2s; }
  .nav-label { font-size: 11px; font-weight: 600; color: var(--muted); margin-top: 4px; }
  .cart-badge { position: absolute; top: 8px; right: calc(50% - 20px); background: var(--danger); color: white; font-size: 10px; font-weight: 800; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; }

  .product-card { background: var(--card); border-radius: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.04); overflow: hidden; transition: transform 0.2s; cursor: pointer; border: 1px solid var(--border); }
  .product-card:active { transform: scale(0.96); }
  .btn-grad { background: var(--grad); color: white; border: none; border-radius: 50px; font-family: inherit; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(41,121,255,0.3); }
  .btn-grad:active { transform: scale(0.96); }
  .input-field { width: 100%; border: 2px solid var(--border); border-radius: 16px; padding: 14px 18px; font-family: inherit; font-size: 15px; outline: none; transition: border-color 0.2s; }
  .input-field:focus { border-color: var(--accent); }
  .toast { position: fixed; top: 30px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.85); color: white; padding: 12px 24px; border-radius: 50px; z-index: 2000; animation: fadeUp 0.3s ease both; backdrop-filter: blur(10px); font-weight: 600; }
  @keyframes fadeUp { from { transform: translate(-50%, 30px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
  .no-scroll::-webkit-scrollbar { display: none; }
`;

function Toast({ msg }) { return msg ? <div className="toast">{msg}</div> : null; }

// ─── STORE PICKER ─────────────────────────────────────────────────────────────
function StorePicker({ onSelect }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://alo-do-uong.onrender.com/api/stores/")
      .then(r => r.json()).then(data => { setStores(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ display: "flex", gap: 6 }}>{[1,2,3].map(i => <div key={i} style={{ width: 10, height: 10, background: G, borderRadius: "50%", animation: "pulse 1.4s infinite", animationDelay: `${i*0.2}s` }} />)}</div><style>{`@keyframes pulse { 0%, 100% { transform: scale(0.6); opacity: 0.4; } 50% { transform: scale(1.2); opacity: 1; } }`}</style></div>;

  return (
    <div style={{ padding: "50px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 45 }}>
        <div style={{ fontSize: 70, marginBottom: 15 }}>🧉</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1a1a2e" }}>Chọn quán ngay!</h1>
        <p style={{ color: "var(--muted)", fontWeight: 500, fontSize: 16 }}>Khám phá các tiệm nước quanh bạn</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {stores.map(s => (
          <div key={s.id} onClick={() => onSelect(s)} style={{ background: "white", padding: 22, borderRadius: 24, boxShadow: "0 8px 25px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 18, cursor: "pointer", border: "1px solid #f0f3f8" }}>
            <div style={{ width: 60, height: 60, background: G, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: "0 4px 12px rgba(41,121,255,0.2)" }}>🥤</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 19, color: "#1a1a2e" }}>{s.name}</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>📍 {s.address}</div>
            </div>
            <div style={{ fontSize: 20, color: "var(--accent)" }}>➔</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ cart, setCart, setToast, setPage, storeData, isOpen, onChangeStore }) {
  const [activeCat, setActiveCat] = useState(0);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://alo-do-uong.onrender.com/api/categories/?store=${storeData.id}`)
      .then(r => r.json()).then(data => setCategories(data)).catch(e => console.error(e));

    fetch(`https://alo-do-uong.onrender.com/api/products/?store=${storeData.id}&active=true`)
      .then(r => r.json()).then(data => { setProducts(data); setLoading(false); }).catch(() => setLoading(false));
  }, [storeData]);

  const filtered = activeCat === 0 ? products : products.filter(p => p.category === activeCat);
  const featured = products.slice(0, 4);

  const addToCart = (p) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...p, qty: 1 }];
    });
    setToast(`Đã thêm ${p.name} 🛒`);
  };

  return (
    <div style={{ paddingBottom: 110 }}>
      {/* Header & Categories */}
      <div style={{ padding: "20px 16px", background: "white", borderRadius: "0 0 32px 32px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <button onClick={onChangeStore} style={{ border: "none", background: "#f0f4ff", color: "var(--accent)", width: 42, height: 42, borderRadius: "50%", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>⬅️</button>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Đang mua tại</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#1a1a2e", display: "flex", alignItems: "center", gap: 6 }}>
                {storeData.name}
                <span style={{ fontSize: 11, background: isOpen ? "#d4f5e9" : "#ffe0e0", color: isOpen ? "#0a6e47" : "#b02020", padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>{isOpen ? "Mở cửa" : "Tạm nghỉ"}</span>
            </div>
          </div>
        </div>
        
        <div style={{ overflowX: "auto", display: "flex", gap: 10, paddingBottom: 5 }} className="no-scroll">
            <button onClick={() => setActiveCat(0)} style={{ padding: "10px 22px", borderRadius: 50, border: "none", whiteSpace: "nowrap", background: activeCat === 0 ? G : "#f4f6fb", color: activeCat === 0 ? "white" : "var(--text)", fontWeight: 800, fontSize: 13, cursor: "pointer", transition: "0.2s" }}>🌟 Tất cả</button>
            {categories.map(c => (
                <button key={c.id} onClick={() => setActiveCat(c.id)} style={{ padding: "10px 22px", borderRadius: 50, border: "none", whiteSpace: "nowrap", background: activeCat === c.id ? G : "#f4f6fb", color: activeCat === c.id ? "white" : "var(--text)", fontWeight: 800, fontSize: 13, cursor: "pointer", transition: "0.2s" }}>
                    {c.name}
                </button>
            ))}
        </div>
      </div>

      {/* Featured Suggestions */}
      {activeCat === 0 && (
        <div style={{ marginTop: 24 }}>
            <div style={{ padding: "0 16px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: 19, fontWeight: 800 }}>✨ Gợi ý cho bạn</h2>
                <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 700 }}>Xem tất cả</span>
            </div>
            <div style={{ display: "flex", gap: 16, overflowX: "auto", padding: "0 16px 15px" }} className="no-scroll">
                {featured.map(p => (
                    <div key={p.id} onClick={() => addToCart(p)} style={{ flexShrink: 0, width: 160, background: "white", borderRadius: 24, padding: 10, boxShadow: "0 4px 15px rgba(0,0,0,0.05)", border: "1px solid #f0f3f8" }}>
                        <div style={{ height: 110, background: G_SOFT, borderRadius: 18, marginBottom: 10, overflow: "hidden" }}>
                            <img src={p.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{p.name}</div>
                        <div style={{ fontWeight: 800, color: "var(--accent)" }}>{fmt(p.price)}</div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Main List */}
      <div style={{ padding: "20px 16px 12px", fontSize: 19, fontWeight: 800 }}>
        {activeCat === 0 ? "🏮 Thực đơn hôm nay" : `🥤 ${categories.find(c => c.id === activeCat)?.name}`}
      </div>
      {loading ? <div style={{ padding: 50, textAlign: "center" }}><div className="dot-loader"><span></span><span></span><span></span></div></div> : (
        <div className="products-grid">
          {filtered.map(p => (
            <div key={p.id} className="product-card" onClick={() => addToCart(p)}>
              <div style={{ height: 140, background: G_SOFT }}><img src={p.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
              <div style={{ padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: "#1a1a2e" }}>{p.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 800, color: "var(--accent)", fontSize: 17 }}>{fmt(p.price)}</div>
                  <button className="btn-grad" style={{ width: 34, height: 34, fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
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
  const updateQty = (id, delta) => setCart(p => p.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));

  if (cart.length === 0) return <div style={{ padding: 120, textAlign: "center" }}><div style={{ fontSize: 80 }}>🛒</div><div style={{ fontWeight: 800, fontSize: 22, marginTop: 15, color: "#1a1a2e" }}>Giỏ hàng đang trống</div><p style={{ color: "var(--muted)", marginTop: 8 }}>Mời bạn quay lại chọn món ngon nhé!</p><button onClick={() => setPage("home")} className="btn-grad" style={{ padding: "14px 28px", marginTop: 25, fontSize: 16 }}>Quay lại mua sắm</button></div>;

  return (
    <div style={{ padding: "24px 16px 140px" }}>
      <h2 style={{ marginBottom: 25, fontWeight: 800, fontSize: 24 }}>🛒 Giỏ hàng của bạn</h2>
      {cart.map(i => (
        <div key={i.id} style={{ background: "white", padding: 16, borderRadius: 24, marginBottom: 15, display: "flex", gap: 16, boxShadow: "0 4px 15px rgba(0,0,0,0.04)", border: "1px solid #f0f3f8" }}>
          <img src={i.image_url} style={{ width: 85, height: 85, borderRadius: 18, objectFit: "cover" }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
                <div style={{ fontWeight: 700, fontSize: 17, color: "#1a1a2e" }}>{i.name}</div>
                <div style={{ color: "var(--accent)", fontWeight: 800, fontSize: 16, marginTop: 4 }}>{fmt(i.price)}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => updateQty(i.id, -1)} style={{ width: 30, height: 30, borderRadius: "50%", border: "2px solid #f0f3f8", background: "white", fontWeight: 800 }}>-</button>
              <span style={{ fontWeight: 800, fontSize: 16 }}>{i.qty}</span>
              <button onClick={() => updateQty(i.id, 1)} style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: G, color: "white", fontWeight: 800 }}>+</button>
            </div>
          </div>
          <div style={{ fontWeight: 800, fontSize: 17, alignSelf: "center", color: "#1a1a2e" }}>{fmt(i.price * i.qty)}</div>
        </div>
      ))}
      <div style={{ position: "fixed", bottom: 95, left: 50, transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: 600, padding: "20px 24px", background: "white", borderRadius: 24, boxShadow: "0 -10px 30px rgba(0,0,0,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 90, border: "1px solid #f0f3f8" }}>
        <div><div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>Tổng thanh toán</div><div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)" }}>{fmt(total)}</div></div>
        <button onClick={() => setPage("checkout")} className="btn-grad" style={{ padding: "16px 35px", fontSize: 16, fontWeight: 800 }}>ĐẶT HÀNG NGAY</button>
      </div>
    </div>
  );
}

// ─── CHECKOUT PAGE ────────────────────────────────────────────────────────────
function CheckoutPage({ cart, storeData, setPage, setToast, setOrders, isOpen }) {
  const [name, setName] = useState(localStorage.getItem("alo_name") || "");
  const [phone, setPhone] = useState(localStorage.getItem("alo_phone") || "");
  const [addr, setAddr] = useState(localStorage.getItem("alo_addr") || "");
  const [gps, setGps] = useState("");
  const [loading, setLoading] = useState(false);
  const [distance, setDistance] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);

  const calculateDistance = (uLat, uLng) => {
    if (!storeData || !storeData.latitude) return 1;
    const R = 6371;
    const dLat = (uLat - storeData.latitude) * Math.PI / 180;
    const dLon = (uLng - storeData.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(storeData.latitude * Math.PI/180) * Math.cos(uLat * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(pos => {
        const d = calculateDistance(pos.coords.latitude, pos.coords.longitude);
        setDistance(d);
        setShippingFee(d < 5 ? 0 : Math.round(d * 3000));
        setGps(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setToast("Đã xác định vị trí & phí ship! 📍");
    });
  };

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const finalTotal = total + shippingFee;

  const handleSubmit = async () => {
    if (!name || !phone || !addr) return setToast("Vui lòng điền đủ thông tin!");
    if (!isOpen) return setToast("Quán đang tạm nghỉ!");
    setLoading(true);
    localStorage.setItem("alo_name", name);
    localStorage.setItem("alo_phone", phone);
    localStorage.setItem("alo_addr", addr);

    const payload = {
      store: storeData.id, customer_name: name, customer_phone: phone, address: `${addr} (GPS: ${gps})`,
      total_price: finalTotal, items: cart.map(i => ({ product_name: i.name, quantity: i.qty, price: i.price }))
    };

    try {
      const res = await fetch("https://alo-do-uong.onrender.com/api/orders/create/", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        const hist = JSON.parse(localStorage.getItem("alo_orders") || "[]");
        const newO = { order_code: data.order_code, status: "Chờ xử lý", date: new Date().toLocaleString(), totalPrice: finalTotal, items: cart };
        localStorage.setItem("alo_orders", JSON.stringify([newO, ...hist]));
        setOrders([newO, ...hist]);
        setPage("history");
        setToast("Đặt hàng thành công! 🎉");
      }
    } catch (e) { setToast("Lỗi kết nối!"); }
    setLoading(false);
  };

  return (
    <div style={{ padding: "24px 16px 120px" }}>
      <h2 style={{ marginBottom: 25, fontWeight: 800, fontSize: 24 }}>📍 Giao hàng đến</h2>
      <div style={{ background: "white", padding: 24, borderRadius: 24, display: "flex", flexDirection: "column", gap: 18, boxShadow: "0 8px 25px rgba(0,0,0,0.05)", border: "1px solid #f0f3f8" }}>
        <input className="input-field" placeholder="Họ tên của bạn" value={name} onChange={e => setName(e.target.value)} />
        <input className="input-field" placeholder="Số điện thoại" value={phone} onChange={e => setPhone(e.target.value)} />
        
        <div style={{ display: "flex", gap: 10 }}>
            <input className="input-field" placeholder="Vị trí GPS" value={gps} readOnly style={{ flex: 1, background: "#f8fafc", fontSize: 13 }} />
            <button onClick={getLocation} className="btn-grad" style={{ padding: "0 18px", fontSize: 13, borderRadius: 16 }}>📍 Lấy GPS</button>
        </div>
        <input className="input-field" placeholder="Địa chỉ chi tiết (Số nhà, đường...)" value={addr} onChange={e => setAddr(e.target.value)} />
      </div>
      
      <div style={{ marginTop: 30, background: "white", padding: 24, borderRadius: 24, boxShadow: "0 8px 25px rgba(0,0,0,0.05)", border: "1px solid #f0f3f8" }}>
        <div style={{ fontWeight: 800, marginBottom: 18, fontSize: 18 }}>Tóm tắt đơn hàng</div>
        {cart.map(i => <div key={i.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 15 }}><span>{i.name} x{i.qty}</span><span style={{ fontWeight: 700 }}>{fmt(i.price * i.qty)}</span></div>)}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 15, color: "var(--muted)", fontWeight: 600 }}>
            <span>Phí vận chuyển ({distance > 0 ? `${distance.toFixed(1)}km` : "Chưa định vị"})</span>
            <span>{shippingFee === 0 ? "Miễn phí" : fmt(shippingFee)}</span>
        </div>
        <div style={{ borderTop: "2px dashed #eee", marginTop: 15, paddingTop: 15, display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 22 }}>
            <span>Tổng cộng</span><span style={{ color: "var(--accent)" }}>{fmt(finalTotal)}</span>
        </div>
      </div>

      <button onClick={handleSubmit} disabled={loading} className="btn-grad" style={{ width: "100%", padding: 20, marginTop: 35, fontSize: 18, fontWeight: 800, boxShadow: "0 10px 25px rgba(41,121,255,0.4)" }}>
        {loading ? "ĐANG XỬ LÝ..." : "XÁC NHẬN ĐẶT HÀNG"}
      </button>
    </div>
  );
}

// ─── HISTORY PAGE ─────────────────────────────────────────────────────────────
function HistoryPage({ orders }) {
  if (orders.length === 0) return <div style={{ padding: 120, textAlign: "center" }}><div style={{ fontSize: 70 }}>📜</div><div style={{ fontWeight: 800, fontSize: 20, marginTop: 15 }}>Chưa có đơn hàng nào</div><button onClick={() => window.location.reload()} className="btn-grad" style={{ padding: "10px 20px", marginTop: 20 }}>Tải lại trang</button></div>;
  return (
    <div style={{ padding: "24px 16px 120px" }}>
      <h2 style={{ marginBottom: 25, fontWeight: 800, fontSize: 24 }}>📜 Lịch sử mua hàng</h2>
      {orders.map((o, idx) => (
        <div key={idx} style={{ background: "white", padding: 20, borderRadius: 24, marginBottom: 16, boxShadow: "0 4px 15px rgba(0,0,0,0.04)", border: "1px solid #f0f3f8" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontWeight: 800, fontSize: 17 }}>Đơn #{o.order_code}</span>
            <span style={{ background: "#d4f5e9", color: "#0a6e47", padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 800 }}>{o.status}</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>{o.date}</div>
          <div style={{ marginTop: 15, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "#1a1a2e", fontWeight: 600 }}>{o.items?.length} món</span>
            <span style={{ fontWeight: 800, color: "var(--accent)", fontSize: 19 }}>{fmt(o.totalPrice)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [storeData, setStoreData] = useState(null);
  const [toast, setToast] = useState("");
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const savedO = JSON.parse(localStorage.getItem("alo_orders") || "[]");
    setOrders(savedO);
    // Luôn bắt đầu bằng việc chọn cửa hàng mới để đảm bảo đúng quy trình bạn yêu cầu
    localStorage.removeItem("selected_store_id");
    setStoreData(null);
    
    setTimeout(() => setShowSplash(false), 2000);
  }, []);

  const handleStoreSelect = (s) => {
    setStoreData(s);
    localStorage.setItem("selected_store_id", s.id);
    setPage("home");
  };

  const handleToast = (m) => { setToast(m); setTimeout(() => setToast(""), 2500); };

  const isOpen = () => {
    if (!storeData || !storeData.is_active) return false;
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const [oh, om] = (storeData.opening_time || "07:00").split(":").map(Number);
    const [ch, cm] = (storeData.closing_time || "22:00").split(":").map(Number);
    return cur >= (oh * 60 + om) && cur <= (ch * 60 + cm);
  };

  if (showSplash) return (
    <div style={{ minHeight: "100vh", background: G, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white" }}>
        <style>{globalStyle}</style>
        <div style={{ fontSize: 80, marginBottom: 25, animation: "bounce 2s infinite" }}>🧉</div>
        <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-1px" }}>Alo Đồ Uống</h1>
        <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }`}</style>
    </div>
  );

  if (!storeData) return (
    <div className="app-shell">
        <style>{globalStyle}</style>
        <StorePicker onSelect={handleStoreSelect} />
    </div>
  );

  return (
    <div className="app-shell">
      <style>{globalStyle}</style>
      <Toast msg={toast} />

      {page === "home" && <HomePage cart={cart} setCart={setCart} setToast={handleToast} setPage={setPage} storeData={storeData} isOpen={isOpen()} onChangeStore={() => { localStorage.removeItem("selected_store_id"); setStoreData(null); }} />}
      {page === "cart" && <CartPage cart={cart} setCart={setCart} setPage={setPage} />}
      {page === "checkout" && <CheckoutPage cart={cart} storeData={storeData} setPage={setPage} setToast={handleToast} setOrders={setOrders} isOpen={isOpen()} />}
      {page === "history" && <HistoryPage orders={orders} />}

      <nav className="bottom-nav">
        <button className={`nav-item ${page === "home" ? "active" : ""}`} onClick={() => setPage("home")}>
          <span className="nav-icon">🏠</span><span className="nav-label">Cửa hàng</span>
        </button>
        <button className={`nav-item ${page === "cart" || page === "checkout" ? "active" : ""}`} onClick={() => setPage("cart")}>
          <span className="nav-icon">🛒</span><span className="nav-label">Giỏ hàng</span>
          {cart.length > 0 && <span className="cart-badge">{cart.reduce((s, i) => s + i.qty, 0)}</span>}
        </button>
        <button className={`nav-item ${page === "history" ? "active" : ""}`} onClick={() => setPage("history")}>
          <span className="nav-icon">📜</span><span className="nav-label">Lịch sử</span>
        </button>
      </nav>
    </div>
  );
}
