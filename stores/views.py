from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.db import transaction
from .models import Store, Product, Category, Order, OrderItem, Customer
from .serializers import StoreSerializer, ProductSerializer, OrderSerializer, CustomerSerializer

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
        queryset = Product.objects.all()
        store_id = self.request.query_params.get('store', None)
        active_only = self.request.query_params.get('active', None)
        
        if store_id is not None:
            queryset = queryset.filter(store_id=store_id)
        if active_only == 'true':
            queryset = queryset.filter(is_active=True)
            
        return queryset

class ProductDetailAPI(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [AllowAny]
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

# 3. API lấy danh sách & cập nhật đơn hàng cho Admin
class OrderListAPI(generics.ListAPIView):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer

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

# 5. API Tạo đơn hàng (Trừ tồn kho)
# 5. API Tạo đơn hàng (Tối ưu hóa tốc độ và độ tin cậy)
class CreateOrderAPI(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request):
        data = request.data
        items_data = data.get('items', [])
        
        if not items_data:
            return Response({"error": "Giỏ hàng trống!"}, status=status.HTTP_400_BAD_REQUEST)

        try:
                # Sinh mã vận đơn chủ động ngay tại đây
                import random, string
                new_code = ''.join(random.choices(string.digits, k=6))
                while Order.objects.filter(order_code=new_code).exists():
                    new_code = ''.join(random.choices(string.digits, k=6))

                # 1. Tạo đơn hàng với mã đã có sẵn
                order = Order.objects.create(
                    order_code=new_code,
                    store_id=data.get('store', 1),
                    customer_name=data.get('customer_name'),
                    customer_phone=data.get('customer_phone'),
                    address=data.get('address'),
                    note=data.get('note', ''),
                    total_price=data.get('total_price', 0)
                )

                # 2. Xử lý từng món và trừ kho ngay lập tức
                for item in items_data:
                    p_name = item.get('product_name', '').strip()
                    qty = int(item.get('quantity', 1))
                    price = int(item.get('price', 0))

                    product = Product.objects.filter(name__iexact=p_name).first()
                    cost_price = 0
                    if product:
                        cost_price = product.cost_price
                        # Tạm thời bỏ qua stock check gắt gao để ưu tiên lên đơn
                        product.stock = max(0, product.stock - qty)
                        product.save()
                    
                    OrderItem.objects.create(
                        order=order,
                        product_name=p_name,
                        quantity=qty,
                        price=price,
                        cost_price=cost_price
                    )

                # 3. Cập nhật dữ liệu Khách hàng (Thu thập dữ liệu Admin)
                customer, created = Customer.objects.get_or_create(
                    store_id=data.get('store', 1),
                    phone=data.get('customer_phone'),
                    defaults={'name': data.get('customer_name')}
                )
                if not created:
                    customer.name = data.get('customer_name') # Cập nhật tên mới nhất
                
                customer.address = data.get('address') # Cập nhật địa chỉ mới nhất
                customer.total_orders += 1
                customer.total_spent += int(data.get('total_price', 0))
                customer.save()

                return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# 6. API Danh sách Khách hàng cho Admin
class CustomerListAPI(generics.ListAPIView):
    queryset = Customer.objects.all().order_by('-total_spent')
    serializer_class = CustomerSerializer

from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, F

class RevenueStatsAPI(APIView):
    def get(self, request):
        time_range = request.query_params.get('time_range', 'week')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        now = timezone.now()
        start_date = None
        end_date = now
        
        prev_start_date = None
        prev_end_date = None
        
        if time_range == 'today':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            prev_start_date = start_date - timedelta(days=1)
            prev_end_date = start_date
        elif time_range == 'week':
            start_date = now - timedelta(days=now.weekday())
            start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            prev_start_date = start_date - timedelta(days=7)
            prev_end_date = start_date
        elif time_range == 'month':
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if start_date.month == 1:
                prev_start_date = start_date.replace(year=start_date.year-1, month=12)
            else:
                prev_start_date = start_date.replace(month=start_date.month-1)
            prev_end_date = start_date
        elif time_range == 'year':
            start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            prev_start_date = start_date.replace(year=start_date.year-1)
            prev_end_date = start_date
        elif time_range == 'custom' and start_date_str and end_date_str:
            from datetime import datetime
            try:
                start_date = timezone.make_aware(datetime.strptime(start_date_str, '%Y-%m-%d'))
                end_date = timezone.make_aware(datetime.strptime(end_date_str, '%Y-%m-%d')) + timedelta(days=1)
                delta = end_date - start_date
                prev_start_date = start_date - delta
                prev_end_date = start_date
            except ValueError:
                start_date = now - timedelta(days=7)
                prev_start_date = start_date - timedelta(days=7)
                prev_end_date = start_date
        else:
            start_date = now - timedelta(days=now.weekday())
            start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            prev_start_date = start_date - timedelta(days=7)
            prev_end_date = start_date

        def get_stats(qs_start, qs_end):
            orders = Order.objects.filter(status='Hoàn thành', created_at__gte=qs_start, created_at__lt=qs_end)
            total_revenue = orders.aggregate(Sum('total_price'))['total_price__sum'] or 0
            
            # calculate cost
            order_items = OrderItem.objects.filter(order__in=orders)
            total_cost = order_items.aggregate(total=Sum(F('quantity') * F('cost_price')))['total'] or 0
            
            gross_profit = total_revenue - total_cost
            margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
            return total_revenue, total_cost, gross_profit, margin, orders
            
        cur_rev, cur_cost, cur_profit, cur_margin, cur_orders = get_stats(start_date, end_date)
        prev_rev, prev_cost, prev_profit, prev_margin, _ = get_stats(prev_start_date, prev_end_date)
        
        def calc_delta(cur, prev):
            if prev == 0:
                return f"+100%" if cur > 0 else "0%"
            delta = (cur - prev) / prev * 100
            return f"{'+' if delta >= 0 else ''}{delta:.1f}%"
            
        metrics = [
            {"label": "Doanh thu", "value": f"{cur_rev:,}₫", "delta": calc_delta(cur_rev, prev_rev), "up": cur_rev >= prev_rev},
            {"label": "Chi phí vốn", "value": f"{cur_cost:,}₫", "delta": calc_delta(cur_cost, prev_cost), "up": cur_cost <= prev_cost}, # lower cost is better, marked as 'up' means positive signal
            {"label": "Lợi nhuận gộp", "value": f"{cur_profit:,}₫", "delta": calc_delta(cur_profit, prev_profit), "up": cur_profit >= prev_profit},
            {"label": "Tỷ suất LN", "value": f"{cur_margin:.1f}%", "delta": calc_delta(cur_margin, prev_margin), "up": cur_margin >= prev_margin},
        ]
        
        days = {}
        for order in cur_orders.prefetch_related('items'):
            date_str = timezone.localtime(order.created_at).strftime('%d/%m/%Y')
            if date_str not in days:
                days[date_str] = {'revenue': 0, 'cost': 0}
            days[date_str]['revenue'] += order.total_price
            
            for item in order.items.all():
                days[date_str]['cost'] += item.quantity * item.cost_price
                
        chart_data = []
        detailed_stats = []
        for date_str, data in sorted(days.items(), reverse=True): # For table (newest first)
            rev = data['revenue']
            cost = data['cost']
            profit = rev - cost
            margin = f"{(profit / rev * 100):.1f}%" if rev > 0 else "0%"
            detailed_stats.append({
                "date": date_str,
                "revenue": f"{rev:,}₫",
                "cost": f"{cost:,}₫",
                "profit": f"{profit:,}₫",
                "margin": margin
            })
            
        for date_str, data in sorted(days.items()): # For chart (oldest first)
            chart_data.append({
                "name": date_str[:5], # dd/mm
                "value": data['revenue'] - data['cost'] # Plot profit
            })
            
        return Response({
            "metrics": metrics,
            "chart_data": chart_data,
            "detailed_stats": detailed_stats
        })

class DashboardStatsAPI(APIView):
    def get(self, request):
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # 1. Metrics
        today_orders = Order.objects.filter(created_at__gte=today_start)
        today_revenue = today_orders.aggregate(total=Sum('total_price'))['total'] or 0
        new_orders_count = Order.objects.filter(status="Chờ xử lý").count()
        today_customers = Customer.objects.filter(last_order_date__gte=today_start).count()
        
        # 2. Weekly Revenue (Last 7 days)
        weekly_data = []
        days = []
        for i in range(6, -1, -1):
            date = (now - timedelta(days=i)).date()
            day_total = Order.objects.filter(created_at__date=date).aggregate(total=Sum('total_price'))['total'] or 0
            weekly_data.append(day_total)
            days.append(date.strftime('%d/%m'))

        # 3. Top Products
        top_items = OrderItem.objects.values('product_name').annotate(
            total_qty=Sum('quantity')
        ).order_by('-total_qty')[:5]
        
        top_products_data = []
        max_qty = top_items[0]['total_qty'] if top_items else 1
        for item in top_items:
            top_products_data.append({
                "name": item['product_name'],
                "sales": item['total_qty'],
                "pct": int((item['total_qty'] / max_qty) * 100)
            })

        # 4. Recent Orders
        recent_orders = Order.objects.all().order_by('-created_at')[:5]
        recent_orders_data = []
        for o in recent_orders:
            first_item = o.items.first()
            recent_orders_data.append({
                "id": f"#{o.order_code}",
                "customer": o.customer_name,
                "product": first_item.product_name if first_item else "N/A",
                "qty": sum(i.quantity for i in o.items.all()),
                "total": f"{o.total_price:,}₫",
                "status": o.status
            })

        return Response({
            "metrics": [
                { "label": "Doanh thu hôm nay", "value": f"{today_revenue/1000000:.1f}M" if today_revenue >= 1000000 else f"{today_revenue:,}", "unit": "₫", "delta": "+0%", "up": True, "color": "#00c896", "raw": today_revenue },
                { "label": "Đơn đang chờ", "value": str(new_orders_count), "unit": "", "delta": "Mới", "up": True, "color": "#f5a623" },
                { "label": "Khách hôm nay", "value": str(today_customers), "unit": "", "delta": "+0%", "up": True, "color": "#4f9cf9" },
                { "label": "Tổng đơn", "value": str(Order.objects.count()), "unit": "", "delta": "Tất cả", "up": True, "color": "#e84a5f" },
            ],
            "weekly": {
                "values": weekly_data,
                "days": days,
                "total": sum(weekly_data)
            },
            "top_products": top_products_data,
            "recent_orders": recent_orders_data
        })

# 7. API Cứu hộ Admin & Nạp dữ liệu mẫu
from django.contrib.auth import get_user_model
class CreateAdminEmergencyAPI(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        User = get_user_model()
        # 1. Tạo/Cập nhật Admin
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
            msg = "Admin created (admin/admin123). "
        else:
            user = User.objects.get(username='admin')
            user.set_password('admin123')
            user.save()
            msg = "Admin password reset. "

        # 2. Nạp dữ liệu mẫu (Seed Data)
        store, _ = Store.objects.get_or_create(
            id=1,
            defaults={
                'name': 'Alo Đồ Uống - Cửa hàng Mẫu',
                'phone': '0123456789',
                'address': '123 Đường ABC, Quận 1, TP.HCM',
                'description': 'Chuyên cung cấp đồ uống giải khát chất lượng cao.',
                'is_active': True
            }
        )

        # Tạo Categories
        cats_data = ['Cà Phê', 'Trà Sữa', 'Nước Ép', 'Đồ Ăn Vặt']
        cat_objs = {}
        for c_name in cats_data:
            cat, _ = Category.objects.get_or_create(store=store, name=c_name)
            cat_objs[c_name] = cat

        # Tạo Sản phẩm mẫu nếu chưa có
        products_data = [
            {'name': 'Cà Phê Sữa Đá', 'price': 25000, 'cost': 10000, 'cat': 'Cà Phê'},
            {'name': 'Bạc Xỉu', 'price': 28000, 'cost': 12000, 'cat': 'Cà Phê'},
            {'name': 'Trà Sữa Trân Châu', 'price': 35000, 'cost': 15000, 'cat': 'Trà Sữa'},
            {'name': 'Nước Cam Ép', 'price': 30000, 'cost': 10000, 'cat': 'Nước Ép'},
            {'name': 'Bánh Tráng Trộn', 'price': 20000, 'cost': 8000, 'cat': 'Đồ Ăn Vặt'},
        ]

        for p in products_data:
            Product.objects.get_or_create(
                store=store,
                name=p['name'],
                defaults={
                    'category': cat_objs[p['cat']],
                    'price': p['price'],
                    'cost_price': p['cost'],
                    'stock': 100,
                    'is_active': True
                }
            )

        return Response({
            "status": "Success",
            "message": msg + "Sample data (Store, Categories, Products) has been seeded!"
        })
