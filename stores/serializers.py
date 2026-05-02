from rest_framework import serializers
from .models import Store, Product, Order, OrderItem, Customer, Category

class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'cost_price', 'image_url', 'category', 'category_name', 'store', 'is_active', 'stock']

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['product_name', 'quantity', 'price']

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'phone', 'address', 'total_orders', 'total_spent', 'last_order_date']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ['id', 'order_code', 'status', 'store', 'customer_name', 'customer_phone', 'address', 'note', 'total_price', 'items', 'created_at']
        read_only_fields = ['id', 'order_code', 'status', 'created_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item in items_data:
            p_name = item.get('product_name', '').strip()
            product = Product.objects.filter(name__iexact=p_name).first()
            cost_price = product.cost_price if product else 0
            OrderItem.objects.create(order=order, cost_price=cost_price, **item)
        return order