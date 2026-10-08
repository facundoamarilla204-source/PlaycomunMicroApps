-- Update names as requested by the user
UPDATE tool_candidates 
SET nombre = 'Calculadora de comisiones' 
WHERE slug = 'calculadora-comisiones-mercadopago';

UPDATE tool_candidates 
SET nombre = 'Generador de facturas' 
WHERE slug = 'generador-recibos';

-- Remove "Punto de equilibrio"
DELETE FROM tool_candidates 
WHERE slug = 'calculadora-punto-equilibrio';

-- Reset all votes to 0 (remove fake votes)
UPDATE tool_candidates 
SET votos = 0;

-- Clear all existing votes to ensure consistency with the 0 count
DELETE FROM tool_votes;
