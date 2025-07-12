from django.contrib import admin
from django.utils.text import slugify

from .models import (
    Profile, Brand, Category, Product, ProductImg, ProductVar,
    Review, Cart, CartItem, Order, OrderItem
)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone_number', 'address', 'birth_date')
    search_fields = ('user__username', 'phone_number')
    list_filter = ('birth_date',)


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'country')
    search_fields = ('name', 'country')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'parent')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}
    list_filter = ('parent',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'brand')
    search_fields = ('name', 'category__name', 'brand__name')
    # prepopulated_fields = {'slug': ('name',)}
    list_filter = ('category', 'brand')


@admin.register(ProductImg)
class ProductImgAdmin(admin.ModelAdmin):
    list_display = ('variant', 'image', 'is_main')
    search_fields = ('product__name',)
    list_filter = ('is_main',)


@admin.register(ProductVar)
class ProductVarAdmin(admin.ModelAdmin):
    list_display = ('get_product_name', 'color', 'volume', 'price', 'art','slug')
    search_fields = ('product__name', 'art')
    # prepopulated_fields = {'slug': ('art', 'product',)}
    list_filter = ('color', 'volume')
    readonly_fields = ('slug',)  # Делаем slug только для чтения

    def get_product_name(self, obj):
        return obj.product.name

    get_product_name.short_description = 'Product'
    # def save_model(self, request, obj, form, change):
    #     # Если slug пустой, вызываем сигнал для его генерации
    #     if not obj.slug:
    #         generate_productvar_slug(ProductVar, obj)
    #     super().save_model(request, obj, form, change)




@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'profile', 'rating', 'created_at')
    search_fields = ('product__name', 'profile__user__username')
    list_filter = ('rating', 'created_at')


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 1


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('profile', 'created_at', 'updated_at')
    inlines = [CartItemInline]


# @admin.register(Cart)
# class CartAdmin(admin.ModelAdmin):
#     list_display = ('profile', 'created_at', 'updated_at')
#     search_fields = ('profile__user__username',)
#     list_filter = ('created_at', 'updated_at')


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('cart', 'product', 'variant', 'quantity')
    search_fields = ('cart__profile__user__username', 'product__name')
    list_filter = ('cart', 'product')


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('profile', 'total_price', 'status', 'created_at', 'updated_at')
    search_fields = ('profile__user__username',)
    list_filter = ('status', 'created_at', 'updated_at')
    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'variant', 'quantity', 'price')
    search_fields = ('order__profile__user__username', 'product__name')
    list_filter = ('order', 'product')
