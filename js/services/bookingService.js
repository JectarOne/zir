// Booking service — expects window.supabase to be the initialized client.
(function (global) {
  'use strict';

  async function createReservation(formData) {
    if (!global.supabase || typeof global.supabase.from !== 'function') {
      console.error('[bookingService] supabase client not initialized.');
      return { success: false, error: 'Supabase client not initialized' };
    }

    const { data, error } = await global.supabase
      .from('reservations')
      .insert([
        {
          customer_name: formData.name,
          customer_phone: formData.phone,
          customer_email: formData.email,
          booking_date: formData.date,
          booking_time: formData.time,
          guests_count: parseInt(formData.guests),
          seating_area: formData.seating, // 'MAIN' | 'VIP' | 'CORNER'
        }
      ])
      .select();

    if (error) {
      console.error('Database insertion failed:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }

  global.createReservation = createReservation;
})(window);
