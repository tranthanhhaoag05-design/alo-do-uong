from django.contrib import admin
from .models import Store, Category, Product, Order, OrderItem

# 1. Đăng ký Cửa hàng
@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'phone')
    list_display_links = ('id', 'name')

# 2. Đăng ký Danh mục
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')

# 3. Đăng ký Sản phẩm
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'price', 'store', 'category')
    list_filter = ('store', 'category')
    list_display_links = ('id', 'name')

# 4. Cách hiển thị món ăn nằm ngay trong đơn hàng
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    # Đã bỏ can_delete = False để ông có thể xóa bớt món bị sai nếu cần
    # Thêm readonly để tránh bấm nhầm làm sai lệch giá tiền của bill
    readonly_fields = ('product_name', 'quantity', 'price') 

# 5. Đăng ký Đơn hàng (ĐÃ NÂNG CẤP ĐỂ KIỂM SOÁT FULL BILL)
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    # Cột hiển thị bên ngoài: Thêm Số điện thoại để dễ nhìn
    list_display = ('id', 'customer_name', 'customer_phone', 'store', 'total_price', 'status', 'created_at')
    
    # BỘ LỌC: Đây là tính năng giúp ông chọn xem riêng từng quán
    list_filter = ('store', 'status', 'created_at')
    
    # THANH TÌM KIẾM: Có thể gõ tìm chữ "Chuyển khoản" hoặc tìm số điện thoại khách
    search_fields = ('customer_name', 'customer_phone', 'note', 'address')
    
    inlines = [OrderItemInline] 
    readonly_fields = ('created_at',)
    
    # ĐỊNH DẠNG LẠI BỐ CỤC BÊN TRONG CHI TIẾT ĐƠN HÀNG
    fieldsets = (
        ('👤 Thông tin Khách Hàng & Quán', {
            'fields': ('customer_name', 'customer_phone', 'store', 'status')
        }),
        ('📝 Chi tiết Giao Hàng & Thanh Toán (Toàn bộ dữ liệu Bill)', {
            'fields': ('address', 'note', 'total_price', 'created_at')
        }),
    )