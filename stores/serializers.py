from rest_framework import serializers
from .models import Store, Product, Order, OrderItem

class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    # Lấy thêm tên danh mục để lát nữa hiển thị lên App cho dễ
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'image_url', 'category', 'category_name', 'store']

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['product_name', 'quantity', 'price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True) # Nhận danh sách các món khách mua

    class Meta:
        model = Order
        fields = ['id', 'store', 'customer_name', 'customer_phone', 'address', 'note', 'total_price', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item in items_data:
            OrderItem.objects.create(order=order, **item)
        return order       