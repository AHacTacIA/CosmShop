from django.urls import path
from rest_framework import routers
from .views import ProfileViewSet, BrandViewSet, CategoryViewSet, ProductViewSet, ProductImgViewSet, ProductVarViewSet, \
    ReviewViewSet, CartViewSet, CartItemViewSet, OrderViewSet, OrderItemViewSet, BulkCategoryViewSet, \
    BulkProductViewSet, RegisterView

router = routers.DefaultRouter()
router.register(r'bulk-products', BulkProductViewSet, basename='bulk-product')
router.register(r'bulk-categories', BulkCategoryViewSet, basename='bulk-category')
router.register(r'profiles', ProfileViewSet, basename='profile')
router.register(r'brands', BrandViewSet, basename='brand')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'product-images', ProductImgViewSet, basename='product-image')
router.register(r'product-variants', ProductVarViewSet, basename='product-variant')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'carts', CartViewSet, basename='cart')
router.register(r'cart-items', CartItemViewSet, basename='cart-item')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'order-items', OrderItemViewSet, basename='order-item')

urlpatterns = [
                  path('products/search/', ProductViewSet.as_view({'get': 'search_products'}), name='product-search'),
                  path('brands/search/', BrandViewSet.as_view({'get': 'search_brands'}), name='brand-search'),
                  path('profiles/me/', ProfileViewSet.as_view({'get': 'me'}), name='profile-me'),
                  path('products/<int:pk>/favorite/', ProductViewSet.as_view({'post': 'favorite'}),
                       name='product-favorite'),
                  path('products/<int:pk>/unfavorite/', ProductViewSet.as_view({'delete': 'unfavorite'}),
                       name='product-unfavorite'),
                  path('api/register/', RegisterView.as_view(), name='register'),


              ] + router.urls
