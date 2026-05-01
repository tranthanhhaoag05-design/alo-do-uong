import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from stores.models import Store, Category, Product

# Tạo Store mặc định
store, created = Store.objects.get_or_create(
    id=1,
    defaults={'name': 'Cửa hàng Mặc định', 'phone': '0123456789'}
)

# Tạo các Categories
cats = ['Trà Sữa', 'Cà Phê', 'Sinh Tố', 'Nước Ép']
for i, c in enumerate(cats):
    Category.objects.get_or_create(id=i+1, store=store, defaults={'name': c})

print("Database seeded with default store and categories.")
