import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import Svg, { Path } from 'react-native-svg';
import QRCodeSVG from 'react-native-qrcode-svg';

// --- Reusable Helper Components ---

const Section = ({ title, children, style }) => (
    <View style={[styles.section, style]}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionContent}>{children}</View>
    </View>
);

const Field = ({ label, value }) => (
    <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value || 'N/A'}</Text>
    </View>
);

// Helper to extract prefixed history items (e.g., "ph_", "hdh_")
const extractHistory = (prefix, history) => {
    if (!history) return {};
    const items = {};
    for (const key in history) {
        if (key.startsWith(prefix)) {
            const label = key.substring(prefix.length).replace(/_/g, ' '); // Clean up label
            items[label] = history[key];
        }
    }
    return items;
};

const HistoryList = ({ title, items }) => (
    <Section title={title}>
        {Object.entries(items).length > 0 ? (
            Object.entries(items).map(([key, value]) => (
                <View key={key} style={styles.historyItem}>
                    <Text style={styles.historyText}>{key}</Text>
                    <Text style={[styles.historyValue, value ? styles.historyValueYes : styles.historyValueNo]}>
                        {value ? 'Yes' : 'No'}
                    </Text>
                </View>
            ))
        ) : (
            <Text style={styles.fieldValue}>No data recorded.</Text>
        )}
    </Section>
);

// --- Tab Scene Components ---

const ProfileScene = ({ record }) => {
    const medicalHistory = record.medical_history || {};
    const combinedData = {
        ...record,
        ...medicalHistory
    };
    console.log('Obstetrical Score Data:', {
        g_score: combinedData.g_score,
        p_score: combinedData.p_score,
        term: combinedData.term,
        preterm: combinedData.preterm,
        abortion: combinedData.abortion,
        living_children: combinedData.living_children,
        fullRecord: record
    });
    return (
    <ScrollView contentContainerStyle={styles.sceneContent}>
        <View style={styles.profileHeader}>
            <View style={styles.qrContainer}>
                {record?.patient_id ? (
                    <QRCodeSVG value={record.patient_id} size={100} />
                ) : (
                    <ActivityIndicator />
                )}
            </View>
            <Text style={styles.profileId}>{record?.patient_id || 'Loading...'}</Text>
            <Text style={styles.profileName}>{`${record?.first_name || ''} ${record?.last_name || ''}`}</Text>
        </View>

        <Section title="Personal Information">
            {/* These fields come from the top-level record */}
            <Field label="Date of Birth" value={record?.medical_history?.dob} />
            <Field label="Age" value={record?.age} />
            <Field label="Blood Type" value={record?.medical_history?.blood_type} />
        </Section>

        <Section title="Contact & Address">
            {/* These fields come from the top-level record */}
            <Field label="Contact No." value={record?.contact_no} />
            <Field label="Purok" value={record?.purok} />
            <Field label="Street" value={record?.street} />
            <Field label="SMS Notifications" value={record?.sms_notifications_enabled ? 'Enabled' : 'Disabled'} />
        </Section>

        <Section title="ID Numbers">
            {/* These fields are inside medical_history */}
            <Field label="PhilHealth No." value={record?.medical_history?.philhealth_no} />
            <Field label="NHTS No." value={record?.medical_history?.nhts_no} />
        </Section>
        
       <Section title="Obstetrical Score" style={styles.obSection}>
            <View style={styles.obScoreGrid}>
                <View style={[styles.obScoreItem, styles.obScoreItemPrimary]}>
                    <Text style={styles.obScoreLabel}>Gravida</Text>
                    <Text style={styles.obScoreValue}>{combinedData.g_score || '0'}</Text>
                    <Text style={styles.obScoreDescription}>Total Pregnancies</Text>
                </View>
                <View style={[styles.obScoreItem, styles.obScoreItemPrimary]}>
                    <Text style={styles.obScoreLabel}>Para</Text>
                    <Text style={styles.obScoreValue}>{combinedData.p_score || '0'}</Text>
                    <Text style={styles.obScoreDescription}>Total Births</Text>
                </View>
                <View style={styles.obScoreItem}>
                    <View style={styles.obScoreIcon}>
                        <Text style={styles.obScoreIconText}>T</Text>
                    </View>
                    <Text style={styles.obScoreValue}>{combinedData.term || '0'}</Text>
                    <Text style={styles.obScoreSubLabel}>Term</Text>
                </View>
                <View style={styles.obScoreItem}>
                    <View style={styles.obScoreIcon}>
                        <Text style={styles.obScoreIconText}>P</Text>
                    </View>
                    <Text style={styles.obScoreValue}>{combinedData.preterm || '0'}</Text>
                    <Text style={styles.obScoreSubLabel}>Preterm</Text>
                </View>
                <View style={styles.obScoreItem}>
                    <View style={styles.obScoreIcon}>
                        <Text style={styles.obScoreIconText}>A</Text>
                    </View>
                    <Text style={styles.obScoreValue}>{combinedData.abortion || '0'}</Text>
                    <Text style={styles.obScoreSubLabel}>Abortion</Text>
                </View>
                <View style={styles.obScoreItem}>
                    <View style={styles.obScoreIcon}>
                        <Text style={styles.obScoreIconText}>L</Text>
                    </View>
                    <Text style={styles.obScoreValue}>{combinedData.living_children || '0'}</Text>
                    <Text style={styles.obScoreSubLabel}>Living</Text>
                </View>
            </View>
            <View style={styles.obScoreSummary}>
                <Text style={styles.obScoreSummaryText}>
                    G{combinedData.g_score || '0'} P{combinedData.p_score || '0'} (T{combinedData.term || '0'}-P{combinedData.preterm || '0'}-A{combinedData.abortion || '0'}-L{combinedData.living_children || '0'})
                </Text>
            </View>
        </Section>
    </ScrollView>
    );
};

const PregnancyHistoryTable = ({ history }) => {
    const gravidas = useMemo(() => Array.from({ length: 10 }, (_, i) => i + 1), []);
    
    // Filter out rows that are completely empty
    const populatedRows = useMemo(() => gravidas.map(g => ({
        g,
        outcome: history[`g${g}_outcome`],
        sex: history[`g${g}_sex`],
        delivery: history[`g${g}_delivery_type`],
        deliveredAt: history[`g${g}_delivered_at`],
    })).filter(row => row.outcome || row.sex || row.delivery || row.deliveredAt), [history, gravidas]);

    if (populatedRows.length === 0) {
        return <Text style={styles.fieldValue}>No pregnancy history recorded.</Text>;
    }

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
            {populatedRows.map(row => (
                <View style={styles.tableRow} key={row.g}>
                    <Text style={styles.tableCellLabel}>G{row.g}</Text>
                    <Text style={styles.tableCell}>{row.outcome}</Text>
                    <Text style={styles.tableCell}>{row.sex}</Text>
                    <Text style={styles.tableCell}>{row.delivery}</Text>
                    <Text style={styles.tableCell}>{row.deliveredAt}</Text>
                </View>
            ))}
        </View>
    );
};

const PregnancyScene = ({ record }) => (
    <ScrollView contentContainerStyle={styles.sceneContent}>
        <Section title="Menstrual & OB History">
            <Field label="Last Menstrual Period (LMP)" value={record?.medical_history?.lmp} />
            <Field label="Expected Date of Confinement (EDC)" value={record?.medical_history?.edc} />
            <Field label="Age of First Period" value={record?.medical_history?.age_first_period} />
            <Field label="Age of Menarche" value={record?.medical_history?.age_of_menarche} />
            <Field label="Bleeding Amount" value={record?.medical_history?.bleeding_amount} />
            <Field label="Duration of Menstruation" value={record?.medical_history?.menstruation_duration} />
            <Field label="Risk Level" value={record?.medical_history?.risk_level} />
        </Section>
        
        <Section title="Pregnancy History">
            <PregnancyHistoryTable history={record?.medical_history} />
        </Section>
    </ScrollView>
);

const MedicalScene = ({ record }) => {
    // Use the helper to extract history objects
    const personalHistory = useMemo(() => extractHistory('ph_', record?.medical_history), [record]);
    const hereditaryHistory = useMemo(() => extractHistory('hdh_', record?.medical_history), [record]);
    const socialHistory = useMemo(() => extractHistory('sh_', record?.medical_history), [record]);
    
    const vaccinations = useMemo(() => [
        { label: 'TT1', value: record?.medical_history?.vaccine_tt1 },
        { label: 'TT2', value: record?.medical_history?.vaccine_tt2 },
        { label: 'TT3', value: record?.medical_history?.vaccine_tt3 },
        { label: 'TT4', value: record?.medical_history?.vaccine_tt4 },
        { label: 'TT5', value: record?.medical_history?.vaccine_tt5 },
        { label: 'FIM', value: record?.medical_history?.vaccine_fim },
    ], [record]);

    return (
        <ScrollView contentContainerStyle={styles.sceneContent}>
            <HistoryList title="Personal History" items={personalHistory} />
            <HistoryList title="Hereditary Disease History" items={hereditaryHistory} />
            <HistoryList title="Social History" items={socialHistory} />
            
            <Section title="Allergies & Family Planning">
                <Field label="Allergy History" value={record?.medical_history?.allergy_history} />
                <Field label="Family Planning History" value={record?.medical_history?.family_planning_history} />
            </Section>

            <Section title="Vaccination Record">
                {vaccinations.map(vax => (
                    <Field key={vax.label} label={vax.label} value={vax.value} />
                ))}
            </Section>
        </ScrollView>
    );
};

const TreatmentScene = ({ record }) => {
    const history = record?.medical_history || {};
    
    // --- Treatment Records ---
    const treatmentHeaders = ['Date', 'Arrival', 'Departure', 'Ht.', 'Wt.', 'BP', 'MUAC', 'BMI', 'AOG', 'FH', 'FHB', 'LOC', 'Pres', 'Fe+FA', 'Admitted', 'Examined'];
    const treatmentRows = useMemo(() => Array.from({ length: 5 }, (_, i) => i)
        .map(rowIndex => {
            const rowData = {};
            let hasData = false;
            for (const header of treatmentHeaders) {
                const key = `tr_${rowIndex}_${header.toLowerCase()}`;
                if (history[key]) {
                    rowData[header] = history[key];
                    hasData = true;
                }
            }
            return hasData ? rowData : null;
        })
        .filter(Boolean), [history]); // Filter out null (empty) rows

    // --- Pregnancy Outcomes ---
    const outcomeHeaders = ['Date Terminated', 'Type of Delivery', 'Outcome', 'Sex of Child', 'Birth Weight (g)', 'Age in Weeks', 'Place of Birth', 'Attended By'];
    const outcomeData = useMemo(() => {
        let hasData = false;
        const data = {};
        for (const header of outcomeHeaders) {
            const key = `outcome_${header.toLowerCase().replace(/ /g, '_').replace(/\(g\)/g, 'g')}`;
            if (history[key]) {
                data[header] = history[key];
                hasData = true;
            }
        }
        return hasData ? data : null;
    }, [history]);

    return (
        <ScrollView contentContainerStyle={styles.sceneContent}>
            
            <Section title="Parental Individual Treatment Record">
                <ScrollView horizontal>
                    <View style={styles.tableContainer}>
                        <View style={styles.horizontalTableHeader}>
                            {treatmentHeaders.map(h => <Text key={h} style={styles.horizontalHeaderCell}>{h}</Text>)}
                        </View>
                        {treatmentRows.length > 0 ? (
                            treatmentRows.map((row, rowIndex) => (
                                <View key={rowIndex} style={styles.horizontalTableRow}>
                                    {treatmentHeaders.map(header => (
                                        <Text key={header} style={styles.horizontalTableCell}>{row[header] || 'N/A'}</Text>
                                    ))}
                                </View>
                            ))
                        ) : (
                            <Text style={styles.fieldValue}>No treatment records found.</Text>
                        )}
                    </View>
                </ScrollView>
            </Section>

            <Section title="Consultation and Referral Form">
                <Field label="Date" value={history.consult_date} />
                <Field label="Complaints" value={history.consult_complaints} />
                <Field label="Referral Done For" value={history.consult_referral} />
                <Field label="Doctor's Order" value={history.consult_orders} />
                <Field label="Remarks" value={history.consult_remarks} />
            </Section>

            <Section title="Pregnancy Outcomes">
                <ScrollView horizontal>
                    <View style={styles.tableContainer}>
                        <View style={styles.horizontalTableHeader}>
                            {outcomeHeaders.map(h => <Text key={h} style={[styles.horizontalHeaderCell, { width: 120 }]}>{h}</Text>)}
                        </View>
                        {outcomeData ? (
                            <View style={styles.horizontalTableRow}>
                                {outcomeHeaders.map(header => (
                                    <Text key={header} style={[styles.horizontalTableCell, { width: 120 }]}>{outcomeData[header] || 'N/A'}</Text>
                                ))}
                            </View>
                        ) : (
                            <Text style={styles.fieldValue}>No outcome data recorded.</Text>
                        )}
                    </View>
                </ScrollView>
            </Section>

            <Section title="Micronutrient Supplementation">
                <Field label="Iron Supplementation Date" value={history.micro_iron_date} />
                <Field label="Iron Supplementation Amount" value={history.micro_iron_amount} />
                <Field label="Vitamin A (200,000 IU) Date" value={history.micro_vita_date} />
                <Field label="Vitamin A (200,000 IU) Amount" value={history.micro_vita_amount} />
            </Section>
        </ScrollView>
    );
};


// --- Main ViewUserRecords Component ---

export default function ViewUserRecords() {
    const { profile } = useAuth();
    const [record, setRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'profile', title: 'Profile' },
        { key: 'pregnancy', title: 'Pregnancy' },
        { key: 'medical', title: 'Med History' },
        { key: 'treatments', title: 'Records' },
    ]);

    useEffect(() => {
        const fetchRecord = async () => {
            if (!profile?.id) return;
            
            setLoading(true);
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .eq('user_id', profile.id)
                .maybeSingle();

            if (error) {
                console.error("Error fetching patient record:", error);
            } else {
                // Parse medical_history if it's a string
                if (data && typeof data.medical_history === 'string') {
                    try {
                        data.medical_history = JSON.parse(data.medical_history);
                    } catch (e) {
                        console.error("Failed to parse medical_history:", e);
                        data.medical_history = {}; // Set to empty object on parse failure
                    }
                }
                setRecord(data);
            }
            setLoading(false);
        };
        fetchRecord();
    }, [profile]);

    // Use useMemo for renderScene to prevent re-creation on every render
    const renderScene = useMemo(() => ({ route }) => {
        if (loading) {
            return <ActivityIndicator size="large" color="#c026d3" style={{ marginTop: 50 }} />;
        }
        if (!record) {
            return <View style={styles.centered}><Text>No record found.</Text></View>;
        }
        
        // Combine patient data with medical_history like the BHW component does
        const medicalHistory = record.medical_history || {};
        const combinedData = {
            ...record,
            ...medicalHistory  // This spreads medical_history fields to top level
        };
        
        switch (route.key) {
            case 'profile':
                return <ProfileScene record={combinedData} />;
            case 'pregnancy':
                return <PregnancyScene record={combinedData} />;
            case 'medical':
                return <MedicalScene record={combinedData} />;
            case 'treatments':
                return <TreatmentScene record={combinedData} />;
            default:
                return null;
        }
    }, [loading, record]); // Re-create renderScene only if loading or record changes
    
    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                initialLayout={{ width: Dimensions.get('window').width }}
                renderTabBar={props => (
                    <TabBar
                        {...props}
                        scrollEnabled
                        indicatorStyle={{ backgroundColor: '#c026d3' }}
                        style={{ backgroundColor: 'white' }}
                        tabStyle={{ width: 'auto', paddingHorizontal: 16 }} // Added padding
                        labelStyle={{ 
                            fontSize: 12, 
                            fontWeight: 'bold', 
                            textTransform: 'uppercase',
                            margin: 0,
                        }}
                        activeColor="#c026d3"
                        inactiveColor="#6b7280"
                    />
                )}
            />
        </SafeAreaView>
    );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    sceneContent: { padding: 20, paddingBottom: 100 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    profileHeader: { alignItems: 'center', marginBottom: 20, padding: 20, backgroundColor: '#fdf2f8', borderRadius: 15 },
    qrContainer: { padding: 10, backgroundColor: 'white', borderRadius: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    profileId: { marginTop: 10, fontWeight: 'bold', color: '#831843' },
    profileName: { fontSize: 22, fontWeight: 'bold', color: '#be185d' },
    
    section: { backgroundColor: 'white', borderRadius: 15, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#fce7f3' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#9d174d', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#fce7f3' },
    sectionContent: {},
    
    fieldContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8 },
    fieldLabel: { color: '#6b7280', fontSize: 14, flex: 1 },
    fieldValue: { fontWeight: 'bold', color: '#374151', fontSize: 14, flex: 1.5, textAlign: 'right' },

    obSection: {
        backgroundColor: '#faf5ff',
        borderColor: '#e9d5ff',
    },
    obScoreGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    obScoreItem: {
        width: '30%',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#f3e8ff',
        shadowColor: '#c084fc',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    obScoreItemPrimary: {
        backgroundColor: '#f3e8ff',
        borderColor: '#c084fc',
        borderWidth: 2,
        transform: [{ scale: 1.05 }],
    },
    obScoreLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#7e22ce',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    obScoreValue: {
        fontSize: 28,
        fontWeight: '800',
        color: '#7e22ce',
        marginBottom: 4,
    },
    obScoreDescription: {
        fontSize: 10,
        color: '#a855f7',
        textAlign: 'center',
        fontWeight: '600',
    },
    obScoreSubLabel: {
        fontSize: 10,
        color: '#6b7280',
        fontWeight: '600',
        marginTop: 4,
    },
    obScoreIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#e9d5ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 2,
        borderColor: '#c084fc',
    },
    obScoreIconText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#7e22ce',
    },
    obScoreSummary: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#f3e8ff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d8b4fe',
    },
    obScoreSummaryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#7e22ce',
        textAlign: 'center',
        fontFamily: 'monospace',
    },
    historyItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
    historyText: { fontSize: 14, color: '#374151', flex: 1 },
    historyValue: { fontSize: 14, fontWeight: 'bold', flex: 0.5, textAlign: 'right' },
    historyValueYes: { color: '#16a34a' },
    historyValueNo: { color: '#ef4444' },

    // --- Pregnancy History Table ---
    tableContainer: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        overflow: 'hidden',
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
        alignItems: 'center',
    },
    tableHeaderText: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 4,
        fontWeight: 'bold',
        fontSize: 11,
        color: '#374151',
        textAlign: 'center',
    },
    tableCellLabel: {
        flex: 0.6,
        padding: 8,
        fontSize: 12,
        fontWeight: '600',
        color: '#1f2937',
        textAlign: 'center',
    },
    tableCell: {
        flex: 1,
        paddingVertical: 6,
        paddingHorizontal: 4,
        fontSize: 12,
        color: '#111827',
        borderLeftWidth: 1,
        borderColor: '#e5e7eb',
        textAlign: 'center',
    },

    // --- Horizontal Tables (Treatment & Outcome) ---
    horizontalTableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f9fafb',
    },
    horizontalHeaderCell: {
        width: 90, // Fixed width
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
        width: 90, // Must match header
        padding: 8,
        borderRightWidth: 1,
        borderColor: '#e5e7eb',
        fontSize: 11,
        color: '#111827',
        textAlign: 'center',
    },
});
