-- Function to get landing page stats securely
-- This function uses SECURITY DEFINER to bypass RLS for these specific aggregated counts

CREATE OR REPLACE FUNCTION get_landing_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    equipment_count bigint;
    rentals_count bigint;
    users_count bigint;
    total_revenue numeric;
    equipment_added_this_month bigint;
    occupancy_rate numeric;
    start_of_month timestamp;
BEGIN
    start_of_month := date_trunc('month', now());

    -- 1. Total Equipment
    SELECT count(*) INTO equipment_count FROM equipment;

    -- 2. Total Rentals
    SELECT count(*) INTO rentals_count FROM rentals;

    -- 3. Total Users (Clients)
    SELECT count(*) INTO users_count FROM profiles WHERE role = 'client';

    -- 4. Total Revenue (Completed rentals)
    SELECT COALESCE(SUM(total_price), 0) INTO total_revenue 
    FROM rentals 
    WHERE status = 'completed';

    -- 5. Equipment added this month
    SELECT count(*) INTO equipment_added_this_month 
    FROM equipment 
    WHERE created_at >= start_of_month;

    -- 6. Occupancy Rate (Active Rentals / Total Equipment)
    SELECT 
        CASE 
            WHEN count(*) > 0 THEN 
                (SELECT count(*) FROM rentals WHERE status = 'active')::numeric / count(*)::numeric * 100
            ELSE 0 
        END 
    INTO occupancy_rate
    FROM equipment;

    result := json_build_object(
        'equipment_count', equipment_count,
        'rentals_count', rentals_count,
        'users_count', users_count,
        'total_revenue', total_revenue,
        'equipment_added_this_month', equipment_added_this_month,
        'occupancy_rate', ROUND(COALESCE(occupancy_rate, 0), 1)
    );

    RETURN result;
END;
$$;

-- Grant execute permission to everyone (anon for public, authenticated for logged in)
GRANT EXECUTE ON FUNCTION get_landing_stats() TO anon, authenticated;
