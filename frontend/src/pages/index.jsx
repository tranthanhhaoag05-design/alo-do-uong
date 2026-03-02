import React, { useState, useEffect } from 'react';

const noteTagsList = ["Ít đá", "Đá riêng", "Ít đường", "Không đường"];

const HomePage = () => {
    // ==========================================
    // 1. STATE QUẢN LÝ QUY TRÌNH
    // ==========================================
    const [appState, setAppState] = useState('splash'); 

    const [stores, setStores] = useState([]);
    const [currentStore, setCurrentStore] = useState(null);
    const [menuData, setMenuData] = useState([]);

    const [customerName, setCustomerName] = useState(""); 
    const [customerPhone, setCustomerPhone] = useState("");
    const [showAuthModal, setShowAuthModal] = useState(false);

    const [cart, setCart] = useState([]);
    const [filterCategory, setFilterCategory] = useState('all');
    const [address, setAddress] = useState('');
    const [selectedKCN, setSelectedKCN] = useState('');
    const [note, setNote] = useState('');
    const [activeTags, setActiveTags] = useState([]);
    const [showTags, setShowTags] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [gpsCoords, setGpsCoords] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("Tiền mặt");

    // ==========================================
    // 2. LOGIC TẢI DỮ LIỆU & "NHỚ MẶT" KHÁCH HÀNG
    // ==========================================
    useEffect(() => {
        const savedName = localStorage.getItem('alo_customer_name');
        const savedPhone = localStorage.getItem('alo_customer_phone');
        if (savedName) setCustomerName(savedName);
        if (savedPhone) setCustomerPhone(savedPhone);

        // Gọi API lấy dữ liệu nhưng KHÔNG nhảy trang ngay lập tức
        fetch('https://alo-do-uong.onrender.com/api/stores/', { mode: 'cors' })
            .then(res => res.json())
            .then(data => setStores(data || []))
            .catch(err => console.error("Lỗi tải danh sách quán:", err));

        // Ép buộc chờ 5 giây để chạy xong hiệu ứng Logo rồi mới vào danh sách quán
        const timer = setTimeout(() => { 
            setAppState(prevState => prevState === 'splash' ? 'stores' : prevState);
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (currentStore?.id) {
            fetch(`https://alo-do-uong.onrender.com/api/menu/?store=${currentStore.id}`)
                .then(response => response.json())
                .then(data => {
                    const formattedData = (data || []).map(item => ({
                        id: item.id, name: item.name, price: item.price, category: item.category_name, img: item.image_url
                    }));
                    setMenuData(formattedData);
                    setFilterCategory('all');
                    setCart([]); 
                })
                .catch(error => console.error("Lỗi lấy menu:", error));
        }
    }, [currentStore]);

    // ==========================================
    // 3. CÁC HÀM XỬ LÝ LOGIC
    // ==========================================
    const categoriesFromDB = ['all', ...new Set(menuData.map(item => item.category))];
    const formatMoney = (amount) => (amount || 0).toLocaleString('vi-VN') + " đ";

    const filteredData = menuData.filter(item => {
        if (filterCategory === 'all') return true;
        return item.category === filterCategory;
    });

    const addToCart = (item) => setCart([...cart, item]);
    const removeFromCart = (indexToRemove) => setCart(cart.filter((_, index) => index !== indexToRemove));
    const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);
    const totalItems = cart.length;

    const toggleTag = (tag) => {
        if (activeTags.includes(tag)) setActiveTags(activeTags.filter(t => t !== tag));
        else setActiveTags([...activeTags, tag]);
    };

    const getLocation = () => {
        setAddress("Đang tìm...");
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (p) => {
                    setGpsCoords({ lat: p.coords.latitude, lon: p.coords.longitude });
                    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${p.coords.latitude}&lon=${p.coords.longitude}`)
                        .then(r => r.json())
                        .then(d => setAddress(`📍 ${d.address?.road || d.display_name?.split(',')[0]} (GPS)`))
                        .catch(() => setAddress(`Tọa độ: ${p.coords.latitude.toFixed(3)},...`));
                },
                () => { alert("Bật GPS lên bạn ơi!"); setAddress(""); }
            );
        }
    };

    const handleOpenCart = () => {
        if (!customerName || !customerPhone) {
            setShowAuthModal(true);
        } else {
            setShowModal(true);
        }
    };

    const handleSaveUserInfo = () => {
        if (!customerName.trim() || !customerPhone.trim()) {
            alert("Vui lòng nhập đầy đủ Tên và Số điện thoại để quán dễ liên hệ nhé!");
            return;
        }
        localStorage.setItem('alo_customer_name', customerName);
        localStorage.setItem('alo_customer_phone', customerPhone);
        
        setShowAuthModal(false);
        setShowModal(true);
    };

    const generateOrderMessage = () => {
        if (cart.length === 0) return "";
        let counts = {};
        cart.forEach(x => counts[x.name] = (counts[x.name] || 0) + 1);

        let msg = `🛒 ĐƠN MỚI TỪ: ${currentStore?.name?.toUpperCase() || "QUÁN"}\n`;
        msg += `👤 Khách hàng: ${customerName} - ${customerPhone}\n`; 
        msg += `----------------\n`;
        for (let name in counts) {
            msg += `+ ${counts[name]}x ${name}\n`;
        }
        msg += `----------------\n`;
        msg += `🥤 Tổng số ly: ${totalItems}\n`;
        msg += `💰 Tổng tiền: ${formatMoney(totalPrice)}\n`;
        msg += `💳 Thanh toán: ${paymentMethod}\n`;
        
        let fullAddress = "";
        if (selectedKCN) fullAddress += `[${selectedKCN}] `;
        fullAddress += address || 'Khách chưa nhập địa chỉ chi tiết';
        msg += `📍 Giao đến: ${fullAddress}\n`;

        if (gpsCoords) {
            msg += `🗺️ Bản đồ: https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lon}\n`;
        }

        if (note || activeTags.length > 0) {
            msg += `📝 Ghi chú: ${activeTags.join(", ")} ${note}`;
        }
        return msg;
    };

    const handleCheckoutAndCopy = () => {
        if (!address && !selectedKCN) { alert("Vui lòng cho biết bạn đang ở đâu (GPS hoặc Chọn KCN) trước khi chốt đơn!"); return; }

        const finalMessage = generateOrderMessage();
        let counts = {};
        cart.forEach(x => counts[x.name] = (counts[x.name] || 0) + 1);

        let finalNote = activeTags.join(", ") + (note ? ", " + note : "") + ` | Trả: ${paymentMethod}`;
        if (gpsCoords) {
            finalNote += ` | Map: https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lon}`;
        }

        const orderData = {
            store: currentStore?.id,
            customer_name: customerName,
            customer_phone: customerPhone, 
            address: (selectedKCN ? `[${selectedKCN}] ` : "") + address,
            note: finalNote,
            total_price: totalPrice,
            items: Object.keys(counts).map(name => ({
                product_name: name, quantity: counts[name], price: cart.find(i => i.name === name).price
            }))
        };

        navigator.clipboard.writeText(finalMessage).then(() => {
            fetch('https://alo-do-uong.onrender.com/api/orders/', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData)
            }).catch(err => console.log("Lỗi lưu DB", err));

            alert("✅ Đã chép tin nhắn giỏ hàng!\n\nZalo sẽ mở ra, bạn chỉ cần DÁN (Ctrl+V) vào ô chat và gửi cho quán nhé.");
            window.open(`https://zalo.me/${currentStore?.phone}`, '_blank');
            setCart([]);
            setShowModal(false);
        }).catch(() => {
            alert("Trình duyệt không hỗ trợ copy tự động. Vui lòng copy tay nội dung bên trên.");
        });
    };

    // ==========================================
    // 4. CSS DÀNH RIÊNG CHO WEBSITE PC
    // ==========================================
    const webStyles = `
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&display=swap');
        body, html { margin: 0; padding: 0; overflow-x: hidden; background-color: #f8f9fa; }
        .zaui-header, .zaui-status-bar { display: none !important; }
    `;

    if (appState === 'splash') {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center vh-100 m-0 p-0" style={{ backgroundColor: '#000' }}>
                <style>{webStyles} {` .logo-zoom { animation: zoomInLogo 1.5s ease-out forwards; } @keyframes zoomInLogo { 0% { transform: scale(0); opacity: 0; } 70% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } } @keyframes dropBounce { 0% { transform: translateY(-50px); opacity: 0; } 50% { transform: translateY(10px); opacity: 1; } 70% { transform: translateY(-5px); } 100% { transform: translateY(0); opacity: 1; } } `}</style>
                <img src="/logo.jpg" alt="Logo" className="logo-zoom" style={{ width: '150px', marginBottom: '20px', borderRadius: '20px' }} />
                <div style={{ fontFamily: "'Baloo 2', cursive", fontSize: '2.5rem', fontWeight: '800' }}>
                    {"Alo Đồ Uống".split("").map((char, index) => (
                        <span key={index} style={{ display: 'inline-block', opacity: 0, animation: `dropBounce 0.6s ease forwards`, animationDelay: `${1.5 + index * 0.15}s`, background: 'linear-gradient(45deg, #00E5FF, #FF00FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0px 0px 8px rgba(255,255,255,0.3)' }}>
                            {char === " " ? "\u00A0" : char}
                        </span>
                    ))}
                </div>
            </div>
        );
    }

    if (appState === 'stores') {
        return (
            <div className="container-fluid m-0 p-0 d-flex flex-column align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: "'Baloo 2', cursive" }}>
                <style>{webStyles}</style>
                <img src="/logo.jpg" alt="Logo" style={{ width: '80px', borderRadius: '15px', marginBottom: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }} />
                <h2 className="text-center fw-bold mb-4" style={{ background: 'linear-gradient(45deg, #00E5FF, #FF00FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '2rem' }}>
                    Hôm nay bạn muốn đặt ở đâu?
                </h2>
                <div className="d-flex flex-column gap-3 w-100 px-3" style={{ maxWidth: '500px' }}>
                    {stores.length === 0 ? (
                        <div className="text-center text-muted"><div className="spinner-border text-info" role="status"></div><p className="mt-2 fs-5">Đang tìm các quán gần bạn...</p></div>
                    ) : (
                        stores.map(store => (
                            <button key={store.id} className="btn btn-white btn-lg text-start fw-bold shadow-sm p-3 rounded-4 d-flex align-items-center justify-content-between bg-white border-0" onClick={() => { setCurrentStore(store); setAppState('menu'); }} style={{ fontSize: '1.2rem', color: '#333' }}>
                                <span>🏪 {store.name}</span><i className="bi bi-chevron-right" style={{ color: '#00E5FF' }}></i>
                            </button>
                        ))
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="m-0 p-0" style={{ paddingBottom: '100px', backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: "'Baloo 2', cursive" }}>
            <style>{webStyles}</style>
            
            <div className="bg-white shadow-sm p-2 d-flex align-items-center" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
                <button className="btn btn-light rounded-circle me-2" onClick={() => setAppState('stores')}><i className="bi bi-arrow-left fs-5"></i></button>
                <span className="fw-bold fs-5 text-truncate" style={{ background: 'linear-gradient(45deg, #00E5FF, #FF00FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{currentStore?.name || "Cửa hàng"}</span>
            </div>

            <div className="text-center py-4 mb-4 position-relative overflow-hidden shadow-sm" style={{ backgroundColor: '#ffffff', borderRadius: '0 0 35px 35px', borderBottom: '2px solid rgba(0, 229, 255, 0.3)' }}>
                <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '100px', height: '100px', background: 'rgba(0, 229, 255, 0.15)', borderRadius: '50%', filter: 'blur(25px)' }}></div>
                <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '100px', height: '100px', background: 'rgba(255, 0, 255, 0.15)', borderRadius: '50%', filter: 'blur(25px)' }}></div>
                <h2 className="fw-bold mb-2 text-uppercase position-relative" style={{ background: 'linear-gradient(45deg, #00E5FF, #FF00FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '1px', fontSize: '1.8rem', lineHeight: '1.2' }}>{currentStore?.name || "Cửa hàng"}</h2>
                <div className="d-inline-block px-3 py-1 rounded-pill position-relative" style={{ background: 'rgba(255, 0, 255, 0.05)', border: '1px solid rgba(255, 0, 255, 0.2)' }}><small style={{ color: '#FF00FF', fontWeight: 'bold', letterSpacing: '0.5px', fontSize: '0.85rem' }}>✨ Thơm ngon - Giao tận nơi ✨</small></div>
            </div>

            <a href={`tel:${currentStore?.phone}`} className="d-flex align-items-center justify-content-center shadow-lg" style={{ position: 'fixed', bottom: cart.length > 0 ? '90px' : '30px', right: '20px', width: '55px', height: '55px', background: 'linear-gradient(45deg, #00E5FF, #FF00FF)', color: 'white', borderRadius: '50%', textDecoration: 'none', zIndex: 999, transition: 'bottom 0.3s ease-in-out' }}>
                <i className="bi bi-telephone-fill fs-3" style={{ animation: 'tada 1.5s infinite' }}></i>
            </a>

            <div className="container" style={{ maxWidth: '600px' }}>
                <div className="card p-3 mb-4 border-0 shadow-sm rounded-4 bg-white">
                    <div className="d-flex gap-2 mb-2">
                        <input type="text" className="form-control shadow-none bg-light border-0" placeholder="📍 Địa chỉ chi tiết (VD: Cổng số 1...)" value={address} onChange={(e) => setAddress(e.target.value)} />
                        <button className="btn btn-outline-dark border-0 bg-light text-primary" onClick={getLocation} title="Lấy GPS hiện tại"><i className="bi bi-crosshair" style={{ color: '#00E5FF' }}></i></button>
                    </div>
                    <select className="form-select shadow-none mb-2 border-0 bg-light" value={selectedKCN} onChange={(e) => setSelectedKCN(e.target.value)}>
                        <option value="">-- Chọn Khu Công Nghiệp (Nếu có) --</option>
                        <option value="KCN Đại Đăng">🏭 KCN Đại Đăng</option>
                        <option value="KCN Sóng Thần 3">🏭 KCN Sóng Thần 3</option>
                        <option value="KCN Kim Huy">🏭 KCN Kim Huy</option>
                        <option value="Mang về">🛍️ Ghé lấy mang về</option>
                    </select>
                    <div className="d-flex align-items-center gap-2">
                        <input type="text" className="form-control shadow-none border-0 bg-light" placeholder="Ghi chú (VD: Ít đường...)" value={note} onChange={(e) => setNote(e.target.value)} />
                        <button className="btn btn-light rounded-circle border-0" type="button" onClick={() => setShowTags(!showTags)} style={{ width: '40px', height: '40px', background: '#eee' }}><i className="bi bi-tags"></i></button>
                    </div>
                    {showTags && (
                        <div className="mt-2">
                            {noteTagsList.map(tag => (
                                <span key={tag} className={`note-option ${activeTags.includes(tag) ? 'active' : ''}`} onClick={() => toggleTag(tag)} style={{ display: 'inline-block', margin: '3px', padding: '6px 12px', background: activeTags.includes(tag) ? 'linear-gradient(45deg, #00E5FF, #FF00FF)' : '#eee', color: activeTags.includes(tag) ? '#fff' : '#555', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', border: 'none' }}>{tag}</span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="sticky-top py-2 mb-3 rounded-4" style={{ top: '60px', zIndex: 900, backgroundColor: '#f8f9fa' }}>
                    <div className="d-flex overflow-auto px-1 pb-2" style={{ whiteSpace: 'nowrap', scrollbarWidth: 'none' }}>
                        {categoriesFromDB.map(cat => (
                            <button key={cat} className={`btn btn-sm rounded-pill me-2 px-4 py-2 fw-bold shadow-sm border-0 ${filterCategory === cat ? 'text-white' : 'bg-white'}`} onClick={() => setFilterCategory(cat)} style={{ background: filterCategory === cat ? 'linear-gradient(45deg, #00E5FF, #FF00FF)' : '#fff', color: filterCategory === cat ? '#fff' : '#666' }}>
                                {cat === 'all' ? 'Tất cả' : cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="row g-3">
                    {filteredData.length === 0 ? (
                        <div className="text-center text-muted py-5 w-100"><i className="bi bi-inbox fs-1"></i><p className="mt-2">Quán này chưa lên menu...</p></div>
                    ) : (
                        filteredData.map(item => (
                            <div className="col-6" key={item.id}>
                                <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                                    <img src={item.img} className="card-img-top" alt={item.name} onError={(e) => e.target.src='https://via.placeholder.com/300?text=App+Bán+Hàng'} style={{ height: '140px', objectFit: 'cover' }} />
                                    <div className="card-body p-3 d-flex flex-column">
                                        <h6 className="card-title fw-bold mb-1 text-truncate" style={{ fontSize: '0.95rem' }}>{item.name}</h6>
                                        <div className="mt-auto d-flex justify-content-between align-items-center pt-2">
                                            <span className="fw-bold" style={{ color: '#FF00FF', fontSize: '1rem' }}>{formatMoney(item.price)}</span>
                                            <button className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center text-white shadow-sm" style={{ width: '32px', height: '32px', background: 'linear-gradient(45deg, #00E5FF, #FF00FF)', border: 'none' }} onClick={() => addToCart(item)}><i className="bi bi-plus fs-5"></i></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Float Giỏ Hàng */}
            {cart.length > 0 && (
                <div className="position-fixed w-100 d-flex justify-content-center" style={{ bottom: '20px', zIndex: 1040, left: 0 }} onClick={handleOpenCart}>
                    <div className="bg-white shadow-lg rounded-pill p-2 d-flex align-items-center justify-content-between" style={{ width: '90%', maxWidth: '400px', border: '2px solid #00E5FF', cursor: 'pointer' }}>
                        <div className="d-flex align-items-center">
                            <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-2 fw-bold shadow-sm" style={{ width: '38px', height: '38px', backgroundColor: '#111', fontSize: '1.1rem' }}>{totalItems}</div>
                            <div>
                                <small className="text-muted d-block" style={{ fontSize: '11px', lineHeight: '1' }}>Tổng tiền:</small>
                                <span className="fw-bold" style={{ fontSize: '1.1rem', background: 'linear-gradient(45deg, #00E5FF, #FF00FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{formatMoney(totalPrice)}</span>
                            </div>
                        </div>
                        <button className="btn rounded-pill px-3 py-2 fw-bold shadow-sm text-white border-0" style={{ fontSize: '14px', background: 'linear-gradient(45deg, #00E5FF, #FF00FF)' }}>
                            Xem & Đặt <i className="bi bi-chevron-up"></i>
                        </button>
                    </div>
                </div>
            )}

            {/* 🔥 MODAL ĐĂNG NHẬP THÔNG TIN */}
            {showAuthModal && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1100 }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4 p-4">
                            <div className="text-center mb-4">
                                <h4 className="fw-bold" style={{ background: 'linear-gradient(45deg, #00E5FF, #FF00FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    Thông tin liên hệ
                                </h4>
                                <small className="text-muted">Quán sẽ gọi cho bạn theo số này để xác nhận đơn</small>
                            </div>
                            
                            <div className="mb-3">
                                <label className="form-label fw-bold text-muted small">Tên của bạn</label>
                                <input type="text" className="form-control form-control-lg bg-light border-0 shadow-none rounded-3" 
                                    placeholder="Nhập tên..." 
                                    value={customerName} 
                                    onChange={(e) => setCustomerName(e.target.value)} 
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="form-label fw-bold text-muted small">Số điện thoại Zalo</label>
                                <input type="tel" className="form-control form-control-lg bg-light border-0 shadow-none rounded-3" 
                                    placeholder="Ví dụ: 0901234567" 
                                    value={customerPhone} 
                                    onChange={(e) => setCustomerPhone(e.target.value)} 
                                />
                            </div>

                            <div className="d-flex gap-2">
                                <button className="btn btn-light rounded-pill w-50 py-2 fw-bold" onClick={() => setShowAuthModal(false)}>Quay lại</button>
                                <button className="btn text-white rounded-pill w-50 py-2 fw-bold shadow-sm" 
                                    style={{ background: 'linear-gradient(45deg, #00E5FF, #FF00FF)', border: 'none' }}
                                    onClick={handleSaveUserInfo}>
                                    Tiếp tục <i className="bi bi-arrow-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL GIỎ HÀNG */}
            {showModal && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            
                            <div className="modal-header border-0 pb-0 d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="modal-title fw-bold mb-0" style={{ background: 'linear-gradient(45deg, #00E5FF, #FF00FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        Giỏ hàng của bạn
                                    </h5>
                                    <small className="text-muted"><i className="bi bi-person-check-fill text-success"></i> {customerName} ({customerPhone})</small>
                                </div>
                                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
                            </div>

                            <div className="modal-body pb-0">
                                {cart.length === 0 ? <p className="text-center text-muted py-3">Giỏ hàng trống trơn...</p> : cart.map((item, index) => (
                                    <div className="d-flex justify-content-between align-items-center border-bottom py-2" key={index}>
                                        <div>
                                            <h6 className="mb-0 fw-bold">{item.name}</h6>
                                            <small className="fw-bold" style={{ color: '#FF00FF' }}>{formatMoney(item.price)}</small>
                                        </div>
                                        <button className="btn btn-light text-danger rounded-circle p-2 shadow-sm border-0" onClick={() => removeFromCart(index)}><i className="bi bi-trash"></i></button>
                                    </div>
                                ))}

                                {cart.length > 0 && (
                                    <div className="mt-3 p-3 rounded-3" style={{ backgroundColor: '#f8f9fa', border: '1px solid #eee' }}>
                                        <h6 className="fw-bold mb-2 small text-muted">Phương thức thanh toán:</h6>
                                        <div className="d-flex gap-3">
                                            <label className="d-flex align-items-center cursor-pointer fw-bold">
                                                <input type="radio" name="payment" value="Tiền mặt" checked={paymentMethod === "Tiền mặt"} onChange={(e) => setPaymentMethod(e.target.value)} className="me-2" /> 💵 Tiền mặt
                                            </label>
                                            <label className="d-flex align-items-center cursor-pointer fw-bold" style={{ color: paymentMethod === "Chuyển khoản" ? '#FF00FF' : '#333' }}>
                                                <input type="radio" name="payment" value="Chuyển khoản" checked={paymentMethod === "Chuyển khoản"} onChange={(e) => setPaymentMethod(e.target.value)} className="me-2" /> 💳 Chuyển khoản
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {cart.length > 0 && (
                                    <div className="mt-3 p-3 rounded-3 d-flex" style={{ backgroundColor: '#fdf9ec', border: '1px dashed #ccc', borderLeft: '4px solid #00E5FF' }}>
                                        <div style={{ flex: 1 }}>
                                            <h6 className="fw-bold mb-2 small" style={{ color: '#00E5FF' }}>Tin nhắn sẽ gửi:</h6>
                                            <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '12px', color: '#444', fontFamily: "monospace", lineHeight: '1.4' }}>
                                                {generateOrderMessage()}
                                            </pre>
                                        </div>
                                        
                                        {/* HIỆN MÃ QR KHI CHỌN CHUYỂN KHOẢN (ĐÃ BỌC THÉP CHỐNG LỖI LINK) */}
                                        {paymentMethod === "Chuyển khoản" && (
                                            <div className="ms-3 d-flex flex-column align-items-center justify-content-center" style={{ width: '100px', borderLeft: '1px dashed #ddd', paddingLeft: '10px' }}>
                                                <small className="fw-bold mb-1 text-center" style={{ fontSize: '10px', color: '#FF00FF' }}>Quét để thanh toán</small>
                                                
                                                <img 
                                                    src={
                                                        currentStore?.qr_image 
                                                        ? (currentStore.qr_image.startsWith('http') 
                                                            ? currentStore.qr_image 
                                                            : `https://alo-do-uong.onrender.com${currentStore.qr_image.startsWith('/') ? '' : '/'}${currentStore.qr_image}`) 
                                                        : `https://img.vietqr.io/image/970436-123456789-compact2.png?amount=${totalPrice}&addInfo=Thanh toan do uong`
                                                    } 
                                                    alt="QR Code" 
                                                    onError={(e) => {
                                                        console.log("Lỗi load ảnh QR, đường dẫn hiện tại là:", e.target.src);
                                                        e.target.src = `https://img.vietqr.io/image/970436-123456789-compact2.png?amount=${totalPrice}&addInfo=Loi_Anh_Tu_Dong_Chuyen`;
                                                    }}
                                                    style={{ width: '80px', height: '80px', objectFit: 'contain', border: '1px solid #eee', borderRadius: '5px', backgroundColor: '#fff' }} 
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {cart.length > 0 && (
                                    <div className="mt-3 pt-2 d-flex justify-content-between align-items-center">
                                        <div>
                                            <span className="fw-bold fs-6">Tổng cộng:</span>
                                            <small className="d-block text-muted">({totalItems} sản phẩm)</small>
                                        </div>
                                        <span className="fw-bold fs-4" style={{ background: 'linear-gradient(45deg, #00E5FF, #FF00FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{formatMoney(totalPrice)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer border-0 pt-3">
                                <button type="button" className="btn w-100 rounded-pill py-3 fw-bold text-truncate shadow-lg text-white d-flex justify-content-center align-items-center" onClick={handleCheckoutAndCopy} style={{ background: 'linear-gradient(45deg, #00E5FF, #FF00FF)', border: 'none', fontSize: '1.1rem' }}>
                                    <i className="bi bi-clipboard-check fs-4 me-2"></i> Copy & Chuyển sang Zalo
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;