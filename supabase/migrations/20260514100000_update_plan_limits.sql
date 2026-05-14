-- Atualiza limites de planos
UPDATE plan_limits SET
  carousels_per_month = 3,
  exports_per_month = 0,
  ai_images_per_month = 3
WHERE plan = 'free';

UPDATE plan_limits SET
  carousels_per_month = 50,
  exports_per_month = 100,
  ai_images_per_month = 20
WHERE plan = 'construtor';

UPDATE plan_limits SET
  carousels_per_month = 150,
  exports_per_month = 999999,
  ai_images_per_month = 60
WHERE plan = 'escala';

UPDATE plan_limits SET
  carousels_per_month = 300,
  exports_per_month = 999999,
  ai_images_per_month = 150
WHERE plan = 'agencia';
