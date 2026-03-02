from rest_framework import generics
from .models import Store, Product, Order, OrderItem
from .serializers import StoreSerializer, ProductSerializer, OrderSerializer
from rest_framework.response import Response
from rest_framework import status

class CreateOrderAPI(generics.CreateAPIView):
    serializer_class = OrderSerializer

# 1. API lấy danh sách các cửa hàng (Để biết quán nào ID số mấy)
class StoreListAPI(generics.ListAPIView):
    queryset = Store.objects.all()
    serializer_class = StoreSerializer

# 2. API lấy Menu (Có chức năng lọc theo ID cửa hàng)
class ProductListAPI(generics.ListAPIView):
    serializer_class = ProductSerializer

    def get_queryset(self):
        # Mặc định lấy các món đang mở bán
        queryset = Product.objects.filter(is_active=True)
        # Lấy ID cửa hàng từ đường link (nếu có)
        store_id = self.request.query_params.get('store', None)
        if store_id is not None:
            queryset = queryset.filter(store_id=store_id)
        return queryset