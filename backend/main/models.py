from django.conf import settings
from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils.text import slugify



class Brand(models.Model):
    name = models.CharField(max_length=150, verbose_name='Название бренда')
    slug = models.SlugField(max_length=100, unique=True)
    country = models.TextField(verbose_name='Страна',null=False, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Бренд'
        verbose_name_plural = 'Бренды'
        db_table = 'main_brands'


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name='Название категории')
    slug = models.SlugField(max_length=100, unique=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children',
                               verbose_name='Подкатегория категории')

    def __str__(self):
        return f'{self.name} - {self.parent}'

    class Meta:
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
        db_table = 'main_categories'


class Product(models.Model):
    name = models.CharField(max_length=200, verbose_name='Название продукта')
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    sh_descr = models.TextField(verbose_name='Краткое описание')
    descr = models.TextField(verbose_name='Описание',null=False, blank=True)
    usage = models.TextField(verbose_name='Использование',null=False, blank=True)
    composition = models.TextField(verbose_name='Состав',null=False, blank=True)
    category = models.ForeignKey(Category, related_name='products', on_delete=models.CASCADE,
                                 verbose_name='Категория продукта')
    brand = models.ForeignKey(Brand, related_name='products', on_delete=models.CASCADE, null=True, blank=True,
                              verbose_name='Бренд продукта')

    def __str__(self):
        return f'{self.name} - {self.brand}'

    class Meta:
        verbose_name = 'Продукт'
        verbose_name_plural = 'Продукты'
        db_table = 'main_products'


class ProductVar(models.Model):
    product = models.ForeignKey(Product, related_name='variants', on_delete=models.CASCADE,
                                verbose_name='Продукт')
    art = models.CharField(max_length=100, unique=True, verbose_name='Артикул')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Цена')
    volume = models.CharField(max_length=50, blank=True, null=True, verbose_name='Объём')
    volume_unit = models.CharField(max_length=20, blank=True, null=True, verbose_name='Единица измерения')
    color = models.CharField(max_length=100, blank=True, null=True, verbose_name='Цвет')
    slug = models.SlugField(max_length=200, unique=True, blank=True)

    def __str__(self):
        return f'{self.product.name} - {self.art}'

    class Meta:
        verbose_name = 'Вариант продукта'
        verbose_name_plural = 'Варианты продуктов'
        db_table = 'main_product_variants'


class ProductImg(models.Model):
    variant = models.ForeignKey(ProductVar, related_name='images', on_delete=models.CASCADE,
                                verbose_name='Вариант продукта')
    image = models.ImageField(upload_to='products/images/', verbose_name='Изображение')
    is_main = models.BooleanField(default=False, verbose_name='Главное изображение')

    def __str__(self):
        return f'Изображение для {self.variant.art}'

    class Meta:
        verbose_name = 'Изображение продукта'
        verbose_name_plural = 'Изображения продуктов'
        db_table = 'main_product_images'


@receiver(pre_save, sender=Product)
def generate_product_slug(sender, instance, **kwargs):
    if not instance.slug:
        base_slug = f"{instance.name}-{instance.brand.name}"
        instance.slug = slugify(base_slug)

        # Проверяем уникальность
        original_slug = instance.slug
        counter = 1
        while Product.objects.filter(slug=instance.slug).exclude(pk=instance.pk).exists():
            instance.slug = f"{original_slug}-{counter}"
            counter += 1


@receiver(pre_save, sender=ProductVar)
def generate_variant_slug(sender, instance, **kwargs):
    if not instance.slug:
        base_slug = f"{instance.art}-{instance.product.name}"
        instance.slug = slugify(base_slug)

        # Проверяем уникальность
        original_slug = instance.slug
        counter = 1
        while ProductVar.objects.filter(slug=instance.slug).exclude(pk=instance.pk).exists():
            instance.slug = f"{original_slug}-{counter}"
            counter += 1










class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    favorites = models.ManyToManyField(Product, blank=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True, verbose_name='Номер телефона')
    address = models.TextField(blank=True, null=True, verbose_name='Адрес')
    birth_date = models.DateField(null=True, blank=True, verbose_name='Дата рождения')

    def __str__(self):
        return self.user.username

    class Meta:
        verbose_name = 'Профиль'
        verbose_name_plural = 'Профили'
        db_table = 'main_profiles'



class Review(models.Model):
    product = models.ForeignKey(Product, related_name='reviews', on_delete=models.CASCADE)
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE)
    rating = models.PositiveIntegerField(verbose_name='Оценка')
    comment = models.TextField( verbose_name='Комментарий')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата публикации')

    def __str__(self):
        return f"Review by {self.profile.username} for {self.product.name}"

    class Meta:
        verbose_name = 'Отзыв'
        verbose_name_plural = 'Отзывы'
        db_table = 'main_reviews'


class Cart(models.Model):
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    def __str__(self):
        return f"Cart of {self.profile.user.username}"

    class Meta:
        verbose_name = 'Корзина'
        verbose_name_plural = 'Корзины'
        db_table = 'main_carts'


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name='Продукт')
    variant = models.ForeignKey(ProductVar, on_delete=models.CASCADE, null=True, blank=True,
                                verbose_name='Вариант продукта')
    quantity = models.PositiveIntegerField(default=1, verbose_name='Количество')

    def __str__(self):
        return f"{self.quantity} x {self.product.name} in cart {self.cart.id}"

    class Meta:
        verbose_name = 'Элементы корзины'
        verbose_name_plural = 'Элементы корзин'
        db_table = 'main_cart_items'


class Order(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='orders')
    total_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Итоговая цена')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=50, choices=(
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ), default='pending', verbose_name='Статус заказа')

    def __str__(self):
        return f"Order {self.id} by {self.profile.user.username}"

    class Meta:
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'
        db_table = 'main_orders'


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name='Продукт')
    variant = models.ForeignKey(ProductVar, on_delete=models.CASCADE, null=True, blank=True,
                                verbose_name='Вариант продукта')
    quantity = models.PositiveIntegerField( verbose_name='Количество')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Цена')

    def __str__(self):
        return f"{self.quantity} x {self.product.name} in order {self.order.id}"

    class Meta:
        verbose_name = 'Элементы заказы'
        verbose_name_plural = 'Элементы заказов'
        db_table = 'main_order_items'
