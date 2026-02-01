import asyncio
import sys
sys.path.insert(0, '.')
from app.core.database import AsyncSessionLocal
from sqlalchemy import text


# Map category slugs to relevant Unsplash image search terms
category_images = {
    # Parent categories
    'electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&h=200&fit=crop',
    'fashion-apparel': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=200&h=200&fit=crop',
    'home-garden': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop',
    'health-beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop',
    'sports-outdoors': 'https://images.unsplash.com/photo-1461896836934-bd45ba8a0491?w=200&h=200&fit=crop',
    'automotive': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=200&h=200&fit=crop',
    'food-beverages': 'https://images.unsplash.com/photo-1506617420156-8e4536971650?w=200&h=200&fit=crop',
    'baby-kids': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200&h=200&fit=crop',
    'books-stationery': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=200&fit=crop',
    'pet-supplies': 'https://images.unsplash.com/photo-1450778869180-e77d3bed0267?w=200&h=200&fit=crop',
    'industrial-tools': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200&h=200&fit=crop',
    'agriculture': 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=200&h=200&fit=crop',
    'packaging-printing': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop',
    'textiles-fabrics': 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200&h=200&fit=crop',
    'minerals-energy': 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=200&h=200&fit=crop',
    'jewelry-watches': 'https://images.unsplash.com/photo-1515562141589-67f0d569b6cc?w=200&h=200&fit=crop',
    'office-school-supplies': 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&h=200&fit=crop',
    'toys-games': 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=200&h=200&fit=crop',
    'furniture-decor': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=200&fit=crop',
    'electrical-lighting': 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=200&h=200&fit=crop',

    # Electronics subcategories
    'smartphones': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&h=200&fit=crop',
    'laptops': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&h=200&fit=crop',
    'tablets': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200&h=200&fit=crop',
    'headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop',
    'cameras': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&h=200&fit=crop',
    'televisions': 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=200&h=200&fit=crop',
    'gaming-consoles': 'https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=200&h=200&fit=crop',
    'wearable-tech': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop',
    'networking-equipment': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=200&h=200&fit=crop',
    'storage-devices': 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=200&h=200&fit=crop',
    'drones-accessories': 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=200&h=200&fit=crop',
    'smart-home-devices': 'https://images.unsplash.com/photo-1558002038-1055907df827?w=200&h=200&fit=crop',
    'projectors': 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=200&h=200&fit=crop',
    'power-banks': 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=200&h=200&fit=crop',
    'computer-components': 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=200&h=200&fit=crop',

    # Fashion subcategories
    'men-clothing': 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=200&h=200&fit=crop',
    'women-clothing': 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200&h=200&fit=crop',
    'shoes-footwear': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop',
    'bags-accessories': 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&h=200&fit=crop',
    'sportswear': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=200&fit=crop',
    'formal-wear': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    'swimwear': 'https://images.unsplash.com/photo-1570976447640-ac859083963f?w=200&h=200&fit=crop',
    'maternity-wear': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&h=200&fit=crop',
    'traditional-clothing': 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=200&h=200&fit=crop',
    'plus-size-fashion': 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200&h=200&fit=crop',
    'sunglasses': 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200&h=200&fit=crop',
    'watches': 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=200&h=200&fit=crop',
    'jewelry': 'https://images.unsplash.com/photo-1515562141589-67f0d569b6cc?w=200&h=200&fit=crop',

    # Home & Garden subcategories
    'kitchen-appliances': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop',
    'garden-tools': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=200&fit=crop',
    'home-decor': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&h=200&fit=crop',
    'bedding': 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200&h=200&fit=crop',
    'lighting': 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=200&h=200&fit=crop',
    'bathroom-fixtures': 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=200&h=200&fit=crop',
    'storage-solutions': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop',
    'air-conditioning': 'https://images.unsplash.com/photo-1585338447937-7082f8fc763d?w=200&h=200&fit=crop',
    'cleaning-supplies': 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=200&h=200&fit=crop',
    'bathroom-accessories': 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=200&h=200&fit=crop',
    'bbq-grilling': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&h=200&fit=crop',
    'pest-control': 'https://images.unsplash.com/photo-1585059895524-72f7c14b4e3e?w=200&h=200&fit=crop',
    'home-improvement': 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=200&h=200&fit=crop',

    # Health & Beauty subcategories
    'skincare': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&h=200&fit=crop',
    'haircare': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&h=200&fit=crop',
    'makeup': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop',
    'fragrances': 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=200&h=200&fit=crop',
    'vitamins-supplements': 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=200&h=200&fit=crop',
    'fitness-equipment': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=200&fit=crop',
    'personal-care': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=200&h=200&fit=crop',
    'dental-care': 'https://images.unsplash.com/photo-1559757175-7cb036712cde?w=200&h=200&fit=crop',
    'massage-equipment': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=200&h=200&fit=crop',
    'first-aid': 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=200&h=200&fit=crop',
    'oral-care': 'https://images.unsplash.com/photo-1559757175-7cb036712cde?w=200&h=200&fit=crop',
    'men-grooming': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&h=200&fit=crop',
    'nail-care': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200&h=200&fit=crop',
    'medical-devices': 'https://images.unsplash.com/photo-1530497610245-b4ca40da4e47?w=200&h=200&fit=crop',
    'weight-management': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=200&fit=crop',

    # Sports & Outdoors
    'camping-hiking': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=200&h=200&fit=crop',
    'cycling': 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=200&h=200&fit=crop',
    'fishing': 'https://images.unsplash.com/photo-1532015421-e9a8c5c63d56?w=200&h=200&fit=crop',
    'team-sports': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&h=200&fit=crop',
    'gym-fitness': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=200&fit=crop',
    'yoga-pilates': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&h=200&fit=crop',
    'running-jogging': 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=200&h=200&fit=crop',
    'swimming': 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=200&h=200&fit=crop',
    'outdoor-furniture': 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=200&h=200&fit=crop',
    'sports-nutrition': 'https://images.unsplash.com/photo-1593095948071-474c5cc2c786?w=200&h=200&fit=crop',
    'water-sports': 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=200&h=200&fit=crop',
    'martial-arts': 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=200&h=200&fit=crop',
    'golf-equipment': 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=200&h=200&fit=crop',
    'winter-sports': 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=200&h=200&fit=crop',
    'hunting-shooting': 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=200&h=200&fit=crop',

    # Automotive
    'car-parts': 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=200&h=200&fit=crop',
    'car-electronics': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop',
    'tires-wheels': 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=200&h=200&fit=crop',
    'car-accessories': 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=200&h=200&fit=crop',
    'oils-fluids': 'https://images.unsplash.com/photo-1635784341046-e886e5a32e1e?w=200&h=200&fit=crop',
    'car-care': 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=200&h=200&fit=crop',
    'tools-equipment': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200&h=200&fit=crop',
    'safety-security': 'https://images.unsplash.com/photo-1558002038-1055907df827?w=200&h=200&fit=crop',
    'performance-parts': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=200&h=200&fit=crop',
    'truck-accessories': 'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=200&h=200&fit=crop',
    'car-audio': 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=200&h=200&fit=crop',
    'car-lighting': 'https://images.unsplash.com/photo-1621252179027-94459d278660?w=200&h=200&fit=crop',
    'motorcycle-parts': 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=200&h=200&fit=crop',
    'car-cleaning': 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=200&h=200&fit=crop',
    'gps-navigation': 'https://images.unsplash.com/photo-1476242906366-d8eb64c2f661?w=200&h=200&fit=crop',

    # Food & Beverages
    'snacks': 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=200&h=200&fit=crop',
    'beverages': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200&h=200&fit=crop',
    'canned-goods': 'https://images.unsplash.com/photo-1534483509719-8a40e3a22e63?w=200&h=200&fit=crop',
    'grains-cereals': 'https://images.unsplash.com/photo-1556710808-a2bc27a448f2?w=200&h=200&fit=crop',
    'dairy-products': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&h=200&fit=crop',
    'condiments-sauces': 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=200&h=200&fit=crop',
    'cooking-oils': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&h=200&fit=crop',
    'dried-fruits-nuts': 'https://images.unsplash.com/photo-1536816579748-4ecb3f03d72a?w=200&h=200&fit=crop',
    'tea-coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&h=200&fit=crop',
    'confectionery': 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=200&h=200&fit=crop',
    'organic-foods': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop',
    'spices-herbs': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&h=200&fit=crop',
    'frozen-foods': 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=200&h=200&fit=crop',
    'baby-food': 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=200&h=200&fit=crop',
    'gourmet-foods': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop',

    # Baby & Kids
    'baby-clothing': 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=200&h=200&fit=crop',
    'diapers-wipes': 'https://images.unsplash.com/photo-1584839404042-8bc22a0e3480?w=200&h=200&fit=crop',
    'baby-toys': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200&h=200&fit=crop',
    'strollers': 'https://images.unsplash.com/photo-1591135142710-a5e1a38be000?w=200&h=200&fit=crop',
    'baby-care': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200&h=200&fit=crop',
    'kids-fashion': 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=200&h=200&fit=crop',
    'baby-furniture': 'https://images.unsplash.com/photo-1586105449897-20b5efeb3233?w=200&h=200&fit=crop',
    'kids-shoes': 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=200&h=200&fit=crop',
    'maternity-products': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&h=200&fit=crop',
    'kids-electronics': 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=200&h=200&fit=crop',
    'nursery-furniture': 'https://images.unsplash.com/photo-1586105449897-20b5efeb3233?w=200&h=200&fit=crop',
    'baby-safety': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200&h=200&fit=crop',
    'kids-clothing': 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=200&h=200&fit=crop',
    'school-supplies': 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&h=200&fit=crop',
    'baby-feeding': 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=200&h=200&fit=crop',

    # Books & Stationery
    'fiction-books': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=200&fit=crop',
    'non-fiction': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=200&fit=crop',
    'notebooks': 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=200&h=200&fit=crop',
    'pens-pencils': 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=200&h=200&fit=crop',
    'art-supplies': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&h=200&fit=crop',
    'office-supplies': 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&h=200&fit=crop',
    'educational-books': 'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?w=200&h=200&fit=crop',
    'diaries-planners': 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=200&h=200&fit=crop',
    'greeting-cards': 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=200&h=200&fit=crop',
    'childrens-books': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&h=200&fit=crop',
    'e-books': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=200&fit=crop',
    'magazines': 'https://images.unsplash.com/photo-1504711434969-e33886168d9c?w=200&h=200&fit=crop',
    'gift-wrapping': 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=200&h=200&fit=crop',
    'calendars-planners': 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=200&h=200&fit=crop',
    'craft-supplies': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&h=200&fit=crop',

    # Pet Supplies
    'dog-supplies': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop',
    'cat-supplies': 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop',
    'bird-supplies': 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=200&h=200&fit=crop',
    'pet-food': 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=200&h=200&fit=crop',
    'pet-accessories': 'https://images.unsplash.com/photo-1601758123927-4f7acc7da589?w=200&h=200&fit=crop',
    'pet-grooming': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop',
    'pet-toys': 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=200&h=200&fit=crop',
    'pet-beds': 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=200&h=200&fit=crop',
    'pet-carriers': 'https://images.unsplash.com/photo-1601758123927-4f7acc7da589?w=200&h=200&fit=crop',
    'pet-medication': 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=200&h=200&fit=crop',
    'aquarium-supplies': 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=200&h=200&fit=crop',
    'reptile-supplies': 'https://images.unsplash.com/photo-1504450874802-0ba2bcd659e3?w=200&h=200&fit=crop',
    'pet-health': 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=200&h=200&fit=crop',
    'pet-clothing': 'https://images.unsplash.com/photo-1583337130417-13571a247434?w=200&h=200&fit=crop',
    'pet-training': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop',

    # Jewelry & Watches
    'diamond-jewelry': 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200&h=200&fit=crop',
    'gold-jewelry': 'https://images.unsplash.com/photo-1515562141589-67f0d569b6cc?w=200&h=200&fit=crop',
    'silver-jewelry': 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&h=200&fit=crop',
    'luxury-watches': 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=200&h=200&fit=crop',
    'fashion-watches': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop',
    'earrings': 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&h=200&fit=crop',
    'necklaces-pendants': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&h=200&fit=crop',
    'bracelets-bangles': 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=200&h=200&fit=crop',
    'rings': 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200&h=200&fit=crop',
    'wedding-jewelry': 'https://images.unsplash.com/photo-1515562141589-67f0d569b6cc?w=200&h=200&fit=crop',

    # Toys & Games
    'action-figures': 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=200&h=200&fit=crop',
    'board-games': 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=200&h=200&fit=crop',
    'building-blocks': 'https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=200&h=200&fit=crop',
    'dolls-accessories': 'https://images.unsplash.com/photo-1613682988402-8264c tried-image?w=200&h=200&fit=crop',
    'educational-toys': 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=200&h=200&fit=crop',
    'outdoor-play': 'https://images.unsplash.com/photo-1566140967404-b8b3932483f5?w=200&h=200&fit=crop',
    'puzzles': 'https://images.unsplash.com/photo-1606503153255-59d7e15ef6be?w=200&h=200&fit=crop',
    'remote-control-toys': 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=200&h=200&fit=crop',
    'video-games-consoles': 'https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=200&h=200&fit=crop',
    'stuffed-animals': 'https://images.unsplash.com/photo-1559715541-5daf8a0296d0?w=200&h=200&fit=crop',

    # Furniture & Decor
    'living-room-furniture': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=200&fit=crop',
    'bedroom-furniture': 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=200&h=200&fit=crop',
    'dining-furniture': 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=200&h=200&fit=crop',
    'outdoor-furniture': 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=200&h=200&fit=crop',
    'storage-organization': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop',
    'wall-art-decor': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&h=200&fit=crop',
    'rugs-carpets': 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=200&h=200&fit=crop',
    'curtains-blinds': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&h=200&fit=crop',
    'shelving-bookcases': 'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=200&h=200&fit=crop',
    'bathroom-furniture': 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=200&h=200&fit=crop',

    # Office & School Supplies
    'printers-scanners': 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=200&h=200&fit=crop',
    'office-furniture': 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=200&h=200&fit=crop',
    'writing-instruments': 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=200&h=200&fit=crop',
    'paper-products': 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=200&h=200&fit=crop',
    'filing-storage': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop',
    'presentation-supplies': 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&h=200&fit=crop',
    'desk-accessories': 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=200&h=200&fit=crop',
    'school-bags': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&h=200&fit=crop',
    'calculators-electronics': 'https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=200&h=200&fit=crop',

    # Electrical & Lighting
    'led-lighting': 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=200&h=200&fit=crop',
    'chandeliers': 'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?w=200&h=200&fit=crop',
    'outdoor-lighting': 'https://images.unsplash.com/photo-1558882224-dda166ffe2ec?w=200&h=200&fit=crop',
    'solar-lighting': 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=200&h=200&fit=crop',
    'switches-sockets': 'https://images.unsplash.com/photo-1558002038-1055907df827?w=200&h=200&fit=crop',
    'wiring-cables': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=200&h=200&fit=crop',
    'circuit-breakers': 'https://images.unsplash.com/photo-1558002038-1055907df827?w=200&h=200&fit=crop',
    'generators': 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=200&h=200&fit=crop',
    'transformers': 'https://images.unsplash.com/photo-1558002038-1055907df827?w=200&h=200&fit=crop',
    'smart-lighting': 'https://images.unsplash.com/photo-1558002038-1055907df827?w=200&h=200&fit=crop',

    # Industrial & Tools
    'hand-tools': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200&h=200&fit=crop',
    'power-tools': 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=200&h=200&fit=crop',
    'safety-equipment': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&h=200&fit=crop',
    'measuring-tools': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200&h=200&fit=crop',
    'welding-equipment': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200&h=200&fit=crop',
    'woodworking-tools': 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=200&h=200&fit=crop',
    'plumbing-tools': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200&h=200&fit=crop',
    'electrical-tools': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200&h=200&fit=crop',
    'industrial-chemicals': 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=200&h=200&fit=crop',

    # Agriculture
    'seeds-plants': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=200&fit=crop',
    'fertilizers': 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=200&h=200&fit=crop',
    'irrigation-equipment': 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=200&h=200&fit=crop',
    'greenhouse-supplies': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=200&fit=crop',
    'animal-feed': 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=200&h=200&fit=crop',
    'farm-machinery': 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=200&h=200&fit=crop',
    'poultry-equipment': 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=200&h=200&fit=crop',
    'aquaculture': 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=200&h=200&fit=crop',

    # Packaging & Printing
    'gift-boxes': 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=200&h=200&fit=crop',
    'shipping-supplies': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop',
    'labels-tags': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop',
    'printing-machinery': 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=200&h=200&fit=crop',
    'packaging-design': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop',

    # Textiles & Fabrics
    'denim-fabric': 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200&h=200&fit=crop',
    'silk-fabric': 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200&h=200&fit=crop',
    'cotton-fabric': 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200&h=200&fit=crop',
    'leather-faux-leather': 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200&h=200&fit=crop',
    'embroidery-supplies': 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200&h=200&fit=crop',

    # Minerals & Energy
    'precious-metals': 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=200&h=200&fit=crop',
    'industrial-minerals': 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=200&h=200&fit=crop',
    'renewable-energy': 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=200&h=200&fit=crop',
    'oil-gas-equipment': 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=200&h=200&fit=crop',
    'battery-storage': 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=200&h=200&fit=crop',
}


async def seed():
    async with AsyncSessionLocal() as db:
        updated = 0
        for slug, image_url in category_images.items():
            result = await db.execute(
                text("UPDATE categories SET image_url = :url WHERE slug = :slug AND (image_url IS NULL OR image_url = '')"),
                {'url': image_url, 'slug': slug}
            )
            if result.rowcount > 0:
                updated += 1

        await db.commit()
        print(f"Updated {updated} categories with images")

        # Show categories still missing images
        result = await db.execute(
            text("SELECT slug, name FROM categories WHERE image_url IS NULL OR image_url = ''")
        )
        missing = result.fetchall()
        if missing:
            print(f"\n{len(missing)} categories still missing images:")
            for row in missing:
                print(f"  '{row[0]}': '',")


if __name__ == "__main__":
    asyncio.run(seed())
