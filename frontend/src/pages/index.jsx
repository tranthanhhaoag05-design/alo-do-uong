import React, { useState, useEffect } from 'react';

const noteTagsList = ["Ít đá", "Đá riêng", "Ít đường", "Không đường"];

const HomePage = () => {
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

    useEffect(() => {
        const savedName = localStorage.getItem('alo_customer_name');
        const savedPhone = localStorage.getItem('alo_customer_phone');
        if (savedName) setCustomerName(savedName);
        if (savedPhone) setCustomerPhone(savedPhone);

        fetch('https://alo-do-uong.onrender.com/api/stores/', { mode: 'cors' })
            .then(res => res.json())
            .then(data => {
                setStores(data || []);
                if(data && data.length > 0) setAppState('stores');
            })
            .catch(err => console.error("Lỗi tải danh sách quán:", err));

        const timer = setTimeout(() => { setAppState('stores'); }, 5000);
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

    const categoriesFromDB = ['all', ...new Set(menuData.map(item => item.category))];
    const formatMoney = (amount) => (amount || 0).toLocaleString('vi-VN') + " đ";
    const filteredData = menuData.filter(item => filterCategory === 'all' || item.category === filterCategory);
    const addToCart = (item) => setCart([...cart, item]);
    const removeFromCart = (indexToRemove) => setCart(cart.filter((_, index) => index !== indexToRemove));
    const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);
    const totalItems = cart.length;

    const getLocation = () => {
        setAddress("Đang tìm...");
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (p) => {
                    setGpsCoords({ lat: p.coords.latitude, lon: p.coords.longitude });
                    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${p.coords.latitude}&lon=${p.coords.longitude}`)
                        .then(r => r.json())
                        .then(d => setAddress(`📍 ${d.address?.road || d.display_name?.split(',')[0] || "Vị trí GPS"}`))
                        .catch(() => setAddress(`📍 GPS: ${p.coords.latitude.toFixed(3)}`));
                },
                () => { alert("Bật GPS lên bạn ơi!"); setAddress(""); }
            );
        }
    };

    const generateOrderMessage = () => {
        if (cart.length === 0) return "";
        let counts = {};
        cart.forEach(x => counts[x.name] = (counts[x.name] || 0) + 1);
        let msg = `🛒 ĐƠN MỚI TỪ: ${currentStore?.name?.toUpperCase() || "QUÁN"}\n👤 Khách hàng: ${customerName} - ${customerPhone}\n----------------\n`;
        for (let name in counts) msg += `+ ${counts[name]}x ${name}\n`;
        msg += `----------------\n💰 Tổng tiền: ${formatMoney(totalPrice)}\n💳 Trả: ${paymentMethod}\n📍 Giao đến: ${(selectedKCN ? `[${selectedKCN}] ` : "") + address}`;
        if (gpsCoords) msg += `\n🗺️ Bản đồ: http://google.com/maps?q=${gpsCoords.lat},${gpsCoords.lon}`;
        return msg;
    };

    const handleCheckoutAndCopy = () => {
        if (!address && !selectedKCN) { alert("Vui lòng chọn địa chỉ!"); return; }
        const orderData = {
            store: currentStore?.id, customer_name: customerName, customer_phone: customerPhone,
            address: (selectedKCN ? `[${selectedKCN}] ` : "") + address,
            note: activeTags.join(", ") + (note ? ", " + note : "") + ` | Trả: ${paymentMethod}`,
            total_price: totalPrice,
            items: Object.keys(cart.reduce((acc, curr) => { acc[curr.name] = (acc[curr.name] || 0) + 1; return acc; }, {})).map(name => ({
                product_name: name, quantity: cart.filter(i => i.name === name).length, price: cart.find(i => i.name === name).price
            }))
        };
        navigator.clipboard.writeText(generateOrderMessage()).then(() => {
            fetch('https://alo-do-uong.onrender.com/api/orders/', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData)
            }).catch(err => console.log("Lỗi lưu DB", err));
            alert("✅ Đã chép tin nhắn! Đang mở Zalo...");
            window.open(`https://zalo.me/${currentStore?.phone}`, '_blank');
            setCart([]); setShowModal(false);
        });
    };

    const webStyles = `
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&display=swap');
        body, html { margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Baloo 2', cursive; }
        .logo-zoom { animation: zoomInLogo 1.5s ease-out; }
        @keyframes zoomInLogo { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
    `;

    if (appState === 'splash') {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-dark text-white">
                <style>{webStyles}</style>
                <img src="/logo.jpg" alt="Logo" className="logo-zoom" style={{ width: '120px', borderRadius: '20px' }} />
                <h1 className="mt-3 fw-bold">Alo Đồ Uống</h1>
                <div className="spinner-border text-info mt-3" role="status"></div>
            </div>
        );
    }

    return (
        <div className="pb-5 min-vh-100 bg-light">
            <style>{webStyles}</style>
            <div className="bg-white shadow-sm p-3 sticky-top d-flex align-items-center">
                <button className="btn btn-light rounded-circle me-3" onClick={() => setAppState('stores')}><i className="bi bi-arrow-left"></i></button>
                <span className="fw-bold fs-5 text-truncate" style={{ background: 'linear-gradient(45deg, #00E5FF, #FF00FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {appState === 'stores' ? "Chọn Quán" : currentStore?.name}
                </span>
            </div>

            <div className="container mt-3" style={{ maxWidth: '600px' }}>
                {appState === 'stores' ? (
                    <div className="w-100">
                        {stores.length === 0 ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-info mb-3"></div>
                                <p className="text-muted">Đang kết nối nhà bếp Render...<br/><small>(Chờ khoảng 1 phút)</small></p>
                            </div>
                        ) : (
                            stores.map(store => (
                                <button key={store.id} className="btn btn-white w-100 text-start shadow-sm p-3 mb-3 rounded-4 border-0 d-flex justify-content-between align-items-center" onClick={() => { setCurrentStore(store); setAppState('menu'); }}>
                                    <span className="fw-bold">🏪 {store.name}</span>
                                    <i className="bi bi-chevron-right text-info"></i>
                                </button>
                            ))
                        )}
                    </div>
                ) : (
                    <>
                        <div className="card border-0 shadow-sm rounded-4 p-3 mb-3 bg-white">
                            <input type="text" className="form-control border-0 bg-light mb-2" placeholder="📍 Địa chỉ của bạn..." value={address} onChange={(e) => setAddress(e.target.value)} />
                            <select className="form-select border-0 bg-light mb-2" value={selectedKCN} onChange={(e) => setSelectedKCN(e.target.value)}>
                                <option value="">-- Chọn Khu Công Nghiệp --</option>
                                <option value="KCN Đại Đăng">KCN Đại Đăng</option>
                                <option value="KCN Sóng Thần 3">KCN Sóng Thần 3</option>
                                <option value="KCN Kim Huy">KCN Kim Huy</option>
                            </select>
                            <button className="btn btn-sm btn-outline-info w-100 rounded-pill" onClick={getLocation}>📍 Lấy vị trí GPS</button>
                        </div>

                        <div className="row g-3">
                            {menuData.map(item => (
                                <div className="col-6" key={item.id}>
                                    <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                                        <img src={item.img} style={{ height: '120px', objectFit: 'cover' }} onError={(e) => e.target.src='/logo.jpg'} />
                                        <div className="card-body p-2">
                                            <h6 className="fw-bold mb-1 text-truncate">{item.name}</h6>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span className="fw-bold text-danger">{formatMoney(item.price)}</span>
                                                <button className="btn btn-sm btn-info text-white rounded-circle" onClick={() => addToCart(item)}>+</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {cart.length > 0 && (
                <div className="fixed-bottom p-3 d-flex justify-content-center">
                    <button className="btn w-100 shadow-lg rounded-pill py-3 fw-bold text-white border-0" 
                        style={{ maxWidth: '500px', background: 'linear-gradient(45deg, #00E5FF, #FF00FF)' }}
                        onClick={() => { if(!customerName) setShowAuthModal(true); else setShowModal(true); }}>
                        🛒 {totalItems} món - {formatMoney(totalPrice)}
                    </button>
                </div>
            )}

            {showAuthModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
                    <div className="modal-dialog modal-dialog-centered px-3">
                        <div className="modal-content border-0 rounded-4 p-4 text-center">
                            <h4 className="fw-bold mb-3">Thông tin liên hệ</h4>
                            <input type="text" className="form-control mb-2" placeholder="Tên bạn..." onChange={e => setCustomerName(e.target.value)} />
                            <input type="tel" className="form-control mb-3" placeholder="SĐT Zalo..." onChange={e => setCustomerPhone(e.target.value)} />
                            <button className="btn btn-info text-white w-100 rounded-pill py-2" onClick={() => { localStorage.setItem('alo_customer_name', customerName); localStorage.setItem('alo_customer_phone', customerPhone); setShowAuthModal(false); setShowModal(true); }}>Tiếp tục</button>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
                    <div className="modal-dialog modal-dialog-centered px-2">
                        <div className="modal-content border-0 rounded-4">
                            <div className="modal-header">
                                <h5 className="fw-bold">Xác nhận đơn hàng</h5>
                                <button className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                {cart.map((item, idx) => ( <div key={idx} className="d-flex justify-content-between border-bottom py-1"><span>{item.name}</span><span>{formatMoney(item.price)}</span></div> ))}
                                <div className="mt-3 text-center">
                                    <p className="fw-bold mb-1">Thanh toán Chuyển khoản:</p>
                                    <img src={currentStore?.qr_image ? (currentStore.qr_image.startsWith('http') ? currentStore.qr_image : `https://alo-do-uong.onrender.com${currentStore.qr_image}`) : "https://img.vietqr.io/image/970436-123456789-compact2.png"} alt="QR" style={{ width: '150px' }} />
                                </div>
                            </div>
                            <div className="modal-footer"><button className="btn btn-info w-100 rounded-pill text-white fw-bold" onClick={handleCheckoutAndCopy}>GỬI ĐƠN QUA ZALO</button></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;