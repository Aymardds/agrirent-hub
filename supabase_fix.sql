
-- 1. Update the trigger function to handle case sensitivity and invalid values robustly
create or replace function public.handle_new_user()
returns trigger as $$
declare
  normalized_role text;
begin
  -- Get the role from metadata, default to 'client' if missing
  normalized_role := coalesce(new.raw_user_meta_data->>'role', 'client');
  
  -- Convert to lowercase to ensure it matches the check constraint
  normalized_role := lower(normalized_role);
  
  -- Handle 'super admin' with space -> 'super_admin'
  if normalized_role = 'super admin' then
    normalized_role := 'super_admin';
  end if;

  -- If the role is still not valid (not in the allowed list), force it to 'client'
  -- This prevents the "violates check constraint" error completely
  if normalized_role not in ('client', 'cooperative', 'provider', 'super_admin') then
    normalized_role := 'client';
  end if;

  insert into public.profiles (id, full_name, role, phone, company)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    normalized_role,
    new.raw_user_meta_data->>'phone', 
    new.raw_user_meta_data->>'company'
  );
  return new;
end;
$$ language plpgsql security definer;
