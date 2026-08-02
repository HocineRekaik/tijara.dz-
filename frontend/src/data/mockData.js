// Algerian Wilayas used in mock data
export const wilayas = [
  { id: 'algiers', name: 'الجزائر العاصمة' },
  { id: 'oran', name: 'وهران' },
  { id: 'constantine', name: 'قسنطينة' },
  { id: 'setif', name: 'سطيف' },
  { id: 'tizi-ouzou', name: 'تيزي وزو' },
  { id: 'batna', name: 'باتنة' },
  { id: 'annaba', name: 'عنابة' },
  { id: 'blida', name: 'البليدة' },
];

// Categories
export const categories = [
  {
    id: 'phones',
    name: 'الهواتف',
    icon: '📱',
    count: 124,
    image: 'https://hips.hearstapps.com/hmg-prod/images/apple-iphone-17-group-001-68cacd4eb0920.jpg?crop=0.713xw:0.950xh;0.136xw,0.0317xh&resize=1200:*',
  },
  {
    id: 'clothes',
    name: 'الملابس',
    icon: '👕',
    count: 342,
    image: 'https://img.magnific.com/free-photo/clothing-rack-with-floral-hawaiian-shirts-hangers-hat_23-2149366018.jpg',
  },
  {
    id: 'accessories',
    name: 'الإكسسوارات',
    icon: '🎧',
    count: 198,
    image: 'https://t4.ftcdn.net/jpg/03/66/78/53/360_F_366785399_CSlYBX3DDS5r8yXvlaGHO13CWbYl6YQ9.jpg',
  },
  {
    id: 'electronics',
    name: 'الإلكترونيات',
    icon: '💻',
    count: 156,
    image: 'https://cdn.thewirecutter.com/wp-content/media/2026/03/BEST-MACBOOKS-5410-3x2-1.jpg?auto=webp&quality=75&crop=3:2&width=1024',
  },
  {
    id: 'sports',
    name: 'المنتجات الرياضية',
    icon: '🏀',
    count: 87,
    image: 'https://t4.ftcdn.net/jpg/01/92/31/55/360_F_192315562_ILTPfWZRq6e4LqS7f7Z4jL3y5e5V0KpM.jpg',
    subcategories: [
      'ملابس رياضية',
      'أحذية رياضية',
      'كرات ومعدات رياضية',
      'كرة القدم',
      'كرة السلة',
      'اللياقة البدنية',
      'الجري',
      'إكسسوارات رياضية',
      'معدات التدريب',
    ],
  },
];

// All stores (unified list used for discovery, categories, featured, and latest)
export const allStores = [
  // ========== PHONES ==========
  {
    id: 101,
    title: 'موبايل إكسبريس (Mobile Express)',
    description: 'أفضل الهواتف الذكية الأصلية وإكسسواراتها مع كفالة حقيقية وتوصيل لـ 58 ولاية.',
    category: 'الهواتف',
    wilaya: 'الجزائر العاصمة',
    location: 'الجزائر العاصمة - باب الزوار',
    phone: '0555 12 34 56',
    email: 'contact@mobileexpress.dz',
    rating: 4.9,
    reviewCount: 312,
    badge: 'مميز',
    tags: ['هواتف', 'سامسونج', 'أبل', 'توصيل'],
    isFeatured: true,
    createdAt: '2025-01-15',
    workingHours: 'السبت - الخميس: 09:00 - 20:00',
    about: 'موبايل إكسبريس هو المتجر الرائد في بيع الهواتف الذكية الأصلية في الجزائر. نوفر أحدث إصدارات سامسونج، أبل، شاومي وهواوي مع كفالة رسمية وخدمة ما بعد البيع. نوصل لجميع الولايات الـ 58 مع إمكانية الدفع عند الاستلام.',
    products: [
      { name: 'Samsung Galaxy S25 Ultra', price: '299,000 د.ج' },
      { name: 'iPhone 16 Pro Max', price: '389,000 د.ج' },
      { name: 'Xiaomi 15 Pro', price: '149,000 د.ج' },
      { name: 'واقي شاشة زجاج', price: '1,500 د.ج' },
    ]
  },
  {
    id: 105,
    title: 'فون بلازا (Phone Plaza)',
    description: 'هواتف مستعملة ومجددة بحالة ممتازة وأسعار مغرية مع ضمان 3 أشهر.',
    category: 'الهواتف',
    wilaya: 'وهران',
    location: 'وهران - المدينة الجديدة',
    phone: '0661 44 55 66',
    email: 'info@phoneplaza.dz',
    rating: 4.3,
    reviewCount: 89,
    tags: ['هواتف_مستعملة', 'مجدد', 'ضمان', 'وهران'],
    isFeatured: false,
    createdAt: '2025-11-20',
    workingHours: 'السبت - الخميس: 10:00 - 19:00',
    about: 'فون بلازا متخصص في بيع الهواتف المستعملة والمجددة بحالة ممتازة. كل جهاز يخضع لفحص شامل من 25 نقطة قبل البيع.',
    products: [
      { name: 'iPhone 14 (مجدد)', price: '135,000 د.ج' },
      { name: 'Samsung S23 (مستعمل)', price: '95,000 د.ج' },
      { name: 'Oppo Reno 10 (مجدد)', price: '55,000 د.ج' },
    ]
  },
  {
    id: 106,
    title: 'جوال ستور (Jawwal Store)',
    description: 'أكبر تشكيلة من الهواتف الذكية وشرائح الاتصال مع عروض حصرية أسبوعية.',
    category: 'الهواتف',
    wilaya: 'قسنطينة',
    location: 'قسنطينة - شارع بن مليك',
    phone: '0550 77 88 99',
    email: 'sales@jawwalstore.dz',
    rating: 4.6,
    reviewCount: 156,
    tags: ['هواتف', 'عروض', 'شرائح', 'قسنطينة'],
    isFeatured: false,
    createdAt: '2025-06-10',
    workingHours: 'السبت - الخميس: 09:30 - 19:30',
    about: 'جوال ستور يقدم أفضل العروض الأسبوعية على الهواتف الذكية الجديدة مع خدمة توصيل سريعة لجميع أحياء قسنطينة.',
    products: [
      { name: 'Samsung Galaxy A55', price: '65,000 د.ج' },
      { name: 'Infinix Note 40 Pro', price: '42,000 د.ج' },
      { name: 'شريحة Djezzy 4G', price: '500 د.ج' },
    ]
  },

  // ========== CLOTHES ==========
  {
    id: 102,
    title: 'أناقة دي زاد (Anaka DZ Store)',
    description: 'ملابس رجالية ونسائية عصرية بأفضل الأسعار. تصاميم تركية ومحلية ذات جودة عالية.',
    category: 'الملابس',
    wilaya: 'وهران',
    location: 'وهران - حي العقيد لطفي',
    phone: '0662 98 76 54',
    email: 'anaka@store.dz',
    rating: 4.8,
    reviewCount: 245,
    badge: 'الأكثر طلباً',
    tags: ['ملابس', 'موضة', 'تركيا', 'وهران'],
    isFeatured: true,
    createdAt: '2024-08-05',
    workingHours: 'السبت - الخميس: 10:00 - 21:00',
    about: 'أناقة دي زاد هو متجرك المفضل للملابس العصرية بأسعار تنافسية. نستورد أفخم التصاميم التركية ونقدم مقاسات من XS حتى 4XL للرجال والنساء.',
    products: [
      { name: 'جاكيت جلد رجالي تركي', price: '8,500 د.ج' },
      { name: 'فستان سهرة نسائي', price: '12,000 د.ج' },
      { name: 'قميص كاجوال رجالي', price: '3,200 د.ج' },
      { name: 'بنطلون جينز نسائي', price: '4,500 د.ج' },
    ]
  },
  {
    id: 202,
    title: 'شيك كيدز (Chic Kids)',
    description: 'ملابس أطفال حديثي الولادة وحتى سن 12 سنة. خامات قطنية مريحة وصحية لأطفالكم.',
    category: 'الملابس',
    wilaya: 'تيزي وزو',
    location: 'تيزي وزو - شارع الحرية',
    phone: '026 98 76 54',
    email: 'info@chickids.dz',
    rating: 4.7,
    reviewCount: 178,
    tags: ['أطفال', 'ملابس', 'تيزي_وزو', 'قطن'],
    isFeatured: false,
    createdAt: '2025-09-12',
    workingHours: 'السبت - الخميس: 09:00 - 18:00',
    about: 'شيك كيدز يهتم براحة أطفالكم أولاً. جميع منتجاتنا من القطن العضوي الطبيعي بألوان وتصاميم مبهجة تناسب جميع المناسبات.',
    products: [
      { name: 'طقم مولود جديد (5 قطع)', price: '4,200 د.ج' },
      { name: 'فستان بنات ربيعي', price: '2,800 د.ج' },
      { name: 'بيجاما أطفال قطنية', price: '1,900 د.ج' },
    ]
  },
  {
    id: 107,
    title: 'ستايل مان (Style Man DZ)',
    description: 'ملابس رجالية كلاسيكية وكاجوال للعمل والمناسبات. بدلات، أحذية، وإكسسوارات.',
    category: 'الملابس',
    wilaya: 'الجزائر العاصمة',
    location: 'الجزائر العاصمة - الحمادية',
    phone: '0555 88 11 22',
    email: 'styleman@mail.dz',
    rating: 4.5,
    reviewCount: 134,
    tags: ['رجالي', 'بدلات', 'كلاسيك', 'الجزائر'],
    isFeatured: false,
    createdAt: '2025-04-22',
    workingHours: 'السبت - الخميس: 10:00 - 20:00',
    about: 'ستايل مان يقدم أرقى الأزياء الرجالية للمحترفين. بدلات رسمية، قمصان عمل، وأحذية إيطالية مع خدمة تفصيل حسب المقاس.',
    products: [
      { name: 'بدلة رسمية كاملة', price: '18,000 د.ج' },
      { name: 'حذاء جلد إيطالي', price: '9,500 د.ج' },
      { name: 'ربطة عنق حرير', price: '2,200 د.ج' },
    ]
  },

  // ========== ACCESSORIES ==========
  {
    id: 201,
    title: 'صوت ونغم (Sound & Tune)',
    description: 'سماعات رأس لاسلكية ومكبرات صوت ذكية من أشهر الماركات العالمية بأسعار تنافسية.',
    category: 'الإكسسوارات',
    wilaya: 'سطيف',
    location: 'سطيف - شارع الذهب',
    phone: '036 12 34 56',
    email: 'sound@tune.dz',
    rating: 4.6,
    reviewCount: 98,
    tags: ['سماعات', 'صوت', 'سبيكر', 'سطيف'],
    isFeatured: false,
    createdAt: '2025-10-05',
    workingHours: 'السبت - الخميس: 10:00 - 19:00',
    about: 'صوت ونغم هو وجهتك الأولى لعشاق الموسيقى. نوفر سماعات JBL, Sony, Bose وأجهزة صوت ذكية مع خدمة تجربة مجانية في المحل.',
    products: [
      { name: 'سماعات JBL Tune 770NC', price: '15,000 د.ج' },
      { name: 'مكبر صوت Sony SRS-XB100', price: '8,500 د.ج' },
      { name: 'سماعات AirPods Pro 2', price: '22,000 د.ج' },
    ]
  },
  {
    id: 204,
    title: 'مجوهرات الرمال (Rimal Jewelry)',
    description: 'إكسسوارات نسائية مطلية بالذهب ومجوهرات فضية بتصميمات شرقية وعصرية ساحرة.',
    category: 'الإكسسوارات',
    wilaya: 'باتنة',
    location: 'باتنة - مروانة',
    phone: '033 12 99 88',
    email: 'rimal@jewelry.dz',
    rating: 4.8,
    reviewCount: 210,
    badge: 'الأعلى تقييماً',
    tags: ['مجوهرات', 'فضة', 'إكسسوارات_نسائية', 'باتنة'],
    isFeatured: true,
    createdAt: '2024-12-01',
    workingHours: 'السبت - الخميس: 09:00 - 18:00',
    about: 'مجوهرات الرمال تقدم تشكيلة واسعة من الإكسسوارات النسائية الفاخرة. تصاميم شرقية أصيلة وعصرية مستوحاة من التراث الجزائري.',
    products: [
      { name: 'عقد فضة مطلي بالذهب', price: '6,500 د.ج' },
      { name: 'أسوارة مرجان جزائري', price: '4,200 د.ج' },
      { name: 'أقراط لؤلؤ طبيعي', price: '8,000 د.ج' },
    ]
  },
  {
    id: 108,
    title: 'كفر زون (Cover Zone)',
    description: 'أغلفة هواتف، واقيات شاشة، وشواحن سريعة لجميع الماركات بتصاميم عصرية.',
    category: 'الإكسسوارات',
    wilaya: 'عنابة',
    location: 'عنابة - شارع الاستقلال',
    phone: '038 55 66 77',
    email: 'coverzone@mail.dz',
    rating: 4.4,
    reviewCount: 67,
    tags: ['أغلفة', 'شواحن', 'واقي_شاشة', 'عنابة'],
    isFeatured: false,
    createdAt: '2026-01-15',
    workingHours: 'السبت - الخميس: 09:30 - 19:00',
    about: 'كفر زون يوفر جميع إكسسوارات الهواتف من أغلفة مقاومة للصدمات وواقيات شاشة زجاجية وشواحن سريعة لجميع الماركات.',
    products: [
      { name: 'غلاف iPhone 16 مقاوم للصدمات', price: '1,800 د.ج' },
      { name: 'شاحن سريع 65W', price: '3,200 د.ج' },
      { name: 'كابل USB-C مضفر 2م', price: '800 د.ج' },
    ]
  },

  // ========== ELECTRONICS ==========
  {
    id: 103,
    title: 'تيك زون (TechZone Constantine)',
    description: 'معدات ومستلزمات الحواسيب، تجهيز غرف الألعاب (Gaming Setup) وبطاقات الشحن الرقمية.',
    category: 'الإلكترونيات',
    wilaya: 'قسنطينة',
    location: 'قسنطينة - وسط المدينة',
    phone: '0770 45 67 89',
    email: 'tech@zoneconstantine.dz',
    rating: 4.9,
    reviewCount: 287,
    badge: 'تقييم عالي',
    tags: ['إلكترونيات', 'ألعاب', 'حواسيب', 'قسنطينة'],
    isFeatured: true,
    createdAt: '2024-06-20',
    workingHours: 'السبت - الخميس: 09:00 - 21:00',
    about: 'تيك زون هو أكبر متجر لمعدات الحواسيب والألعاب في قسنطينة. نوفر أحدث البطاقات الرسومية، المعالجات، والشاشات مع خدمة تركيب وتجميع مجانية.',
    products: [
      { name: 'RTX 4070 Super', price: '120,000 د.ج' },
      { name: 'كرسي غيمنغ DXRacer', price: '35,000 د.ج' },
      { name: 'لوحة مفاتيح ميكانيكية RGB', price: '12,000 د.ج' },
      { name: 'شاشة 27" 165Hz IPS', price: '55,000 د.ج' },
    ]
  },
  {
    id: 203,
    title: 'الجزائر الذكية (Smart Algiers)',
    description: 'أجهزة منزلية ذكية، كاميرات مراقبة، وأنظمة أمان متطورة للمنازل والمحلات التجارية.',
    category: 'الإلكترونيات',
    wilaya: 'الجزائر العاصمة',
    location: 'الجزائر العاصمة - دالي براهيم',
    phone: '023 45 67 89',
    email: 'smart@algiers.dz',
    rating: 4.5,
    reviewCount: 143,
    tags: ['أمان', 'منزل_ذكي', 'كاميرات', 'الجزائر'],
    isFeatured: false,
    createdAt: '2025-07-30',
    workingHours: 'السبت - الخميس: 08:30 - 18:30',
    about: 'الجزائر الذكية متخصصة في حلول المنزل الذكي والأمان. نوفر كاميرات مراقبة، أقفال ذكية، وأنظمة إنذار مع خدمة تركيب احترافية.',
    products: [
      { name: 'كاميرا مراقبة WiFi 360°', price: '7,500 د.ج' },
      { name: 'قفل ذكي بالبصمة', price: '15,000 د.ج' },
      { name: 'نظام إنذار 4 مناطق', price: '25,000 د.ج' },
    ]
  },
  {
    id: 109,
    title: 'ميغا تيك (Mega Tech)',
    description: 'حواسيب محمولة، طابعات، وأجهزة مكتبية للشركات والأفراد بأسعار الجملة.',
    category: 'الإلكترونيات',
    wilaya: 'البليدة',
    location: 'البليدة - شارع فرانتز فانون',
    phone: '025 33 44 55',
    email: 'mega@tech.dz',
    rating: 4.2,
    reviewCount: 76,
    tags: ['حواسيب_محمولة', 'طابعات', 'مكتبية', 'البليدة'],
    isFeatured: false,
    createdAt: '2026-03-01',
    workingHours: 'السبت - الخميس: 09:00 - 18:00',
    about: 'ميغا تيك يقدم حلولاً تقنية شاملة للشركات والأفراد. حواسيب HP, Dell, Lenovo وطابعات بأسعار الجملة مع ضمان وصيانة.',
    products: [
      { name: 'Lenovo ThinkPad L14', price: '95,000 د.ج' },
      { name: 'طابعة HP LaserJet Pro', price: '28,000 د.ج' },
      { name: 'شاشة Dell 24" FHD', price: '32,000 د.ج' },
    ]
  },
];

// Helper: get featured stores
export const featuredStores = allStores.filter(s => s.isFeatured);

// Helper: get latest stores (sorted by creation date descending)
export const latestStores = [...allStores]
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  .slice(0, 4);

// Helper: get stores by category
export const getStoresByCategory = (categoryName) =>
  allStores.filter(s => s.category === categoryName);

// Helper: get store by ID
export const getStoreById = (id) =>
  allStores.find(s => s.id === id);
