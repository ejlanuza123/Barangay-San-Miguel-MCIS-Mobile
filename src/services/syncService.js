// src/services/syncService.js
import NetInfo from '@react-native-community/netinfo';
import { getDatabase } from './database';
import { supabase } from './supabase';

// Helper function to delete a single item from the queue
const deleteFromQueue = async (id) => {
  const db = getDatabase();
  try {
    // FIX: Use array for parameters
    await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
  } catch (error) {
    console.error('Failed to delete from sync queue:', error);
  }

};



// Add this function to show sync notifications

const showSyncNotification = async (action, tableName, payload, success = true) => {

  const db = getDatabase();



  if (!success) return;



  let message = '';



  try {

    console.log('[SYNC_DEBUG] showSyncNotification called:', { action, tableName });



    // SIMPLE FIX: Use generic messages for ALL record types

    if (tableName === 'patients') {

      message = `Patient record ${action === 'create' ? 'added' : 'updated'} successfully`;

    } 

    else if (tableName === 'child_records') {

      message = `Child record ${action === 'create' ? 'added' : 'updated'} successfully`;

    }

    else if (tableName === 'appointments') {

      message = `Appointment ${action === 'create' ? 'scheduled' : 'updated'} successfully`;

    }

    else {

      message = `${tableName} ${action} operation completed successfully`;

    }



    console.log('[SYNC_DEBUG] Storing notification:', message);

    

    await db.runAsync(

      `INSERT INTO sync_notifications (message, type, created_at) VALUES (?, ?, datetime('now'))`,

      [message, 'success']

    );



  } catch (error) {

    console.error('[SYNC_DEBUG] CRITICAL: Failed to store notification:', error);

    // ABSOLUTELY DO NOT THROW - we don't want to break sync

  }

};

const safeLog = (message, data) => {
    try {
        if (data === null || data === undefined) {
            console.log(message, 'null/undefined');
            return;
        }
        // Convert to JSON string to avoid toString issues
        console.log(message, JSON.stringify(data, null, 2));
    } catch (e) {
        console.log(message, '[logging error]');
    }
};



export const syncOfflineData = async () => {
    console.log('[SYNC] Step 1: Starting sync');
    
    try {
        const state = await NetInfo.fetch();
        console.log('[SYNC] Step 2: Network state fetched');
        
        if (!state.isConnected) {
            console.log("App is offline. Skipping sync.");
            return;
        }

        console.log("App is online. Starting sync process...");
        
        const db = getDatabase();
        console.log('[SYNC] Step 3: Database obtained');
        
        const queue = await db.getAllAsync('SELECT * FROM sync_queue ORDER BY id ASC;');
        console.log('[SYNC] Step 4: Queue fetched, length:', queue?.length || 0);

        if (queue.length === 0) {
            console.log("Sync queue is empty.");
            return;
        }
        
        console.log(`Found ${queue.length} items to sync.`);

        let syncedCount = 0;

        for (let i = 0; i < queue.length; i++) {
            const item = queue[i];
            console.log(`[SYNC] Step 5.${i}: Processing item index ${i}`);
            
            try {
                console.log('[SYNC] Step 5.${i}.1: Item exists:', !!item);
                console.log('[SYNC] Step 5.${i}.2: Item.id:', item?.id || 'undefined');
                console.log('[SYNC] Step 5.${i}.3: Item.action:', item?.action || 'undefined');
                console.log('[SYNC] Step 5.${i}.4: Item.table_name:', item?.table_name || 'undefined');
                
                // CRITICAL: Parse payload with safety
                console.log('[SYNC] Step 5.${i}.5: About to parse payload');
                let payload;
                try {
                    payload = JSON.parse(item.payload);
                    console.log('[SYNC] Step 5.${i}.6: Payload parsed successfully');
                } catch (parseError) {
                    console.error('[SYNC] PARSE ERROR:', parseError?.message || 'unknown');
                    continue;
                }
                
                console.log('[SYNC] Step 5.${i}.7: Checking payload properties');
                
                let error = null;
                let syncResultData = null;

                if (item.action === 'create' && item.table_name === 'patients') {
                    console.log('[SYNC] Step 5.${i}.8: Patient create branch');
                    
                    try {
                        const { data, error: insertError } = await supabase.from('patients').insert([payload]).select();
                        syncResultData = data ? data[0] : null;
                        error = insertError;
                        console.log('[SYNC] Step 5.${i}.9: Patient insert complete');
                    } catch (networkError) {
                        console.error('[SYNC] Network error during patient sync');
                        error = networkError;
                        continue;
                    }

                } else if (item.action === 'update' && item.table_name === 'patients') {
                    console.log('[SYNC] Step 5.${i}.10: Patient update branch');
                    
                    try {
                        const { error: updateError } = await supabase
                            .from('patients')
                            .update(payload)
                            .eq('patient_id', payload.patient_id);
                        
                        error = updateError;
                        console.log('[SYNC] Step 5.${i}.11: Patient update complete');
                    } catch (networkError) {
                        console.error('[SYNC] Network error during patient update');
                        error = networkError;
                        continue;
                    }

                } else if (item.action === 'create' && item.table_name === 'appointments') {
                    console.log('[SYNC] Step 5.${i}.12: Appointment create branch');
                    
                    const syncPayload = { ...payload };
                    console.log('[SYNC] Step 5.${i}.13: Payload copied');
                    
                    if (!syncPayload.created_by) {
                        delete syncPayload.created_by;
                        console.log('[SYNC] Step 5.${i}.14: created_by removed');
                    }
                    
                    if (!syncPayload.patient_id) {
                        delete syncPayload.patient_id;
                        console.log('[SYNC] Step 5.${i}.15: patient_id removed');
                    }
                    
                    console.log('[SYNC] Step 5.${i}.16: About to insert appointment');
                    
                    try {
                        const { data, error: insertError } = await supabase
                            .from('appointments')
                            .insert([syncPayload])
                            .select();
                        
                        syncResultData = data ? data[0] : null;
                        error = insertError;
                        console.log('[SYNC] Step 5.${i}.17: Appointment insert complete');
                    } catch (networkError) {
                        console.error('[SYNC] Network error during appointment sync');
                        error = networkError;
                        continue;
                    }

                } else if (item.action === 'update' && item.table_name === 'child_records') {
                    console.log('[SYNC] Step 5.${i}.21: Child record update branch');
                    
                    try {
                        // Ensure payload has required fields and handle null values
                        const updatePayload = { ...payload };
                        
                        // FIX: Add the same safeNumber function for update operations
                        const safeNumber = (val) => {
                            if (val === null || val === undefined || val === 'null' || val === 'undefined') {
                                return null;
                            }
                            const num = parseFloat(val);
                            return isNaN(num) ? null : num;
                        };
                        
                        updatePayload.weight_kg = safeNumber(updatePayload.weight_kg);
                        updatePayload.height_cm = safeNumber(updatePayload.height_cm);
                        updatePayload.bmi = safeNumber(updatePayload.bmi);
                        
                        const { error: updateError } = await supabase
                            .from('child_records')
                            .update(updatePayload)
                            .eq('child_id', payload.child_id);
                        
                        error = updateError;
                        console.log('[SYNC] Step 5.${i}.22: Child record update complete');
                    } catch (networkError) {
                        console.error('[SYNC] Network error during child record update');
                        error = networkError;
                        continue;
                    }

                } else if (item.action === 'create') {
                    console.log('[SYNC] Step 5.${i}.23: Generic create branch');
                    try {
                        const { data, error: insertError } = await supabase.from(item.table_name).insert([payload]).select();
                        syncResultData = data ? data[0] : null;
                        error = insertError;
                        console.log('[SYNC] Step 5.${i}.24: Generic insert complete');
                    } catch (networkError) {
                        console.error('[SYNC] Network error during generic sync');
                        error = networkError;
                        continue;
                    }

                } else if (item.action === 'update') {
                    console.log('[SYNC] Step 5.${i}.25: Generic update branch');
                    const { id, ...updateData } = payload; 
                    if (!id) {
                        console.error('[SYNC] Update payload is missing an ID');
                        continue;
                    }
                    try {
                        const { error: updateError } = await supabase.from(item.table_name).update(updateData).eq('id', id);
                        error = updateError;
                        console.log('[SYNC] Step 5.${i}.26: Generic update complete');
                    } catch (networkError) {
                        console.error('[SYNC] Network error during generic update');
                        error = networkError;
                        continue;
                    }
                }

                console.log('[SYNC] Step 5.${i}.27: Checking error status');

                if (!error) {
                    console.log('[SYNC] Step 5.${i}.28: No error, proceeding with cleanup');
                    
                    await deleteFromQueue(item.id);
                    console.log('[SYNC] Step 5.${i}.29: Deleted from queue');
                    
                    syncedCount++;
                    console.log('[SYNC] Step 5.${i}.30: About to show notification');
                    
                    try {
                       await showSyncNotification(item.action, item.table_name, payload, true);
                       console.log('[SYNC] Step 5.${i}.31: Notification shown');
                    } catch (notifError) {
                        console.error('[SYNC] Failed to create sync notification');
                        try {
                            await db.runAsync(
                            `INSERT INTO sync_notifications (message, type, created_at) VALUES (?, ?, datetime('now'))`,
                            [`${item.table_name} ${item.action} synced successfully`, 'success']
                            );
                        } catch (fallbackError) {
                            console.error('[SYNC] Even fallback notification failed');
                        }
                    }
                    
                } else {
                    console.error('[SYNC] Failed to sync item');
                    
                    if (error.message && (error.message.includes('Network request failed') || error.message.includes('fetch'))) {
                        console.log('[SYNC] Network error detected, stopping sync to retry later');
                        break;
                    }
                }
            } catch (e) {
                console.error('[SYNC] CRITICAL ERROR IN LOOP:', e?.message || 'unknown error');
                
                if (e.message && (e.message.includes('Network') || e.message.includes('fetch'))) {
                    console.log('[SYNC] Network error detected, stopping sync process');
                    break;
                }
            }
        }
        
        console.log(`[SYNC] Sync process finished. ${syncedCount} items synced successfully.`);
    } catch (error) {
        console.error('[SYNC] TOP LEVEL ERROR:', error?.message || 'unknown');
    }
};
// Add this function to check for pending sync notifications

export const checkSyncNotifications = async (addNotification) => {
    const db = getDatabase();
    
    try {

        const notifications = await db.getAllAsync(

            'SELECT * FROM sync_notifications WHERE is_read = 0 ORDER BY created_at DESC'

        );

        

        console.log(`Found ${notifications.length} sync notifications to show`);

        

        for (const notif of notifications) {

            if (addNotification && notif.message) {

                addNotification(notif.message, notif.type || 'success');

                console.log('Showing sync notification:', notif.message);

            }

            // Mark as read - FIX: Use array for parameters

            await db.runAsync('UPDATE sync_notifications SET is_read = 1 WHERE id = ?', [notif.id]);

        }

        return notifications.length;

    } catch (error) {
        console.error('Error checking sync notifications:', error);
        return 0;
    }

};