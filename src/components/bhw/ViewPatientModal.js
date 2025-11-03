// src/components/bhw/ViewPatientModal.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';

// --- ICONS & HELPER COMPONENTS ---
const BackArrowIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none"><Path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const CheckboxDisplay = ({ label, isChecked }) => (
    <View style={styles.checkboxContainer}>
        <View style={[styles.checkboxBase, isChecked && styles.checkboxChecked]}>
            {isChecked && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>{label}</Text>
    </View>
);
const Field = ({ label, value }) => (
    <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value || 'N/A'}</Text>
    </View>
);
const SectionHeader = ({ title }) => <Text style={styles.sectionTitle}>{title}</Text>;

export default function ViewPatientModal({ patient, onClose }) {
    const details = patient.medical_history || {};

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose}><BackArrowIcon /></TouchableOpacity>
                <Text style={styles.headerTitle}>Maternal Patient Record</Text>
                <View style={{width: 24}}/>
            </View>
            
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profile Section with QR Code */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarPlaceholder}>
                        {patient.patient_id ? (
                            <QRCode 
                                value={patient.patient_id}
                                size={80}
                                backgroundColor="white"
                            />
                        ) : null}
                    </View>
                    <Text style={styles.profileName}>{`${patient.first_name} ${patient.last_name}`}</Text>
                    <Text style={styles.patientId}>ID: {patient.patient_id}</Text>
                </View>

                {/* Personal Information */}
                <SectionHeader title="Personal Information" />
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Field label="Last Name" value={patient.last_name} />
                        <Field label="First Name" value={patient.first_name} />
                        <Field label="Middle Name" value={patient.middle_name} />
                    </View>
                    <View style={styles.row}>
                        <Field label="Date of Birth" value={details.dob} />
                        <Field label="Blood Type" value={details.blood_type} />
                        <Field label="Age" value={patient.age} />
                    </View>
                </View>

                {/* ID Numbers */}
                <SectionHeader title="ID Numbers" />
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Field label="NHTS No." value={details.nhts_no} />
                        <Field label="PhilHealth No." value={details.philhealth_no} />
                    </View>
                </View>

                {/* Contact Information */}
                <SectionHeader title="Contact Information" />
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Field label="Family Folder No." value={details.family_folder_no} />
                        <Field label="Contact No." value={patient.contact_no} />
                    </View>
                    <View style={styles.smsContainer}>
                        <Text style={styles.smsLabel}>SMS Notifications:</Text>
                        <Text style={styles.smsValue}>{details.sms_notifications_enabled ? 'Enabled' : 'Disabled'}</Text>
                    </View>
                </View>

                {/* Address */}
                <SectionHeader title="Address" />
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Field label="Purok" value={details.purok} />
                        <Field label="Street" value={details.street} />
                    </View>
                </View>

                {/* Obstetrical Score */}
                <SectionHeader title="Obstetrical Score" />
                <View style={styles.card}>
                    <View style={styles.grid}>
                        <Field label="G" value={details.g_score} />
                        <Field label="P" value={details.p_score} />
                        <Field label="Term" value={details.term} />
                        <Field label="Preterm" value={details.preterm} />
                        <Field label="Abortion" value={details.abortion} />
                        <Field label="Living Children" value={details.living_children} />
                    </View>
                </View>

                {/* Pregnancy History */}
                <SectionHeader title="Pregnancy History" />
                <View style={styles.card}>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={styles.tableHeaderCell}>Gravida</Text>
                            <Text style={styles.tableHeaderCell}>Outcome</Text>
                            <Text style={styles.tableHeaderCell}>Sex</Text>
                            <Text style={styles.tableHeaderCell}>NSD/CS</Text>
                            <Text style={styles.tableHeaderCell}>Delivered At</Text>
                        </View>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(g => (
                            <View key={g} style={styles.tableRow}>
                                <Text style={styles.tableCell}>G{g}</Text>
                                <Text style={styles.tableCell}>{details[`g${g}_outcome`] || 'N/A'}</Text>
                                <Text style={styles.tableCell}>{details[`g${g}_sex`] || 'N/A'}</Text>
                                <Text style={styles.tableCell}>{details[`g${g}_delivery_type`] || 'N/A'}</Text>
                                <Text style={styles.tableCell}>{details[`g${g}_delivered_at`] || 'N/A'}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Past Menstrual Period */}
                <SectionHeader title="Past Menstrual Period" />
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Field label="Last Menstrual Period (LMP)" value={details.lmp} />
                        <Field label="Risk Code" value={details.risk_code} />
                    </View>
                    <View style={styles.row}>
                        <Field label="Expected Date of Confinement (EDC)" value={details.edc} />
                        <Field label="Age of First Period" value={details.age_first_period} />
                    </View>
                </View>

                {/* OB History */}
                <SectionHeader title="OB History" />
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Field label="Age of Menarche" value={details.age_of_menarche} />
                        <Field label="Amount of Bleeding" value={details.bleeding_amount} />
                        <Field label="Duration of Menstruation (days)" value={details.menstruation_duration} />
                    </View>
                </View>

                {/* Vaccination Record */}
                <SectionHeader title="Vaccination Record" />
                <View style={styles.card}>
                    <View style={styles.vaccineTable}>
                        {['TT1', 'TT2', 'TT3', 'TT4', 'TT5', 'FIM'].map(vaccine => (
                            <View key={vaccine} style={styles.vaccineRow}>
                                <Text style={styles.vaccineLabel}>{vaccine}</Text>
                                <Text style={styles.vaccineDate}>{details[`vaccine_${vaccine.toLowerCase()}`] || 'Not given'}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Medical History */}
                <SectionHeader title="Medical History" />
                <View style={styles.card}>
                    <Text style={styles.subSectionTitle}>Personal History</Text>
                    <View style={styles.checkboxGrid}>
                        {['Diabetes Mellitus (DM)', 'Asthma', 'Cardiovascular Disease (CVD)', 'Heart Disease', 'Goiter'].map(item => 
                            <CheckboxDisplay key={item} label={item} isChecked={!!details[`ph_${item}`]} />
                        )}
                    </View>
                    
                    <Text style={styles.subSectionTitle}>Hereditary History</Text>
                    <View style={styles.checkboxGrid}>
                        {['Hypertension (HPN)', 'Asthma', 'Heart Disease', 'Diabetes Mellitus', 'Goiter'].map(item => 
                            <CheckboxDisplay key={item} label={item} isChecked={!!details[`hdh_${item}`]} />
                        )}
                    </View>

                    <Text style={styles.subSectionTitle}>Social History</Text>
                    <View style={styles.checkboxGrid}>
                        {['Smoker', 'Ex-smoker', 'Second-hand Smoker', 'Alcohol Drinker', 'Substance Abuse'].map(item => 
                            <CheckboxDisplay key={item} label={item} isChecked={!!details[`sh_${item}`]} />
                        )}
                    </View>
                </View>

                {/* History of Allergy and Drugs */}
                <SectionHeader title="History of Allergy and Drugs" />
                <View style={styles.card}>
                    <Text style={styles.textArea}>{details.allergy_history || 'No allergies or drug reactions recorded'}</Text>
                </View>

                {/* Family Planning History */}
                <SectionHeader title="Family Planning History" />
                <View style={styles.card}>
                    <Text style={styles.textArea}>{details.family_planning_history || 'No family planning history recorded'}</Text>
                </View>

                {/* Parental Individual Treatment Record */}
                <SectionHeader title="Parental Individual Treatment Record" />
                <View style={styles.card}>
                    <ScrollView horizontal>
                        <View>
                            <View style={styles.treatmentHeader}>
                                {['Date', 'Arrival', 'Departure', 'Ht.', 'Wt.', 'BP', 'MUAC', 'BMI', 'AOG', 'FH', 'FHB', 'LOC', 'Pres', 'Fe+FA', 'Admitted', 'Examined'].map(header => (
                                    <Text key={header} style={styles.treatmentHeaderCell}>{header}</Text>
                                ))}
                            </View>
                            {Array.from({ length: 5 }).map((_, rowIndex) => (
                                <View key={rowIndex} style={styles.treatmentRow}>
                                    {Array.from({ length: 16 }).map((_, colIndex) => (
                                        <Text key={colIndex} style={styles.treatmentCell}>
                                            {details[`treatment_${rowIndex}_${colIndex}`] || '-'}
                                        </Text>
                                    ))}
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                {/* Consultation and Referral Form */}
                <SectionHeader title="Consultation and Referral Form" />
                <View style={styles.card}>
                    <Field label="Date" value={details.consultation_date} />
                    <Field label="Complaints" value={details.complaints} />
                    <Field label="Referral Done For" value={details.referral_for} />
                    <Field label="Doctor's Order" value={details.doctors_order} />
                    <Field label="Remarks" value={details.consultation_remarks} />
                </View>

                {/* Pregnancy Outcomes */}
                <SectionHeader title="Pregnancy Outcomes" />
                <View style={styles.card}>
                    <ScrollView horizontal>
                        <View>
                            <View style={styles.treatmentHeader}>
                                {['Date Terminated', 'Type of Delivery', 'Outcome', 'Sex of Child', 'Birth Weight (g)', 'Age in Weeks', 'Place of Birth', 'Attended By'].map(header => (
                                    <Text key={header} style={styles.treatmentHeaderCell}>{header}</Text>
                                ))}
                            </View>
                            <View style={styles.treatmentRow}>
                                {Array.from({ length: 8 }).map((_, index) => (
                                    <Text key={index} style={styles.treatmentCell}>
                                        {details[`outcome_${index}`] || '-'}
                                    </Text>
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                </View>

                {/* Micronutrient Supplementation */}
                <SectionHeader title="Micronutrient Supplementation" />
                <View style={styles.card}>
                    <ScrollView horizontal>
                        <View>
                            <View style={styles.treatmentHeader}>
                                <Text style={styles.treatmentHeaderCell}>Supplementation Type</Text>
                                <Text style={styles.treatmentHeaderCell}>Date Given</Text>
                                <Text style={styles.treatmentHeaderCell}>Amount Given</Text>
                            </View>
                            <View style={styles.treatmentRow}>
                                <Text style={styles.treatmentCell}>Iron Supplementation / Ferrous Sulfate</Text>
                                <Text style={styles.treatmentCell}>{details.iron_date || '-'}</Text>
                                <Text style={styles.treatmentCell}>{details.iron_amount || '-'}</Text>
                            </View>
                            <View style={styles.treatmentRow}>
                                <Text style={styles.treatmentCell}>Vitamin A (200,000 IU)</Text>
                                <Text style={styles.treatmentCell}>{details.vitamin_a_date || '-'}</Text>
                                <Text style={styles.treatmentCell}>{details.vitamin_a_amount || '-'}</Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4f8' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderColor: '#e5e7eb', backgroundColor: 'white' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    scrollContent: { padding: 20 },
    profileSection: {
        alignItems: 'center',
        marginBottom: 15,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        elevation: 3,
        padding: 10,
    },
    profileName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    patientId: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 2,
    },
    card: { backgroundColor: 'white', borderRadius: 15, padding: 20, marginBottom: 15, elevation: 2 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 10 },
    subSectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 10, marginBottom: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    fieldContainer: { flex: 1, marginHorizontal: 5 },
    fieldLabel: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
    fieldValue: { fontSize: 16, fontWeight: '500', color: '#111827' },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    checkboxGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center', width: '50%', marginBottom: 10 },
    checkboxBase: { width: 20, height: 20, borderWidth: 2, borderColor: '#3b82f6', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
    checkboxChecked: { backgroundColor: '#3b82f6' },
    checkmark: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    checkboxLabel: { marginLeft: 8, fontSize: 14 },
    smsContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    smsLabel: { fontSize: 14, color: '#6b7280', marginRight: 8 },
    smsValue: { fontSize: 14, fontWeight: '500', color: '#111827' },
    table: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8 },
    tableHeader: { flexDirection: 'row', backgroundColor: '#f9fafb', borderBottomWidth: 1, borderColor: '#e5e7eb' },
    tableHeaderCell: { flex: 1, padding: 8, fontSize: 12, fontWeight: '600', color: '#374151', textAlign: 'center' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e5e7eb' },
    tableCell: { flex: 1, padding: 8, fontSize: 12, color: '#6b7280', textAlign: 'center' },
    vaccineTable: { marginTop: 10 },
    vaccineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#f3f4f6' },
    vaccineLabel: { fontSize: 14, fontWeight: '500', color: '#374151' },
    vaccineDate: { fontSize: 14, color: '#6b7280' },
    textArea: { fontSize: 14, color: '#374151', lineHeight: 20, padding: 8, backgroundColor: '#f9fafb', borderRadius: 6 },
    treatmentHeader: { flexDirection: 'row', backgroundColor: '#f9fafb' },
    treatmentHeaderCell: { width: 80, padding: 8, fontSize: 10, fontWeight: '600', color: '#374151', textAlign: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
    treatmentRow: { flexDirection: 'row' },
    treatmentCell: { width: 80, padding: 8, fontSize: 10, color: '#6b7280', textAlign: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
});