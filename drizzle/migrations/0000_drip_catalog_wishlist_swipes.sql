-- Profiles ---------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Catalog (public read) ---------------------------------------------------
CREATE TABLE public.products (
  id text PRIMARY KEY,
  category text NOT NULL,
  name text NOT NULL,
  image_key text NOT NULL,
  color text NOT NULL DEFAULT '#888888',
  tags text[] NOT NULL DEFAULT '{}',
  match integer NOT NULL DEFAULT 90,
  sort integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON public.products (category, sort);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can browse products" ON public.products FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.product_variants (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  brand text NOT NULL,
  price integer NOT NULL,
  rating numeric(2,1) NOT NULL DEFAULT 4.5,
  delivery text NOT NULL DEFAULT '3-day',
  fit text NOT NULL DEFAULT 'Regular',
  position integer NOT NULL DEFAULT 0
);
CREATE INDEX product_variants_product_idx ON public.product_variants (product_id, position);
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can browse variants" ON public.product_variants FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.outfits (
  id text PRIMARY KEY,
  title text NOT NULL,
  mood text NOT NULL,
  image_key text NOT NULL,
  creator text NOT NULL,
  top_color text NOT NULL DEFAULT '#888888',
  bottom_color text NOT NULL DEFAULT '#444444',
  sort integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.outfits TO anon, authenticated;
GRANT ALL ON public.outfits TO service_role;
ALTER TABLE public.outfits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can browse outfits" ON public.outfits FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.outfit_pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id text NOT NULL REFERENCES public.outfits(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text NOT NULL,
  price integer NOT NULL,
  position integer NOT NULL DEFAULT 0
);
CREATE INDEX outfit_pieces_outfit_idx ON public.outfit_pieces (outfit_id, position);
GRANT SELECT ON public.outfit_pieces TO anon, authenticated;
GRANT ALL ON public.outfit_pieces TO service_role;
ALTER TABLE public.outfit_pieces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can browse outfit pieces" ON public.outfit_pieces FOR SELECT TO anon, authenticated USING (true);

-- Wishlist (private) ------------------------------------------------------
CREATE TABLE public.wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  product_id text REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id text REFERENCES public.product_variants(id) ON DELETE CASCADE,
  outfit_id text REFERENCES public.outfits(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wishlist_one_target CHECK ((variant_id IS NOT NULL AND product_id IS NOT NULL AND outfit_id IS NULL) OR (outfit_id IS NOT NULL AND variant_id IS NULL AND product_id IS NULL))
);
CREATE UNIQUE INDEX wishlist_user_variant_uq ON public.wishlist_items (user_id, variant_id) WHERE variant_id IS NOT NULL;
CREATE UNIQUE INDEX wishlist_user_outfit_uq ON public.wishlist_items (user_id, outfit_id) WHERE outfit_id IS NOT NULL;
CREATE INDEX wishlist_user_idx ON public.wishlist_items (user_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.wishlist_items TO authenticated;
GRANT ALL ON public.wishlist_items TO service_role;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own wishlist" ON public.wishlist_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add to own wishlist" ON public.wishlist_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove from own wishlist" ON public.wishlist_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Swipes (private) --------------------------------------------------------
CREATE TABLE public.swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  product_id text REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id text REFERENCES public.product_variants(id) ON DELETE SET NULL,
  outfit_id text REFERENCES public.outfits(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('left', 'right', 'up')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT swipes_one_target CHECK ((product_id IS NOT NULL) <> (outfit_id IS NOT NULL))
);
CREATE INDEX swipes_user_idx ON public.swipes (user_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.swipes TO authenticated;
GRANT ALL ON public.swipes TO service_role;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own swipes" ON public.swipes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users record own swipes" ON public.swipes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users undo own swipes" ON public.swipes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Seed catalog ------------------------------------------------------------
INSERT INTO public.products (id, category, name, image_key, color, tags, match, sort) VALUES
('oxford', 'shirts', 'Oversized Oxford', 'shirt-oxford', '#a9c4ea', ARRAY['Cotton','Relaxed']::text[], 94, 0),
('cuban', 'shirts', 'Retro Camp Collar', 'shirt-cuban', '#d9c3a0', ARRAY['Viscose','Print']::text[], 89, 1),
('tee', 'shirts', 'Heavyweight Boxy Tee', 'shirt-tee', '#1c1c1e', ARRAY['280 GSM','Drop-shoulder']::text[], 97, 2),
('linen', 'shirts', 'Band-Collar Linen', 'shirt-linen', '#f3f0ea', ARRAY['Linen','Breathable']::text[], 86, 3),
('baggy', 'jeans', 'Light-Wash Baggy', 'jeans-baggy', '#a6bdd6', ARRAY['Wide leg','Rigid denim']::text[], 95, 4),
('raw', 'jeans', 'Raw Selvedge Straight', 'jeans-raw', '#1f2740', ARRAY['14oz','Selvedge']::text[], 88, 5),
('flare', 'jeans', 'Washed Black Flare', 'jeans-black', '#2b2b2e', ARRAY['Stretch','Low rise']::text[], 91, 6),
('suede', 'jackets', 'Suede Bomber', 'jacket-suede', '#8a5a34', ARRAY['Suede','Ribbed hem']::text[], 92, 7),
('biker', 'jackets', 'Cropped Biker', 'jacket-leather', '#141416', ARRAY['Leather','Cropped']::text[], 90, 8),
('trucker', 'jackets', 'Vintage Trucker', 'jacket-denim', '#7f9fc6', ARRAY['Denim','Oversized']::text[], 87, 9),
('runner', 'sneakers', 'Retro Runner 530', 'sneaker-retro', '#e6e6e6', ARRAY['Mesh','Chunky']::text[], 96, 10),
('minimal', 'sneakers', 'Clean Court Low', 'sneaker-minimal', '#f5f5f2', ARRAY['Leather','Everyday']::text[], 93, 11),
('terrace', 'sneakers', 'Suede Terrace', 'sneaker-suede', '#8b4f2c', ARRAY['Suede','Gum sole']::text[], 89, 12),
('slip', 'dresses', 'Champagne Slip', 'dress-satin', '#e8d9bf', ARRAY['Satin','Bias cut']::text[], 94, 13),
('knit', 'dresses', 'Rib-Knit Midi', 'dress-knit', '#151517', ARRAY['Rib knit','Stretch']::text[], 90, 14),
('floral', 'dresses', 'Terracotta Tiered Maxi', 'dress-floral', '#b5532b', ARRAY['Cotton','Smocked']::text[], 88, 15);

INSERT INTO public.product_variants (id, product_id, brand, price, rating, delivery, fit, position) VALUES
('oxford-1', 'oxford', 'Maison Rue', 2499, 4.7, '2-day', 'Relaxed', 0),
('oxford-2', 'oxford', 'Kōda Studio', 3299, 4.8, 'Tomorrow', 'Boxy', 1),
('oxford-3', 'oxford', 'Northbound', 1899, 4.4, '3-day', 'Regular', 2),
('cuban-1', 'cuban', 'Saltwater Co.', 2799, 4.6, '2-day', 'Boxy', 0),
('cuban-2', 'cuban', 'Atelier Nine', 3899, 4.9, 'Tomorrow', 'Relaxed', 1),
('cuban-3', 'cuban', 'Paloma', 2199, 4.3, '4-day', 'Regular', 2),
('tee-1', 'tee', 'Noir Assembly', 1499, 4.8, 'Tomorrow', 'Boxy', 0),
('tee-2', 'tee', 'Velour Club', 1999, 4.7, '2-day', 'Oversized', 1),
('tee-3', 'tee', 'Field Theory', 999, 4.2, '3-day', 'Regular', 2),
('linen-1', 'linen', 'Kōda Studio', 2999, 4.6, '2-day', 'Relaxed', 0),
('linen-2', 'linen', 'Maison Rue', 3499, 4.8, 'Tomorrow', 'Regular', 1),
('baggy-1', 'baggy', 'Indigo Hour', 3299, 4.7, '2-day', 'Baggy', 0),
('baggy-2', 'baggy', 'Northbound', 2499, 4.5, '3-day', 'Wide', 1),
('baggy-3', 'baggy', 'Velour Club', 4199, 4.8, 'Tomorrow', 'Baggy', 2),
('raw-1', 'raw', 'Field Theory', 5499, 4.9, '3-day', 'Straight', 0),
('raw-2', 'raw', 'Indigo Hour', 4299, 4.6, '2-day', 'Straight', 1),
('flare-1', 'flare', 'Noir Assembly', 3599, 4.7, 'Tomorrow', 'Flare', 0),
('flare-2', 'flare', 'Paloma', 2799, 4.4, '4-day', 'Bootcut', 1),
('flare-3', 'flare', 'Atelier Nine', 4499, 4.8, '2-day', 'Flare', 2),
('suede-1', 'suede', 'Atelier Nine', 8999, 4.9, '2-day', 'Regular', 0),
('suede-2', 'suede', 'Northbound', 6499, 4.5, '3-day', 'Relaxed', 1),
('biker-1', 'biker', 'Noir Assembly', 9499, 4.8, 'Tomorrow', 'Cropped', 0),
('biker-2', 'biker', 'Velour Club', 7899, 4.6, '2-day', 'Slim', 1),
('biker-3', 'biker', 'Paloma', 5999, 4.3, '4-day', 'Cropped', 2),
('trucker-1', 'trucker', 'Indigo Hour', 3999, 4.7, '2-day', 'Oversized', 0),
('trucker-2', 'trucker', 'Saltwater Co.', 3299, 4.4, '3-day', 'Regular', 1),
('runner-1', 'runner', 'Stride Lab', 7999, 4.8, 'Tomorrow', 'True to size', 0),
('runner-2', 'runner', 'Field Theory', 6499, 4.5, '3-day', 'Runs small', 1),
('runner-3', 'runner', 'Kōda Studio', 8499, 4.7, '2-day', 'True to size', 2),
('minimal-1', 'minimal', 'Maison Rue', 5499, 4.8, '2-day', 'True to size', 0),
('minimal-2', 'minimal', 'Stride Lab', 3999, 4.6, 'Tomorrow', 'Runs large', 1),
('terrace-1', 'terrace', 'Saltwater Co.', 5999, 4.7, '3-day', 'True to size', 0),
('terrace-2', 'terrace', 'Velour Club', 6999, 4.8, 'Tomorrow', 'True to size', 1),
('terrace-3', 'terrace', 'Northbound', 4499, 4.4, '4-day', 'Runs small', 2),
('slip-1', 'slip', 'Atelier Nine', 5999, 4.9, '2-day', 'Bodycon', 0),
('slip-2', 'slip', 'Paloma', 3499, 4.5, '3-day', 'Relaxed', 1),
('knit-1', 'knit', 'Noir Assembly', 2999, 4.7, 'Tomorrow', 'Bodycon', 0),
('knit-2', 'knit', 'Velour Club', 3799, 4.8, '2-day', 'Fitted', 1),
('floral-1', 'floral', 'Saltwater Co.', 3299, 4.6, '2-day', 'Flowy', 0),
('floral-2', 'floral', 'Paloma', 2599, 4.4, '4-day', 'Flowy', 1),
('floral-3', 'floral', 'Maison Rue', 4299, 4.8, 'Tomorrow', 'Relaxed', 2);

INSERT INTO public.outfits (id, title, mood, image_key, creator, top_color, bottom_color, sort) VALUES
('terracotta-street', 'Terracotta Street', 'Streetwear', 'look-street', '@kwame.fits', '#efe7da', '#3a3a3c', 0),
('quiet-luxury', 'Quiet Luxury', 'Tailored', 'look-tailored', '@ananya.edit', '#bfb4a3', '#9a8f80', 1),
('lime-time', 'Lime Time', 'Y2K', 'look-y2k', '@mina.wears', '#b6d84a', '#a6bdd6', 2),
('after-dark', 'After Dark', 'Monochrome', 'look-noir', '@diego.noir', '#151517', '#1d1d20', 3),
('rust-riviera', 'Rust Riviera', 'Resort', 'look-linen', '@sofia.sun', '#b4562a', '#b4562a', 4);

INSERT INTO public.outfit_pieces (outfit_id, name, brand, price, position) VALUES
('terracotta-street', 'Cream Harrington', 'Kōda Studio', 5499, 0),
('terracotta-street', 'Washed Cargo', 'Field Theory', 3299, 1),
('terracotta-street', 'Chunky Court', 'Stride Lab', 6999, 2),
('terracotta-street', 'Box Chain', 'Velour Club', 1299, 3),
('quiet-luxury', 'Oatmeal Blazer', 'Atelier Nine', 8999, 0),
('quiet-luxury', 'Silk Cami', 'Maison Rue', 2999, 1),
('quiet-luxury', 'Pleated Trouser', 'Atelier Nine', 4999, 2),
('quiet-luxury', 'Bone Loafer', 'Paloma', 4499, 3),
('lime-time', 'Cropped Cardigan', 'Velour Club', 2499, 0),
('lime-time', 'Baggy Light Wash', 'Indigo Hour', 3299, 1),
('lime-time', 'Platform Runner', 'Stride Lab', 6499, 2),
('lime-time', 'Mini Shoulder Bag', 'Paloma', 1999, 3),
('after-dark', 'Wool Overcoat', 'Noir Assembly', 12999, 0),
('after-dark', 'Merino Turtleneck', 'Kōda Studio', 3999, 1),
('after-dark', 'Straight Trouser', 'Noir Assembly', 4499, 2),
('after-dark', 'Chelsea Boot', 'Field Theory', 7999, 3),
('rust-riviera', 'Linen Shirt Dress', 'Saltwater Co.', 4299, 0),
('rust-riviera', 'Woven Sandal', 'Paloma', 2499, 1),
('rust-riviera', 'Straw Tote', 'Maison Rue', 1899, 2);