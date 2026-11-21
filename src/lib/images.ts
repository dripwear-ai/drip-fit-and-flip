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

/** Database rows store an image_key; bundled photos are resolved here. Full URLs pass through. */
const images: Record<string, string> = {
  "look-street": lookStreet,
  "look-tailored": lookTailored,
  "look-y2k": lookY2k,
  "look-noir": lookNoir,
  "look-linen": lookLinen,
  "shirt-oxford": shirtOxford,
  "shirt-cuban": shirtCuban,
  "shirt-tee": shirtTee,
  "shirt-linen": shirtLinen,
  "jeans-baggy": jeansBaggy,
  "jeans-raw": jeansRaw,
  "jeans-black": jeansBlack,
  "jacket-suede": jacketSuede,
  "jacket-leather": jacketLeather,
  "jacket-denim": jacketDenim,
  "sneaker-retro": sneakerRetro,
  "sneaker-minimal": sneakerMinimal,
  "sneaker-suede": sneakerSuede,
  "dress-satin": dressSatin,
  "dress-knit": dressKnit,
  "dress-floral": dressFloral,
};

export const imageFor = (key: string) => (key.startsWith("http") ? key : (images[key] ?? lookStreet));
