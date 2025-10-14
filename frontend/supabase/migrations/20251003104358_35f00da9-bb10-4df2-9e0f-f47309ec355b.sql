-- Create affiliate program tables
CREATE TABLE public.affiliates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_code TEXT NOT NULL UNIQUE,
  commission_rate NUMERIC NOT NULL DEFAULT 10,
  total_earnings NUMERIC NOT NULL DEFAULT 0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create affiliate orders tracking table
CREATE TABLE public.affiliate_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  commission_amount NUMERIC NOT NULL,
  commission_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id)
);

-- Create gallery table for customer uploads
CREATE TABLE public.gallery_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_uploads ENABLE ROW LEVEL SECURITY;

-- Affiliates policies
CREATE POLICY "Users can view their own affiliate data"
ON public.affiliates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own affiliate data"
ON public.affiliates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own affiliate data"
ON public.affiliates FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage affiliates"
ON public.affiliates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Affiliate orders policies
CREATE POLICY "Affiliates can view their own orders"
ON public.affiliate_orders FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.affiliates
  WHERE affiliates.id = affiliate_orders.affiliate_id
  AND affiliates.user_id = auth.uid()
));

CREATE POLICY "Admins can manage affiliate orders"
ON public.affiliate_orders FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Gallery uploads policies
CREATE POLICY "Users can view approved gallery uploads"
ON public.gallery_uploads FOR SELECT
USING (is_approved = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own uploads"
ON public.gallery_uploads FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage gallery uploads"
ON public.gallery_uploads FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for affiliates updated_at
CREATE TRIGGER update_affiliates_updated_at
BEFORE UPDATE ON public.affiliates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique affiliate code
CREATE OR REPLACE FUNCTION generate_affiliate_code(base_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  final_code TEXT;
  counter INTEGER := 0;
BEGIN
  final_code := UPPER(REGEXP_REPLACE(base_code, '[^A-Z0-9]', '', 'g'));
  
  WHILE EXISTS (SELECT 1 FROM affiliates WHERE affiliate_code = final_code) LOOP
    counter := counter + 1;
    final_code := UPPER(REGEXP_REPLACE(base_code, '[^A-Z0-9]', '', 'g')) || counter::TEXT;
  END LOOP;
  
  RETURN final_code;
END;
$$;