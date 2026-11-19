import lookStreet from "@/assets/looks/look-street.jpg";
import lookTailored from "@/assets/looks/look-tailored.jpg";
import lookY2k from "@/assets/looks/look-y2k.jpg";
import lookNoir from "@/assets/looks/look-noir.jpg";
import lookLinen from "@/assets/looks/look-linen.jpg";

import shirtOxford from "@/assets/products/shirt-oxford.jpg";
import shirtCuban from "@/assets/products/shirt-cuban.jpg";
import shirtTee from "@/assets/products/shirt-tee.jpg";
import shirtLinen from "@/assets/products/shirt-linen.jpg";
import jeansBaggy from "@/assets/products/jeans-baggy.jpg";
import jeansRaw from "@/assets/products/jeans-raw.jpg";
import jeansBlack from "@/assets/products/jeans-black.jpg";
import jacketSuede from "@/assets/products/jacket-suede.jpg";
import jacketLeather from "@/assets/products/jacket-leather.jpg";
import jacketDenim from "@/assets/products/jacket-denim.jpg";
import sneakerRetro from "@/assets/products/sneaker-retro.jpg";
import sneakerMinimal from "@/assets/products/sneaker-minimal.jpg";
import sneakerSuede from "@/assets/products/sneaker-suede.jpg";
import dressSatin from "@/assets/products/dress-satin.jpg";
import dressKnit from "@/assets/products/dress-knit.jpg";
import dressFloral from "@/assets/products/dress-floral.jpg";

export type BrandVariant = {
  brand: string;
  price: number;
  rating: number;
  delivery: string;
  fit: string;
};

export type Product = {
  id: string;
  category: CategorySlug;
  name: string;
  image: string;
  color: string; // hex used by the 3D try-on
  tags: string[];
  match: number;
  variants: BrandVariant[];
};

export type CategorySlug = "shirts" | "jeans" | "jackets" | "sneakers" | "dresses";

export type Category = {
  slug: CategorySlug;
  name: string;
  tagline: string;
  cover: string;
  pieces: number;
  brands: number;
  for: ("women" | "men")[];
};

export const categories: Category[] = [
  {
    slug: "shirts",
    name: "Shirts",
    tagline: "Crisp, camp & boxy",
    cover: shirtCuban,
    pieces: 412,
    brands: 38,
    for: ["men", "women"],
  },
  {
    slug: "jeans",
    name: "Jeans",
    tagline: "Baggy to raw selvedge",
    cover: jeansBaggy,
    pieces: 286,
    brands: 24,
    for: ["men", "women"],
  },
  {
    slug: "jackets",
    name: "Jackets",
    tagline: "The layer that makes it",
    cover: jacketLeather,
    pieces: 198,
    brands: 31,
    for: ["men", "women"],
  },
  {
    slug: "sneakers",
    name: "Sneakers",
    tagline: "Heat for your feet",
    cover: sneakerRetro,
    pieces: 340,
    brands: 19,
    for: ["men", "women"],
  },
  {
    slug: "dresses",
    name: "Dresses",
    tagline: "Slip, knit & maxi",
    cover: dressSatin,
    pieces: 221,
    brands: 27,
    for: ["women"],
  },
];

const v = (brand: string, price: number, rating: number, delivery: string, fit: string) => ({
  brand,
  price,
  rating,
  delivery,
  fit,
});

export const products: Product[] = [
  {
    id: "oxford",
    category: "shirts",
    name: "Oversized Oxford",
    image: shirtOxford,
    color: "#a9c4ea",
    tags: ["Cotton", "Relaxed"],
    match: 94,
    variants: [
      v("Maison Rue", 2499, 4.7, "2-day", "Relaxed"),
      v("Kōda Studio", 3299, 4.8, "Tomorrow", "Boxy"),
      v("Northbound", 1899, 4.4, "3-day", "Regular"),
    ],
  },
  {
    id: "cuban",
    category: "shirts",
    name: "Retro Camp Collar",
    image: shirtCuban,
    color: "#d9c3a0",
    tags: ["Viscose", "Print"],
    match: 89,
    variants: [
      v("Saltwater Co.", 2799, 4.6, "2-day", "Boxy"),
      v("Atelier Nine", 3899, 4.9, "Tomorrow", "Relaxed"),
      v("Paloma", 2199, 4.3, "4-day", "Regular"),
    ],
  },
  {
    id: "tee",
    category: "shirts",
    name: "Heavyweight Boxy Tee",
    image: shirtTee,
    color: "#1c1c1e",
    tags: ["280 GSM", "Drop-shoulder"],
    match: 97,
    variants: [
      v("Noir Assembly", 1499, 4.8, "Tomorrow", "Boxy"),
      v("Velour Club", 1999, 4.7, "2-day", "Oversized"),
      v("Field Theory", 999, 4.2, "3-day", "Regular"),
    ],
  },
  {
    id: "linen",
    category: "shirts",
    name: "Band-Collar Linen",
    image: shirtLinen,
    color: "#f3f0ea",
    tags: ["Linen", "Breathable"],
    match: 86,
    variants: [
      v("Kōda Studio", 2999, 4.6, "2-day", "Relaxed"),
      v("Maison Rue", 3499, 4.8, "Tomorrow", "Regular"),
    ],
  },
  {
    id: "baggy",
    category: "jeans",
    name: "Light-Wash Baggy",
    image: jeansBaggy,
    color: "#a6bdd6",
    tags: ["Wide leg", "Rigid denim"],
    match: 95,
    variants: [
      v("Indigo Hour", 3299, 4.7, "2-day", "Baggy"),
      v("Northbound", 2499, 4.5, "3-day", "Wide"),
      v("Velour Club", 4199, 4.8, "Tomorrow", "Baggy"),
    ],
  },
  {
    id: "raw",
    category: "jeans",
    name: "Raw Selvedge Straight",
    image: jeansRaw,
    color: "#1f2740",
    tags: ["14oz", "Selvedge"],
    match: 88,
    variants: [
      v("Field Theory", 5499, 4.9, "3-day", "Straight"),
      v("Indigo Hour", 4299, 4.6, "2-day", "Straight"),
    ],
  },
  {
    id: "flare",
    category: "jeans",
    name: "Washed Black Flare",
    image: jeansBlack,
    color: "#2b2b2e",
    tags: ["Stretch", "Low rise"],
    match: 91,
    variants: [
      v("Noir Assembly", 3599, 4.7, "Tomorrow", "Flare"),
      v("Paloma", 2799, 4.4, "4-day", "Bootcut"),
      v("Atelier Nine", 4499, 4.8, "2-day", "Flare"),
    ],
  },
  {
    id: "suede",
    category: "jackets",
    name: "Suede Bomber",
    image: jacketSuede,
    color: "#8a5a34",
    tags: ["Suede", "Ribbed hem"],
    match: 92,
    variants: [
      v("Atelier Nine", 8999, 4.9, "2-day", "Regular"),
      v("Northbound", 6499, 4.5, "3-day", "Relaxed"),
    ],
  },
  {
    id: "biker",
    category: "jackets",
    name: "Cropped Biker",
    image: jacketLeather,
    color: "#141416",
    tags: ["Leather", "Cropped"],
    match: 90,
    variants: [
      v("Noir Assembly", 9499, 4.8, "Tomorrow", "Cropped"),
      v("Velour Club", 7899, 4.6, "2-day", "Slim"),
      v("Paloma", 5999, 4.3, "4-day", "Cropped"),
    ],
  },
  {
    id: "trucker",
    category: "jackets",
    name: "Vintage Trucker",
    image: jacketDenim,
    color: "#7f9fc6",
    tags: ["Denim", "Oversized"],
    match: 87,
    variants: [
      v("Indigo Hour", 3999, 4.7, "2-day", "Oversized"),
      v("Saltwater Co.", 3299, 4.4, "3-day", "Regular"),
    ],
  },
  {
    id: "runner",
    category: "sneakers",
    name: "Retro Runner 530",
    image: sneakerRetro,
    color: "#e6e6e6",
    tags: ["Mesh", "Chunky"],
    match: 96,
    variants: [
      v("Stride Lab", 7999, 4.8, "Tomorrow", "True to size"),
      v("Field Theory", 6499, 4.5, "3-day", "Runs small"),
      v("Kōda Studio", 8499, 4.7, "2-day", "True to size"),
    ],
  },
  {
    id: "minimal",
    category: "sneakers",
    name: "Clean Court Low",
    image: sneakerMinimal,
    color: "#f5f5f2",
    tags: ["Leather", "Everyday"],
    match: 93,
    variants: [
      v("Maison Rue", 5499, 4.8, "2-day", "True to size"),
      v("Stride Lab", 3999, 4.6, "Tomorrow", "Runs large"),
    ],
  },
  {
    id: "terrace",
    category: "sneakers",
    name: "Suede Terrace",
    image: sneakerSuede,
    color: "#8b4f2c",
    tags: ["Suede", "Gum sole"],
    match: 89,
    variants: [
      v("Saltwater Co.", 5999, 4.7, "3-day", "True to size"),
      v("Velour Club", 6999, 4.8, "Tomorrow", "True to size"),
      v("Northbound", 4499, 4.4, "4-day", "Runs small"),
    ],
  },
  {
    id: "slip",
    category: "dresses",
    name: "Champagne Slip",
    image: dressSatin,
    color: "#e8d9bf",
    tags: ["Satin", "Bias cut"],
    match: 94,
    variants: [
      v("Atelier Nine", 5999, 4.9, "2-day", "Bodycon"),
      v("Paloma", 3499, 4.5, "3-day", "Relaxed"),
    ],
  },
  {
    id: "knit",
    category: "dresses",
    name: "Rib-Knit Midi",
    image: dressKnit,
    color: "#151517",
    tags: ["Rib knit", "Stretch"],
    match: 90,
    variants: [
      v("Noir Assembly", 2999, 4.7, "Tomorrow", "Bodycon"),
      v("Velour Club", 3799, 4.8, "2-day", "Fitted"),
    ],
  },
  {
    id: "floral",
    category: "dresses",
    name: "Terracotta Tiered Maxi",
    image: dressFloral,
    color: "#b5532b",
    tags: ["Cotton", "Smocked"],
    match: 88,
    variants: [
      v("Saltwater Co.", 3299, 4.6, "2-day", "Flowy"),
      v("Paloma", 2599, 4.4, "4-day", "Flowy"),
      v("Maison Rue", 4299, 4.8, "Tomorrow", "Relaxed"),
    ],
  },
];

export type LookPiece = { name: string; brand: string; price: number };

export type Look = {
  id: string;
  title: string;
  mood: string;
  image: string;
  creator: string;
  pieces: LookPiece[];
  top: string; // hex for 3D try-on
  bottom: string;
};

export const looks: Look[] = [
  {
    id: "terracotta-street",
    title: "Terracotta Street",
    mood: "Streetwear",
    image: lookStreet,
    creator: "@kwame.fits",
    top: "#efe7da",
    bottom: "#3a3a3c",
    pieces: [
      { name: "Cream Harrington", brand: "Kōda Studio", price: 5499 },
      { name: "Washed Cargo", brand: "Field Theory", price: 3299 },
      { name: "Chunky Court", brand: "Stride Lab", price: 6999 },
      { name: "Box Chain", brand: "Velour Club", price: 1299 },
    ],
  },
  {
    id: "quiet-luxury",
    title: "Quiet Luxury",
    mood: "Tailored",
    image: lookTailored,
    creator: "@ananya.edit",
    top: "#bfb4a3",
    bottom: "#9a8f80",
    pieces: [
      { name: "Oatmeal Blazer", brand: "Atelier Nine", price: 8999 },
      { name: "Silk Cami", brand: "Maison Rue", price: 2999 },
      { name: "Pleated Trouser", brand: "Atelier Nine", price: 4999 },
      { name: "Bone Loafer", brand: "Paloma", price: 4499 },
    ],
  },
  {
    id: "lime-time",
    title: "Lime Time",
    mood: "Y2K",
    image: lookY2k,
    creator: "@mina.wears",
    top: "#b6d84a",
    bottom: "#a6bdd6",
    pieces: [
      { name: "Cropped Cardigan", brand: "Velour Club", price: 2499 },
      { name: "Baggy Light Wash", brand: "Indigo Hour", price: 3299 },
      { name: "Platform Runner", brand: "Stride Lab", price: 6499 },
      { name: "Mini Shoulder Bag", brand: "Paloma", price: 1999 },
    ],
  },
  {
    id: "after-dark",
    title: "After Dark",
    mood: "Monochrome",
    image: lookNoir,
    creator: "@diego.noir",
    top: "#151517",
    bottom: "#1d1d20",
    pieces: [
      { name: "Wool Overcoat", brand: "Noir Assembly", price: 12999 },
      { name: "Merino Turtleneck", brand: "Kōda Studio", price: 3999 },
      { name: "Straight Trouser", brand: "Noir Assembly", price: 4499 },
      { name: "Chelsea Boot", brand: "Field Theory", price: 7999 },
    ],
  },
  {
    id: "rust-riviera",
    title: "Rust Riviera",
    mood: "Resort",
    image: lookLinen,
    creator: "@sofia.sun",
    top: "#b4562a",
    bottom: "#b4562a",
    pieces: [
      { name: "Linen Shirt Dress", brand: "Saltwater Co.", price: 4299 },
      { name: "Woven Sandal", brand: "Paloma", price: 2499 },
      { name: "Straw Tote", brand: "Maison Rue", price: 1899 },
    ],
  },
];

export const lookTotal = (look: Look) => look.pieces.reduce((sum, p) => sum + p.price, 0);

export const formatPrice = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);

export const productsFor = (slug: string) => products.filter((p) => p.category === slug);

/** Suggested buys for the AI wardrobe — pieces that unlock new outfits. */
export const wardrobeGaps = [
  { product: products.find((p) => p.id === "suede")!, unlocks: 14, reason: "A warm neutral layer" },
  { product: products.find((p) => p.id === "minimal")!, unlocks: 11, reason: "Clean everyday shoe" },
  { product: products.find((p) => p.id === "raw")!, unlocks: 9, reason: "Dark denim anchor" },
];
