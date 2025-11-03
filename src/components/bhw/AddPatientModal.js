import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { supabase } from '../../services/supabase';
import { useNotification } from '../../context/NotificationContext';
import { logActivity } from '../../services/activityLogger';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import { getDatabase } from '../../services/database';
import NetInfo from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';
import CalendarPickerModal from '../common/CalendarPickerModal';
import { Picker } from '@react-native-picker/picker';

// --- ICONS & HELPER COMPONENTS ---
const BackArrowIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none"><Path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const ProfileIcon = () => <Svg width="100%" height="100%" viewBox="0 0 24 24" fill="#d1d5db"><Path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></Svg>;
const CalendarIcon = () => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M8 7V3M16 4V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;

// --- MEMOIZED HELPER COMPONENTS ---
const Checkbox = React.memo(({ label, value, onValueChange }) => (
    <TouchableOpacity style={styles.checkboxContainer} onPress={() => onValueChange(!value)}>
        <View style={[styles.checkboxBase, value && styles.checkboxChecked]}>
            {value && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
));

const VaccineRow = React.memo(({ label, value, onPress }) => (
    <View style={styles.vaccineRow}>
        <Text style={styles.vaccineLabel}>{label}</Text>
        <TouchableOpacity style={styles.vaccineDateInput} onPress={onPress}>
            <Text style={[styles.inputText, !value && styles.placeholderText]}>
                {value || 'Select Date'}
            </Text>
            <CalendarIcon />
        </TouchableOpacity>
    </View>
));

// --- FORM STEP COMPONENTS ---
const Step1 = React.memo(({ formData, handleChange, setIsCalendarOpen, setCalendarField }) => (
    <>
        <Text style={styles.sectionTitle}>Personal & Contact Information</Text>
        <TextInput style={styles.input} placeholder="Last Name" placeholderTextColor="#9ca3af" value={formData.last_name} onChangeText={t => handleChange('last_name', t)} />
        <TextInput style={styles.input} placeholder="First Name" placeholderTextColor="#9ca3af" value={formData.first_name} onChangeText={t => handleChange('first_name', t)} />
        <TextInput style={styles.input} placeholder="Middle Name" placeholderTextColor="#9ca3af" value={formData.middle_name} onChangeText={t => handleChange('middle_name', t)} />
        
        <TouchableOpacity style={styles.dateInput} onPress={() => { setCalendarField('dob'); setIsCalendarOpen(true); }}>
            <Text style={[styles.inputText, !formData.dob && styles.placeholderText]}>
                {formData.dob || 'Date of Birth (YYYY-MM-DD)'}
            </Text>
            <CalendarIcon />
        </TouchableOpacity>

        <TextInput
            style={[styles.input, styles.readOnlyInput]}
            placeholder="Age"
            placeholderTextColor="#9ca3af"
            value={formData.age}
            editable={false}
        />
        <View style={styles.pickerContainer}>
            <Text style={styles.label}>Blood Type</Text>
            <View style={styles.pickerWrapper}>
                <Picker
                    selectedValue={formData.blood_type}
                    onValueChange={(itemValue) => handleChange('blood_type', itemValue)}
                    style={styles.picker}
                    dropdownIconColor="#6b7280"
                >
                    <Picker.Item label="Select Blood Type" value="" />
                    <Picker.Item label="A+" value="A+" />
                    <Picker.Item label="A-" value="A-" />
                    <Picker.Item label="B+" value="B+" />
                    <Picker.Item label="B-" value="B-" />
                    <Picker.Item label="AB+" value="AB+" />
                    <Picker.Item label="AB-" value="AB-" />
                    <Picker.Item label="O+" value="O+" />
                    <Picker.Item label="O-" value="O-" />
                </Picker>
            </View>
        </View>
        <TextInput style={styles.input} placeholder="Contact No." placeholderTextColor="#9ca3af" value={formData.contact_no} onChangeText={t => handleChange('contact_no', t)} keyboardType="phone-pad" />
        <View style={styles.pickerContainer}>
        <Text style={styles.label}>Purok</Text>
        <View style={styles.pickerWrapper}>
            <Picker
            selectedValue={formData.purok}
            onValueChange={(itemValue) => handleChange('purok', itemValue)}
            style={styles.picker}
            dropdownIconColor="#6b7280"
            >
            <Picker.Item label="Select Purok..." value="" />
            <Picker.Item label="Purok Bagong Silang Zone 1" value="Purok Bagong Silang Zone 1" />
            <Picker.Item label="Purok Bagong Silang Zone 2" value="Purok Bagong Silang Zone 2" />
            <Picker.Item label="Purok Masigla Zone 1" value="Purok Masigla Zone 1" />
            <Picker.Item label="Purok Masigla Zone 2" value="Purok Masigla Zone 2" />
            <Picker.Item label="Purok Masaya" value="Purok Masaya" />
            <Picker.Item label="Purok Bagong Lipunan" value="Purok Bagong Lipunan" />
            <Picker.Item label="Purok Dagomboy" value="Purok Dagomboy" />
            <Picker.Item label="Purok Katarungan Zone 1" value="Purok Katarungan Zone 1" />
            <Picker.Item label="Purok Katarungan Zone 2" value="Purok Katarungan Zone 2" />
            <Picker.Item label="Purok Pagkakaisa" value="Purok Pagkakaisa" />
            <Picker.Item label="Purok Kilos-Agad" value="Purok Kilos-Agad" />
            <Picker.Item label="Purok Balikatan" value="Purok Balikatan" />
            <Picker.Item label="Purok Bayanihan" value="Purok Bayanihan" />
            <Picker.Item label="Purok Magkakapitbahay" value="Purok Magkakapitbahay" />
            <Picker.Item label="Purok Magara Zone 2" value="Purok Magara Zone 2" />
            </Picker>
        </View>
        </View>
        <TextInput 
            style={styles.input} 
            placeholder="Street/Additional Address Details" 
            placeholderTextColor="#9ca3af" 
            value={formData.street} 
            onChangeText={t => handleChange('street', t)} 
            />
        <Text style={styles.sectionTitle}>ID Numbers</Text>
        <TextInput style={styles.input} placeholder="NHTS No." placeholderTextColor="#9ca3af" value={formData.nhts_no} onChangeText={t => handleChange('nhts_no', t)} />
        <TextInput style={styles.input} placeholder="PhilHealth No." placeholderTextColor="#9ca3af" value={formData.philhealth_no} onChangeText={t => handleChange('philhealth_no', t)} />

        <Text style={styles.sectionTitle}>Obstetrical Score</Text>
        <View style={styles.grid}>
            <TextInput style={styles.gridInput} placeholder="G" placeholderTextColor="#9ca3af" value={formData.g_score} onChangeText={t => handleChange('g_score', t)} keyboardType="numeric" />
            <TextInput style={styles.gridInput} placeholder="P" placeholderTextColor="#9ca3af" value={formData.p_score} onChangeText={t => handleChange('p_score', t)} keyboardType="numeric" />
            <TextInput style={styles.gridInput} placeholder="Term" placeholderTextColor="#9ca3af" value={formData.term} onChangeText={t => handleChange('term', t)} keyboardType="numeric" />
            <TextInput style={styles.gridInput} placeholder="Preterm" placeholderTextColor="#9ca3af" value={formData.preterm} onChangeText={t => handleChange('preterm', t)} keyboardType="numeric" />
            <TextInput style={styles.gridInput} placeholder="Abortion" placeholderTextColor="#9ca3af" value={formData.abortion} onChangeText={t => handleChange('abortion', t)} keyboardType="numeric" />
            <TextInput style={styles.gridInput} placeholder="Living" placeholderTextColor="#9ca3af" value={formData.living_children} onChangeText={t => handleChange('living_children', t)} keyboardType="numeric" />
        </View>
    </>
));

const Step2 = React.memo(({ formData, handleChange, setIsCalendarOpen, setCalendarField }) => (
    <>
        <Text style={styles.sectionTitle}>Past Menstrual Period</Text>
        <TouchableOpacity style={styles.dateInput} onPress={() => { setCalendarField('lmp'); setIsCalendarOpen(true); }}>
            <Text style={[styles.inputText, !formData.lmp && styles.placeholderText]}>
                {formData.lmp || 'LMP (YYYY-MM-DD)'}
            </Text>
            <CalendarIcon />
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateInput} onPress={() => { setCalendarField('edc'); setIsCalendarOpen(true); }}>
            <Text style={[styles.inputText, !formData.edc && styles.placeholderText]}>
                {formData.edc || 'EDC (YYYY-MM-DD)'}
            </Text>
            <CalendarIcon />
        </TouchableOpacity>
        <TextInput style={styles.input} placeholder="Age of First Period" placeholderTextColor="#9ca3af" value={formData.age_first_period} onChangeText={t => handleChange('age_first_period', t)} keyboardType="numeric" />

        <Text style={styles.sectionTitle}>OB History</Text>
        <TextInput style={styles.input} placeholder="Age of Menarche" placeholderTextColor="#9ca3af" value={formData.age_of_menarche} onChangeText={t => handleChange('age_of_menarche', t)} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Amount of Bleeding (Scanty/Moderate/Heavy)" placeholderTextColor="#9ca3af" value={formData.bleeding_amount} onChangeText={t => handleChange('bleeding_amount', t)} />
        <TextInput style={styles.input} placeholder="Duration of Menstruation (days)" placeholderTextColor="#9ca3af" value={formData.menstruation_duration} onChangeText={t => handleChange('menstruation_duration', t)} keyboardType="numeric" />
        <View style={styles.pickerContainer}>
            <Text style={styles.sectionTitle}>Risk Level</Text>
            <View style={styles.pickerWrapper}>
                <Picker
                    selectedValue={formData.risk_level}
                    onValueChange={(itemValue) => handleChange('risk_level', itemValue)}
                    style={styles.picker}
                >
                    <Picker.Item label="Select Risk Level" value="" />
                    <Picker.Item label="Normal" value="NORMAL" />
                    <Picker.Item label="Mid Risk" value="MID RISK" />
                    <Picker.Item label="High Risk" value="HIGH RISK" />
                </Picker>
            </View>
        </View>
        <Text style={styles.sectionTitle}>Pregnancy History</Text>
        <PregnancyHistoryTable formData={formData} handleChange={handleChange} />
    </>
));

const Step3 = React.memo(({ formData, handleChange }) => (
    <>
        <Text style={styles.sectionTitle}>Medical & Social History</Text>
        
        <Text style={styles.subSectionTitle}>Personal History</Text>
        <View style={styles.checkboxGrid}>
            {['Diabetes Mellitus (DM)', 'Asthma', 'Cardiovascular Disease (CVD)', 'Heart Disease', 'Goiter'].map(item => <Checkbox key={item} label={item} value={!!formData[`ph_${item}`]} onValueChange={v => handleChange(`ph_${item}`, v)} />)}
        </View>
        
        <Text style={styles.subSectionTitle}>Hereditary Disease History</Text>
        <View style={styles.checkboxGrid}>
            {['Hypertension (HPN)', 'Asthma', 'Heart Disease', 'Diabetes Mellitus', 'Goiter'].map(item => <Checkbox key={item} label={item} value={!!formData[`hdh_${item}`]} onValueChange={v => handleChange(`hdh_${item}`, v)} />)}
        </View>

        <Text style={styles.subSectionTitle}>Social History</Text>
        <View style={styles.checkboxGrid}>
            {['Smoker', 'Ex-smoker', 'Second-hand Smoker', 'Alcohol Drinker', 'Substance Abuse'].map(item => <Checkbox key={item} label={item} value={!!formData[`sh_${item}`]} onValueChange={v => handleChange(`sh_${item}`, v)} />)}
        </View>

        <Text style={styles.subSectionTitle}>Allergy & Family Planning</Text>
        <TextInput style={styles.textArea} placeholder="History of Allergy and Drugs..." placeholderTextColor="#9ca3af" multiline value={formData.allergy_history} onChangeText={t => handleChange('allergy_history', t)} />
        <TextInput style={styles.textArea} placeholder="Family Planning History (Method previously used)..." placeholderTextColor="#9ca3af" multiline value={formData.family_planning_history} onChangeText={t => handleChange('family_planning_history', t)} />
    </>
));

// --- NEW MEMOIZED ROW COMPONENTS FOR STEP 4 ---
const TreatmentRecordRow = React.memo(({ rowIndex, headers, formData, handleChange }) => {
  const rowData = useMemo(() => {
    return headers.map(header => ({
      key: header,
      value: formData[`tr_${rowIndex}_${header.toLowerCase()}`] || ''
    }));
  }, [formData, rowIndex, headers]);

  return (
    <View style={styles.horizontalTableRow}>
      {rowData.map(({ key, value }) => (
        <TextInput
          key={`${key}-${rowIndex}`}
          style={styles.horizontalTableCell}
          placeholderTextColor="#9ca3af"
          value={value}
          onChangeText={t => handleChange(`tr_${rowIndex}_${key.toLowerCase()}`, t)}
        />
      ))}
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.rowIndex === nextProps.rowIndex && 
         JSON.stringify(prevProps.formData) === JSON.stringify(nextProps.formData);
});

const OutcomeRecordRow = React.memo(({ headers, formData, handleChange }) => {
  const rowData = useMemo(() => {
    return headers.map(header => ({
      key: header,
      value: formData[`outcome_${header.toLowerCase().replace(/ /g, '_')}`] || ''
    }));
  }, [formData, headers]);

  return (
    <View style={styles.horizontalTableRow}>
      {rowData.map(({ key, value }) => (
        <TextInput
          key={key}
          style={[styles.horizontalTableCell, { width: 120 }]}
          placeholderTextColor="#9ca3af"
          value={value}
          onChangeText={t => handleChange(`outcome_${key.toLowerCase().replace(/ /g, '_')}`, t)}
        />
      ))}
    </View>
  );
});
// --- END OF NEW MEMOIZED COMPONENTS ---


const Step4 = React.memo(({ formData, handleChange, setIsCalendarOpen, setCalendarField }) => {
  const treatmentHeaders = useMemo(() => ['Date', 'Arrival', 'Departure', 'Ht.', 'Wt.', 'BP', 'MUAC', 'BMI', 'AOG', 'FH', 'FHB', 'LOC', 'Pres', 'Fe+FA', 'Admitted', 'Examined'], []);
  const outcomeHeaders = useMemo(() => ['Date Terminated', 'Type of Delivery', 'Outcome', 'Sex of Child', 'Birth Weight (g)', 'Age in Weeks', 'Place of Birth', 'Attended By'], []);
  
  const openCalendar = useCallback((field) => {
    setCalendarField(field);
    setIsCalendarOpen(true);
  }, [setCalendarField, setIsCalendarOpen]);

    return (
        <>
            <Text style={styles.sectionTitle}>Vaccination & Records</Text>

            {/* --- VACCINATION RECORD --- */}
            <Text style={styles.subSectionTitle}>Vaccination Record</Text>
            <View style={styles.vaccineTable}>
                {['TT1', 'TT2', 'TT3', 'TT4', 'TT5', 'FIM'].map(vaccine => (
                    <VaccineRow
                        key={vaccine}
                        label={vaccine}
                        value={formData[`vaccine_${vaccine.toLowerCase()}`] || ''}
                        onPress={() => openCalendar(`vaccine_${vaccine.toLowerCase()}`)}
                    />
                ))}
            </View>

            {/* --- PARENTAL INDIVIDUAL TREATMENT RECORD --- */}
            <Text style={styles.subSectionTitle}>Parental Individual Treatment Record</Text>
            <ScrollView horizontal={true} contentContainerStyle={styles.horizontalScroll}>
                <View style={styles.horizontalTable}>
                    {/* Header */}
                    <View style={styles.horizontalTableHeader}>
                        {treatmentHeaders.map(h => <Text key={h} style={styles.horizontalHeaderCell}>{h}</Text>)}
                    </View>
                    {/* Body */}
                    {Array.from({ length: 5 }).map((_, rowIndex) => (
                        <TreatmentRecordRow // <-- Using memoized row
                            key={rowIndex}
                            rowIndex={rowIndex}
                            headers={treatmentHeaders}
                            formData={formData}
                            handleChange={handleChange}
                        />
                    ))}
                </View>
            </ScrollView>
            {/* --- PREGNANCY OUTCOMES --- */}
            <Text style={styles.subSectionTitle}>Pregnancy Outcomes</Text>
            <ScrollView horizontal={true} contentContainerStyle={styles.horizontalScroll}>
                <View style={styles.horizontalTable}>
                    {/* Header */}
                    <View style={styles.horizontalTableHeader}>
                        {outcomeHeaders.map(h => <Text key={h} style={[styles.horizontalHeaderCell, { width: 120 }]}>{h}</Text>)}
                    </View>
                    {/* Body (Only 1 row for this table) */}
                    <OutcomeRecordRow // <-- Using memoized row
                        headers={outcomeHeaders}
                        formData={formData}
                        handleChange={handleChange}
                    />
                </View>
            </ScrollView>

            {/* --- MICRONUTRIENT SUPPLEMENTATION --- */}
            <Text style={styles.subSectionTitle}>Micronutrient Supplementation</Text>
            <View style={styles.microTable}>
                {/* Header */}
                <View style={styles.microHeader}>
                    <Text style={[styles.microHeaderText, { flex: 2 }]}>Supplementation Type</Text>
                    <Text style={styles.microHeaderText}>Date Given</Text>
                    <Text style={styles.microHeaderText}>Amount Given</Text>
                </View>
                {/* Iron Row */}
                <View style={styles.microRow}>
                    <Text style={[styles.microCell, { flex: 2, fontWeight: '500' }]}>Iron Supplementation / Ferrous Sulfate</Text>
                    <TouchableOpacity style={styles.microDateCell} onPress={() => openCalendar('micro_iron_date')}>
                        <Text style={[styles.inputText, !formData.micro_iron_date && styles.placeholderText]}>
                            {formData.micro_iron_date || 'Date'}
                        </Text>
                    </TouchableOpacity>
                    <TextInput
                        style={styles.microInputCell}
                        placeholder="Amount"
                        placeholderTextColor="#9ca3af"
                        value={formData.micro_iron_amount || ''}
                        onChangeText={t => handleChange('micro_iron_amount', t)}
                    />
                </View>
                {/* Vitamin A Row */}
                <View style={styles.microRow}>
                    <Text style={[styles.microCell, { flex: 2, fontWeight: '500' }]}>Vitamin A (200,000 IU)</Text>
                    <TouchableOpacity style={styles.microDateCell} onPress={() => openCalendar('micro_vita_date')}>
                        <Text style={[styles.inputText, !formData.micro_vita_date && styles.placeholderText]}>
                            {formData.micro_vita_date || 'Date'}
                        </Text>
                    </TouchableOpacity>
                    <TextInput
                        style={styles.microInputCell}
                        placeholder="Amount"
                        placeholderTextColor="#9ca3af"
                        value={formData.micro_vita_amount || ''}
                        onChangeText={t => handleChange('micro_vita_amount', t)}
                    />
                </View>
            </View>
        </>
    );
});

const PregnancyHistoryTable = React.memo(({ formData, handleChange }) => {
    // Creates an array [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const gravidas = Array.from({ length: 10 }, (_, i) => i + 1);

    return (
        <View style={styles.tableContainer}>
            {/* Header Row */}
            <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 0.6 }]}>G</Text>
                <Text style={styles.tableHeaderText}>Outcome</Text>
                <Text style={styles.tableHeaderText}>Sex</Text>
                <Text style={styles.tableHeaderText}>NSD/CS</Text>
                <Text style={styles.tableHeaderText}>Delivered At</Text>
            </View>

            {/* Data Rows */}
            {gravidas.map(g => (
                <View style={styles.tableRow} key={g}>
                    <Text style={styles.tableCellLabel}>G{g}</Text>
                    <TextInput
                        style={styles.tableCellInput}
                        value={formData[`g${g}_outcome`] || ''}
                        onChangeText={t => handleChange(`g${g}_outcome`, t)}
                        placeholderTextColor="#9ca3af"
                    />
                    
                    <View style={styles.tablePickerWrapper}>
                        <Picker
                            style={styles.tablePicker}
                            selectedValue={formData[`g${g}_sex`] || ''}
                            onValueChange={itemValue => handleChange(`g${g}_sex`, itemValue)}
                            dropdownIconColor="#6b7280"
                            prompt="Select Sex"
                        >
                            <Picker.Item label="Sex" value="" style={styles.tablePickerItem} />
                            <Picker.Item label="M" value="Male" style={styles.tablePickerItem} />
                            <Picker.Item label="F" value="Female" style={styles.tablePickerItem} />
                        </Picker>
                    </View>

                    <TextInput
                        style={styles.tableCellInput}
                        value={formData[`g${g}_delivery_type`] || ''}
                        onChangeText={t => handleChange(`g${g}_delivery_type`, t)}
                        placeholderTextColor="#9ca3af"
                    />
                    <TextInput
                        style={styles.tableCellInput}
                        value={formData[`g${g}_delivered_at`] || ''}
                        onChangeText={t => handleChange(`g${g}_delivered_at`, t)}
                        placeholderTextColor="#9ca3af"
                    />
                </View>
            ))}
        </View>
    );
});


export default function AddPatientModal({ onClose, onSave, mode = 'add', initialData = null }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({});
    const [patientId, setPatientId] = useState('');
    const [loading, setLoading] = useState(false);
    const { addNotification } = useNotification();
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [calendarField, setCalendarField] = useState('');
    const isMounted = React.useRef(true);

    const calculateAge = (dob) => {
        if (!dob) return '';
        
        const birthDate = new Date(dob);
        const today = new Date();
        
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age.toString();
    };

    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setFormData(typeof initialData.medical_history === 'string' ? JSON.parse(initialData.medical_history) : initialData.medical_history || {});
            setPatientId(initialData.patient_id);
            setFormData(prev => ({
                ...prev,
                last_name: initialData.last_name, first_name: initialData.first_name,
                middle_name: initialData.middle_name, age: initialData.age?.toString(),
                contact_no: initialData.contact_no,
                dob: initialData.medical_history?.dob || '',
                purok: initialData.purok || '', // Add this line
                street: initialData.street || ''
            }));
        } else {
            const generateId = async () => {
                setPatientId('Loading...');
                const netInfo = await NetInfo.fetch();
                const db = getDatabase();
                
                if (netInfo.isConnected) {
                    // Online: Get count from Supabase
                    const { count, error } = await supabase
                        .from('patients')
                        .select('*', { count: 'exact', head: true });
                    if (error) {
                        // Fallback to local count if Supabase fails
                        const localPatients = await db.getAllAsync('SELECT * FROM patients WHERE patient_id LIKE "P-%"');
                        const newId = `P-${String((localPatients.length || 0) + 1).padStart(3, '0')}`;
                        setPatientId(newId);
                    } else {
                        const newId = `P-${String((count || 0) + 1).padStart(3, '0')}`;
                        setPatientId(newId);
                    }
                } else {
                    // Offline: Get count from local database - ONLY count P- patients
                    try {
                        const localPatients = await db.getAllAsync('SELECT * FROM patients WHERE patient_id LIKE "P-%"');
                        const newId = `P-${String(localPatients.length + 1).padStart(3, '0')}`;
                        setPatientId(newId);
                    } catch (error) {
                        console.error('Error counting local patients:', error);
                        // Only use TEMP as last resort
                        const uniqueId = `TEMP-${Crypto.randomUUID()}`;
                        setPatientId(uniqueId);
                    }
                }
            };
            generateId();
        }
    }, [mode, initialData]);

    const handleChange = useCallback((name, value) => {
        setFormData(prev => {
            const newFormData = { ...prev, [name]: value };

            // Your existing age calculation logic
            if (name === 'dob' && value) {
            const calculatedAge = calculateAge(value); // Make sure calculateAge is stable
            newFormData.age = calculatedAge;
            }

            return newFormData;
        });
    }, [calculateAge]);

    const handleSave = async () => {
        // Basic validation
        if (!formData.first_name || !formData.last_name) {
            addNotification('First and Last name are required.', 'error');
            return;
        }
        setLoading(true);

        const netInfo = await NetInfo.fetch();
        const db = getDatabase();

        try {
            // Parse the address into purok and street
            let purok = formData.purok || '';
            let street = formData.street || '';

            let finalPatientId = patientId;
            
            // Only try to get user if online
            let user_id = null;
            if (netInfo.isConnected) {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    user_id = user?.id;
                } catch (authError) {
                    console.log('Auth failed, continuing without user_id:', authError);
                }
            }

            // Use the selected risk level from the form instead of calculating
            const riskLevel = formData.risk_level || 'NORMAL';

            // Separate the main table data from the medical history JSON
            const patientRecord = {
                patient_id: finalPatientId,
                first_name: formData.first_name,
                last_name: formData.last_name,
                middle_name: formData.middle_name,
                age: parseInt(formData.age, 10) || null,
                contact_no: formData.contact_no,
                purok: purok,
                street: street,
                risk_level: riskLevel,
                user_id: user_id,
                medical_history: formData
            };

            if (netInfo.isConnected) {
                console.log("Online: " + (mode === 'edit' ? 'Updating' : 'Saving') + " patient...");
                
                if (mode === 'edit') {
                    // EDIT MODE: Update existing patient
                    const { error } = await supabase
                        .from('patients')
                        .update(patientRecord)
                        .eq('patient_id', patientId); // Use the original patient_id
                    
                    if (error) throw error;
                    addNotification('Patient record updated successfully.', 'success');
                } else {
                    // ADD MODE: Create new patient
                    const { error } = await supabase.from('patients').insert([patientRecord]);
                    if (error) throw error;
                    addNotification('Patient record saved successfully.', 'success');
                    try {
                        await logActivity(
                            mode === 'edit' ? 'Patient Updated' : 'New Patient Added', 
                            `Patient: ${formData.first_name} ${formData.last_name}`
                        );
                    } catch (logError) {
                        console.log('Activity logging failed:', logError);
                    }
                }

            } else {
                console.log("Offline: " + (mode === 'edit' ? 'Updating' : 'Saving') + " patient locally...");
                
                if (mode === 'edit') {
                    // EDIT MODE: Update local patient
                    await db.withTransactionAsync(async () => {
                        const statement = await db.prepareAsync(
                            'UPDATE patients SET first_name = ?, last_name = ?, middle_name = ?, age = ?, contact_no = ?, purok = ?, street = ?, risk_level = ?, medical_history = ?, is_synced = ? WHERE patient_id = ?;'
                        );
                        await statement.executeAsync([
                            patientRecord.first_name,
                            patientRecord.last_name,
                            patientRecord.middle_name,
                            patientRecord.age,
                            patientRecord.contact_no,
                            patientRecord.purok,
                            patientRecord.street,
                            patientRecord.risk_level,
                            JSON.stringify(patientRecord.medical_history),
                            0, 
                            patientRecord.patient_id
                        ]);
                        await statement.finalizeAsync();

                        // Add UPDATE action to sync queue
                        const syncStatement = await db.prepareAsync(
                            'INSERT INTO sync_queue (action, table_name, payload) VALUES (?, ?, ?);'
                        );
                        await syncStatement.executeAsync([
                            'update', 
                            'patients', 
                            JSON.stringify({
                                ...patientRecord,
                                id: initialData.id // Include the Supabase ID for updates
                            })
                        ]);
                        await syncStatement.finalizeAsync();
                    });
                    addNotification('Patient updated locally. Will sync when online.', 'success');
                } else {
                    // ADD MODE: Create new local patient
                    await db.withTransactionAsync(async () => {
                        const statement = await db.prepareAsync(
                            'INSERT INTO patients (patient_id, first_name, last_name, age, contact_no, purok, street, risk_level, medical_history, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);'
                        );
                        await statement.executeAsync([
                            patientRecord.patient_id,
                            patientRecord.first_name,
                            patientRecord.last_name,
                            patientRecord.age,
                            patientRecord.contact_no,
                            patientRecord.purok,
                            patientRecord.street,
                            patientRecord.risk_level,
                            JSON.stringify(patientRecord.medical_history),
                            0
                        ]);
                        await statement.finalizeAsync();

                        // Add CREATE action to sync queue
                        const syncStatement = await db.prepareAsync(
                            'INSERT INTO sync_queue (action, table_name, payload) VALUES (?, ?, ?);'
                        );
                        await syncStatement.executeAsync(['create', 'patients', JSON.stringify(patientRecord)]);
                        await syncStatement.finalizeAsync();
                    });
                    addNotification('Patient saved locally. Will sync when online.', 'success');
                }
            }
            onSave();
            onClose();

        } catch (error) {
            console.error("Failed to " + (mode === 'edit' ? 'update' : 'save') + " patient:", error);
            addNotification(`Error: ${error.message}`, 'error');
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
                        handleChange(calendarField, date);
                        setIsCalendarOpen(false);
                    }}
                    mode={calendarField === 'dob' ? 'birthday' : 'any-other-mode'}
                    disableWeekends={false}
                />
            </Modal>
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}><BackArrowIcon /></TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {mode === 'edit' ? 'Update Patient Record' : 'New Patient Record'}
                    </Text>
                    <Text style={styles.stepIndicator}>Step {step} of 4</Text>
                </View>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.profileSection}>
                        <View style={styles.avatarPlaceholder}>
                            {patientId ? (
                                <QRCode
                                    value={patientId}
                                    size={80}
                                    backgroundColor="#f3f4f6"
                                />
                            ) : (
                                <ProfileIcon />
                            )}
                        </View>
                        <Text style={styles.patientId}>Patient ID: {patientId}</Text>
                    </View>
                    {step === 1 && <Step1 formData={formData} handleChange={handleChange} setIsCalendarOpen={setIsCalendarOpen} setCalendarField={setCalendarField} />}
                    {step === 2 && <Step2 formData={formData} handleChange={handleChange} setIsCalendarOpen={setIsCalendarOpen} setCalendarField={setCalendarField} />}
                    {step === 3 && <Step3 formData={formData} handleChange={handleChange} />}
                    {step === 4 && <Step4 formData={formData} handleChange={handleChange} setIsCalendarOpen={setIsCalendarOpen} setCalendarField={setCalendarField} />}
                </ScrollView>
                <View style={styles.footer}>
                    {step > 1 && <TouchableOpacity style={styles.navButton} onPress={() => setStep(step - 1)}><Text style={styles.navButtonText}>Previous</Text></TouchableOpacity>}
                    {step < 4 && <TouchableOpacity style={styles.navButton} onPress={() => setStep(step + 1)}><Text style={styles.navButtonText}>Next</Text></TouchableOpacity>}
                    {step === 4 && (
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Confirm & Save</Text>}
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>
        </>
    );
}

// STYLES (No changes, just providing the full sheet for completeness)
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderColor: '#e5e7eb' },
    headerTitle: { fontSize: 16, fontWeight: 'bold' },
    stepIndicator: { fontSize: 14, color: '#6b7280' },
    backButton: { padding: 5 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    profileSection: { alignItems: 'center', marginBottom: 10 },
    avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    patientId: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginTop: 20, marginBottom: 15, borderBottomWidth: 1, borderColor: '#e5e7eb', paddingBottom: 5 },
    subSectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginTop: 15, marginBottom: 10 },
    input: { backgroundColor: '#f9fafb', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db', fontSize: 16, marginBottom: 10, color: '#111827' },
    readOnlyInput: { backgroundColor: '#e5e7eb', color: '#6b7280' },
    dateInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db', marginBottom: 10 },
    inputText: { fontSize: 16, color: '#111827' },
    placeholderText: { color: '#9ca3af' },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    inputRow: { width: '48%' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gridInput: { width: '32%', textAlign: 'center', backgroundColor: '#f9fafb', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db', fontSize: 14, marginBottom: 10 },
    checkboxGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center', width: '50%', marginBottom: 12 },
    checkboxBase: { width: 22, height: 22, borderWidth: 2, borderColor: '#3b82f6', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
    checkboxChecked: { backgroundColor: '#3b82f6' },
    checkmark: { color: 'white', fontWeight: 'bold' },
    checkboxLabel: { marginLeft: 10, fontSize: 14 },
    textArea: { height: 100, textAlignVertical: 'top', backgroundColor: '#f9fafb', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db', fontSize: 16, marginBottom: 10 },
    footer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', padding: 20, borderTopWidth: 1, borderColor: '#e5e7eb' },
    navButton: { paddingVertical: 12, paddingHorizontal: 40, backgroundColor: '#e5e7eb', borderRadius: 10 },
    navButtonText: { fontWeight: 'bold', color: '#374151' },
    saveButton: { paddingVertical: 12, paddingHorizontal: 40, backgroundColor: '#3b82f6', borderRadius: 10 },
    saveButtonText: { fontWeight: 'bold', color: 'white' },
    pickerContainer: {
        marginBottom: 10,
    },

    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4b5563',
        marginBottom: 8,
    },
    pickerLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4b5563',
        marginBottom: 8,
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        backgroundColor: 'white',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        width: '100%',
        color: '#9ca3af',
    },
    tableContainer: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        overflow: 'hidden', // Keeps inner borders clean
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f9fafb',
        borderBottomWidth: 1,
        borderColor: '#d1d5db',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#e5e7eb',
        alignItems: 'center', // Center items vertically
    },
    tableHeaderText: {
        flex: 1, // All columns equal by default
        paddingVertical: 8,
        paddingHorizontal: 4,
        fontWeight: 'bold',
        fontSize: 11,
        color: '#374151',
        textAlign: 'center',
    },
    tableCellLabel: {
        flex: 0.6, // 'G' column
        padding: 8,
        fontSize: 12,
        fontWeight: '600',
        color: '#1f2937',
        textAlign: 'center',
    },
    tableCellInput: {
        flex: 1, // All other columns equal
        paddingVertical: 6,
        paddingHorizontal: 4,
        fontSize: 12,
        color: '#111827',
        borderLeftWidth: 1,
        borderColor: '#e5e7eb',
    },
    tablePickerWrapper: {
        flex: 1,
        borderLeftWidth: 1,
        borderColor: '#e5e7eb',
        justifyContent: 'center', // Aligns picker vertically
    },
    tablePicker: {
        width: '100%',
        height: 40, // Give it a consistent height
        backgroundColor: 'transparent',
        color: '#111827',
    },
    tablePickerItem: {
        fontSize: 12, // For iOS picker items
        color: '#111827', // Changed from white
    },
    vaccineTable: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 15,
    },
    vaccineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: '#e5e7eb',
    },
    vaccineLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        padding: 12,
        width: 80,
    },
    vaccineDateInput: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderLeftWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#f9fafb',
    },

    // --- HORIZONTAL TABLE ---
    horizontalScroll: {
        marginBottom: 20,
    },
    horizontalTable: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        overflow: 'hidden',
    },
    horizontalTableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f9fafb',
    },
    horizontalHeaderCell: {
        width: 90, // Fixed width for each cell
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderRightWidth: 1,
        borderColor: '#d1d5db',
        fontSize: 11,
        fontWeight: 'bold',
        color: '#374151',
        textAlign: 'center',
    },
    horizontalTableRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderColor: '#d1d5db',
    },
    horizontalTableCell: {
        width: 90, // Must match header width
        padding: 4,
        borderRightWidth: 1,
        borderColor: '#e5e7eb',
        fontSize: 11,
        color: '#111827',
    },

    // --- CONSULTATION FORM ---
    consultForm: {
        padding: 10,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        marginBottom: 15,
    },

    // --- MICRONUTRIENT TABLE ---
    microTable: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 20,
    },
    microHeader: {
        flexDirection: 'row',
        backgroundColor: '#f9fafb',
        borderBottomWidth: 1,
        borderColor: '#d1d5db',
    },
    microHeaderText: {
        flex: 1,
        padding: 10,
        fontSize: 11,
        fontWeight: 'bold',
        color: '#374151',
        textAlign: 'center',
    },
    microRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: '#e5e7eb',
    },
    microCell: {
        flex: 1,
        padding: 10,
        fontSize: 12,
        color: '#111827',
    },
    microDateCell: {
        flex: 1,
        padding: 10,
        borderLeftWidth: 1,
        borderColor: '#e5e7eb',
    },
    microInputCell: {
        flex: 1,
        padding: 10,
        fontSize: 12,
        borderLeftWidth: 1,
        borderColor: '#e5e7eb',
        color: '#111827',
    },
});
