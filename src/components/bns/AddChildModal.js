// src/components/bns/AddChildModal.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { supabase } from '../../services/supabase';
import { useNotification } from '../../context/NotificationContext';
import { logActivity } from '../../services/activityLogger';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import * as Crypto from 'expo-crypto';
import { getDatabase } from '../../services/database';
import NetInfo from '@react-native-community/netinfo';
import CalendarPickerModal from '../common/CalendarPickerModal';

// --- ICONS & HELPER COMPONENTS ---
const BackArrowIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none"><Path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const ProfileIcon = () => <Svg width="100%" height="100%" viewBox="0 0 24 24" fill="#d1d5db"><Path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></Svg>;
const CalendarIcon = () => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M8 7V3M16 4V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const Checkbox = ({ label, value, onValueChange }) => (
    <TouchableOpacity style={styles.checkboxContainer} onPress={() => onValueChange(!value)}>
        <View style={[styles.checkboxBase, value && styles.checkboxChecked]}>
            {value && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
);

const safeString = (value, fallback = '') => {
  if (value == null) return fallback;
  try {
    return String(value);
  } catch (error) {
    console.warn('Value conversion failed, using fallback:', error);
    return fallback;
  }
};

// Safe numeric handling
const safeNumber = (value) => {
  if (value == null || value === '' || value === 'null' || value === 'undefined') {
    return null;
  }
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};

const InputField = ({ label, value, onChangeText, ...props }) => {
  const safeValue = safeString(value, '');
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput 
        style={styles.input} 
        value={safeValue}
        onChangeText={onChangeText} 
        {...props} 
      />
    </View>
  );
};

// --- FORM STEP COMPONENTS ---
const Step1 = ({ formData, handleChange, setIsCalendarOpen }) => (
    <>
        <Text style={styles.sectionTitle}>Child & Family Information</Text>
        <InputField label="Name of BHS"  placeholderTextColor="#9ca3af" value={formData.bhs_name || 'San Miguel'} onChangeText={t => handleChange('bhs_name', t)} />
        <InputField label="Name of Child" placeholder="Enter the name of child"  placeholderTextColor="#9ca3af" value={formData.child_name || ''} onChangeText={t => handleChange('child_name', t)} />
        <View style={styles.row}>
            <View style={{flex: 1}}>
                <Text style={styles.label}>Date of Birth</Text>
                {/* This line will now work correctly */}
                <TouchableOpacity style={styles.dateInput} onPress={() => setIsCalendarOpen(true)}>
                    <Text style={[styles.inputText, !formData.dob && styles.placeholderText]}>
                        {formData.dob || 'YYYY-MM-DD'}
                    </Text>
                    <CalendarIcon />
                </TouchableOpacity>
            </View>
            <InputField containerStyle={{flex:1}} label="Sex"  placeholderTextColor="#9ca3af" placeholder="Male/Female" value={formData.sex || ''} onChangeText={t => handleChange('sex', t)} />
        </View>
        <InputField label="Place of Birth" placeholder="Enter place of birth" placeholderTextColor="#9ca3af" value={formData.place_of_birth || ''} onChangeText={t => handleChange('place_of_birth', t)} />
        <InputField label="Name of Mother" placeholder="Enter the name of mother" placeholderTextColor="#9ca3af" value={formData.mother_name || ''} onChangeText={t => handleChange('mother_name', t)} />
        <InputField label="Name of Father" placeholder="Enter the name of father" placeholderTextColor="#9ca3af" value={formData.father_name || ''} onChangeText={t => handleChange('father_name', t)} />
        <InputField label="Name of Guardian" placeholder="Enter the name of guardian" placeholderTextColor="#9ca3af" value={formData.guardian_name || ''} onChangeText={t => handleChange('guardian_name', t)} />
    </>
);

const Step2 = ({ formData, handleChange }) => (
    <>
        <Text style={styles.sectionTitle}>Measurements & ID Numbers</Text>
        <View style={styles.row}>
            <InputField containerStyle={{flex:1}} label="Weight (kg)" placeholderTextColor="#9ca3af" value={formData.weight_kg || ''} onChangeText={t => handleChange('weight_kg', t)} keyboardType="numeric" />
            <InputField containerStyle={{flex:1}} label="Height (cm)"  placeholderTextColor="#9ca3af" value={formData.height_cm || ''} onChangeText={t => handleChange('height_cm', t)} keyboardType="numeric" />
        </View>
        <InputField label="NHTS No." placeholderTextColor="#9ca3af" value={formData.nhts_no || ''} onChangeText={t => handleChange('nhts_no', t)} />
        <InputField label="PhilHealth No." placeholderTextColor="#9ca3af" value={formData.philhealth_no || ''} onChangeText={t => handleChange('philhealth_no', t)} />

        <Text style={styles.sectionTitle}>Mother's Immunization Status (Td)</Text>
        <View style={styles.grid}>
            {['Td1', 'Td2', 'Td3', 'Td4', 'Td5'].map(v => (
                <InputField containerStyle={styles.gridInput} key={v} label={v} placeholderTextColor="#9ca3af" placeholder="YYYY-MM-DD" value={formData[`mother_immunization_${v}`] || ''} onChangeText={t => handleChange(`mother_immunization_${v}`, t)} />
            ))}
        </View>

        <Text style={styles.sectionTitle}>Exclusive Breastfeeding</Text>
        <View style={styles.checkboxGrid}>
            {['1st Month', '2nd Month', '3rd Month', '4th Month', '5th Month', '6th Month'].map(month => <Checkbox key={month} label={month} value={!!formData[`breastfeeding_${month}`]} onValueChange={v => handleChange(`breastfeeding_${month}`, v)} />)}
        </View>

        <InputField label="Vitamin A (Date Given)"  placeholderTextColor="#9ca3af" placeholder="YYYY-MM-DD" value={formData.vitamin_a_date || ''} onChangeText={t => handleChange('vitamin_a_date', t)} />
    </>
);

export default function AddChildModal({ onClose, onSave, mode = 'add', initialData = null }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({});
    const [childId, setChildId] = useState(''); 
    const [loading, setLoading] = useState(false);
    const { addNotification } = useNotification();
    const [formLoading, setFormLoading] = useState(true);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

   useEffect(() => {
        if (mode === 'edit' && initialData) {
        console.log('[DEBUG] Edit mode - initialData:', initialData);
        setFormLoading(true);

        if (!initialData) {
            console.error('No initialData provided for edit mode');
            setFormLoading(false);
            addNotification('Error: No data found for editing.', 'error');
            onClose();  // Close modal to prevent crash
            return;
        }
        
        // Ensure childId is always a string to prevent QRCode/rendering errors
        setChildId(String(initialData.child_id || ''));
        
        let healthDetails = {};
        try {
            if (initialData.health_details) {
                console.log('[DEBUG] health_details raw:', initialData.health_details);
                const parsed = typeof initialData.health_details === 'string' 
                    ? JSON.parse(initialData.health_details) 
                    : initialData.health_details;
                // FIX: Ensure parsed health_details is always an object (handles 'null' strings)
                healthDetails = (parsed && typeof parsed === 'object') ? parsed : {};
                console.log('[DEBUG] health_details parsed:', healthDetails);
            }
        } catch (error) {
            console.error('Error parsing health_details:', error);
            healthDetails = {};  // Fallback to empty object
        }
        
        // Enhanced sanitization: Ensure ALL values are strings to prevent null leakage
        const sanitizeValue = (value) => {
            if (value == null || value === 'null' || value === 'undefined' || (typeof value === 'string' && value.trim() === '')) {
            return '';
            }
            if (typeof value === 'number' && isNaN(value)) return '';
            return String(value);
        };

        const sanitizeNumericField = (value) => {
            console.log('[DEBUG] Sanitizing numeric field:', { value, type: typeof value });
            if (value == null) return '';
            if (value === 'null' || value === 'undefined' || value === 'NaN') return '';
            if (typeof value === 'number') {
            if (isNaN(value)) return '';
            return String(value);
            }
            if (typeof value === 'string') {
            const parsed = parseFloat(value.trim());
            if (isNaN(parsed)) return '';
            return value.trim();
            }
            return '';
        };

        // Build sanitizedData with explicit String() fallbacks for safety
        const sanitizedData = {
            bhs_name: String(sanitizeValue(healthDetails.bhs_name) || 'San Miguel'),
            child_name: String((sanitizeValue(initialData.first_name) || '') + ' ' + (sanitizeValue(initialData.last_name) || '')),
            dob: String(sanitizeValue(initialData.dob) || ''),
            sex: String(sanitizeValue(initialData.sex) || ''),
            place_of_birth: String(sanitizeValue(initialData.place_of_birth) || ''),
            mother_name: String(sanitizeValue(initialData.mother_name) || ''),
            father_name: String(sanitizeValue(initialData.father_name) || ''),
            guardian_name: String(sanitizeValue(initialData.guardian_name) || ''),
            weight_kg: sanitizeNumericField(initialData.weight_kg),
            height_cm: sanitizeNumericField(initialData.height_cm),
            nhts_no: String(sanitizeValue(initialData.nhts_no) || ''),
            philhealth_no: String(sanitizeValue(initialData.philhealth_no) || ''),
            mother_immunization_Td1: String(sanitizeValue(healthDetails.mother_immunization_Td1) || ''),
            mother_immunization_Td2: String(sanitizeValue(healthDetails.mother_immunization_Td2) || ''),
            mother_immunization_Td3: String(sanitizeValue(healthDetails.mother_immunization_Td3) || ''),
            mother_immunization_Td4: String(sanitizeValue(healthDetails.mother_immunization_Td4) || ''),
            mother_immunization_Td5: String(sanitizeValue(healthDetails.mother_immunization_Td5) || ''),
            'breastfeeding_1st Month': Boolean(healthDetails['breastfeeding_1st Month']),
            'breastfeeding_2nd Month': Boolean(healthDetails['breastfeeding_2nd Month']),
            'breastfeeding_3rd Month': Boolean(healthDetails['breastfeeding_3rd Month']),
            'breastfeeding_4th Month': Boolean(healthDetails['breastfeeding_4th Month']),
            'breastfeeding_5th Month': Boolean(healthDetails['breastfeeding_5th Month']),
            'breastfeeding_6th Month': Boolean(healthDetails['breastfeeding_6th Month']),
            vitamin_a_date: String(sanitizeValue(healthDetails.vitamin_a_date) || ''),
        };

        console.log('[DEBUG] Final sanitizedData for form:', sanitizedData);
        console.log('[DEBUG] Numeric fields check:', {
            weight_kg: { value: sanitizedData.weight_kg, type: typeof sanitizedData.weight_kg },
            height_cm: { value: sanitizedData.height_cm, type: typeof sanitizedData.height_cm }
        });
        
        setFormData(sanitizedData);
        setFormLoading(false);
        } else {
            // Add mode logic remains the same
            setFormLoading(false);
            const generateId = async () => {
                setChildId('Loading...');
                const netInfo = await NetInfo.fetch();
                const db = getDatabase();

                if (netInfo.isConnected) {
                    const { count, error } = await supabase
                        .from('child_records')
                        .select('*', { count: 'exact', head: true });

                    if (error) {
                        const localChildren = await db.getAllAsync('SELECT * FROM child_records WHERE child_id LIKE "C-%"');
                        const newId = `C-${String((localChildren.length || 0) + 1).padStart(3, '0')}`;
                        setChildId(newId);
                    } else {
                        const newId = `C-${String((count || 0) + 1).padStart(3, '0')}`;
                        setChildId(newId);
                    }
                } else {
                    try {
                        const localChildren = await db.getAllAsync('SELECT * FROM child_records WHERE child_id LIKE "C-%"');
                        const newId = `C-${String(localChildren.length + 1).padStart(3, '0')}`;
                        setChildId(newId);
                    } catch (error) {
                        console.error('Error counting local children:', error);
                        const uniqueId = `TEMP-C-${Crypto.randomUUID()}`;
                        setChildId(uniqueId);
                    }
                }
            };
            generateId();

            setFormData({
                bhs_name: 'San Miguel',
                child_name: '',
                dob: '',
                sex: '',
                place_of_birth: '',
                mother_name: '',
                father_name: '',
                guardian_name: '',
                weight_kg: '',
                height_cm: '',
                nhts_no: '',
                philhealth_no: '',
                mother_immunization_Td1: '',
                mother_immunization_Td2: '',
                mother_immunization_Td3: '',
                mother_immunization_Td4: '',
                mother_immunization_Td5: '',
                'breastfeeding_1st Month': false,
                'breastfeeding_2nd Month': false,
                'breastfeeding_3rd Month': false,
                'breastfeeding_4th Month': false,
                'breastfeeding_5th Month': false,
                'breastfeeding_6th Month': false,
                vitamin_a_date: '',
            });
        }
    }, [mode, initialData]);
        if (formLoading) {
            return (
                <SafeAreaView style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.backButton}>
                            <BackArrowIcon />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{mode === 'edit' ? 'Edit Child Record' : 'New Child Record'}</Text>
                    </View>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                        <Text style={{ marginTop: 10 }}>Loading form data...</Text>
                    </View>
                </SafeAreaView>
            );
        }

    const handleChange = (name, value) => setFormData(prev => ({ ...prev, [name]: value }));

    const handleSave = async () => {
        if (!formData.child_name || !formData.dob) {
            addNotification("Please fill in the child's name and date of birth.", 'error');
            return;
        }
        setLoading(true);

        const netInfo = await NetInfo.fetch();
        const db = getDatabase();

        try {
            const [firstName, ...lastNameParts] = formData.child_name.split(' ');
            
            let finalChildId = childId;

            // FIX: Proper null/undefined/empty string handling for numeric fields
            const safeParseFloat = (value) => {
                if (value === null || value === undefined || value === '' || value === 'null' || value === 'undefined') {
                    return null;
                }
                const parsed = parseFloat(value);
                return isNaN(parsed) ? null : parsed;
            };

            const weight = safeParseFloat(formData.weight_kg);
            const height = safeParseFloat(formData.height_cm);
            let bmi = null;
            
            // FIX: Only calculate BMI if we have valid numbers
            if (weight !== null && height !== null && height > 0) {
                const heightInMeters = height / 100;
                bmi = weight / (heightInMeters * heightInMeters);
                // Round to 2 decimal places for consistency
                bmi = Math.round(bmi * 100) / 100;
            }

            const childRecord = {
                child_id: finalChildId,
                first_name: firstName,
                last_name: lastNameParts.join(' ') || '',
                dob: formData.dob,
                sex: formData.sex,
                place_of_birth: formData.place_of_birth || '',
                mother_name: formData.mother_name,
                father_name: formData.father_name || '',
                guardian_name: formData.guardian_name || '',
                nhts_no: formData.nhts_no || '',
                philhealth_no: formData.philhealth_no || '',
                weight_kg: weight,
                height_cm: height,
                bmi: bmi,
                nutrition_status: 'H',
                health_details: formData,
            };

            // ADD DEBUG LOGGING
            console.log('🔍 [DEBUG] Child record before save:', JSON.stringify(childRecord, null, 2));
            console.log('🔍 [DEBUG] Numeric fields:', {
                weight_kg: { type: typeof childRecord.weight_kg, value: childRecord.weight_kg },
                height_cm: { type: typeof childRecord.height_cm, value: childRecord.height_cm },
                bmi: { type: typeof childRecord.bmi, value: childRecord.bmi }
            });

            if (netInfo.isConnected) {
                // --- ONLINE LOGIC ---
                console.log(`Online: ${mode === 'edit' ? 'Updating' : 'Saving'} child record...`);
                
                if (mode === 'edit') {
                    // EDIT MODE: Update existing child record
                    try {
                        const { error } = await supabase
                            .from('child_records')
                            .update(childRecord)
                            .eq('child_id', childId);
                        
                        if (error) throw error;
                        addNotification('Child record updated successfully.', 'success');
                    } catch (onlineError) {
                        console.error("Online update failed, falling back to offline:", onlineError);
                        
                        // Fallback to offline update
                        await db.withTransactionAsync(async () => {
                            const statement = await db.prepareAsync(
                                `UPDATE child_records SET 
                                    first_name = ?, last_name = ?, dob = ?, sex = ?, place_of_birth = ?,
                                    mother_name = ?, father_name = ?, guardian_name = ?, nhts_no = ?, philhealth_no = ?,
                                    weight_kg = ?, height_cm = ?, bmi = ?, nutrition_status = ?, health_details = ?
                                WHERE child_id = ?;`
                            );
                            const safeSqlValue = (val) => {
                                if (val === null || val === undefined || val === 'null' || val === 'undefined') {
                                    return undefined;
                                }
                                if (typeof val === 'boolean') return val ? 1 : 0;
                                if (typeof val === 'number') return isNaN(val) ? null : val;
                                if (typeof val === 'string' && val.trim() === '') return null;
                                return val;
                                };
                                
                            await statement.executeAsync([
                                safeSqlValue(childRecord.first_name), 
                                safeSqlValue(childRecord.last_name), 
                                safeSqlValue(childRecord.dob),
                                safeSqlValue(childRecord.sex),
                                safeSqlValue(childRecord.place_of_birth),
                                safeSqlValue(childRecord.mother_name),
                                safeSqlValue(childRecord.father_name),
                                safeSqlValue(childRecord.guardian_name),
                                safeSqlValue(childRecord.nhts_no),
                                safeSqlValue(childRecord.philhealth_no),
                                safeSqlValue(childRecord.weight_kg),
                                safeSqlValue(childRecord.height_cm),
                                safeSqlValue(childRecord.bmi),
                                safeSqlValue(childRecord.nutrition_status),
                                JSON.stringify(childRecord.health_details),
                                safeSqlValue(childRecord.child_id)
                                ]);
                            await statement.finalizeAsync();

                            const syncStatement = await db.prepareAsync(
                                'INSERT INTO sync_queue (action, table_name, payload) VALUES (?, ?, ?);'
                            );
                            await syncStatement.executeAsync([
                                'update', 
                                'child_records', 
                                JSON.stringify({
                                    ...childRecord,
                                    id: initialData?.id
                                })
                            ]);
                            await syncStatement.finalizeAsync();
                        });
                        addNotification('Child record updated locally. Will sync when online.', 'success');
                    }
                } else {
                    // ADD MODE: Create new child record
                    try {
                        const { error } = await supabase.from('child_records').insert([childRecord]);
                        if (error) throw error;
                        addNotification('New child record added successfully.', 'success');
                        
                        try {
                            await logActivity(
                                mode === 'edit' ? 'Update Child' : 'Add Child', 
                                `ID: ${finalChildId}`
                            );
                        } catch (logError) {
                            console.log('Activity logging failed:', logError);
                        }

                    } catch (onlineError) {
                        console.error("Online save failed, falling back to offline:", onlineError);
                        
                        // Fallback to offline save
                        await db.withTransactionAsync(async () => {
                            const statement = await db.prepareAsync(
                                `INSERT INTO child_records (
                                    child_id, first_name, last_name, dob, sex, place_of_birth, 
                                    mother_name, father_name, guardian_name, nhts_no, philhealth_no,
                                    weight_kg, height_cm, bmi, nutrition_status, health_details
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
                            );
                            await statement.executeAsync([
                                childRecord.child_id, 
                                childRecord.first_name, 
                                childRecord.last_name, 
                                childRecord.dob,
                                childRecord.sex,
                                childRecord.place_of_birth,
                                childRecord.mother_name,
                                childRecord.father_name,
                                childRecord.guardian_name,
                                childRecord.nhts_no,
                                childRecord.philhealth_no,
                                childRecord.weight_kg,
                                childRecord.height_cm,
                                childRecord.bmi,
                                childRecord.nutrition_status,
                                JSON.stringify(childRecord.health_details)
                            ]);
                            await statement.finalizeAsync();

                            const syncStatement = await db.prepareAsync(
                                'INSERT INTO sync_queue (action, table_name, payload) VALUES (?, ?, ?);'
                            );
                            await syncStatement.executeAsync(['create', 'child_records', JSON.stringify(childRecord)]);
                            await syncStatement.finalizeAsync();
                        });
                        addNotification('Child record saved locally. Will sync when online.', 'success');
                    }
                }

            } else {
                // --- OFFLINE LOGIC ---
                console.log(`Offline: ${mode === 'edit' ? 'Updating' : 'Saving'} child record locally...`);
                
                await db.withTransactionAsync(async () => {
                    // FIX: Use a safer approach for SQLite operations
                    const safeValue = (val) => {
                        if (val === null || val === undefined) {
                            return undefined;
                        }
                        return val;
                    };

                    if (mode === 'edit') {
                        // UPDATE existing record - FIXED with safeValue wrapper
                        const statement = await db.prepareAsync(
                            `UPDATE child_records SET 
                                first_name = ?, last_name = ?, dob = ?, sex = ?, place_of_birth = ?,
                                mother_name = ?, father_name = ?, guardian_name = ?, nhts_no = ?, philhealth_no = ?,
                                weight_kg = ?, height_cm = ?, bmi = ?, nutrition_status = ?, health_details = ?
                            WHERE child_id = ?;`
                        );
                        
                        await statement.executeAsync([
                            safeValue(childRecord.first_name), 
                            safeValue(childRecord.last_name), 
                            safeValue(childRecord.dob),
                            safeValue(childRecord.sex),
                            safeValue(childRecord.place_of_birth),
                            safeValue(childRecord.mother_name),
                            safeValue(childRecord.father_name),
                            safeValue(childRecord.guardian_name),
                            safeValue(childRecord.nhts_no),
                            safeValue(childRecord.philhealth_no),
                            safeValue(childRecord.weight_kg),  // This was causing the error
                            safeValue(childRecord.height_cm),  // This too
                            safeValue(childRecord.bmi),        // And this
                            safeValue(childRecord.nutrition_status),
                            JSON.stringify(childRecord.health_details),
                            safeValue(childRecord.child_id)
                        ]);
                        await statement.finalizeAsync();

                        const syncStatement = await db.prepareAsync(
                            'INSERT INTO sync_queue (action, table_name, payload) VALUES (?, ?, ?);'
                        );
                        await syncStatement.executeAsync([
                            'update', 
                            'child_records', 
                            JSON.stringify({
                                ...childRecord,
                                id: initialData?.id
                            })
                        ]);
                        await syncStatement.finalizeAsync();
                    } else {
                        // CREATE new record - FIXED with safeValue wrapper
                        const statement = await db.prepareAsync(
                            `INSERT INTO child_records (
                                child_id, first_name, last_name, dob, sex, place_of_birth, 
                                mother_name, father_name, guardian_name, nhts_no, philhealth_no,
                                weight_kg, height_cm, bmi, nutrition_status, health_details
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
                        );
                        
                        await statement.executeAsync([
                            safeValue(childRecord.child_id), 
                            safeValue(childRecord.first_name), 
                            safeValue(childRecord.last_name), 
                            safeValue(childRecord.dob),
                            safeValue(childRecord.sex),
                            safeValue(childRecord.place_of_birth),
                            safeValue(childRecord.mother_name),
                            safeValue(childRecord.father_name),
                            safeValue(childRecord.guardian_name),
                            safeValue(childRecord.nhts_no),
                            safeValue(childRecord.philhealth_no),
                            safeValue(childRecord.weight_kg),  // This was causing the error
                            safeValue(childRecord.height_cm),  // This too
                            safeValue(childRecord.bmi),        // And this
                            safeValue(childRecord.nutrition_status),
                            JSON.stringify(childRecord.health_details)
                        ]);
                        await statement.finalizeAsync();

                        const syncStatement = await db.prepareAsync(
                            'INSERT INTO sync_queue (action, table_name, payload) VALUES (?, ?, ?);'
                        );
                        await syncStatement.executeAsync(['create', 'child_records', JSON.stringify(childRecord)]);
                        await syncStatement.finalizeAsync();
                    }
                });
                addNotification(`Child record ${mode === 'edit' ? 'updated' : 'saved'} locally. Will sync when online.`, 'success');
            }
            onSave();
            onClose();

        } catch (error) {
            console.error(`Failed to ${mode === 'edit' ? 'update' : 'save'} child record:`, error);
            console.error('🔍 [DEBUG] Error details:', {
                message: error.message,
                stack: error.stack
            });
            
            if (error.message.includes('Network request failed')) {
                addNotification('Network error. Please check your internet connection.', 'error');
            } else {
                addNotification(`Error: ${error.message}`, 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Modal
                transparent={true}
                visible={isCalendarOpen}
                animationType="fade"
                onRequestClose={() => setIsCalendarOpen(false)}
            >
                <CalendarPickerModal
                    onClose={() => setIsCalendarOpen(false)}
                    onDateSelect={(date) => {
                        handleChange('dob', date);
                        setIsCalendarOpen(false);
                    }}
                    mode="any-other-mode"
                    disableWeekends={false}
                />
            </Modal>

        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.backButton}><BackArrowIcon /></TouchableOpacity>
                <Text style={styles.headerTitle}>{mode === 'edit' ? 'Edit Child Record' : 'New Child Record'}</Text>
                <Text style={styles.stepIndicator}>Step {step} of 2</Text>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.profileSection}>
                    {/* FIX: Completely safe QRCode rendering */}
                    {(() => {
                        const safeChildId = childId ? String(childId) : '';
                        const canRenderQR = safeChildId && safeChildId.startsWith('C-');
                        
                        return (
                        <>
                            <View style={styles.avatarPlaceholder}>
                            {safeChildId.startsWith('C-') ? <QRCode value={safeChildId} size={80} /> : <ProfileIcon />}
                                </View>
                                <Text style={styles.patientId}>Child ID: {safeChildId}</Text>
                        </>
                        );
                    })()}
                </View>
                {step === 1 && <Step1 formData={formData} handleChange={handleChange} setIsCalendarOpen={setIsCalendarOpen} />}
                {step === 2 && <Step2 formData={formData} handleChange={handleChange} />}
            </ScrollView>
            <View style={styles.footer}>
                {step > 1 && <TouchableOpacity style={styles.navButton} onPress={() => setStep(step - 1)}><Text style={styles.navButtonText}>Previous</Text></TouchableOpacity>}
                {step < 2 && <TouchableOpacity style={styles.navButton} onPress={() => setStep(step + 1)}><Text style={styles.navButtonText}>Next</Text></TouchableOpacity>}
                {step === 2 && (
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Confirm & Save</Text>}
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    </>
);

}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderColor: '#e5e7eb' },
    headerTitle: { fontSize: 16, fontWeight: 'bold' },
    stepIndicator: { fontSize: 14, color: '#6b7280' },
    backButton: { padding: 5 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    profileSection: { alignItems: 'center', marginVertical: 10 },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginBottom: 8, padding: 10 },
    patientId: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginTop: 15, marginBottom: 10, borderBottomWidth: 1, borderColor: '#e5e7eb', paddingBottom: 5 },
    subSectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginTop: 10, marginBottom: 10 },
    inputContainer: { marginBottom: 15 },
    label: { fontSize: 14, color: '#6b7280', marginBottom: 5 },
    input: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db', fontSize: 16, marginBottom: 10, color: '#111827' },
    dateInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#d1d5db',
        marginBottom: 10,
    },
    inputText: {
        fontSize: 16,
        color: '#111827',
    },
    placeholderText: {
        color: '#9ca3af',
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    inputRow: { flex: 1 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gridInput: { width: '32%', marginBottom: 10 },
    checkboxGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center', width: '50%', marginBottom: 12 },
    checkboxBase: { width: 22, height: 22, borderWidth: 2, borderColor: '#3b82f6', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
    checkboxChecked: { backgroundColor: '#3b82f6' },
    checkmark: { color: 'white', fontWeight: 'bold' },
    checkboxLabel: { marginLeft: 8, fontSize: 14 },
    footer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', padding: 20, borderTopWidth: 1, borderColor: '#e5e7eb' },
    navButton: { paddingVertical: 12, paddingHorizontal: 40, backgroundColor: '#e5e7eb', borderRadius: 10 },
    navButtonText: { fontWeight: 'bold', color: '#374151' },
    saveButton: { paddingVertical: 12, paddingHorizontal: 40, backgroundColor: '#3b82f6', borderRadius: 10 },
    saveButtonText: { fontWeight: 'bold', color: 'white' },
});