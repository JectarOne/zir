// Supabase client init — uses publishable (anon) key only.
// Requires js/lib/supabase.umd.js to be loaded BEFORE this file.
// NEVER place the secret (service_role) key in browser code.
(function (global) {
  'use strict';
  var SUPABASE_URL = 'https://lpwobukoftgqmzpiqdul.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_WLREaQwhY7O1f0zyUNl6LA_E6bfp-0L';

  if (!global.supabase || typeof global.supabase.createClient !== 'function') {
    console.error('[supabaseClient] UMD build not found. Load js/lib/supabase.umd.js first.');
    return;
  }

  // UMD attaches { createClient } as window.supabase.
  // Reassign window.supabase to the actual client instance.
  global.supabase = global.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
})(window);
