-- Enable realtime for products table
ALTER TABLE products REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE products;

-- Enable realtime for product_variants table
ALTER TABLE product_variants REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE product_variants;

-- Enable realtime for product_images table
ALTER TABLE product_images REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE product_images;