from django_filters import NumberFilter
from django_filters.rest_framework import DjangoFilterBackend, FilterSet
from rest_framework import filters, viewsets, permissions, status, generics
# from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.pagination import PageNumberPagination

class FavoritePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

from .models import Profile, Brand, Category, Product, ProductImg, ProductVar, Review, Cart, CartItem, Order, OrderItem
from .serializers import (
    ProfileSerializer, BrandSerializer,
    CategorySerializer, ProductSerializer,
    ProductImgSerializer, ProductVarSerializer,
    ReviewSerializer, CartSerializer,
    CartItemSerializer, OrderSerializer,
    OrderItemSerializer, UserRegistrationSerializer
)
from .permissions import IsAdminOrReadOnly, IsOwnerOrReadOnly


class BulkCategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

# from django_filters.rest_framework import DjangoFilterBackend

class BulkProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def create(self, request, *args, **kwargs):
        # Проверяем, что данные пришли в виде списка
        if not isinstance(request.data, list):
            return Response(
                {"error": "Expected a list of products"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)

        try:
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class ProductFilter(FilterSet):
    min_price = NumberFilter(field_name="price", lookup_expr='gte')
    max_price = NumberFilter(field_name="price", lookup_expr='lte')

    class Meta:
        model = Product
        fields = ['category', 'brand', 'min_price', 'max_price']


User = get_user_model()


class ProfileViewSet(viewsets.ModelViewSet):
    """
        API endpoint для управления профилями пользователей.
        - Пользователи видят только свой профиль
        - Админы видят все профили
        - Кастомный эндпоинт /me/ для получения текущего профиля
    """
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        """Фильтрация профилей по правам пользователя"""
        if self.request.user.is_staff:
            return Profile.objects.all()
        return Profile.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Получение профиля текущего пользователя"""
        profile = get_object_or_404(Profile, user=request.user)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='me/favorites', pagination_class=FavoritePagination)
    def my_favorites(self, request):
        """Получение списка избранных товаров текущего пользователя с пагинацией"""
        try:
            profile = request.user.profile
            favorites = profile.favorites.all().order_by('-id')  # Сортировка по новым первым

            # Пагинируем queryset
            page = self.paginate_queryset(favorites)
            if page is not None:
                from .serializers import ProductSerializer
                serializer = ProductSerializer(page, many=True, context={'request': request})
                return self.get_paginated_response(serializer.data)

            # Если пагинация отключена
            from .serializers import ProductSerializer
            serializer = ProductSerializer(favorites, many=True, context={'request': request})
            return Response({
                'count': favorites.count(),
                'results': serializer.data
            })

        except Profile.DoesNotExist:
            return Response(
                {'error': 'Профиль не найден'},
                status=status.HTTP_404_NOT_FOUND
            )


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Получаем профиль для включения в ответ
        profile = user.profile
        profile_serializer = ProfileSerializer(profile)

        refresh = RefreshToken.for_user(user)

        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'profile': profile_serializer.data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })


class BrandViewSet(viewsets.ModelViewSet):
    """
    API endpoint для управления брендами.
    - Чтение доступно всем
    - Изменение только админам
    - Фильтрация по name и country
    """
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['name', 'country']
    search_fields = ['name']

    @action(detail=False, methods=['get'], url_path='search')
    def search_brands(self, request):
        query = request.GET.get('q', '')
        brands = Brand.objects.filter(name__icontains=query)
        serializer = self.get_serializer(brands, many=True)
        return Response(serializer.data)


class CategoryViewSet(viewsets.ModelViewSet):
    # queryset = Category.objects.filter(parent__isnull=True)
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=True, methods=['get'])
    def children(self, request, pk=None):
        category = self.get_object()
        children = category.children.all()
        serializer = self.get_serializer(children, many=True)
        return Response(serializer.data)


    @action(detail=False, methods=['get'])
    def parents(self, request):
        parents = Category.objects.filter(parent__isnull=True)
        serializer = self.get_serializer(parents, many=True)
        return Response(serializer.data)


class ProductViewSet(viewsets.ModelViewSet):
    """
        API endpoint для управления товарами.
        Дополнительные действия:
        - /images/ - изображения товара
        - /variants/ - варианты товара
        - /reviews/ - отзывы
        - /favorite/ - добавление в избранное
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_class = ProductFilter
    search_fields = ['name', 'description']

    def get_permissions(self):
        """
        Переопределяем permissions для разных actions
        """
        if self.action in ['favorite', 'unfavorite']:
            # Для избранного разрешаем авторизованным пользователям
            return [permissions.IsAuthenticated()]
        return [IsAdminOrReadOnly()]

    @action(detail=False, methods=['get'], url_path='search')
    def search_products(self, request):
        query = request.GET.get('q', '')
        products = Product.objects.filter(name__icontains=query)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def images(self, request, pk=None):
        product = self.get_object()
        images = product.images.all()
        serializer = ProductImgSerializer(images, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def variants(self, request, pk=None):
        product = self.get_object()
        variants = product.variants.all()
        serializer = ProductVarSerializer(variants, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def reviews(self, request, pk=None):
        product = self.get_object()
        reviews = product.reviews.all()
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def favorite(self, request, pk=None):
        product = self.get_object()
        request.user.profile.favorites.add(product)
        return Response({'status': 'added to favorites'})

    @action(detail=True, methods=['delete'], permission_classes=[permissions.IsAuthenticated])
    def unfavorite(self, request, pk=None):
        product = self.get_object()
        request.user.profile.favorites.remove(product)
        return Response({'status': 'removed from favorites'})


class ProductImgViewSet(viewsets.ModelViewSet):
    queryset = ProductImg.objects.all()
    serializer_class = ProductImgSerializer
    permission_classes = [IsAdminOrReadOnly]


class ProductVarViewSet(viewsets.ModelViewSet):
    queryset = ProductVar.objects.all()
    serializer_class = ProductVarSerializer
    permission_classes = [IsAdminOrReadOnly]


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def get_queryset(self):
        product_id = self.request.query_params.get('product_id')
        if product_id:
            return Review.objects.filter(product_id=product_id)
        return Review.objects.all()

    def perform_create(self, serializer):
        serializer.save(profile=self.request.user.profile)


class CartViewSet(viewsets.ModelViewSet):
    """
    API endpoint для управления корзинами.
    Кастомные действия:
    - /my_cart/ - текущая корзина пользователя
    - /items/ - управление элементами корзины
    """
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Cart.objects.filter(profile=self.request.user.profile)

    @action(detail=False, methods=['get'])
    def my_cart(self, request):
        cart = get_object_or_404(Cart, profile=request.user.profile)
        serializer = self.get_serializer(cart)
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post', 'delete'])
    def items(self, request, pk=None):
        cart = self.get_object()
        if request.method == 'GET':
            items = cart.items.all()
            serializer = CartItemSerializer(items, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            serializer = CartItemSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(cart=cart)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        elif request.method == 'DELETE':
            cart.items.all().delete()
            return Response(status=status.HTTP_204_NO_CONTENT)


class CartItemViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CartItem.objects.filter(cart__profile=self.request.user.profile)

    def perform_create(self, serializer):
        cart, _ = Cart.objects.get_or_create(profile=self.request.user.profile)
        serializer.save(cart=cart)


class OrderViewSet(viewsets.ModelViewSet):
    """
    API endpoint для управления заказами.
    Особенности:
    - Автоматический расчет суммы
    - Перенос товаров из корзины
    - Фильтрация по статусу
    """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']

    def get_queryset(self):
        return Order.objects.filter(profile=self.request.user.profile)

    def perform_create(self, serializer):
        profile = self.request.user.profile
        cart = get_object_or_404(Cart, profile=profile)

        order = serializer.save(profile=profile)
        total_price = 0

        for item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product=item.product,
                variant=item.variant,
                quantity=item.quantity,
                price=item.variant.price if item.variant else item.product.price
            )
            total_price += (item.variant.price if item.variant else item.product.price) * item.quantity

        order.total_price = total_price
        order.save()
        cart.items.all().delete()
        return order

    @action(detail=True, methods=['get'])
    def items(self, request, pk=None):
        order = self.get_object()
        items = order.items.select_related('product', 'variant')
        serializer = OrderItemSerializer(items, many=True)
        return Response(serializer.data)


class OrderItemViewSet(viewsets.ModelViewSet):
    serializer_class = OrderItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return OrderItem.objects.filter(order__profile=self.request.user.profile)
