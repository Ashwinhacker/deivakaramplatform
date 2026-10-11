export interface DonationProgram {
  id: string;
  name: string;
  basePrice: number;
  tagline: string;
  badge: string;
  icon: 'cake' | 'video' | 'elder' | 'child' | 'animal' | 'general';
  inclusions: string[];
  note: string;
  hasAddons?: boolean;
  hasQuantity?: boolean;
}

export const DONATION_PROGRAMS: DonationProgram[] = [
  {
    id: 'birthday_anniversary',
    name: '1. Birthday / Anniversary Donation',
    basePrice: 2500,
    tagline: 'Starts from Rs. 2,500',
    badge: 'Celebrate Life',
    icon: 'cake',
    inclusions: [
      '25 food meals - Rs. 70 each',
      '1 kg Cake - Rs. 550',
      'Photo Banner - Rs. 150'
    ],
    note: 'Celebrate your special milestones with those who need it most. We share food and joy in your name.',
    hasAddons: true
  },
  {
    id: 'virtual_birthday',
    name: '2. Virtual Birthday Celebration',
    basePrice: 3500,
    tagline: 'Rs. 3,500',
    badge: 'Interactive Meet',
    icon: 'video',
    inclusions: [
      '20 food meals for children',
      'Cake',
      'Chocolates & Juice',
      'Festive items such as balloons and caps'
    ],
    note: 'You can join a virtual meet and celebrate your special day with the children.'
  },
  {
    id: 'old_age_home',
    name: '3. Old Age Home Donation',
    basePrice: 10000,
    tagline: 'Total: Rs. 10,000',
    badge: 'Senior Respect',
    icon: 'elder',
    inclusions: [
      'Food',
      'Cake',
      'Essential items for elders'
    ],
    note: 'A meaningful way to share love, care and respect with senior citizens.'
  },
  {
    id: 'orphanage_home',
    name: '4. Orphanage Home Donation',
    basePrice: 7500,
    tagline: 'Total: Rs. 7,500',
    badge: 'Brighten Childhood',
    icon: 'child',
    inclusions: [
      'Food',
      'Cake',
      'Essential items for children'
    ],
    note: 'Make a special occasion brighter by sharing it with children in need.'
  },
  {
    id: 'feed_stray_animals',
    name: '5. Feed Stray Animals',
    basePrice: 750,
    tagline: 'Starts from Rs. 750',
    badge: 'Compassion for All',
    icon: 'animal',
    inclusions: [
      'Minimum: 25 food portions',
      'Rs. 30 per food portion',
      'Minimum contribution for 25 portions - Rs. 750'
    ],
    note: 'Help provide nourishment and care to animals in need.',
    hasQuantity: true
  },
  {
    id: 'general_custom',
    name: '6. General / Custom Contribution',
    basePrice: 1000,
    tagline: 'Flexible Amount',
    badge: 'Where Most Needed',
    icon: 'general',
    inclusions: [
      'Disaster and emergency hospital relief',
      'Daily Annadhanam free kitchen supplies',
      'Elder medical aid and children education'
    ],
    note: 'Support general operational relief funds where the urgent need is greatest.'
  }
];

export const BIRTHDAY_ADDONS = [
  { id: 'photo_cake', name: 'Photo Cake', price: 800, desc: 'Photo Cake - Rs. 800' },
  { id: 'rose_milk', name: 'Rose Milk (10 glasses)', price: 150, desc: 'Rose Milk - 10 glasses - Rs. 150' },
  { id: 'grocery_kit', name: 'Grocery Kit (1 family)', price: 500, desc: 'Grocery Kit - 1 family - Rs. 500' },
  { id: 'stationery_kit', name: 'Stationery Kit', price: 25, isPerUnit: true, desc: 'Stationery Kit - Rs. 25 each' }
];
