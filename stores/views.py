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
            return Category.objects.filter(store_id=store_id).order_by('-id')
        return Category.objects.none()

    def perform_create(self, serializer):
        # Khi tạo, nếu frontend gửi store id lên thì dùng, không thì có thể báo lỗi
        serializer.save()


class CategoryDetailAPI(generics.RetrieveUpdateDestroyAPIView):
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
                # Tạo mã đơn 6 số ngẫu nhiên
                import random, string
                code = ''.join(random.choices(string.digits, k=6))
                
                order = Order.objects.create(
                    order_code=code, store_id=data.get('store', 1),
                    customer_name=data.get('customer_name'), customer_phone=data.get('customer_phone'),
                    address=data.get('address'), total_price=data.get('total_price', 0)
                )
                
                # Tự động cập nhật/tạo thông tin Khách hàng
                customer, created = Customer.objects.get_or_create(
                    store_id=order.store_id, 
                    phone=order.customer_phone,
                    defaults={'name': order.customer_name}
                )
                customer.total_orders += 1
                customer.total_spent += int(order.total_price)
                customer.address = order.address
                customer.save()

                for item in data.get('items', []):
                    qty = int(item.get('quantity', 0))
                    product = Product.objects.filter(store_id=order.store_id, name__iexact=item.get('product_name')).first()
                    if not product or product.stock < qty:
                        raise Exception(f"Món '{item.get('product_name')}' chỉ còn {product.stock if product else 0} phần, không đủ để giao!")
                    
                    product.stock -= qty
                    product.save()

                    OrderItem.objects.create(
                        order=order, product_name=item.get('product_name'),
                        quantity=qty, price=item.get('price'),
                        note=item.get('note', ''), cost_price=product.cost_price
                    )
                
                return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# 4. Thống kê & Dashboard
class DashboardStatsAPI(APIView):
    def get(self, request):
        store_id = request.query_params.get('store')
        if not store_id: return Response({"error": "Missing store_id"}, status=400)
        
        now = timezone.now()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        yesterday = today - timedelta(days=1)
        
        # 1. Metrics
        today_rev = Order.objects.filter(store_id=store_id, created_at__gte=today, status__in=['Hoàn thành', 'Chờ xử lý', 'Đang giao']).aggregate(total=Sum('total_price'))['total'] or 0
        yesterday_rev = Order.objects.filter(store_id=store_id, created_at__gte=yesterday, created_at__lt=today, status__in=['Hoàn thành', 'Chờ xử lý', 'Đang giao']).aggregate(total=Sum('total_price'))['total'] or 0
        
        rev_delta = "100%" if yesterday_rev == 0 else f"{int((today_rev - yesterday_rev) / yesterday_rev * 100)}%"
        new_orders = Order.objects.filter(store_id=store_id, status="Chờ xử lý").count()
        
        # 2. Weekly Chart
        weekly_values = []
        days_labels = []
        for i in range(6, -1, -1):
            date = (now - timedelta(days=i)).date()
            val = Order.objects.filter(store_id=store_id, created_at__date=date, status__in=['Hoàn thành', 'Chờ xử lý', 'Đang giao']).aggregate(total=Sum('total_price'))['total'] or 0
            weekly_values.append(val)
            days_labels.append(date.strftime('%d/%m'))

        # 3. Top Products
        top_items = OrderItem.objects.filter(order__store_id=store_id).values('product_name').annotate(total=Sum('quantity')).order_by('-total')[:5]
        max_sales = max([i['total'] for i in top_items], default=1)
        top_products = [{"name": i['product_name'], "sales": i['total'], "pct": int(i['total']/max_sales*100)} for i in top_items]

        # 4. Recent Orders
        recent = Order.objects.filter(store_id=store_id).order_by('-created_at')[:5]
        recent_data = [{"id": f"#{o.order_code}", "customer": o.customer_name, "product": "Đơn hàng", "qty": o.items.count(), "total": f"{o.total_price:,}₫", "status": o.status} for o in recent]

        return Response({
            "metrics": [
                {"label": "Doanh thu hôm nay", "value": f"{today_rev:,}", "unit": "₫", "delta": rev_delta, "up": today_rev >= yesterday_rev, "color": "#00c896"},
                {"label": "Đơn mới", "value": str(new_orders), "unit": "đơn", "delta": "Mới", "up": True, "color": "#2563eb"},
            ],
            "weekly": { "values": weekly_values, "days": days_labels, "total": sum(weekly_values) },
            "top_products": top_products,
            "recent_orders": recent_data
        })

class RevenueStatsAPI(APIView):
    def get(self, request):
        store_id = request.query_params.get('store')
        if not store_id: return Response({"error": "Missing store_id"}, status=400)
        
        range_type = request.query_params.get('time_range', 'week')
        now = timezone.now()
        chart_data = []
        detailed_stats = []
        
        if range_type == 'today':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            orders = Order.objects.filter(store_id=store_id, status='Hoàn thành', created_at__gte=start_date)
            for h in range(24):
                hour_orders = orders.filter(created_at__hour=h)
                rev = hour_orders.aggregate(total=Sum('total_price'))['total'] or 0
                cost = OrderItem.objects.filter(order__in=hour_orders).aggregate(total=Sum(F('quantity') * F('cost_price')))['total'] or 0
                chart_data.append({"name": f"{h:02d}:00", "value": rev - cost})
        
        elif range_type == 'year':
            start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0)
            orders = Order.objects.filter(store_id=store_id, status='Hoàn thành', created_at__gte=start_date)
            for m in range(1, 13):
                month_orders = orders.filter(created_at__month=m)
                rev = month_orders.aggregate(total=Sum('total_price'))['total'] or 0
                cost = OrderItem.objects.filter(order__in=month_orders).aggregate(total=Sum(F('quantity') * F('cost_price')))['total'] or 0
                chart_data.append({"name": f"Tháng {m}", "value": rev - cost})
        
        else: # Week, Month, Custom
            days = 7 if range_type == 'week' else 30
            if range_type == 'custom':
                try:
                    s_str = request.query_params.get('start_date')
                    e_str = request.query_params.get('end_date')
                    start_date = timezone.datetime.strptime(s_str, '%Y-%m-%d')
                    end_date = timezone.datetime.strptime(e_str, '%Y-%m-%d')
                    days = (end_date - start_date).days + 1
                    now = end_date
                except: days = 30
            
            start_date = now - timedelta(days=days-1)
            orders = Order.objects.filter(store_id=store_id, status='Hoàn thành', created_at__gte=start_date.replace(hour=0, minute=0))
            
            for i in range(days-1, -1, -1):
                date = (now - timedelta(days=i)).date()
                day_orders = orders.filter(created_at__date=date)
                rev = day_orders.aggregate(total=Sum('total_price'))['total'] or 0
                cost = OrderItem.objects.filter(order__in=day_orders).aggregate(total=Sum(F('quantity') * F('cost_price')))['total'] or 0
                profit = rev - cost
                chart_data.append({"name": date.strftime('%d/%m'), "value": profit})
                if rev > 0:
                    detailed_stats.append({
                        "date": date.strftime('%d/%m/%Y'),
                        "revenue": f"{rev:,}₫", "cost": f"{cost:,}₫", "profit": f"{profit:,}₫",
                        "margin": f"{int(profit/rev*100)}%" if rev > 0 else "0%"
                    })

        # Cập nhật Metrics tổng quát
        orders_all = Order.objects.filter(store_id=store_id, status='Hoàn thành', created_at__gte=start_date if 'start_date' in locals() else now - timedelta(days=30))
        total_rev = orders_all.aggregate(total=Sum('total_price'))['total'] or 0
        total_cost = OrderItem.objects.filter(order__in=orders_all).aggregate(total=Sum(F('quantity') * F('cost_price')))['total'] or 0
        total_profit = total_rev - total_cost

        return Response({
            "metrics": [
                {"label": "Doanh thu kỳ này", "value": f"{total_rev:,}₫", "delta": "Ổn định", "up": True},
                {"label": "Lợi nhuận ròng", "value": f"{total_profit:,}₫", "delta": f"{int(total_profit/total_rev*100) if total_rev>0 else 0}%", "up": True},
            ],
            "chart_data": chart_data,
            "detailed_stats": detailed_stats[::-1] if detailed_stats else []
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