from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.db import transaction
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from .models import Store, Product, Category, Order, OrderItem, Customer
from .serializers import StoreSerializer, ProductSerializer, OrderSerializer, CustomerSerializer
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, F

# 0. API Đăng ký & Đăng nhập Admin
class RegisterAdminAPI(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')
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
        email = request.data.get('email')
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

# 1. API lấy danh sách các cửa hàng
class StoreListAPI(generics.ListAPIView):
    queryset = Store.objects.all()
    serializer_class = StoreSerializer

class StoreDetailAPI(generics.RetrieveUpdateAPIView):
    permission_classes = [AllowAny]
    queryset = Store.objects.all()
    serializer_class = StoreSerializer

# 2. API lấy & tạo Sản Phẩm
class ProductListCreateAPI(generics.ListCreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductSerializer

    def get_queryset(self):
        store_id = self.request.query_params.get('store')
        queryset = Product.objects.all()
        if store_id:
            queryset = queryset.filter(store_id=store_id)
        
        active_only = self.request.query_params.get('active', None)
        if active_only == 'true':
            queryset = queryset.filter(is_active=True)
        return queryset

class ProductDetailAPI(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [AllowAny]
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

# 3. API lấy danh sách & cập nhật đơn hàng cho Admin
class OrderListAPI(generics.ListAPIView):
    serializer_class = OrderSerializer
    def get_queryset(self):
        store_id = self.request.query_params.get('store')
        queryset = Order.objects.all().order_by('-created_at')
        if store_id:
            queryset = queryset.filter(store_id=store_id)
        return queryset

class OrderStatusUpdateAPI(generics.UpdateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        new_status = request.data.get('status')
        if new_status:
            instance.status = new_status
            instance.save()
            return Response({"status": "success", "new_status": instance.status})
        return Response({"error": "No status provided"}, status=status.HTTP_400_BAD_REQUEST)

# 4. API Tracking cho Khách hàng
class OrderTrackAPI(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    lookup_field = 'order_code'
    queryset = Order.objects.all()

# 5. API Tạo đơn hàng
class CreateOrderAPI(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        data = request.data
        items_data = data.get('items', [])
        if not items_data:
            return Response({"error": "Giỏ hàng trống!"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            import random, string
            new_code = ''.join(random.choices(string.digits, k=6))
            while Order.objects.filter(order_code=new_code).exists():
                new_code = ''.join(random.choices(string.digits, k=6))

            order = Order.objects.create(
                order_code=new_code,
                store_id=data.get('store', 1),
                customer_name=data.get('customer_name'),
                customer_phone=data.get('customer_phone'),
                address=data.get('address'),
                note=data.get('note', ''),
                total_price=data.get('total_price', 0)
            )

            for item in items_data:
                p_name = item.get('product_name', '').strip()
                qty = int(item.get('quantity', 1))
                price = int(item.get('price', 0))
                product = Product.objects.filter(store_id=order.store_id, name__iexact=p_name).first()
                cost_price = product.cost_price if product else 0
                if product:
                    product.stock = max(0, product.stock - qty)
                    product.save()
                
                OrderItem.objects.create(
                    order=order, product_name=p_name, quantity=qty, price=price, cost_price=cost_price
                )

            customer, created = Customer.objects.get_or_create(
                store_id=order.store_id, phone=data.get('customer_phone'),
                defaults={'name': data.get('customer_name')}
            )
            customer.total_orders += 1
            customer.total_spent += int(data.get('total_price', 0))
            customer.save()

            return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# 6. API Danh sách Khách hàng
class CustomerListAPI(generics.ListAPIView):
    serializer_class = CustomerSerializer
    def get_queryset(self):
        store_id = self.request.query_params.get('store')
        queryset = Customer.objects.all().order_by('-total_spent')
        if store_id:
            queryset = queryset.filter(store_id=store_id)
        return queryset

class RevenueStatsAPI(APIView):
    def get(self, request):
        store_id = request.query_params.get('store')
        if not store_id: return Response({"error": "Vui lòng cung cấp store ID"}, status=400)
        time_range = request.query_params.get('time_range', 'week')
        now = timezone.now()
        
        if time_range == 'today': start_date = now.replace(hour=0, minute=0)
        elif time_range == 'month': start_date = now.replace(day=1, hour=0, minute=0)
        else: start_date = now - timedelta(days=7) # week default

        def get_stats(qs_start, qs_end):
            orders = Order.objects.filter(store_id=store_id, status='Hoàn thành', created_at__gte=qs_start, created_at__lt=qs_end)
            rev = orders.aggregate(Sum('total_price'))['total_price__sum'] or 0
            cost = OrderItem.objects.filter(order__in=orders).aggregate(total=Sum(F('quantity') * F('cost_price')))['total'] or 0
            profit = rev - cost
            margin = (profit / rev * 100) if rev > 0 else 0
            return rev, cost, profit, margin, orders

        cur_rev, cur_cost, cur_profit, cur_margin, cur_orders = get_stats(start_date, now)
        
        metrics = [
            {"label": "Doanh thu", "value": f"{cur_rev:,}₫", "up": True},
            {"label": "Chi phí vốn", "value": f"{cur_cost:,}₫", "up": False},
            {"label": "Lợi nhuận gộp", "value": f"{cur_profit:,}₫", "up": True},
            {"label": "Tỷ suất LN", "value": f"{cur_margin:.1f}%", "up": True},
        ]
        
        days = {}
        for order in cur_orders:
            d = timezone.localtime(order.created_at).strftime('%d/%m')
            days[d] = days.get(d, 0) + order.total_price
            
        chart_data = [{"name": k, "value": v} for k, v in sorted(days.items())]
            
        return Response({"metrics": metrics, "chart_data": chart_data})

class DashboardStatsAPI(APIView):
    def get(self, request):
        store_id = request.query_params.get('store')
        if not store_id: return Response({"error": "Vui lòng cung cấp store ID"}, status=400)
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0)
        
        today_rev = Order.objects.filter(store_id=store_id, created_at__gte=today_start).aggregate(total=Sum('total_price'))['total'] or 0
        new_orders = Order.objects.filter(store_id=store_id, status="Chờ xử lý").count()
        
        top_items = OrderItem.objects.filter(order__store_id=store_id).values('product_name').annotate(total=Sum('quantity')).order_by('-total')[:5]
        top_products = [{"name": i['product_name'], "sales": i['total'], "pct": 100} for i in top_items]

        recent = Order.objects.filter(store_id=store_id).order_by('-created_at')[:5]
        recent_data = [{"id": f"#{o.order_code}", "customer": o.customer_name, "total": f"{o.total_price:,}₫", "status": o.status} for o in recent]

        return Response({
            "metrics": [
                {"label": "Doanh thu hôm nay", "value": f"{today_rev:,}₫", "color": "#00c896"},
                {"label": "Đơn đang chờ", "value": str(new_orders), "color": "#f5a623"},
                {"label": "Tổng đơn", "value": str(Order.objects.filter(store_id=store_id).count()), "color": "#e84a5f"},
            ],
            "top_products": top_products,
            "recent_orders": recent_data
        })

class CreateAdminEmergencyAPI(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        User = get_user_model()
        if not User.objects.filter(username='admin').exists():
            user = User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
            Store.objects.get_or_create(owner=user, defaults={'name': 'Cửa hàng Mẫu', 'phone': '0123'})
            return Response({"status": "Success"})
        return Response({"status": "Already exists"})