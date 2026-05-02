from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.db import transaction
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, get_user_model
from rest_framework.authtoken.models import Token
from .models import Store, Product, Category, Order, OrderItem, Customer
from .serializers import StoreSerializer, ProductSerializer, OrderSerializer, CustomerSerializer, CategorySerializer
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, F

# 0. API Đăng ký & Đăng nhập Admin
class RegisterAdminAPI(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email', '').lower().strip()
        password = request.data.get('password')
        phone = request.data.get('phone', '')

        if not email or not password:
            return Response({"error": "Vui lòng nhập đầy đủ email và mật khẩu"}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username=email).exists():
            return Response({"error": "Email này đã được đăng ký!"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            user = User.objects.create_user(username=email, email=email, password=password)
            store = Store.objects.create(
                owner=user,
                name=f"Cửa hàng của {email.split('@')[0]}",
                phone=phone,
                address="Chưa cập nhật"
            )
            token, _ = Token.objects.get_or_create(user=user)
            
        return Response({
            "token": token.key,
            "store_id": store.id,
            "user": {"email": user.email}
        }, status=status.HTTP_201_CREATED)

class LoginAdminAPI(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email', '').lower().strip()
        password = request.data.get('password')
        user = authenticate(username=email, password=password)
        
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            store = Store.objects.filter(owner=user).first()
            return Response({
                "token": token.key,
                "store_id": store.id if store else None,
                "user": {"email": user.email}
            })
        return Response({"error": "Thông tin đăng nhập không chính xác"}, status=status.HTTP_400_BAD_REQUEST)

# 1. API Cửa hàng
class StoreListAPI(generics.ListAPIView):
    queryset = Store.objects.all()
    serializer_class = StoreSerializer

class StoreDetailAPI(generics.RetrieveUpdateAPIView):
    permission_classes = [AllowAny]
    queryset = Store.objects.all()
    serializer_class = StoreSerializer

# 1.1 API Danh mục
class CategoryListAPI(generics.ListCreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = CategorySerializer
    def get_queryset(self):
        store_id = self.request.query_params.get('store')
        if store_id:
            return Category.objects.filter(store_id=store_id)
        return Category.objects.none()

class CategoryDetailAPI(generics.RetrieveDestroyAPIView):
    permission_classes = [AllowAny]
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


# 2. API Sản phẩm
class ProductListCreateAPI(generics.ListCreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductSerializer
    def get_queryset(self):
        store_id = self.request.query_params.get('store')
        queryset = Product.objects.all()
        if store_id: queryset = queryset.filter(store_id=store_id)
        if self.request.query_params.get('active') == 'true': queryset = queryset.filter(is_active=True)
        return queryset

class ProductDetailAPI(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [AllowAny]
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

# 3. API Đơn hàng
class OrderListAPI(generics.ListAPIView):
    serializer_class = OrderSerializer
    def get_queryset(self):
        store_id = self.request.query_params.get('store')
        queryset = Order.objects.all().order_by('-created_at')
        if store_id: queryset = queryset.filter(store_id=store_id)
        return queryset

class OrderStatusUpdateAPI(generics.UpdateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

class OrderTrackAPI(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    lookup_field = 'order_code'
    queryset = Order.objects.all()

class CreateOrderAPI(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        data = request.data
        try:
            with transaction.atomic():
                import random, string
                code = ''.join(random.choices(string.digits, k=6))
                order = Order.objects.create(
                    order_code=code, store_id=data.get('store', 1),
                    customer_name=data.get('customer_name'), customer_phone=data.get('customer_phone'),
                    address=data.get('address'), total_price=data.get('total_price', 0)
                )
                for item in data.get('items', []):
                    product = Product.objects.filter(store_id=order.store_id, name__iexact=item.get('product_name')).first()
                    OrderItem.objects.create(
                        order=order, product_name=item.get('product_name'),
                        quantity=item.get('quantity'), price=item.get('price'),
                        cost_price=product.cost_price if product else 0
                    )
                return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
        except Exception as e: return Response({"error": str(e)}, status=400)

# 4. Thống kê & Dashboard
class DashboardStatsAPI(APIView):
    def get(self, request):
        store_id = request.query_params.get('store')
        if not store_id: return Response({"error": "Missing store_id"}, status=400)
        
        now = timezone.now()
        today = now.replace(hour=0, minute=0, second=0)
        
        today_rev = Order.objects.filter(store_id=store_id, created_at__gte=today).aggregate(total=Sum('total_price'))['total'] or 0
        new_orders = Order.objects.filter(store_id=store_id, status="Chờ xử lý").count()
        
        weekly_values = []
        days_labels = []
        for i in range(6, -1, -1):
            date = (now - timedelta(days=i)).date()
            val = Order.objects.filter(store_id=store_id, created_at__date=date).aggregate(total=Sum('total_price'))['total'] or 0
            weekly_values.append(val)
            days_labels.append(date.strftime('%d/%m'))

        top_items = OrderItem.objects.filter(order__store_id=store_id).values('product_name').annotate(total=Sum('quantity')).order_by('-total')[:5]
        top_products = [{"name": i['product_name'], "sales": i['total'], "pct": 100} for i in top_items]

        recent = Order.objects.filter(store_id=store_id).order_by('-created_at')[:5]
        recent_data = [{"id": f"#{o.order_code}", "customer": o.customer_name, "product": "Đơn hàng", "qty": 1, "total": f"{o.total_price:,}₫", "status": o.status} for o in recent]

        return Response({
            "metrics": [
                {"label": "Doanh thu hôm nay", "value": f"{today_rev:,}", "unit": "₫", "delta": "0%", "up": True, "color": "#00c896"},
                {"label": "Đơn mới", "value": str(new_orders), "unit": "đơn", "delta": "0%", "up": True, "color": "#2563eb"},
            ],
            "weekly": { "values": weekly_values, "days": days_labels, "total": sum(weekly_values) },
            "top_products": top_products,
            "recent_orders": recent_data
        })

class RevenueStatsAPI(APIView):
    def get(self, request):
        store_id = request.query_params.get('store')
        if not store_id: return Response({"error": "Missing store_id"}, status=400)
        orders = Order.objects.filter(store_id=store_id, status='Hoàn thành')
        rev = orders.aggregate(total=Sum('total_price'))['total'] or 0
        cost = OrderItem.objects.filter(order__in=orders).aggregate(total=Sum(F('quantity') * F('cost_price')))['total'] or 0
        
        return Response({
            "metrics": [
                {"label": "Tổng doanh thu", "value": f"{rev:,}₫", "delta": "0%", "up": True},
                {"label": "Lợi nhuận", "value": f"{(rev-cost):,}₫", "delta": "0%", "up": True},
            ],
            "chart_data": [], "detailed_stats": []
        })

class CustomerListAPI(generics.ListAPIView):
    serializer_class = CustomerSerializer
    def get_queryset(self):
        store_id = self.request.query_params.get('store')
        return Customer.objects.filter(store_id=store_id) if store_id else Customer.objects.none()

class CreateAdminEmergencyAPI(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        user, created = User.objects.get_or_create(username='admin@admin.com', email='admin@admin.com')
        user.set_password('admin123')
        user.save()
        store, _ = Store.objects.get_or_create(owner=user, defaults={'name': 'Cửa hàng Tổng', 'phone': '0900000000'})
        return Response({"status": "Reset thành công admin@admin.com / admin123"})