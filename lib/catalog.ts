import type { Product } from "@/lib/types";

const defaultSizes = ["7", "8", "9", "10", "11", "12", "13"];

const productImages = {
  orange:
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
  trail:
    "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=900&q=80",
  daily:
    "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=900&q=80",
  white:
    "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=80",
  casual:
    "https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&w=900&q=80",
  skate:
    "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80",
  recovery:
    "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=80",
  track:
    "https://images.unsplash.com/photo-1605408499391-6368c628ef42?auto=format&fit=crop&w=900&q=80",
};

const colorways = {
  sprint: [
    { name: "Volt Orange", hex: "#F97316", imageUrl: productImages.orange },
    { name: "Black", hex: "#111827", imageUrl: productImages.skate },
    { name: "White", hex: "#F8FAFC", imageUrl: productImages.white },
    { name: "Electric Blue", hex: "#2563EB", imageUrl: productImages.track },
  ],
  trail: [
    { name: "Ember", hex: "#C2410C", imageUrl: productImages.trail },
    { name: "Forest", hex: "#166534", imageUrl: productImages.recovery },
    { name: "Stone", hex: "#78716C", imageUrl: productImages.casual },
  ],
  daily: [
    { name: "Mist", hex: "#CBD5E1", imageUrl: productImages.daily },
    { name: "Navy", hex: "#1E3A8A", imageUrl: productImages.track },
    { name: "Coral", hex: "#FB7185", imageUrl: productImages.orange },
    { name: "Black", hex: "#111827", imageUrl: productImages.skate },
  ],
  race: [
    { name: "White Flame", hex: "#F8FAFC", imageUrl: productImages.white },
    { name: "Crimson", hex: "#DC2626", imageUrl: productImages.orange },
    { name: "Hyper Lime", hex: "#84CC16", imageUrl: productImages.track },
  ],
};

export const fallbackProducts: Product[] = [
  {
    id: 1,
    name: "Aero Sprint X",
    description: "Featherweight tempo shoe for fast road sessions.",
    price: 129,
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    inventory: 24,
    status: "active",
    sizingInfo: "US sizes 7-13. True-to-size with a close performance hold through the midfoot.",
    fitNotes:
      "Best for neutral runners who want a fast, locked-in feel for tempo days and intervals.",
    availableSizes: defaultSizes,
    availableColors: colorways.sprint,
    specs: [
      { label: "Weight", value: "7.4 oz" },
      { label: "Drop", value: "6 mm" },
      { label: "Surface", value: "Road" },
      { label: "Cushion", value: "Responsive foam" },
    ],
  },
  {
    id: 2,
    name: "Trail Ember Pro",
    description: "Aggressive grip and rock protection for technical trails.",
    price: 154,
    imageUrl:
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=900&q=80",
    inventory: 18,
    status: "active",
    sizingInfo:
      "US sizes 7-14. Runs slightly snug; consider a half size up for thicker trail socks.",
    fitNotes:
      "Protective trail fit with a reinforced toe, grippy outsole, and stable platform on uneven ground.",
    availableSizes: ["7", "8", "9", "10", "11", "12", "13", "14"],
    availableColors: colorways.trail,
    specs: [
      { label: "Weight", value: "10.2 oz" },
      { label: "Drop", value: "8 mm" },
      { label: "Surface", value: "Technical trail" },
      { label: "Lug depth", value: "5 mm" },
    ],
  },
  {
    id: 3,
    name: "Cloud Mile 3",
    description: "Soft daily trainer built for high-mileage comfort.",
    price: 118,
    imageUrl:
      "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=900&q=80",
    inventory: 32,
    status: "active",
    sizingInfo: "US sizes 6-13. True-to-size with a roomy forefoot for longer runs.",
    fitNotes:
      "Soft daily fit for high-mileage runners who want comfort without a sloppy upper.",
    availableSizes: ["6", "7", "8", "9", "10", "11", "12", "13"],
    availableColors: colorways.daily,
    specs: [
      { label: "Weight", value: "9.1 oz" },
      { label: "Drop", value: "10 mm" },
      { label: "Surface", value: "Road" },
      { label: "Cushion", value: "Max comfort" },
    ],
  },
  {
    id: 4,
    name: "Marathon Carbon",
    description: "Carbon plate propulsion for race-day efficiency.",
    price: 219,
    imageUrl:
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=80",
    inventory: 12,
    status: "active",
    sizingInfo: "US sizes 7-13. Race fit; narrow-footed runners can stay true-to-size.",
    fitNotes:
      "Snug race-day lockdown with a carbon plate and rocker geometry for efficient turnover.",
    availableSizes: defaultSizes,
    availableColors: colorways.race,
    specs: [
      { label: "Weight", value: "6.8 oz" },
      { label: "Drop", value: "8 mm" },
      { label: "Plate", value: "Full carbon" },
      { label: "Best for", value: "Marathon racing" },
    ],
  },
  {
    id: 5,
    name: "City Run Knit",
    description: "Breathable knit upper for relaxed urban runs.",
    price: 96,
    imageUrl:
      "https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&w=900&q=80",
    inventory: 29,
    status: "active",
    sizingInfo: "US sizes 6-12. Flexible knit upper adapts to most foot shapes.",
    fitNotes:
      "Easygoing urban fit with breathable stretch and moderate support for relaxed miles.",
    availableSizes: ["6", "7", "8", "9", "10", "11", "12"],
    availableColors: [
      { name: "Knit Black", hex: "#18181B", imageUrl: productImages.casual },
      { name: "Sand", hex: "#D6D3D1", imageUrl: productImages.white },
      { name: "Sky", hex: "#38BDF8", imageUrl: productImages.track },
    ],
    specs: [
      { label: "Weight", value: "8.6 oz" },
      { label: "Drop", value: "8 mm" },
      { label: "Upper", value: "Engineered knit" },
      { label: "Surface", value: "Road and gym" },
    ],
  },
  {
    id: 6,
    name: "Stability Core",
    description: "Guided support for smooth, confident daily training.",
    price: 142,
    imageUrl:
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80",
    inventory: 21,
    status: "active",
    sizingInfo: "US sizes 7-14 including select wide-friendly volume. True-to-size.",
    fitNotes:
      "Guided support and a broad base help reduce excess motion during daily training.",
    availableSizes: ["7", "8", "9", "10", "11", "12", "13", "14"],
    availableColors: [
      { name: "Graphite", hex: "#374151", imageUrl: productImages.skate },
      { name: "Safety Orange", hex: "#EA580C", imageUrl: productImages.orange },
      { name: "Royal", hex: "#1D4ED8", imageUrl: productImages.track },
    ],
    specs: [
      { label: "Weight", value: "10.5 oz" },
      { label: "Drop", value: "10 mm" },
      { label: "Support", value: "Stability" },
      { label: "Cushion", value: "Structured foam" },
    ],
  },
  {
    id: 7,
    name: "Recovery Glide",
    description: "Plush foam and wide base for easy recovery miles.",
    price: 109,
    imageUrl:
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=80",
    inventory: 17,
    status: "active",
    sizingInfo: "US sizes 6-13. Roomy fit with extra volume through the forefoot.",
    fitNotes:
      "Plush recovery ride with a wide base for easy days, walks, and post-race comfort.",
    availableSizes: ["6", "7", "8", "9", "10", "11", "12", "13"],
    availableColors: [
      { name: "Cloud", hex: "#E5E7EB", imageUrl: productImages.recovery },
      { name: "Sage", hex: "#86EFAC", imageUrl: productImages.trail },
      { name: "Midnight", hex: "#0F172A", imageUrl: productImages.skate },
    ],
    specs: [
      { label: "Weight", value: "9.8 oz" },
      { label: "Drop", value: "6 mm" },
      { label: "Surface", value: "Road" },
      { label: "Cushion", value: "Plush" },
    ],
  },
  {
    id: 8,
    name: "Track Volt Elite",
    description: "Snappy low-profile racer for intervals and track work.",
    price: 168,
    imageUrl:
      "https://images.unsplash.com/photo-1605408499391-6368c628ef42?auto=format&fit=crop&w=900&q=80",
    inventory: 15,
    status: "active",
    sizingInfo:
      "US sizes 7-13. Low-volume performance fit; consider a half size up if between sizes.",
    fitNotes:
      "Snappy, low-profile fit for track sessions, intervals, and short fast road efforts.",
    availableSizes: defaultSizes,
    availableColors: [
      { name: "Volt", hex: "#A3E635", imageUrl: productImages.track },
      { name: "Track Red", hex: "#EF4444", imageUrl: productImages.orange },
      { name: "Black", hex: "#111827", imageUrl: productImages.skate },
    ],
    specs: [
      { label: "Weight", value: "6.5 oz" },
      { label: "Drop", value: "4 mm" },
      { label: "Surface", value: "Track and road" },
      { label: "Ride", value: "Firm and fast" },
    ],
  },
];
