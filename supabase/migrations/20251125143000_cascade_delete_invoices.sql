-- Drop existing foreign key constraint
ALTER TABLE invoices
DROP CONSTRAINT invoices_client_id_fkey;

-- Add new foreign key constraint with ON DELETE CASCADE
ALTER TABLE invoices
ADD CONSTRAINT invoices_client_id_fkey
FOREIGN KEY (client_id)
REFERENCES clients(id)
ON DELETE CASCADE;

