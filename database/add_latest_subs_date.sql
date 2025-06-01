-- Add latest_subs_date column to companies table
ALTER TABLE public.companies 
ADD COLUMN latest_subs_date timestamp with time zone DEFAULT now();

-- Update existing companies to have a default subscription date
UPDATE public.companies 
SET latest_subs_date = now() 
WHERE latest_subs_date IS NULL;

-- Add comment to the column
COMMENT ON COLUMN public.companies.latest_subs_date IS 'Last subscription payment date, subscription is valid for 30 days from this date';
