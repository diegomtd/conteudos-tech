-- Corrigir title_uppercase = false em todos os slides históricos
UPDATE carousel_slides
SET title_uppercase = true
WHERE title_uppercase = false OR title_uppercase IS NULL;

-- Corrigir font_size_title claramente abaixo do mínimo esperado (versão anterior tinha bug)
UPDATE carousel_slides
SET font_size_title = 80
WHERE font_size_title < 60;
