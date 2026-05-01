
from django.db import models

# Bảng 1: Quản lý Cửa hàng (Tạp hóa Anh Đô, Coffee Góc Phố...)
class Store(models.Model):
    name = models.CharField(max_length=255, verbose_name="Tên cửa hàng")
    phone = models.CharField(max_length=20, verbose_name="Số Zalo nhận đơn")
    address = models.CharField(max_length=255, verbose_name="Địa chỉ")
    description = models.TextField(blank=True, null=True, verbose_name="Lời giới thiệu/Tagline")
    opening_time = models.TimeField(default="07:00", verbose_name="Giờ mở cửa")
    closing_time = models.TimeField(default="22:00", verbose_name="Giờ đóng cửa")
    is_active = models.BooleanField(default=True, verbose_name="Trạng thái mở cửa")
    latitude = models.FloatField(default=10.762622, verbose_name="Vĩ độ (Lat)") # Mặc định TP.HCM
    longitude = models.FloatField(default=106.660172, verbose_name="Kinh độ (Lng)")
    qr_payment_url = models.FileField(upload_to='store_qrs/', blank=True, null=True, verbose_name="Mã QR thanh toán")
    created_at = models.DateTimeField(auto_now_add=True)
    
    # 🌟 ĐÂY RỒI, DÒNG MỚI NẰM CHUNG HÀNG VỚI CÁC TRƯỜNG Ở TRÊN:
    qr_image = models.CharField(max_length=500, blank=True, null=True, verbose_name="Ảnh QR Thanh Toán")

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
    price = models.IntegerField(verbose_name="Giá bán (VNĐ)")
    cost_price = models.IntegerField(verbose_name="Giá nhập (VNĐ)", default=0)
    stock = models.IntegerField(verbose_name="Số lượng tồn kho", default=0)
    image_url = models.FileField(upload_to='products/', blank=True, null=True, verbose_name="Ảnh sản phẩm")
    is_active = models.BooleanField(default=True, verbose_name="Đang bán")

    def __str__(self):
        return self.name

# Bảng 3.5: Quản lý Khách hàng (Thu thập dữ liệu từ đơn hàng)
class Customer(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='customers', verbose_name="Thuộc cửa hàng")
    name = models.CharField(max_length=255, verbose_name="Tên khách hàng")
    phone = models.CharField(max_length=20, verbose_name="Số điện thoại")
    total_orders = models.IntegerField(default=0, verbose_name="Tổng số đơn")
    total_spent = models.IntegerField(default=0, verbose_name="Tổng chi tiêu")
    last_order_date = models.DateTimeField(auto_now=True, verbose_name="Đơn hàng gần nhất")
    address = models.TextField(blank=True, null=True, verbose_name="Địa chỉ")

    class Meta:
        unique_together = ('store', 'phone')

    def __str__(self):
        return f"{self.name} ({self.phone})"

# Bảng 4: Quản lý Đơn hàng (Thông tin chung)
class Order(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, verbose_name="Cửa hàng")
    customer_name = models.CharField(max_length=255, verbose_name="Tên khách")
    customer_phone = models.CharField(max_length=20, verbose_name="SĐT khách")
    address = models.TextField(verbose_name="Địa chỉ giao")
    note = models.TextField(blank=True, null=True, verbose_name="Ghi chú")
    total_price = models.IntegerField(verbose_name="Tổng tiền")
    status = models.CharField(max_length=50, default="Chờ xử lý", verbose_name="Trạng thái")
    order_code = models.CharField(max_length=6, unique=True, blank=True, verbose_name="Mã đơn 6 số")
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        import random
        import string
        if not self.order_code:
            # Generate a random 6-digit numeric code
            self.order_code = ''.join(random.choices(string.digits, k=6))
            # Ensure uniqueness
            while Order.objects.filter(order_code=self.order_code).exists():
                self.order_code = ''.join(random.choices(string.digits, k=6))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Đơn #{self.order_code} - {self.customer_name}"

# Bảng 5: Chi tiết đơn hàng (Mua những món gì)
class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product_name = models.CharField(max_length=255)
    quantity = models.IntegerField(default=1)
    price = models.IntegerField()
    cost_price = models.IntegerField(verbose_name="Giá nhập lúc mua", default=0)

    def __str__(self):
        return f"{self.quantity} x {self.product_name}"