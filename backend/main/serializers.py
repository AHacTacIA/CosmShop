from django.db import transaction
from rest_framework import serializers
from .models import Profile, Brand, Category, Product, ProductImg, ProductVar, Review, Cart, CartItem, Order, OrderItem


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['id', 'user', 'phone_number', 'address', 'birth_date']


class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['favorites']


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['name', 'country', 'slug']
        extra_kwargs = {
            'name': {'validators': []},
            'slug': {'validators': []}
        }

    def create(self, validated_data):
        brand, created = Brand.objects.get_or_create(
            slug=validated_data['slug'],
            defaults=validated_data
        )
        return brand

class BulkCategorySerializer(serializers.ListSerializer):
    def create(self, validated_data):
        categories = [Category(**item) for item in validated_data]
        return Category.objects.bulk_create(categories)


class CategorySerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=True)
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'parent']
        extra_kwargs = {
            'name': {'validators': []},
            'slug': {'validators': []}
        }
        list_serializer_class = BulkCategorySerializer

    def create(self, validated_data):
        category, created = Category.objects.get_or_create(
            id=validated_data['id'],
            defaults=validated_data
        )
        return category


class ProductImgSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImg
        fields = ['image', 'is_main']

    def to_internal_value(self, data):
        # Преобразуем путь в файл
        return {'image': data['image'], 'is_main': data['is_main']}

class ProductVarSerializer(serializers.ModelSerializer):
    # images = serializers.SerializerMethodField(many=True)
    images = ProductImgSerializer(many=True)

    class Meta:
        model = ProductVar
        fields = ['art', 'price', 'volume', 'volume_unit', 'color', 'slug', 'images']

    # def get_images(self, obj):
    #     return ProductImgSerializer(obj.images.all(), many=True).data


class BulkProductSerializer(serializers.ListSerializer):
    def create(self, validated_data):
        # Этап 1: Подготовка данных
        brand_data_map = {}
        category_data_map = {}
        product_data_list = []

        # Собираем и дедуплицируем данные
        for product_data in validated_data:
            # Обрабатываем бренд
            brand_data = product_data.pop('brand')
            brand_slug = brand_data['slug']
            brand_data_map[brand_slug] = brand_data

            # Обрабатываем категорию
            category_data = product_data.pop('category')
            category_id = category_data['id']
            category_data_map[category_id] = category_data

            # Сохраняем данные продукта
            product_data_list.append({
                'data': product_data,
                'brand_slug': brand_slug,
                'category_id': category_id,
                'variants': product_data.pop('variants', [])
            })

        # Этап 2: Создание объектов в транзакции
        with transaction.atomic():
            # Создаем или получаем бренды
            brands = {
                slug: Brand.objects.get_or_create(slug=slug, defaults=data)[0]
                for slug, data in brand_data_map.items()
            }

            # Создаем или получаем категории
            categories = {
                id: Category.objects.get_or_create(id=id, defaults=data)[0]
                for id, data in category_data_map.items()
            }

            # Создаем продукты
            products = []
            variants_to_create = []
            images_to_create = []

            for item in product_data_list:
                product = Product.objects.create(
                    brand=brands[item['brand_slug']],
                    category=categories[item['category_id']],
                    **item['data']
                )
                products.append(product)

                # Подготавливаем варианты и изображения
                for variant_data in item['variants']:
                    variant = ProductVar(
                        product=product,
                        **{k: v for k, v in variant_data.items() if k != 'images'}
                    )
                    variants_to_create.append(variant)

                    # Подготавливаем изображения
                    for image_data in variant_data.get('images', []):
                        images_to_create.append(ProductImg(
                            variant=variant,
                            image=image_data['image'],
                            is_main=image_data.get('is_main', False)
                        ))

            # Массово создаем варианты
            if variants_to_create:
                ProductVar.objects.bulk_create(variants_to_create)

            # Массово создаем изображения
            if images_to_create:
                ProductImg.objects.bulk_create(images_to_create)

        return products

class ProductSerializer(serializers.ModelSerializer):
    # category = CategorySerializer()
    brand = BrandSerializer()
    variants = ProductVarSerializer(many=True)
    category = CategorySerializer()

    class Meta:
        model = Product
        fields = '__all__'
        list_serializer_class = BulkProductSerializer
        # fields = ['name', 'brand', 'category_id', 'sh_descr', 'descr', 'usage', 'composition', 'variants']

    def create(self, validated_data):
        # 1. Обработка бренда
        brand_data = validated_data.pop('brand')
        brand, _ = Brand.objects.get_or_create(
            slug=brand_data['slug'],
            defaults=brand_data
        )

        # 2. Обработка категории
        category_data = validated_data.pop('category')
        try:
            category = Category.objects.get(id=category_data['id'])
        except Category.DoesNotExist:
            category = Category.objects.create(**category_data)

        # 3. Создаем основной продукт
        product = Product.objects.create(
            brand=brand,
            category=category,
            **{k: v for k, v in validated_data.items() if k != 'variants'}
        )

        # 4. Обработка вариантов
        variants_data = validated_data.pop('variants', [])
        variants = []
        for variant_data in variants_data:
            images_data = variant_data.pop('images', [])

            # Создаем вариант продукта
            variant = ProductVar.objects.create(
                product=product,
                **variant_data
            )

            # Создаем изображения для варианта
            ProductImg.objects.bulk_create([
                ProductImg(variant=variant, **img_data)
                for img_data in images_data
            ])
            variants.append(variant)

        # 5. Устанавливаем варианты для продукта
        product.variants.set(variants)

        return product








class ReviewSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    product = ProductSerializer(read_only=True)

    class Meta:
        model = Review
        fields = '__all__'


class CartSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = Cart
        fields = '__all__'


class CartItemSerializer(serializers.ModelSerializer):
    cart = CartSerializer(read_only=True)
    product = ProductSerializer(read_only=True)
    variant = ProductVarSerializer(read_only=True)

    class Meta:
        model = CartItem
        fields = '__all__'


class OrderSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = Order
        fields = '__all__'


class OrderItemSerializer(serializers.ModelSerializer):
    order = OrderSerializer(read_only=True)
    product = ProductSerializer(read_only=True)
    variant = ProductVarSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = '__all__'


class CartWithItemsSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'user', 'created_at', 'updated_at', 'items']
