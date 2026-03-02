

from django.db import models

# Bảng 1: Quản lý Cửa hàng (Tạp hóa Anh Đô, Coffee Góc Phố...)
class Store(models.Model):
    name = models.CharField(max_length=255, verbose_name="Tên cửa hàng")
    phone = models.CharField(max_length=20, verbose_name="Số Zalo nhận đơn")
    address = models.CharField(max_length=255, blank=True, null=True, verbose_name="Địa chỉ")
    created_at = models.DateTimeField(auto_now_add=True)
    
    # 🌟 ĐÂY RỒI, DÒNG MỚI NẰM CHUNG HÀNG VỚI CÁC TRƯỜNG Ở TRÊN:
    qr_image = models.ImageField(upload_to='store_qrs/', blank=True, null=True, verbose_name="Ảnh QR Thanh Toán")

    # Chỉ giữ lại ĐÚNG 1 CÁI hàm này ở dưới cùng thôi nhé
    def __str__(self):
        return self.name

# Bảng 2: Quản lý Danh mục (Nước ngọt, Đồ ăn vặt, Cà phê...)
class Category(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='categories', verbose_name="Thuộc cửa hàng")
    name = models.CharField(max_length=255, verbose_name="Tên danh mục")

    def __str__(self):
        return f"{self.name} - {self.store.name}"

# Bảng 3: Quản lý Sản phẩm (Sting, Bò húc, Bạc xỉu...)
class Product(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='products', verbose_name="Thuộc cửa hàng")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products', verbose_name="Danh mục")
    name = models.CharField(max_length=255, verbose_name="Tên món")
    price = models.IntegerField(verbose_name="Giá tiền (VNĐ)")
    image_url = models.CharField(max_length=500, blank=True, null=True, verbose_name="Link ảnh")
    is_active = models.BooleanField(default=True, verbose_name="Đang bán")

    def __str__(self):
        return self.name

# Bảng 4: Quản lý Đơn hàng (Thông tin chung)
class Order(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, verbose_name="Cửa hàng")
    customer_name = models.CharField(max_length=255, verbose_name="Tên khách")
    customer_phone = models.CharField(max_length=20, verbose_name="SĐT khách")
    address = models.TextField(verbose_name="Địa chỉ giao")
    note = models.TextField(blank=True, null=True, verbose_name="Ghi chú")
    total_price = models.IntegerField(verbose_name="Tổng tiền")
    status = models.CharField(max_length=50, default="Chờ xử lý", verbose_name="Trạng thái")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Đơn #{self.id} - {self.customer_name}"

# Bảng 5: Chi tiết đơn hàng (Mua những món gì)
class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product_name = models.CharField(max_length=255)
    quantity = models.IntegerField(default=1)
    price = models.IntegerField()