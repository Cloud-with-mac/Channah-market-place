"""
Management command to seed the database with sample data for Channah.
"""
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from django.utils import timezone
from decimal import Decimal
import random

from apps.accounts.models import User, UserRole
from apps.vendors.models import Vendor, VendorStatus
from apps.catalog.models import Category, Product, ProductImage, ProductStatus


class Command(BaseCommand):
    help = 'Seed the database with sample categories, vendors, and products'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            ProductImage.objects.all().delete()
            Product.objects.all().delete()
            Vendor.objects.all().delete()
            Category.objects.all().delete()
            User.objects.filter(role=UserRole.VENDOR).delete()

        self.stdout.write('Seeding database...')

        # Create categories
        categories = self.create_categories()
        self.stdout.write(self.style.SUCCESS(f'Created {len(categories)} categories'))

        # Create vendors
        vendors = self.create_vendors()
        self.stdout.write(self.style.SUCCESS(f'Created {len(vendors)} vendors'))

        # Create products
        products = self.create_products(categories, vendors)
        self.stdout.write(self.style.SUCCESS(f'Created {len(products)} products'))

        self.stdout.write(self.style.SUCCESS('Database seeding completed!'))

    def create_categories(self):
        categories_data = [
            {
                'name': 'Electronics',
                'slug': 'electronics',
                'description': 'Discover the latest gadgets, smartphones, laptops, and more.',
                'icon': 'Smartphone',
                'image_url': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop',
                'is_featured': True,
                'children': [
                    {'name': 'Phones & Tablets', 'slug': 'phones-tablets'},
                    {'name': 'Computers & Laptops', 'slug': 'computers-laptops'},
                    {'name': 'TV & Audio', 'slug': 'tv-audio'},
                    {'name': 'Cameras', 'slug': 'cameras'},
                    {'name': 'Accessories', 'slug': 'electronics-accessories'},
                ]
            },
            {
                'name': 'Fashion',
                'slug': 'fashion',
                'description': 'Stay stylish with our curated collection of clothing and accessories.',
                'icon': 'Shirt',
                'image_url': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop',
                'is_featured': True,
                'children': [
                    {'name': "Men's Clothing", 'slug': 'mens-clothing'},
                    {'name': "Women's Clothing", 'slug': 'womens-clothing'},
                    {'name': 'Shoes', 'slug': 'shoes'},
                    {'name': 'Bags & Accessories', 'slug': 'bags-accessories'},
                    {'name': 'Jewelry', 'slug': 'jewelry'},
                ]
            },
            {
                'name': 'Home & Garden',
                'slug': 'home-garden',
                'description': 'Everything you need for a comfortable and beautiful home.',
                'icon': 'Home',
                'image_url': 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400&h=400&fit=crop',
                'is_featured': True,
                'children': [
                    {'name': 'Furniture', 'slug': 'furniture'},
                    {'name': 'Kitchen & Dining', 'slug': 'kitchen-dining'},
                    {'name': 'Bedding', 'slug': 'bedding'},
                    {'name': 'Garden & Outdoor', 'slug': 'garden-outdoor'},
                    {'name': 'Home Decor', 'slug': 'home-decor'},
                ]
            },
            {
                'name': 'Health & Beauty',
                'slug': 'health-beauty',
                'description': 'Personal care products for your health and wellness.',
                'icon': 'Heart',
                'image_url': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop',
                'is_featured': True,
                'children': [
                    {'name': 'Skincare', 'slug': 'skincare'},
                    {'name': 'Makeup', 'slug': 'makeup'},
                    {'name': 'Hair Care', 'slug': 'hair-care'},
                    {'name': 'Fragrances', 'slug': 'fragrances'},
                    {'name': 'Health Supplements', 'slug': 'health-supplements'},
                ]
            },
            {
                'name': 'Sports & Outdoors',
                'slug': 'sports-outdoors',
                'description': 'Gear up for adventure with our sports and outdoor equipment.',
                'icon': 'Dumbbell',
                'image_url': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&fit=crop',
                'is_featured': True,
                'children': [
                    {'name': 'Exercise & Fitness', 'slug': 'exercise-fitness'},
                    {'name': 'Team Sports', 'slug': 'team-sports'},
                    {'name': 'Camping & Hiking', 'slug': 'camping-hiking'},
                    {'name': 'Cycling', 'slug': 'cycling'},
                ]
            },
            {
                'name': 'Books & Media',
                'slug': 'books-media',
                'description': 'Explore our collection of books, music, and entertainment.',
                'icon': 'Book',
                'image_url': 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=400&fit=crop',
                'is_featured': False,
                'children': [
                    {'name': 'Books', 'slug': 'books'},
                    {'name': 'Music', 'slug': 'music'},
                    {'name': 'Movies & TV', 'slug': 'movies-tv'},
                ]
            },
            {
                'name': 'Automotive',
                'slug': 'automotive',
                'description': 'Auto parts, accessories, and everything for your vehicle.',
                'icon': 'Car',
                'image_url': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=400&fit=crop',
                'is_featured': False,
                'children': [
                    {'name': 'Car Parts', 'slug': 'car-parts'},
                    {'name': 'Car Accessories', 'slug': 'car-accessories'},
                    {'name': 'Motorcycle Parts', 'slug': 'motorcycle-parts'},
                ]
            },
            {
                'name': 'Baby & Kids',
                'slug': 'baby-kids',
                'description': 'Everything for your little ones from newborns to teens.',
                'icon': 'Baby',
                'image_url': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=400&fit=crop',
                'is_featured': True,
                'children': [
                    {'name': 'Baby Gear', 'slug': 'baby-gear'},
                    {'name': 'Kids Clothing', 'slug': 'kids-clothing'},
                    {'name': 'Toys & Games', 'slug': 'toys-games'},
                ]
            },
        ]

        created_categories = []

        for idx, cat_data in enumerate(categories_data):
            children = cat_data.pop('children', [])
            parent, created = Category.objects.get_or_create(
                slug=cat_data['slug'],
                defaults={
                    **cat_data,
                    'sort_order': idx,
                    'is_active': True,
                }
            )
            created_categories.append(parent)

            for child_idx, child_data in enumerate(children):
                child, _ = Category.objects.get_or_create(
                    slug=child_data['slug'],
                    defaults={
                        'name': child_data['name'],
                        'parent': parent,
                        'sort_order': child_idx,
                        'is_active': True,
                    }
                )
                created_categories.append(child)

        return created_categories

    def create_vendors(self):
        vendors_data = [
            {'business_name': 'TechHub Store', 'slug': 'techhub-store', 'description': 'Your one-stop shop for all electronics and gadgets.', 'email': 'vendor1@channah.com', 'city': 'Lagos', 'country': 'Nigeria'},
            {'business_name': 'Fashion Forward', 'slug': 'fashion-forward', 'description': 'Trendy clothing and accessories for the modern shopper.', 'email': 'vendor2@channah.com', 'city': 'Abuja', 'country': 'Nigeria'},
            {'business_name': 'Home Essentials', 'slug': 'home-essentials', 'description': 'Quality home goods at affordable prices.', 'email': 'vendor3@channah.com', 'city': 'Port Harcourt', 'country': 'Nigeria'},
            {'business_name': 'Beauty Glow', 'slug': 'beauty-glow', 'description': 'Premium beauty and skincare products.', 'email': 'vendor4@channah.com', 'city': 'Ibadan', 'country': 'Nigeria'},
            {'business_name': 'Sports Elite', 'slug': 'sports-elite', 'description': 'Everything for sports enthusiasts.', 'email': 'vendor5@channah.com', 'city': 'Kano', 'country': 'Nigeria'},
            {'business_name': 'Gadget World', 'slug': 'gadget-world', 'description': 'Innovative gadgets and accessories.', 'email': 'vendor6@channah.com', 'city': 'Enugu', 'country': 'Nigeria'},
            {'business_name': 'Style Hub', 'slug': 'style-hub', 'description': 'Fashion-forward styles for everyone.', 'email': 'vendor7@channah.com', 'city': 'Benin City', 'country': 'Nigeria'},
            {'business_name': 'Kids Paradise', 'slug': 'kids-paradise', 'description': 'Everything your children need.', 'email': 'vendor8@channah.com', 'city': 'Calabar', 'country': 'Nigeria'},
        ]

        created_vendors = []

        for vendor_data in vendors_data:
            user, _ = User.objects.get_or_create(
                email=vendor_data['email'],
                defaults={
                    'first_name': vendor_data['business_name'].split()[0],
                    'last_name': 'Vendor',
                    'role': UserRole.VENDOR,
                    'is_verified': True,
                }
            )
            if not user.password:
                user.set_password('vendor123')
                user.save()

            vendor, _ = Vendor.objects.get_or_create(
                slug=vendor_data['slug'],
                defaults={
                    'user': user,
                    'business_name': vendor_data['business_name'],
                    'description': vendor_data['description'],
                    'business_email': vendor_data['email'],
                    'city': vendor_data.get('city'),
                    'country': vendor_data.get('country'),
                    'status': VendorStatus.APPROVED,
                    'verified_at': timezone.now(),
                    'rating': round(random.uniform(4.0, 5.0), 1),
                    'total_reviews': random.randint(50, 500),
                }
            )
            created_vendors.append(vendor)

        return created_vendors

    def create_products(self, categories, vendors):
        products_data = [
            # ELECTRONICS - Phones & Tablets (5 products)
            {'name': 'iPhone 15 Pro Max 256GB', 'slug': 'iphone-15-pro-max-256gb', 'price': Decimal('1199.99'), 'compare_at_price': Decimal('1299.99'), 'category_slug': 'phones-tablets', 'vendor_index': 0, 'is_featured': True, 'images': ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&h=800&fit=crop'], 'description': '<p>The latest iPhone with A17 Pro chip.</p>'},
            {'name': 'Samsung Galaxy S24 Ultra', 'slug': 'samsung-galaxy-s24-ultra', 'price': Decimal('1099.99'), 'category_slug': 'phones-tablets', 'vendor_index': 5, 'is_featured': True, 'images': ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&h=800&fit=crop'], 'description': '<p>Flagship Samsung phone with S Pen.</p>'},
            {'name': 'iPad Pro 12.9 inch M2', 'slug': 'ipad-pro-12-9-m2', 'price': Decimal('1099.99'), 'compare_at_price': Decimal('1199.99'), 'category_slug': 'phones-tablets', 'vendor_index': 0, 'images': ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=800&fit=crop'], 'description': '<p>Ultimate iPad with M2 chip.</p>'},
            {'name': 'Google Pixel 8 Pro', 'slug': 'google-pixel-8-pro', 'price': Decimal('899.99'), 'category_slug': 'phones-tablets', 'vendor_index': 5, 'images': ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&h=800&fit=crop'], 'description': '<p>Pure Android with best camera.</p>'},
            {'name': 'OnePlus 12 5G', 'slug': 'oneplus-12-5g', 'price': Decimal('799.99'), 'compare_at_price': Decimal('899.99'), 'category_slug': 'phones-tablets', 'vendor_index': 0, 'images': ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop'], 'description': '<p>Flagship killer with 100W charging.</p>'},

            # ELECTRONICS - Computers & Laptops (5 products)
            {'name': 'MacBook Pro 16 inch M3 Max', 'slug': 'macbook-pro-16-m3-max', 'price': Decimal('3499.99'), 'category_slug': 'computers-laptops', 'vendor_index': 0, 'is_featured': True, 'images': ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop'], 'description': '<p>Most powerful MacBook ever.</p>'},
            {'name': 'Dell XPS 15 OLED', 'slug': 'dell-xps-15-oled', 'price': Decimal('1899.99'), 'compare_at_price': Decimal('2099.99'), 'category_slug': 'computers-laptops', 'vendor_index': 5, 'images': ['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&h=800&fit=crop'], 'description': '<p>Stunning OLED laptop for creators.</p>'},
            {'name': 'Gaming Desktop RTX 4090', 'slug': 'gaming-desktop-rtx-4090', 'price': Decimal('2999.99'), 'category_slug': 'computers-laptops', 'vendor_index': 0, 'images': ['https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&h=800&fit=crop'], 'description': '<p>Ultimate gaming PC.</p>'},
            {'name': 'Mechanical Keyboard RGB', 'slug': 'mechanical-keyboard-rgb', 'price': Decimal('119.99'), 'category_slug': 'computers-laptops', 'vendor_index': 5, 'images': ['https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800&h=800&fit=crop'], 'description': '<p>Professional mechanical keyboard.</p>'},
            {'name': 'Gaming Mouse Wireless', 'slug': 'gaming-mouse-wireless', 'price': Decimal('79.99'), 'compare_at_price': Decimal('99.99'), 'category_slug': 'computers-laptops', 'vendor_index': 0, 'images': ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&h=800&fit=crop'], 'description': '<p>High-precision wireless mouse.</p>'},

            # ELECTRONICS - TV & Audio (5 products)
            {'name': 'Sony 65 inch 4K OLED TV', 'slug': 'sony-65-4k-oled-tv', 'price': Decimal('1999.99'), 'compare_at_price': Decimal('2499.99'), 'category_slug': 'tv-audio', 'vendor_index': 0, 'is_featured': True, 'images': ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&h=800&fit=crop'], 'description': '<p>Stunning 4K OLED display.</p>'},
            {'name': 'Wireless Bluetooth Headphones', 'slug': 'wireless-bluetooth-headphones', 'price': Decimal('79.99'), 'compare_at_price': Decimal('99.99'), 'category_slug': 'tv-audio', 'vendor_index': 5, 'is_featured': True, 'images': ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop'], 'description': '<p>Premium wireless headphones with ANC.</p>'},
            {'name': 'Noise Cancelling Earbuds', 'slug': 'noise-cancelling-earbuds', 'price': Decimal('149.99'), 'compare_at_price': Decimal('179.99'), 'category_slug': 'tv-audio', 'vendor_index': 0, 'images': ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&h=800&fit=crop'], 'description': '<p>True wireless earbuds with ANC.</p>'},
            {'name': 'Soundbar with Subwoofer', 'slug': 'soundbar-with-subwoofer', 'price': Decimal('299.99'), 'category_slug': 'tv-audio', 'vendor_index': 5, 'images': ['https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&h=800&fit=crop'], 'description': '<p>Immersive home theater sound.</p>'},
            {'name': 'Portable Bluetooth Speaker', 'slug': 'portable-bluetooth-speaker', 'price': Decimal('49.99'), 'category_slug': 'tv-audio', 'vendor_index': 0, 'images': ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&h=800&fit=crop'], 'description': '<p>Waterproof portable speaker.</p>'},

            # ELECTRONICS - Cameras (5 products)
            {'name': 'Sony Alpha A7 IV', 'slug': 'sony-alpha-a7-iv', 'price': Decimal('2499.99'), 'category_slug': 'cameras', 'vendor_index': 0, 'is_featured': True, 'images': ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=800&fit=crop'], 'description': '<p>Full-frame mirrorless camera.</p>'},
            {'name': 'Canon EOS R6 Mark II', 'slug': 'canon-eos-r6-mark-ii', 'price': Decimal('2299.99'), 'category_slug': 'cameras', 'vendor_index': 5, 'images': ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=800&fit=crop'], 'description': '<p>High-speed mirrorless camera.</p>'},
            {'name': 'GoPro Hero 12 Black', 'slug': 'gopro-hero-12-black', 'price': Decimal('449.99'), 'compare_at_price': Decimal('499.99'), 'category_slug': 'cameras', 'vendor_index': 0, 'images': ['https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=800&h=800&fit=crop'], 'description': '<p>Ultimate action camera.</p>'},
            {'name': 'DJI Mini 4 Pro Drone', 'slug': 'dji-mini-4-pro-drone', 'price': Decimal('759.99'), 'category_slug': 'cameras', 'vendor_index': 5, 'images': ['https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&h=800&fit=crop'], 'description': '<p>Compact 4K drone.</p>'},
            {'name': 'Camera Tripod Professional', 'slug': 'camera-tripod-professional', 'price': Decimal('89.99'), 'category_slug': 'cameras', 'vendor_index': 0, 'images': ['https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800&h=800&fit=crop'], 'description': '<p>Sturdy professional tripod.</p>'},

            # ELECTRONICS - Accessories (5 products)
            {'name': 'Wireless Charging Pad', 'slug': 'wireless-charging-pad', 'price': Decimal('34.99'), 'category_slug': 'electronics-accessories', 'vendor_index': 0, 'images': ['https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?w=800&h=800&fit=crop'], 'description': '<p>Fast 15W wireless charger.</p>'},
            {'name': 'USB-C Hub 10-in-1', 'slug': 'usb-c-hub-10-in-1', 'price': Decimal('59.99'), 'category_slug': 'electronics-accessories', 'vendor_index': 5, 'images': ['https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?w=800&h=800&fit=crop'], 'description': '<p>Multi-port USB-C hub.</p>'},
            {'name': 'Smart Watch Series 5', 'slug': 'smart-watch-series-5', 'price': Decimal('199.99'), 'compare_at_price': Decimal('249.99'), 'category_slug': 'electronics-accessories', 'vendor_index': 0, 'is_featured': True, 'images': ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop'], 'description': '<p>Advanced smartwatch.</p>'},
            {'name': 'Power Bank 20000mAh', 'slug': 'power-bank-20000mah', 'price': Decimal('39.99'), 'category_slug': 'electronics-accessories', 'vendor_index': 5, 'images': ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&h=800&fit=crop'], 'description': '<p>High-capacity portable charger.</p>'},
            {'name': 'Laptop Sleeve 15 inch', 'slug': 'laptop-sleeve-15', 'price': Decimal('29.99'), 'category_slug': 'electronics-accessories', 'vendor_index': 0, 'images': ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop'], 'description': '<p>Premium laptop sleeve.</p>'},

            # FASHION - Men's Clothing (5 products)
            {'name': 'Premium Cotton T-Shirt', 'slug': 'premium-cotton-tshirt', 'price': Decimal('29.99'), 'category_slug': 'mens-clothing', 'vendor_index': 1, 'images': ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop'], 'description': '<p>Soft organic cotton t-shirt.</p>'},
            {'name': 'Slim Fit Jeans', 'slug': 'slim-fit-jeans', 'price': Decimal('59.99'), 'compare_at_price': Decimal('79.99'), 'category_slug': 'mens-clothing', 'vendor_index': 6, 'images': ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=800&fit=crop'], 'description': '<p>Classic slim fit jeans.</p>'},
            {'name': 'Business Suit Navy', 'slug': 'business-suit-navy', 'price': Decimal('299.99'), 'category_slug': 'mens-clothing', 'vendor_index': 1, 'is_featured': True, 'images': ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=800&fit=crop'], 'description': '<p>Tailored navy suit.</p>'},
            {'name': 'Casual Polo Shirt', 'slug': 'casual-polo-shirt', 'price': Decimal('39.99'), 'category_slug': 'mens-clothing', 'vendor_index': 6, 'images': ['https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&h=800&fit=crop'], 'description': '<p>Classic polo shirt.</p>'},
            {'name': 'Winter Jacket Puffer', 'slug': 'winter-jacket-puffer', 'price': Decimal('149.99'), 'compare_at_price': Decimal('199.99'), 'category_slug': 'mens-clothing', 'vendor_index': 1, 'images': ['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=800&fit=crop'], 'description': '<p>Warm puffer jacket.</p>'},

            # FASHION - Women's Clothing (5 products)
            {'name': 'Elegant Summer Dress', 'slug': 'elegant-summer-dress', 'price': Decimal('59.99'), 'compare_at_price': Decimal('79.99'), 'category_slug': 'womens-clothing', 'vendor_index': 1, 'is_featured': True, 'images': ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=800&fit=crop'], 'description': '<p>Beautiful floral dress.</p>'},
            {'name': 'Cashmere Sweater', 'slug': 'cashmere-sweater', 'price': Decimal('129.99'), 'category_slug': 'womens-clothing', 'vendor_index': 6, 'images': ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=800&fit=crop'], 'description': '<p>Luxurious cashmere sweater.</p>'},
            {'name': 'High Waist Trousers', 'slug': 'high-waist-trousers', 'price': Decimal('69.99'), 'category_slug': 'womens-clothing', 'vendor_index': 1, 'images': ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&h=800&fit=crop'], 'description': '<p>Stylish high-waist trousers.</p>'},
            {'name': 'Silk Blouse', 'slug': 'silk-blouse', 'price': Decimal('89.99'), 'compare_at_price': Decimal('119.99'), 'category_slug': 'womens-clothing', 'vendor_index': 6, 'images': ['https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=800&h=800&fit=crop'], 'description': '<p>Elegant silk blouse.</p>'},
            {'name': 'Maxi Skirt Pleated', 'slug': 'maxi-skirt-pleated', 'price': Decimal('49.99'), 'category_slug': 'womens-clothing', 'vendor_index': 1, 'images': ['https://images.unsplash.com/photo-1583496661160-fb5886a0uj9a?w=800&h=800&fit=crop'], 'description': '<p>Flowing pleated maxi skirt.</p>'},

            # FASHION - Shoes (5 products)
            {'name': 'Running Sneakers Pro', 'slug': 'running-sneakers-pro', 'price': Decimal('129.99'), 'category_slug': 'shoes', 'vendor_index': 1, 'images': ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop'], 'description': '<p>High-performance running shoes.</p>'},
            {'name': 'Leather Oxford Shoes', 'slug': 'leather-oxford-shoes', 'price': Decimal('179.99'), 'compare_at_price': Decimal('219.99'), 'category_slug': 'shoes', 'vendor_index': 6, 'images': ['https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=800&h=800&fit=crop'], 'description': '<p>Classic leather oxford shoes.</p>'},
            {'name': 'High Heel Pumps', 'slug': 'high-heel-pumps', 'price': Decimal('99.99'), 'category_slug': 'shoes', 'vendor_index': 1, 'images': ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=800&fit=crop'], 'description': '<p>Elegant high heel pumps.</p>'},
            {'name': 'Canvas Sneakers Classic', 'slug': 'canvas-sneakers-classic', 'price': Decimal('49.99'), 'category_slug': 'shoes', 'vendor_index': 6, 'images': ['https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&h=800&fit=crop'], 'description': '<p>Timeless canvas sneakers.</p>'},
            {'name': 'Ankle Boots Leather', 'slug': 'ankle-boots-leather', 'price': Decimal('149.99'), 'compare_at_price': Decimal('189.99'), 'category_slug': 'shoes', 'vendor_index': 1, 'images': ['https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&h=800&fit=crop'], 'description': '<p>Stylish leather ankle boots.</p>'},

            # FASHION - Bags & Accessories (5 products)
            {'name': 'Classic Leather Handbag', 'slug': 'classic-leather-handbag', 'price': Decimal('89.99'), 'compare_at_price': Decimal('129.99'), 'category_slug': 'bags-accessories', 'vendor_index': 1, 'is_featured': True, 'images': ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=800&fit=crop'], 'description': '<p>Elegant leather handbag.</p>'},
            {'name': 'Travel Backpack', 'slug': 'travel-backpack', 'price': Decimal('79.99'), 'category_slug': 'bags-accessories', 'vendor_index': 6, 'images': ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop'], 'description': '<p>Durable travel backpack.</p>'},
            {'name': 'Designer Sunglasses', 'slug': 'designer-sunglasses', 'price': Decimal('159.99'), 'category_slug': 'bags-accessories', 'vendor_index': 1, 'images': ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop'], 'description': '<p>Premium designer sunglasses.</p>'},
            {'name': 'Leather Belt Classic', 'slug': 'leather-belt-classic', 'price': Decimal('49.99'), 'category_slug': 'bags-accessories', 'vendor_index': 6, 'images': ['https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800&h=800&fit=crop'], 'description': '<p>Classic leather belt.</p>'},
            {'name': 'Silk Scarf Designer', 'slug': 'silk-scarf-designer', 'price': Decimal('69.99'), 'category_slug': 'bags-accessories', 'vendor_index': 1, 'images': ['https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&h=800&fit=crop'], 'description': '<p>Luxurious silk scarf.</p>'},

            # FASHION - Jewelry (5 products)
            {'name': 'Gold Necklace Pendant', 'slug': 'gold-necklace-pendant', 'price': Decimal('249.99'), 'compare_at_price': Decimal('299.99'), 'category_slug': 'jewelry', 'vendor_index': 1, 'is_featured': True, 'images': ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=800&fit=crop'], 'description': '<p>Beautiful gold pendant necklace.</p>'},
            {'name': 'Diamond Stud Earrings', 'slug': 'diamond-stud-earrings', 'price': Decimal('399.99'), 'category_slug': 'jewelry', 'vendor_index': 6, 'images': ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=800&fit=crop'], 'description': '<p>Sparkling diamond studs.</p>'},
            {'name': 'Silver Bracelet Chain', 'slug': 'silver-bracelet-chain', 'price': Decimal('79.99'), 'category_slug': 'jewelry', 'vendor_index': 1, 'images': ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=800&fit=crop'], 'description': '<p>Elegant silver chain bracelet.</p>'},
            {'name': 'Watch Rose Gold', 'slug': 'watch-rose-gold', 'price': Decimal('299.99'), 'compare_at_price': Decimal('349.99'), 'category_slug': 'jewelry', 'vendor_index': 6, 'images': ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&h=800&fit=crop'], 'description': '<p>Elegant rose gold watch.</p>'},
            {'name': 'Pearl Earrings Classic', 'slug': 'pearl-earrings-classic', 'price': Decimal('129.99'), 'category_slug': 'jewelry', 'vendor_index': 1, 'images': ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=800&fit=crop'], 'description': '<p>Timeless pearl drop earrings.</p>'},

            # HOME & GARDEN - Furniture (5 products)
            {'name': 'Modern Sofa 3-Seater', 'slug': 'modern-sofa-3-seater', 'price': Decimal('899.99'), 'compare_at_price': Decimal('1099.99'), 'category_slug': 'furniture', 'vendor_index': 2, 'is_featured': True, 'images': ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=800&fit=crop'], 'description': '<p>Contemporary 3-seater sofa.</p>'},
            {'name': 'Dining Table Set 6', 'slug': 'dining-table-set-6', 'price': Decimal('699.99'), 'category_slug': 'furniture', 'vendor_index': 2, 'images': ['https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&h=800&fit=crop'], 'description': '<p>Elegant dining table with 6 chairs.</p>'},
            {'name': 'Office Chair Ergonomic', 'slug': 'office-chair-ergonomic', 'price': Decimal('349.99'), 'category_slug': 'furniture', 'vendor_index': 2, 'images': ['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&h=800&fit=crop'], 'description': '<p>Ergonomic office chair.</p>'},
            {'name': 'Bookshelf Wooden 5-Tier', 'slug': 'bookshelf-wooden-5-tier', 'price': Decimal('199.99'), 'category_slug': 'furniture', 'vendor_index': 2, 'images': ['https://images.unsplash.com/photo-1594620302200-9a762244a156?w=800&h=800&fit=crop'], 'description': '<p>Solid wood bookshelf.</p>'},
            {'name': 'Queen Bed Frame Metal', 'slug': 'queen-bed-frame-metal', 'price': Decimal('299.99'), 'compare_at_price': Decimal('399.99'), 'category_slug': 'furniture', 'vendor_index': 2, 'images': ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=800&fit=crop'], 'description': '<p>Sturdy metal bed frame.</p>'},

            # HOME & GARDEN - Kitchen & Dining (5 products)
            {'name': 'Air Fryer Digital', 'slug': 'air-fryer-digital', 'price': Decimal('99.99'), 'compare_at_price': Decimal('129.99'), 'category_slug': 'kitchen-dining', 'vendor_index': 2, 'is_featured': True, 'images': ['https://images.unsplash.com/photo-1648567735141-8f9de14d37ed?w=800&h=800&fit=crop'], 'description': '<p>Digital air fryer.</p>'},
            {'name': 'Coffee Maker Automatic', 'slug': 'coffee-maker-automatic', 'price': Decimal('149.99'), 'category_slug': 'kitchen-dining', 'vendor_index': 2, 'images': ['https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&h=800&fit=crop'], 'description': '<p>Automatic coffee maker.</p>'},
            {'name': 'Knife Set Professional 8pc', 'slug': 'knife-set-professional-8pc', 'price': Decimal('129.99'), 'category_slug': 'kitchen-dining', 'vendor_index': 2, 'images': ['https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&h=800&fit=crop'], 'description': '<p>Professional 8-piece knife set.</p>'},
            {'name': 'Cookware Set Nonstick 12pc', 'slug': 'cookware-set-nonstick-12pc', 'price': Decimal('199.99'), 'compare_at_price': Decimal('249.99'), 'category_slug': 'kitchen-dining', 'vendor_index': 2, 'images': ['https://images.unsplash.com/photo-1584990347449-a4f01ab1c2a1?w=800&h=800&fit=crop'], 'description': '<p>Complete nonstick cookware set.</p>'},
            {'name': 'Blender High Speed', 'slug': 'blender-high-speed', 'price': Decimal('79.99'), 'category_slug': 'kitchen-dining', 'vendor_index': 2, 'images': ['https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&h=800&fit=crop'], 'description': '<p>Powerful blender.</p>'},

            # HOME & GARDEN - Bedding (5 products)
            {'name': 'Luxury Bedding Set', 'slug': 'luxury-bedding-set', 'price': Decimal('149.99'), 'compare_at_price': Decimal('199.99'), 'category_slug': 'bedding', 'vendor_index': 2, 'is_featured': True, 'images': ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=800&fit=crop'], 'description': '<p>Premium Egyptian cotton bedding.</p>'},
            {'name': 'Memory Foam Pillow Set', 'slug': 'memory-foam-pillow-set', 'price': Decimal('59.99'), 'category_slug': 'bedding', 'vendor_index': 2, 'images': ['https://images.unsplash.com/photo-1592789705501-f9ae4287c4a9?w=800&h=800&fit=crop'], 'description': '<p>Ergonomic memory foam pillows.</p>'},
            {'name': 'Weighted Blanket 15lb', 'slug': 'weighted-blanket-15lb', 'price': Decimal('89.99'), 'category_slug': 'bedding', 'vendor_index': 2, 'images': ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=800&fit=crop'], 'description': '<p>Calming weighted blanket.</p>'},
            {'name': 'Mattress Topper Gel', 'slug': 'mattress-topper-gel', 'price': Decimal('129.99'), 'compare_at_price': Decimal('159.99'), 'category_slug': 'bedding', 'vendor_index': 2, 'images': ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=800&fit=crop'], 'description': '<p>Cooling gel mattress topper.</p>'},
            {'name': 'Throw Blanket Fleece', 'slug': 'throw-blanket-fleece', 'price': Decimal('34.99'), 'category_slug': 'bedding', 'vendor_index': 2, 'images': ['https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?w=800&h=800&fit=crop'], 'description': '<p>Soft fleece throw blanket.</p>'},

            # HOME & GARDEN - Garden & Outdoor (5 products)
            {'name': 'Patio Furniture Set', 'slug': 'patio-furniture-set', 'price': Decimal('599.99'), 'compare_at_price': Decimal('799.99'), 'category_slug': 'garden-outdoor', 'vendor_index': 2, 'is_featured': True, 'images': ['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&h=800&fit=crop'], 'description': '<p>Complete outdoor patio set.</p>'},
            {'name': 'Ceramic Plant Pot Set', 'slug': 'ceramic-plant-pot-set', 'price': Decimal('38.99'), 'category_slug': 'garden-outdoor', 'vendor_index': 2, 'images': ['https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&h=800&fit=crop'], 'description': '<p>Set of 3 ceramic plant pots.</p>'},
            {'name': 'Garden Tool Set 10pc', 'slug': 'garden-tool-set-10pc', 'price': Decimal('49.99'), 'category_slug': 'garden-outdoor', 'vendor_index': 2, 'images': ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=800&fit=crop'], 'description': '<p>Complete gardening tool set.</p>'},
            {'name': 'Outdoor String Lights', 'slug': 'outdoor-string-lights', 'price': Decimal('29.99'), 'category_slug': 'garden-outdoor', 'vendor_index': 2, 'images': ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=800&fit=crop'], 'description': '<p>Weatherproof string lights.</p>'},
            {'name': 'BBQ Grill Gas', 'slug': 'bbq-grill-gas', 'price': Decimal('399.99'), 'category_slug': 'garden-outdoor', 'vendor_index': 2, 'images': ['https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&h=800&fit=crop'], 'description': '<p>3-burner gas grill.</p>'},

            # HOME & GARDEN - Home Decor (5 products)
            {'name': 'Modern Table Lamp', 'slug': 'modern-table-lamp', 'price': Decimal('45.99'), 'category_slug': 'home-decor', 'vendor_index': 2, 'images': ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&h=800&fit=crop'], 'description': '<p>Minimalist table lamp.</p>'},
            {'name': 'Wall Art Canvas Set', 'slug': 'wall-art-canvas-set', 'price': Decimal('79.99'), 'category_slug': 'home-decor', 'vendor_index': 2, 'images': ['https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800&h=800&fit=crop'], 'description': '<p>3-piece canvas wall art.</p>'},
            {'name': 'Decorative Mirror Round', 'slug': 'decorative-mirror-round', 'price': Decimal('89.99'), 'compare_at_price': Decimal('119.99'), 'category_slug': 'home-decor', 'vendor_index': 2, 'images': ['https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&h=800&fit=crop'], 'description': '<p>Stylish round mirror.</p>'},
            {'name': 'Scented Candle Set', 'slug': 'scented-candle-set', 'price': Decimal('34.99'), 'category_slug': 'home-decor', 'vendor_index': 2, 'images': ['https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=800&h=800&fit=crop'], 'description': '<p>Luxury scented candle set.</p>'},
            {'name': 'Vase Ceramic Modern', 'slug': 'vase-ceramic-modern', 'price': Decimal('39.99'), 'category_slug': 'home-decor', 'vendor_index': 2, 'images': ['https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800&h=800&fit=crop'], 'description': '<p>Modern ceramic vase.</p>'},

            # HEALTH & BEAUTY - Skincare (5 products)
            {'name': 'Organic Face Serum', 'slug': 'organic-face-serum', 'price': Decimal('42.99'), 'category_slug': 'skincare', 'vendor_index': 3, 'is_featured': True, 'images': ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&h=800&fit=crop'], 'description': '<p>Anti-aging serum.</p>'},
            {'name': 'Moisturizer SPF 30', 'slug': 'moisturizer-spf-30', 'price': Decimal('29.99'), 'category_slug': 'skincare', 'vendor_index': 3, 'images': ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop'], 'description': '<p>Daily moisturizer with SPF.</p>'},
            {'name': 'Face Cleanser Gentle', 'slug': 'face-cleanser-gentle', 'price': Decimal('18.99'), 'category_slug': 'skincare', 'vendor_index': 3, 'images': ['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=800&fit=crop'], 'description': '<p>Gentle face cleanser.</p>'},
            {'name': 'Sheet Mask Set 10pc', 'slug': 'sheet-mask-set-10pc', 'price': Decimal('24.99'), 'category_slug': 'skincare', 'vendor_index': 3, 'images': ['https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&h=800&fit=crop'], 'description': '<p>Korean sheet masks.</p>'},
            {'name': 'Eye Cream Anti-Wrinkle', 'slug': 'eye-cream-anti-wrinkle', 'price': Decimal('39.99'), 'compare_at_price': Decimal('49.99'), 'category_slug': 'skincare', 'vendor_index': 3, 'images': ['https://images.unsplash.com/photo-1570194065650-d99fb4b38b17?w=800&h=800&fit=crop'], 'description': '<p>Targeted eye cream.</p>'},

            # HEALTH & BEAUTY - Makeup (5 products)
            {'name': 'Professional Makeup Brush Set', 'slug': 'professional-makeup-brush-set', 'price': Decimal('49.99'), 'compare_at_price': Decimal('69.99'), 'category_slug': 'makeup', 'vendor_index': 3, 'is_featured': True, 'images': ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=800&fit=crop'], 'description': '<p>12-piece brush set.</p>'},
            {'name': 'Foundation Full Coverage', 'slug': 'foundation-full-coverage', 'price': Decimal('34.99'), 'category_slug': 'makeup', 'vendor_index': 3, 'images': ['https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?w=800&h=800&fit=crop'], 'description': '<p>Long-lasting foundation.</p>'},
            {'name': 'Lipstick Matte Collection', 'slug': 'lipstick-matte-collection', 'price': Decimal('29.99'), 'category_slug': 'makeup', 'vendor_index': 3, 'images': ['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&h=800&fit=crop'], 'description': '<p>Set of 6 matte lipsticks.</p>'},
            {'name': 'Eyeshadow Palette Nude', 'slug': 'eyeshadow-palette-nude', 'price': Decimal('44.99'), 'category_slug': 'makeup', 'vendor_index': 3, 'images': ['https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&h=800&fit=crop'], 'description': '<p>Versatile nude palette.</p>'},
            {'name': 'Mascara Volumizing', 'slug': 'mascara-volumizing', 'price': Decimal('19.99'), 'category_slug': 'makeup', 'vendor_index': 3, 'images': ['https://images.unsplash.com/photo-1631214499738-e09e9c8f1c2e?w=800&h=800&fit=crop'], 'description': '<p>Dramatic volume mascara.</p>'},

            # HEALTH & BEAUTY - Hair Care (5 products)
            {'name': 'Premium Hair Oil Treatment', 'slug': 'premium-hair-oil-treatment', 'price': Decimal('24.99'), 'category_slug': 'hair-care', 'vendor_index': 3, 'images': ['https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&h=800&fit=crop'], 'description': '<p>Nourishing hair oil.</p>'},
            {'name': 'Shampoo Sulfate-Free', 'slug': 'shampoo-sulfate-free', 'price': Decimal('18.99'), 'category_slug': 'hair-care', 'vendor_index': 3, 'images': ['https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800&h=800&fit=crop'], 'description': '<p>Gentle sulfate-free shampoo.</p>'},
            {'name': 'Hair Dryer Professional', 'slug': 'hair-dryer-professional', 'price': Decimal('79.99'), 'compare_at_price': Decimal('99.99'), 'category_slug': 'hair-care', 'vendor_index': 3, 'images': ['https://images.unsplash.com/photo-1522338242042-2d1c40c16d0a?w=800&h=800&fit=crop'], 'description': '<p>Professional ionic hair dryer.</p>'},
            {'name': 'Hair Straightener Ceramic', 'slug': 'hair-straightener-ceramic', 'price': Decimal('59.99'), 'category_slug': 'hair-care', 'vendor_index': 3, 'images': ['https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&h=800&fit=crop'], 'description': '<p>Ceramic flat iron.</p>'},
            {'name': 'Deep Conditioner Mask', 'slug': 'deep-conditioner-mask', 'price': Decimal('22.99'), 'category_slug': 'hair-care', 'vendor_index': 3, 'images': ['https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&h=800&fit=crop'], 'description': '<p>Intensive deep conditioning.</p>'},

            # SPORTS & OUTDOORS - Exercise & Fitness (5 products)
            {'name': 'Yoga Mat Premium', 'slug': 'yoga-mat-premium', 'price': Decimal('39.99'), 'category_slug': 'exercise-fitness', 'vendor_index': 4, 'images': ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&h=800&fit=crop'], 'description': '<p>Non-slip yoga mat.</p>'},
            {'name': 'Adjustable Dumbbell Set', 'slug': 'adjustable-dumbbell-set', 'price': Decimal('299.99'), 'compare_at_price': Decimal('399.99'), 'category_slug': 'exercise-fitness', 'vendor_index': 4, 'is_featured': True, 'images': ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=800&fit=crop'], 'description': '<p>Adjustable dumbbells 5-52.5 lbs.</p>'},
            {'name': 'Resistance Bands Set', 'slug': 'resistance-bands-set', 'price': Decimal('29.99'), 'category_slug': 'exercise-fitness', 'vendor_index': 4, 'images': ['https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800&h=800&fit=crop'], 'description': '<p>Set of 5 resistance bands.</p>'},
            {'name': 'Treadmill Folding', 'slug': 'treadmill-folding', 'price': Decimal('499.99'), 'compare_at_price': Decimal('699.99'), 'category_slug': 'exercise-fitness', 'vendor_index': 4, 'images': ['https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&h=800&fit=crop'], 'description': '<p>Compact folding treadmill.</p>'},
            {'name': 'Foam Roller Set', 'slug': 'foam-roller-set', 'price': Decimal('34.99'), 'category_slug': 'exercise-fitness', 'vendor_index': 4, 'images': ['https://images.unsplash.com/photo-1600881333168-2ef49b341f30?w=800&h=800&fit=crop'], 'description': '<p>Muscle recovery foam roller.</p>'},

            # SPORTS & OUTDOORS - Camping & Hiking (5 products)
            {'name': 'Camping Tent 4-Person', 'slug': 'camping-tent-4-person', 'price': Decimal('159.99'), 'category_slug': 'camping-hiking', 'vendor_index': 4, 'is_featured': True, 'images': ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=800&fit=crop'], 'description': '<p>Waterproof 4-person tent.</p>'},
            {'name': 'Hiking Backpack 50L', 'slug': 'hiking-backpack-50l', 'price': Decimal('89.99'), 'category_slug': 'camping-hiking', 'vendor_index': 4, 'images': ['https://images.unsplash.com/photo-1622260614153-03223fb72052?w=800&h=800&fit=crop'], 'description': '<p>Large hiking backpack.</p>'},
            {'name': 'Sleeping Bag Cold Weather', 'slug': 'sleeping-bag-cold-weather', 'price': Decimal('79.99'), 'compare_at_price': Decimal('99.99'), 'category_slug': 'camping-hiking', 'vendor_index': 4, 'images': ['https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=800&h=800&fit=crop'], 'description': '<p>Warm sleeping bag.</p>'},
            {'name': 'Portable Camp Stove', 'slug': 'portable-camp-stove', 'price': Decimal('49.99'), 'category_slug': 'camping-hiking', 'vendor_index': 4, 'images': ['https://images.unsplash.com/photo-1510672981848-a1c4f1cb5ccf?w=800&h=800&fit=crop'], 'description': '<p>Compact camping stove.</p>'},
            {'name': 'LED Headlamp Rechargeable', 'slug': 'led-headlamp-rechargeable', 'price': Decimal('24.99'), 'category_slug': 'camping-hiking', 'vendor_index': 4, 'images': ['https://images.unsplash.com/photo-1544628847-0aa9579b0183?w=800&h=800&fit=crop'], 'description': '<p>Bright rechargeable headlamp.</p>'},

            # BABY & KIDS - Baby Gear (5 products)
            {'name': 'Baby Stroller Lightweight', 'slug': 'baby-stroller-lightweight', 'price': Decimal('199.99'), 'compare_at_price': Decimal('249.99'), 'category_slug': 'baby-gear', 'vendor_index': 7, 'is_featured': True, 'images': ['https://images.unsplash.com/photo-1586356904153-e69a5e50e47e?w=800&h=800&fit=crop'], 'description': '<p>Compact lightweight stroller.</p>'},
            {'name': 'Baby Car Seat', 'slug': 'baby-car-seat', 'price': Decimal('149.99'), 'category_slug': 'baby-gear', 'vendor_index': 7, 'images': ['https://images.unsplash.com/photo-1565538420870-da08ff96a207?w=800&h=800&fit=crop'], 'description': '<p>Safe infant car seat.</p>'},
            {'name': 'Baby Monitor Video', 'slug': 'baby-monitor-video', 'price': Decimal('89.99'), 'category_slug': 'baby-gear', 'vendor_index': 7, 'images': ['https://images.unsplash.com/photo-1544413660-299165566b1d?w=800&h=800&fit=crop'], 'description': '<p>HD video baby monitor.</p>'},
            {'name': 'High Chair Convertible', 'slug': 'high-chair-convertible', 'price': Decimal('129.99'), 'category_slug': 'baby-gear', 'vendor_index': 7, 'images': ['https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&h=800&fit=crop'], 'description': '<p>Convertible high chair.</p>'},
            {'name': 'Diaper Bag Backpack', 'slug': 'diaper-bag-backpack', 'price': Decimal('49.99'), 'category_slug': 'baby-gear', 'vendor_index': 7, 'images': ['https://images.unsplash.com/photo-1544413660-299165566b1d?w=800&h=800&fit=crop'], 'description': '<p>Stylish diaper bag.</p>'},

            # BABY & KIDS - Toys & Games (5 products)
            {'name': 'LEGO Building Set 500pc', 'slug': 'lego-building-set-500pc', 'price': Decimal('49.99'), 'category_slug': 'toys-games', 'vendor_index': 7, 'is_featured': True, 'images': ['https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&h=800&fit=crop'], 'description': '<p>Creative building blocks.</p>'},
            {'name': 'Remote Control Car', 'slug': 'remote-control-car', 'price': Decimal('39.99'), 'category_slug': 'toys-games', 'vendor_index': 7, 'images': ['https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=800&h=800&fit=crop'], 'description': '<p>Fast RC car.</p>'},
            {'name': 'Board Game Family Fun', 'slug': 'board-game-family-fun', 'price': Decimal('24.99'), 'category_slug': 'toys-games', 'vendor_index': 7, 'images': ['https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=800&h=800&fit=crop'], 'description': '<p>Fun family board game.</p>'},
            {'name': 'Stuffed Animal Plush', 'slug': 'stuffed-animal-plush', 'price': Decimal('19.99'), 'category_slug': 'toys-games', 'vendor_index': 7, 'images': ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=800&fit=crop'], 'description': '<p>Soft cuddly plush toy.</p>'},
            {'name': 'Art Supplies Kit Kids', 'slug': 'art-supplies-kit-kids', 'price': Decimal('29.99'), 'category_slug': 'toys-games', 'vendor_index': 7, 'images': ['https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=800&fit=crop'], 'description': '<p>Complete art supplies kit.</p>'},
        ]

        category_map = {cat.slug: cat for cat in categories}
        created_products = []

        for prod_data in products_data:
            category = category_map.get(prod_data.get('category_slug'))
            vendor = vendors[prod_data.get('vendor_index', 0) % len(vendors)]
            images = prod_data.pop('images', [])

            prod_data.pop('category_slug', None)
            prod_data.pop('vendor_index', None)
            is_featured = prod_data.pop('is_featured', False)

            product, created = Product.objects.get_or_create(
                slug=prod_data['slug'],
                defaults={
                    **prod_data,
                    'vendor': vendor,
                    'category': category,
                    'status': ProductStatus.ACTIVE,
                    'quantity': random.randint(10, 100),
                    'rating': round(random.uniform(4.0, 5.0), 1),
                    'review_count': random.randint(10, 300),
                    'view_count': random.randint(100, 5000),
                    'sales_count': random.randint(10, 500),
                    'is_featured': is_featured,
                    'published_at': timezone.now(),
                }
            )

            if created:
                for img_idx, img_url in enumerate(images):
                    ProductImage.objects.create(
                        product=product,
                        url=img_url,
                        alt_text=product.name,
                        sort_order=img_idx,
                        is_primary=img_idx == 0,
                    )

            created_products.append(product)

        return created_products
