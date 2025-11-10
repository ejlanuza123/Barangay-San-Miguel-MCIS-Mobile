// src/services/ChatService.js
import { supabase } from '../services/supabase';
// Comprehensive Maternal and Child Health Information Database
const HEALTH_DATABASE = {
  pregnancy: {
    facts: [
      "Pregnancy typically lasts 40 weeks, divided into three trimesters",
      "A balanced diet with folic acid is crucial in early pregnancy to prevent birth defects",
      "Regular prenatal checkups should occur: monthly until 28 weeks, twice monthly until 36 weeks, then weekly",
      "Normal weight gain during pregnancy is 11.5-16 kg for women with normal BMI",
      "Fetal movements are usually felt between 18-22 weeks"
    ],
    advice: [
      "Take 400-800 mcg of folic acid daily before conception and during early pregnancy",
      "Attend all scheduled prenatal appointments for monitoring",
      "Eat iron-rich foods and take iron supplements as prescribed",
      "Avoid alcohol, tobacco, and unprescribed medications",
      "Practice gentle exercises like walking and prenatal yoga",
      "Get adequate rest and sleep on your left side for better blood flow"
    ],
    warning_signs: [
      "Severe headache or blurred vision",
      "Vaginal bleeding or fluid leakage",
      "Severe abdominal pain",
      "Decreased fetal movement",
      "Fever above 38°C",
      "Persistent vomiting"
    ]
  },
  child_nutrition: {
    facts: [
      "Exclusive breastfeeding is recommended for the first 6 months",
      "Breast milk provides perfect nutrition and antibodies for babies",
      "Solid foods can be introduced at 6 months while continuing breastfeeding",
      "Children need vitamin A, iron, and iodine for proper development",
      "Malnutrition in first 1000 days can cause permanent damage"
    ],
    advice: [
      "Breastfeed within first hour after birth",
      "Feed babies 8-12 times daily in first months",
      "Introduce one new food at a time to monitor allergies",
      "Include diverse food groups: grains, proteins, fruits, vegetables",
      "Ensure clean and safe food preparation",
      "Continue breastfeeding up to 2 years or beyond"
    ],
    warning_signs: [
      "Poor weight gain or weight loss",
      "Lethargy or lack of energy",
      "Dry skin or hair changes",
      "Frequent illnesses",
      "Developmental delays"
    ]
  },
  immunization: {
    schedule: [
      "At birth: BCG, Hepatitis B-1",
      "6 weeks: Pentavalent-1, OPV-1, PCV-1, Rota-1",
      "10 weeks: Pentavalent-2, OPV-2, PCV-2, Rota-2",
      "14 weeks: Pentavalent-3, OPV-3, PCV-3, Rota-3",
      "9-12 months: Measles vaccine, Vitamin A",
      "12-15 months: MMR"
    ],
    importance: [
      "Vaccines protect against life-threatening diseases",
      "They help develop herd immunity in the community",
      "Prevent outbreaks of preventable diseases",
      "Save children from disability and death",
      "Cost-effective health intervention"
    ]
  },
  childhood_illnesses: {
    diarrhea: {
      prevention: "Practice good hygiene, safe water, exclusive breastfeeding",
      treatment: "Give ORS, continue feeding, zinc supplements",
      danger_signs: "Blood in stool, sunken eyes, unable to drink"
    },
    pneumonia: {
      prevention: "Vaccination, good nutrition, clean environment",
      treatment: "Antibiotics as prescribed, fever management",
      danger_signs: "Fast breathing, chest indrawing, unable to drink"
    },
    malaria: {
      prevention: "Use insecticide-treated nets, eliminate breeding sites",
      treatment: "Early diagnosis and complete treatment",
      danger_signs: "Convulsions, unable to drink, severe vomiting"
    }
  },
  postnatal: {
    mother_care: [
      "Rest for at least 6-8 weeks after delivery",
      "Eat nutritious foods and drink plenty of fluids",
      "Watch for signs of infection: fever, foul-smelling discharge",
      "Practice good perineal hygiene",
      "Attend postnatal checkups at 6 weeks"
    ],
    newborn_care: [
      "Keep baby warm and dry",
      "Practice exclusive breastfeeding",
      "Keep umbilical cord clean and dry",
      "Give vitamin K injection at birth",
      "Monitor for jaundice and infections"
    ]
  },
  family_planning: {
    methods: [
      "Condoms: Protects against STIs and pregnancy",
      "Oral contraceptives: 99% effective when taken correctly",
      "IUD: Long-term protection for 5-10 years",
      "Implants: 3-5 years protection",
      "Sterilization: Permanent method"
    ],
    benefits: [
      "Allows spacing between pregnancies",
      "Reduces maternal and infant mortality",
      "Improves family economic status",
      "Enables better child care and education"
    ]
  }
};

const ACTIONS = {
  EMERGENCY_CALL: { type: 'CALL', label: '📞 Call Emergency (911)', value: 'tel:911' },
  NAV_INVENTORY: { type: 'NAVIGATE', label: '📦 Go to Inventory', value: 'InventoryScreen' },
  NAV_PATIENTS: { type: 'NAVIGATE', label: '👥 Go to Patient Records', value: 'PatientManagementScreen' },
  NAV_APPOINTMENTS: { type: 'NAVIGATE', label: '📅 Go to Appointments', value: 'AppointmentScreen' },
};

// English Responses
const RESPONSES = {
  greetings: [
    "Hello! I'm your San Miguel MCIS Health Assistant. I can help with maternal care, child health, nutrition, and more. How can I assist you today?",
    "Hi there! I'm here to provide health information for mothers and children. What would you like to know?",
    "Welcome! I'm your health assistant for maternal and child care. Ask me about pregnancy, child nutrition, immunizations, or common health concerns."
  ],
  pregnancy: [
    `Pregnancy Care Tips:\n• Take folic acid daily\n• Attend all prenatal checkups\n• Eat balanced diet with iron-rich foods\n• Avoid harmful substances\n• Get adequate rest\n\nImportant: Watch for warning signs like severe headache, bleeding, or decreased fetal movement.`,
    `Pregnancy Facts:\n• Duration: 40 weeks (3 trimesters)\n• Normal weight gain: 11.5-16 kg\n• Feel fetal movements at 18-22 weeks\n• Regular checkups essential\n\nAlways consult your healthcare provider for personal medical advice.`
  ],
  nutrition: [
    `Child Nutrition Guide:\n• Exclusive breastfeeding for 6 months\n• Introduce solids at 6 months\n• Continue breastfeeding to 2 years+\n• Include diverse food groups\n• Ensure food safety and hygiene`,
    `Nutrition Facts:\n• Breast milk provides perfect nutrition\n• Vitamin A, iron, iodine crucial\n• Malnutrition in first 1000 days can cause permanent damage\n• Feed babies 8-12 times daily initially`
  ],
  immunization: [
    `Immunization Schedule:\n• Birth: BCG, Hepatitis B-1\n• 6 weeks: Pentavalent-1, OPV-1\n• 10 weeks: Pentavalent-2, OPV-2\n• 14 weeks: Pentavalent-3, OPV-3\n• 9-12 months: Measles, Vitamin A\n• 12-15 months: MMR`,
    `Why Immunize?\n• Protects against deadly diseases\n• Develops community immunity\n• Prevents outbreaks\n• Saves children from disability\n• Cost-effective health protection`
  ],
  child_care: [
    `Newborn Care Essentials:\n• Keep baby warm and dry\n• Exclusive breastfeeding\n• Clean umbilical cord care\n• Monitor for jaundice\n• Watch for infection signs\n• Regular health checkups`,
    `Child Development:\n• Track milestones monthly\n• Provide stimulating environment\n• Ensure adequate nutrition\n• Protect from infections\n• Lots of love and attention`
  ],
  emergency: [
    `🚨 EMERGENCY WARNING SIGNS - Seek immediate medical help:\n\nFor Pregnant Women:\n• Severe headache/blurred vision\n• Vaginal bleeding\n• Severe abdominal pain\n• Decreased fetal movement\n• High fever\n\nFor Children:\n• Fast/difficult breathing\n• Convulsions\n• Unable to drink\n• Severe diarrhea/vomiting\n• Unconsciousness\n\nContact your health center or emergency services immediately!`,
    `URGENT CARE NEEDED for:\n• High fever that doesn't respond to treatment\n• Dehydration signs (sunken eyes, dry mouth)\n• Breathing difficulties\n• Severe pain\n• Unconsciousness or confusion\n\nDon't delay - seek professional medical help now!`
  ],
  family_planning: [
    `Family Planning Methods:\n• Condoms: Protection + STI prevention\n• Pills: 99% effective when taken correctly\n• IUD: Long-term (5-10 years)\n• Implants: 3-5 years protection\n• Sterilization: Permanent\n\nBenefits: Healthier mothers, healthier children, better family planning.`,
    `Family Planning Benefits:\n• Space pregnancies for mother's health\n• Reduce maternal/infant mortality\n• Improve family economics\n• Better child care and education\n• Empower women's health choices`
  ],
  inventory: [
    "To manage medical inventory, go to the Inventory tab. You can add medicines and supplies by tapping the '+' button, view stock levels, and set low-stock alerts for essential items.",
    "Inventory management helps track:\n• Medicines and vaccines\n• Medical equipment\n• Supplies and disposables\n• Set automatic reorder points\n\nAccess through Inventory section."
  ],
  appointments: [
    "Schedule health appointments in the Appointment tab. Create appointments for:\n• Prenatal checkups\n• Child immunization\n• Postnatal visits\n• General consultations\n\nTrack upcoming appointments and send reminders.",
    "Appointment features:\n• Schedule new appointments\n• View patient history\n• Set reminders\n• Track completed visits\n• Generate appointment reports"
  ],
  patients: [
    "Patient records in the Patient tab include:\n• Maternal health history\n• Child growth tracking\n• Immunization records\n• Medical history\n• Contact information\n\nAdd new patients and update health information.",
    "Patient management:\n• Complete health profiles\n• Growth monitoring charts\n• Immunization tracking\n• Medical history\n• Emergency contacts\n• Treatment records"
  ],
  reports: [
    "Generate health reports for:\n• Immunization coverage\n• Maternal health indicators\n• Child nutrition status\n• Disease surveillance\n• Inventory usage\n\nExport data for health monitoring and planning.",
    "Reporting features:\n• Monthly health statistics\n• Immunization reports\n• Maternal care indicators\n• Child growth monitoring\n• Inventory consumption\n• Custom date ranges"
  ],
  default: [
    "I'm not sure I understand. Could you please rephrase your question about maternal health, child care, or app features?",
    "I'm here to help with maternal and child health information. Try asking about pregnancy care, child nutrition, immunizations, or using the app features.",
    "I don't have an answer for that specific question yet. Please ask about:\n• Pregnancy and maternal care\n• Child health and nutrition\n• Immunizations\n• Family planning\n• App features\nOr contact our health center for specific medical advice."
  ],
  add_patient: [
    "To add a new patient record, go to the 'Patients' tab and tap the '+' button. You'll need their basic information and medical history.",
    "You can register a new patient by navigating to the Patient Records section. Would you like me to take you there?"
  ],
  inventory_check: [
    "You can check current medicine stock levels in the 'Inventory' tab. It shows available quantities and expiration dates.",
    "Need to check supplies? Go to the Inventory section to see real-time stock levels for all medicines and kits."
  ],
  generate_report: [
    "Monthly reports can be generated from the 'Reports' tab. You can select the reporting period and type of data you need.",
    "To create a report, visit the Reports section. You can export data on immunizations, prenatal visits, and nutrition status."
  ],

  // NEW RESPONSES FOR BNS
  growth_tracking: [
    "Use the 'Child Records' tab to track growth. You can enter new height and weight measurements to automatically update their nutritional status.",
    "To monitor a child's growth, go to their record and add new measurements. The app will calculate their BMI and weight-for-age status."
  ],
  nutrition_program: [
    "For feeding program guidelines and malnutrition monitoring, check the 'Nutrition' section in Child Records. It highlights children who need immediate attention.",
    "You can identify children eligible for feeding programs by filtering the Child Records list by nutritional status (e.g., severely wasted)."
  ],
  bhw_add_patient: [
    `📋 **Guide: Adding a Patient Record**\n\n1. Navigate to the **Patients** tab.\n2. Tap the **(+) Add Button** at the bottom right.\n3. Select patient type (Pregnant, Child, or General).\n4. Fill in required fields:\n   • Full Name & Age/DOB\n   • Address (Purok)\n   • PhilHealth No. (if available)\n   • Vital signs & baseline health info\n5. Tap **Save Record**.\n\nEnsure consent is obtained before recording personal data.`
  ],
  bhw_inventory: [
    `📦 **Medicine Inventory Management**\n\nUse the Inventory module to track:\n• **Stock Levels:** Monitor remaining quantities of Paracetamol, Vitamins, Oresol, etc.\n• **Expiration Dates:** Receive alerts 3 months before medicines expire.\n• **Dispensing Logs:** Record every item given to patients for accurate audit trails.\n\nRemember to conduct physical counts monthly to reconcile with app records.`
  ],
  bhw_reports: [
    `📊 **Generating Monthly Reports**\n\nThe app automatically aggregates data for your reports:\n\n1. Go to **Reports** tab.\n2. Select report type (e.g., "Prenatal Care Summary", "Immunization Coverage").\n3. Choose the reporting month.\n4. Tap **Generate PDF** or **Export Data**.\n\nReview data for accuracy before submitting to the midwife/nurse.`
  ],
  bhw_protocols: [
    `🚨 **BHW Emergency Protocols**\n\n1. **Assess** the situation quickly (check danger signs).\n2. **stabilize** if trained (e.g., first aid), otherwise do not delay.\n3. **Refer** immediately to nearest health center or hospital. Use the app's **Emergency Call** feature.\n4. **Transport**: Assist in arranging rapid transport.\n5. **Document**: Record the referral in the app after the immediate danger passes.`
  ],

  // ================= BNS RESPONSES =================
  bns_growth_tracking: [
    `📏 **Tracking Child Growth (OPT Plus)**\n\n1. Navigate to **Child Records**.\n2. Select the child's profile.\n3. Tap **New Measurement**.\n4. Enter accurate **Weight (kg)** and **Length/Height (cm)**.\n5. The app automatically calculates status:\n   • Weight-for-Age (Underweight)\n   • Height-for-Age (Stunting)\n   • Weight-for-Length/Height (Wasting)\n\nEnsure weighing scale is calibrated before use.`
  ],
  bns_assessment: [
    `⚖️ **Nutrition Assessment Guide**\n\nKey indicators to check:\n\n• **MUAC (Mid-Upper Arm Circumference):**\n   - Red (< 11.5cm): Severe Acute Malnutrition (SAM)\n   - Yellow (11.5-12.5cm): Moderate Acute Malnutrition (MAM)\n   - Green (> 12.5cm): Normal\n\n• **Physical check:** Look for bipedal edema (manas) or visible severe wasting.`
  ],
  bns_feeding_program: [
    `🥣 **Feeding Program Guidelines**\n\nPriority beneficiaries:\n1. Severely Wasted & Wasted children (6-59 months)\n2. Stunted children\n\nProtocol:\n• Daily supplementary feeding for 120 days\n• Deworming prior to start\n• Monthly weighing to monitor progress\n• Nutrition education for parents/guardians`
  ],
  bns_malnutrition_signs: [
    `⚠️ **Signs of Acute Malnutrition**\n\nLook for these clinical signs:\n\n• **Severe Wasting:** "Skin and bones" appearance, loose skin on buttocks (baggy pants sign).\n• **Edema:** Swelling starting in both feet (press with thumb for 3 seconds, if pit remains, it is positive).\n• **Poor appetite:** Child cannot finish typical RUTF ration.\n\n**Action:** Refer IMMEDIATELY to Health Center if ANY of these are present.`
  ],
  pregnancy: [
    `🤰 **Pregnancy Care Essentials**\n\n• **Schedule:** Monthly checkup until 7th month, twice a month until 9th, then weekly.\n• **Nutrition:** Eat iron-rich foods (green leafy veggies, liver/meat). Take prescribed folic acid/iron supplements.\n• **Hygiene:** Maintain good personal hygiene to prevent infections.\n• **Warning Signs:** Spotting/bleeding, severe headache, water breaks early.\n\nTap 'Schedule Appointment' to book your next prenatal visit.`
  ],
  emergency_warning: [
     `🚨 **UNIVERSAL EMERGENCY SIGNS**\n\nSeek help IMMEDIATELY if:\n• Difficulty breathing or fast breathing\n• Convulsions (seizures)\n• Unconsciousness or hard to wake\n• Inability to drink or breastfeed\n• Severe vomiting (everything comes up)\n\nDo not wait. Go to the nearest facility now.`
  ],
  update_child_records: [
    `📝 **How to Update Child Health Records**\n\n1. Go to **Child Records** tab\n2. Select the child's profile you want to update\n3. Tap the **Edit** button (pencil icon)\n4. Update the information:\n   • Growth measurements (weight, height)\n   • Immunization status\n   • Nutritional assessment\n   • Health concerns\n5. Tap **Save Changes** to update the record\n\nAll updates are automatically logged with timestamp and user info.`,
    `🔄 **Updating Child Records Guide**\n\nTo modify existing child health information:\n\n**For BNS:**\n• Navigate to Child Records\n• Find child using search or filter\n• Tap profile → Edit → Update data\n• Save changes\n\n**Changes you can update:**\n• Weight and height measurements\n• MUAC readings\n• Feeding program status\n• Immunization updates\n• Growth monitoring data`
    ],

    update_records: [
    "To update any health record, go to the respective tab (Patients for BHW, Child Records for BNS), select the record, and tap the edit button. You can modify personal information, health data, and tracking information.",
    "Record updates are done by:\n1. Navigating to the records section\n2. Selecting the specific record\n3. Tapping Edit/Update\n4. Making changes\n5. Saving the updates\n\nAll changes are tracked in the system audit log."
    ]
};

// Tagalog Responses
const RESPONSES_TAGALOG = {
  greetings: [
    "Kumusta! Ako ang San Miguel MCIS Health Assistant. Maaari akong tumulong sa maternal care, kalusugan ng bata, nutrisyon, at marami pa. Paano kita matutulungan ngayon?",
    "Magandang araw! Narito ako para magbigay ng impormasyon sa kalusugan para sa mga ina at bata. Ano ang gusto mong malaman?",
    "Maligayang pagdating! Ako ang iyong health assistant para sa maternal at child care. Magtanong ka tungkol sa pagbubuntis, nutrisyon ng bata, immunization, o mga karaniwang health concerns."
  ],
  pregnancy: [
    `Mga Tip sa Pag-aalaga ng Buntis:\n• Uminom ng folic acid araw-araw\n• Dumalo sa lahat ng prenatal checkups\n• Kumain ng balanced diet na may iron-rich foods\n• Iwasan ang mga nakakasamang substance\n• Magpahinga nang sapat\n\nMahalaga: Bantayan ang mga warning signs tulad ng matinding sakit ng ulo, pagdurugo, o pagbawas ng fetal movement.`,
    `Mga Katotohanan sa Pagbubuntis:\n• Tagal: 40 linggo (3 trimester)\n• Normal na pagdagdag ng timbang: 11.5-16 kg\n• Ramdam ang fetal movements sa 18-22 linggo\n• Mahalaga ang regular na checkups\n\nLaging kumonsulta sa iyong healthcare provider para sa personal na medical advice.`
  ],
  nutrition: [
    `Gabay sa Nutrisyon ng Bata:\n• Eksklusibong breastfeeding sa unang 6 na buwan\n• Magpakilala ng solid foods sa 6 na buwan\n• Ipagpatuloy ang breastfeeding hanggang 2 taon pataas\n• Isama ang iba't ibang food groups\n• Siguraduhing malinis at ligtas ang pagkain`,
    `Mga Katotohanan sa Nutrisyon:\n• Ang breast milk ay nagbibigay ng perpektong nutrisyon\n• Mahalaga ang Vitamin A, iron, iodine\n• Ang malnutrisyon sa unang 1000 araw ay maaaring magdulot ng permanenteng pinsala\n• Pakainin ang mga sanggol ng 8-12 beses sa isang araw sa simula`
  ],
  immunization: [
    `Iskedyul ng Bakuna:\n• Kapanganakan: BCG, Hepatitis B-1\n• 6 linggo: Pentavalent-1, OPV-1\n• 10 linggo: Pentavalent-2, OPV-2\n• 14 linggo: Pentavalent-3, OPV-3\n• 9-12 buwan: Measles, Vitamin A\n• 12-15 buwan: MMR`,
    `Bakit Magpabakuna?\n• Proteksyon laban sa mga nakamamatay na sakit\n• Nagbibigay ng community immunity\n• Pumipigil sa outbreak\n• Nagliligtas ng mga bata sa kapansanan\n• Cost-effective na health protection`
  ],
  emergency: [
    `🚨 MGA BABALA SA EMERGENCY - Humingi ng agarang medical help:\n\nPara sa Buntis:\n• Matinding sakit ng ulo/malabong paningin\n• Pagdurugo mula sa ari\n• Matinding sakit ng tiyan\n• Pagbawas ng fetal movement\n• Mataas na lagnat\n\nPara sa mga Bata:\n• Mabilis/mahirap na paghinga\n• Pangingisay\n• Hindi makainom\n• Matinding diarrhea/pagsusuka\n• Nawawalan ng malay\n\nTawagan agad ang health center o emergency services!`
  ],
  default: [
    "Hindi ko lubos na naiintindihan. Maaari bang ulitin mo ang iyong tanong tungkol sa maternal health, child care, o app features?",
    "Narito ako para tumulong sa impormasyon tungkol sa kalusugan ng ina at bata. Subukan mong magtanong tungkol sa pregnancy care, child nutrition, immunizations, o paggamit ng app features.",
    "Wala pa akong sagot sa partikular na tanong na iyon. Mangyaring magtanong tungkol sa:\n• Pregnancy at maternal care\n• Child health at nutrition\n• Immunizations\n• Family planning\n• App features\nO makipag-ugnayan sa aming health center para sa partikular na medical advice."
  ],
  update_child_records: [
    `📝 **Paano i-update ang mga Rekord ng Kalusugan ng Bata**\n\n1. Pumunta sa **Child Records** tab\n2. Piliin ang profile ng batang gusto mong i-update\n3. I-tap ang **Edit** button (pencil icon)\n4. I-update ang impormasyon:\n   • Mga sukat ng paglaki (timbang, taas)\n   • Katayuan sa bakuna\n   • Assessment sa nutrisyon\n   • Mga alalahanin sa kalusugan\n5. I-tap ang **Save Changes** para ma-update ang rekord\n\nLahat ng updates ay awtomatikong na-log kasama ang timestamp at impormasyon ng user.`
    ],

    update_records: [
    "Para i-update ang anumang health record, pumunta sa kaukulang tab (Patients para sa BHW, Child Records para sa BNS), piliin ang record, at i-tap ang edit button. Maaari mong baguhin ang personal na impormasyon, health data, at tracking information."
    ]

};

// Bisaya Responses
const RESPONSES_BISAYA = {
  greetings: [
    "Kumusta! Ako ang San Miguel MCIS Health Assistant. Makatabang ko sa maternal care, panglawas sa bata, nutrisyon, ug uban pa. Unsaon nako pagtabang nimo karon?",
    "Maayong adlaw! Ania ko para mohatag og impormasyon sa panglawas alang sa mga inahan ug mga bata. Unsay imong gusto mahibaw-an?",
    "Malipayong pag-abot! Ako ang imong health assistant alang sa maternal ug child care. Mangutana bahin sa pagmabdos, nutrisyon sa bata, immunization, o komon nga mga health concerns."
  ],
  pregnancy: [
    `Mga Tip sa Pag-atiman sa Mabdos:\n• Inom og folic acid matag adlaw\n• Apil sa tanan nga prenatal checkups\n• Kaon og balanced diet nga adunay iron-rich foods\n• Likayi ang mga makadaot nga substance\n• Pahuwaya og igo\n\nImportante: Bantayi ang mga warning signs sama sa grabe nga sakit sa ulo, pagdugo, o pagkaminos sa fetal movement.`,
    `Mga Kamatuoran sa Pagmabdos:\n• Gidugayon: 40 ka semana (3 trimester)\n• Normal nga pagdaghan sa timbang: 11.5-16 kg\n• Mabati ang fetal movements sa 18-22 ka semana\n• Importante ang regular nga checkups\n\nKanunay nga magkonsulta sa imong healthcare provider alang sa personal nga medical advice.`
  ],
  default: [
    "Wala ko masabti og tarong. Mahimo ba nimo usbon ang imong pangutana bahin sa maternal health, child care, o app features?",
    "Ania ko aron motabang sa impormasyon bahin sa panglawas sa inahan ug bata. Sulayi ang pagpangutana bahin sa pregnancy care, child nutrition, immunizations, o paggamit sa app features.",
    "Wala pa koy tubag niadtong partikular nga pangutana. Palihug mangutana bahin sa:\n• Pregnancy ug maternal care\n• Child health ug nutrition\n• Immunizations\n• Family planning\n• App features\nO makig-uban sa among health center alang sa partikular nga medical advice."
  ],
  update_child_records: [
  `📝 **Unsaon Pag-update sa mga Rekord sa Panglawas sa Bata**\n\n1. Adto sa **Child Records** tab\n2. Pilia ang profile sa bata nga gusto nimo i-update\n3. I-tap ang **Edit** button (pencil icon)\n4. I-update ang impormasyon:\n   • Mga pagsukod sa pagtubo (gibug-aton, gitas-on)\n   • Kahimtang sa bakuna\n   • Assessment sa nutrisyon\n   • Mga kabalaka sa panglawas\n5. I-tap ang **Save Changes** aron ma-update ang rekord\n\nTanang updates awtomatikong na-log uban sa timestamp ug impormasyon sa user.`
    ],

    update_records: [
    "Aron i-update ang bisan unsang health record, adto sa tagsatagsa nga tab (Patients alang sa BHW, Child Records alang sa BNS), pilia ang record, ug i-tap ang edit button. Mahimo nimo usbon ang personal nga impormasyon, health data, ug tracking information."
    ]
};

// Enhanced response system with actions
const RESPONSES_WITH_ACTIONS = {
  patients: [
    {
      text: "You can add and manage patient records in the Patient tab. Would you like to go there now?",
      actions: [
        { type: 'navigate', label: '👥 Go to Patients', screen: 'PatientManagement' }
      ]
    }
  ],
  inventory: [
    {
      text: "To manage medical inventory, go to the Inventory tab. You can add medicines and check stock levels.",
      actions: [
        { type: 'navigate', label: '📦 Go to Inventory', screen: 'BhwInventory' }
      ]
    }
  ],
  appointments: [
    {
      text: "Schedule health appointments in the Appointment tab. Create appointments for prenatal checkups, immunizations, and more.",
      actions: [
        { type: 'navigate', label: '📅 Go to Appointments', screen: 'BhwAppointment' }
      ]
    }
  ],
  emergency: [
    {
      text: "🚨 EMERGENCY WARNING SIGNS - Seek immediate medical help!",
      actions: [
        { type: 'call', label: '📞 Call Emergency (911)', number: '911' },
        { type: 'call', label: '🏥 Call Local Health Center', number: '+631234567890' }
      ],
      isEmergency: true
    }
  ],
  bns_growth_tracking: [
    {
      text: "You can track child growth and nutritional status in the Child Records section. Would you like to go there now?",
      actions: [
        { 
          type: 'navigate', 
          label: '👶 Go to Child Records', 
          screen: 'ChildHealthRecords',
          // Add navigation parameters for nested navigation
          navigationParams: { 
            screen: 'ChildHealthRecords'
          }
        }
      ]
    }
  ],
  
  // BHW specific actions
  bhw_add_patient: [
    {
      text: "You can add new patient records in the Patient Management section. Would you like to go there now?",
      actions: [
        { 
          type: 'navigate', 
          label: '👥 Go to Patient List', 
          screen: 'PatientManagement',
          navigationParams: { 
            screen: 'PatientManagement'
          }
        }
      ]
    }
  ],
  
  // Update other actions similarly...
  patients: [
    {
      text: "You can add and manage patient records in the Patient tab. Would you like to go there now?",
      actions: [
        { 
          type: 'navigate', 
          label: '👥 Go to Patients', 
          screen: 'PatientManagement',
          navigationParams: { 
            screen: 'PatientManagement'
          }
        }
      ]
    }
  ],
  
  inventory: [
    {
      text: "To manage medical inventory, go to the Inventory tab. You can add medicines and check stock levels.",
      actions: [
        { 
          type: 'navigate', 
          label: '📦 Go to Inventory', 
          screen: 'BhwInventory',
          navigationParams: { 
            screen: 'BhwInventory'
          }
        }
      ]
    }
  ],
  
  appointments: [
    {
      text: "Schedule health appointments in the Appointment tab. Create appointments for prenatal checkups, immunizations, and more.",
      actions: [
        { 
          type: 'navigate', 
          label: '📅 Go to Appointments', 
          screen: 'BhwAppointment',
          navigationParams: { 
            screen: 'BhwAppointment'
          }
        }
      ]
    }
  ],
  update_child_records: [
  {
    text: "You can update child health records in the Child Records section. Would you like to go there now?",
    actions: [
      { 
        type: 'navigate', 
        label: '👶 Go to Child Records', 
        screen: 'ChildHealthRecords',
        navigationParams: { 
          screen: 'ChildHealthRecords'
        }
      }
    ]
  }
],

update_records: [
  {
    text: "You can update health records in the respective records section. Would you like to go there now?",
    actions: (userRole) => [ // Make it a function that accepts userRole
      { 
        type: 'navigate', 
        label: userRole === 'BNS' ? '👶 Update Child Records' : '👥 Update Patient Records', 
        screen: userRole === 'BNS' ? 'ChildHealthRecords' : 'PatientManagement',
        navigationParams: { 
          screen: userRole === 'BNS' ? 'ChildHealthRecords' : 'PatientManagement'
        }
      }
    ]
  }
]
};
  

// Define SUGGESTED_QUESTIONS here (before export)
export const SUGGESTED_QUESTIONS = [
  "Pregnancy care tips",
  "Child nutrition guide", 
  "Immunization schedule",
  "Newborn care essentials",
  "Emergency warning signs",
  "Family planning methods",
  "How to add patient records?",
  "Schedule immunization appointment",
  "Check medicine inventory",
  "Generate health reports"
];

// Dynamic Configuration System
export const CHAT_CONFIG = {
  // Role-based configurations - Colors matched precisely to SettingsScreen
  roles: {
    'BHW': {
      primary: "#93c5fd", // Very Light Blue
      secondary: '#60a5fa', // (Kept for compatibility if used elsewhere)
      accent: '#60a5fa',
      headerGradient: ["#93c5fd", "#60a5fa"],
      light: "#dbeafe",
      dark: "#264a77ff",
      features: ['inventory', 'patients', 'appointments', 'reports'],
      permissions: ['manage_patients', 'manage_inventory', 'schedule_appointments'],
      defaultQuestions: [
        "How to add patient record?",
        "Check medicine inventory",
        "Generate monthly report",
        "Immunization schedule",
        "Emergency protocols"
      ]
    },
    'BNS': {
      primary: "#6ee7b7", // Very Light Emerald Green
      secondary: '#34d399',
      accent: '#34d399',
      headerGradient: ["#6ee7b7", "#34d399"],
      light: "#a7f3d0",
      dark: "#226b50ff",
      features: ['child_records', 'nutrition_tracking', 'appointments', 'reports'],
      permissions: ['manage_children', 'track_nutrition', 'schedule_appointments'],
      defaultQuestions: [
        "Track child growth",
        "Nutrition assessment guide",
        "Update child records",
        "Feeding program guidelines",
        "Malnutrition signs"
      ]
    },
    'USER/MOTHER/GUARDIAN': {
      primary: "#f9a8d4", // Very Light Rose Pink
      secondary: '#f472b6',
      accent: '#f472b6',
      headerGradient: ["#f9a8d4", "#f472b6"],
      light: "#fce7f3",
      dark: "#6c2e4eff",
      features: ['appointments', 'records', 'health_info'],
      permissions: ['view_records', 'schedule_appointments'],
      defaultQuestions: [
        "Pregnancy care tips",
        "Child nutrition guide",
        "Immunization schedule",
        "Emergency warning signs",
        "Family planning methods"
      ]
    }
  },

  // Context-aware responses
  contexts: {
    morning: {
      greeting: "Good morning! ☀️",
      suggestions: ["Schedule today's checkup", "Check immunization due", "Update health records"]
    },
    afternoon: {
      greeting: "Good afternoon! 🌤️",
      suggestions: ["Follow-up on appointments", "Review nutrition tips", "Check medication stock"]
    },
    evening: {
      greeting: "Good evening! 🌙", 
      suggestions: ["Plan tomorrow's schedule", "Emergency contacts", "Rest reminders"]
    },
    weekend: {
      greeting: "Happy weekend! 🎉",
      suggestions: ["Weekend health tips", "Family activities", "Relaxation advice"]
    }
  },

  // Seasonal/Event-based content
  seasonal: {
    rainy_season: {
      warnings: ["Watch for dengue symptoms", "Keep children dry and warm", "Check for respiratory issues"],
      tips: ["Use mosquito nets", "Keep medicines dry", "Monitor for colds"]
    },
    summer: {
      warnings: ["Stay hydrated", "Protect from heat stroke", "Watch for dehydration"],
      tips: ["Drink plenty of water", "Use sunscreen", "Wear light clothing"]
    },
    holiday_season: {
      warnings: ["Moderate food intake", "Watch for allergies", "Maintain routines"],
      tips: ["Healthy holiday recipes", "Stress management", "Family safety tips"]
    }
  }
};

// Topic detection function
export const detectTopic = (message) => {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('pregnant') || lowerMessage.includes('pregnancy') || lowerMessage.includes('buntis') || lowerMessage.includes('mabdos')) return 'pregnancy';
  if (lowerMessage.includes('nutrition') || lowerMessage.includes('food') || lowerMessage.includes('breastfeed') || lowerMessage.includes('nutrisyon') || lowerMessage.includes('pagkaon')) return 'nutrition';
  if (lowerMessage.includes('immuniz') || lowerMessage.includes('vaccin') || lowerMessage.includes('bakuna') || lowerMessage.includes('turok')) return 'immunization';
  if (lowerMessage.includes('baby') || lowerMessage.includes('newborn') || lowerMessage.includes('child') || lowerMessage.includes('sanggol') || lowerMessage.includes('bata')) return 'child_care';
  if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || lowerMessage.includes('emergensya') || lowerMessage.includes('delikado')) return 'emergency';
  if (lowerMessage.includes('family planning') || lowerMessage.includes('contraceptive') || lowerMessage.includes('family planning')) return 'family_planning';
  if (lowerMessage.includes('inventory') || lowerMessage.includes('stock') || lowerMessage.includes('medicine') || lowerMessage.includes('supply')) return 'inventory';
  if (lowerMessage.includes('appointment') || lowerMessage.includes('schedule') || lowerMessage.includes('booking')) return 'appointments';
  if (lowerMessage.includes('patient') || lowerMessage.includes('record') || lowerMessage.includes('pasiente')) return 'patients';
 // --- BHW SPECIFIC TOPICS ---
  if (lowerMessage.includes('add patient') || lowerMessage.includes('new record') || lowerMessage.includes('register profile')) return 'bhw_add_patient';
  if (lowerMessage.includes('medicine inventory') || lowerMessage.includes('check stock') || lowerMessage.includes('supplies')) return 'bhw_inventory';
  if (lowerMessage.includes('monthly report') || lowerMessage.includes('generate report') || lowerMessage.includes('accomplishment report')) return 'bhw_reports';
  if (lowerMessage.includes('emergency protocol') || lowerMessage.includes('bhw emergency') || lowerMessage.includes('referral procedure')) return 'bhw_protocols';
  if (lowerMessage.includes('update child') || lowerMessage.includes('edit child') || lowerMessage.includes('modify child') || lowerMessage.includes('change child record')) return 'update_child_records';
  if (lowerMessage.includes('update record') || lowerMessage.includes('edit record') || lowerMessage.includes('modify record') || lowerMessage.includes('change record')) return 'update_records';
  if (lowerMessage.includes('update patient') || lowerMessage.includes('edit patient') || lowerMessage.includes('modify patient')) return 'update_records';

  // --- BNS SPECIFIC TOPICS ---
  if (lowerMessage.includes('track child growth') || lowerMessage.includes('measure') || lowerMessage.includes('opt plus')) return 'bns_growth_tracking';
  if (lowerMessage.includes('nutrition assessment') || lowerMessage.includes('nutritional status') || lowerMessage.includes('muac')) return 'bns_assessment';
  if (lowerMessage.includes('feeding program') || lowerMessage.includes('supplementary feeding') || lowerMessage.includes('dietary supplementation')) return 'bns_feeding_program';
  if (lowerMessage.includes('malnutrition signs') || lowerMessage.includes('signs of sam') || lowerMessage.includes('severe acute malnutrition')) return 'bns_malnutrition_signs';

  // --- GENERAL/USER TOPICS (Existing + refined) ---
  if (lowerMessage.includes('pregnant') || lowerMessage.includes('pregnancy') || lowerMessage.includes('buntis') || lowerMessage.includes('prenatal')) return 'pregnancy';
  if (lowerMessage.includes('child nutrition') || lowerMessage.includes('breastfeed') || lowerMessage.includes('complementary feeding')) return 'child_nutrition';
  if (lowerMessage.includes('immuniz') || lowerMessage.includes('vaccin') || lowerMessage.includes('bakuna') || lowerMessage.includes('schedule')) return 'immunization';
  if (lowerMessage.includes('emergency warning') || lowerMessage.includes('danger signs') || lowerMessage.includes('delikado')) return 'emergency_warning';
  if (lowerMessage.includes('family planning') || lowerMessage.includes('contraceptive') || lowerMessage.includes('birth control')) return 'family_planning';
  return null;
};

// Language detection function
export const detectLanguage = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Tagalog patterns
  const tagalogPatterns = [
    /\b(kumusta|magandang|salamat|ano|paano|bakit|sino|saan)\b/,
    /\b(aking|iyong|namin|ninyo|kanila|ito|iyan|iyon)\b/,
    /\b(oo|hindi|maraming|kaunti|malaki|maliit|mabuti|masama)\b/,
    /\b(buntis|pagbubuntis|sanggol|bata|ina|nanay|tatay|ama)\b/,
    /\b(gamot|doktor|ospital|health|kalusugan|sakit|lagnat)\b/
  ];
  
  // Bisaya patterns
  const bisayaPatterns = [
    /\b(kumusta|salamat|unsa|giunsa|ngano|kinsa|asa|diin)\b/,
    /\b(ako|imo|amon|inyo|ila|kini|kana|kadto)\b/,
    /\b(oo|dili|daghan|gamay|dako|gubot|maayo|daotan)\b/,
    /\b(mabdos|pagmabdos|bata|inahan|nanay|tatay|amahan)\b/,
    /\b(tambal|doktor|ospital|panglawas|sakit|hilanat)\b/
  ];
  
  let tagalogScore = 0;
  let bisayaScore = 0;
  
  tagalogPatterns.forEach(pattern => {
    if (pattern.test(lowerMessage)) tagalogScore++;
  });
  
  bisayaPatterns.forEach(pattern => {
    if (pattern.test(lowerMessage)) bisayaScore++;
  });
  
  if (bisayaScore > tagalogScore && bisayaScore >= 2) return 'bisaya';
  if (tagalogScore >= 2) return 'tagalog';
  return 'english';
};

// Dynamic Health Database with real-time updates
export const createDynamicHealthDatabase = (userRole, currentContext) => {
  const baseDatabase = {
    pregnancy: {
      facts: [
        "Pregnancy typically lasts 40 weeks, divided into three trimesters",
        "A balanced diet with folic acid is crucial in early pregnancy to prevent birth defects",
        "Regular prenatal checkups should occur: monthly until 28 weeks, twice monthly until 36 weeks, then weekly",
        "Normal weight gain during pregnancy is 11.5-16 kg for women with normal BMI",
        "Fetal movements are usually felt between 18-22 weeks"
      ],
      advice: [
        "Take 400-800 mcg of folic acid daily before conception and during early pregnancy",
        "Attend all scheduled prenatal appointments for monitoring",
        "Eat iron-rich foods and take iron supplements as prescribed",
        "Avoid alcohol, tobacco, and unprescribed medications",
        "Practice gentle exercises like walking and prenatal yoga",
        "Get adequate rest and sleep on your left side for better blood flow"
      ],
      warning_signs: [
        "Severe headache or blurred vision",
        "Vaginal bleeding or fluid leakage",
        "Severe abdominal pain", 
        "Decreased fetal movement",
        "Fever above 38°C",
        "Persistent vomiting"
      ]
    },
    // ... other health categories can be added here
  };

  // Role-specific enhancements
  if (userRole === 'BHW') {
    baseDatabase.pregnancy.advice.push(
      "Document all prenatal visits in patient records",
      "Schedule follow-up appointments automatically",
      "Monitor high-risk pregnancies more frequently"
    );
  }

  if (userRole === 'BNS') {
    baseDatabase.pregnancy.advice.push(
      "Track nutritional intake using growth charts",
      "Monitor weight gain patterns",
      "Provide breastfeeding support resources"
    );
  }

  // Context-aware additions
  if (currentContext.season === 'rainy_season') {
    baseDatabase.pregnancy.warning_signs.push(
      "Watch for mosquito-borne illnesses",
      "Be cautious of slippery surfaces"
    );
  }

  return baseDatabase;
};

// Context Management
export const getCurrentContext = (currentTime, userContext) => {
  const hour = currentTime.getHours();
  const day = currentTime.getDay();
  const month = currentTime.getMonth();
  
  const timeContext = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const isWeekend = day === 0 || day === 6;
  
  // Seasonal detection (simplified)
  let season = 'normal';
  if (month >= 5 && month <= 10) season = 'rainy_season';
  if (month >= 2 && month <= 4) season = 'summer';
  if (month === 11 || month === 0) season = 'holiday_season';
  
  return {
    timeOfDay: timeContext,
    isWeekend,
    season,
    ...userContext
  };
};

// Dynamic Pattern Creation
const createDynamicPatterns = (userRole, context) => {
  const basePatterns = [
    // Emergency patterns (always highest priority)
    { pattern: /\b(emergency|urgent|help immediately|danger|warning|sakít|delikado|emergensya)\b/, type: 'emergency', priority: 1 },
    
    // Health topics
    { pattern: /\b(pregnant|pregnancy|prenatal|maternal|trimester|fetal)\b/, type: 'pregnancy', priority: 2 },
    { pattern: /\b(nutrition|breastfeed|breast milk|solid food|feed|diet|food)\b/, type: 'nutrition', priority: 2 },
    { pattern: /\b(immuniz|vaccin|inject|shot|bcg|measles|polio)\b/, type: 'immunization', priority: 2 },
    
    // Role-specific patterns
    ...(userRole === 'BHW' ? [
        { pattern: /\b(add patient|new record|register patient)\b/i, type: 'add_patient', priority: 2 },
        { pattern: /\b(medicine|stock|inventory|supplies)\b/i, type: 'inventory_check', priority: 2 },
        { pattern: /\b(report|statistics|monthly summary)\b/i, type: 'generate_report', priority: 2 },
        { pattern: /\b(add|new|register).*(patient|record|profile)\b/i, type: 'bhw_add_patient', priority: 2 },
        { pattern: /\b(inventory|stock|medicine|expire)\b/i, type: 'bhw_inventory', priority: 2 },
        { pattern: /\b(report|summary|accomplishment)\b/i, type: 'bhw_reports', priority: 2 },
        { pattern: /\b(protocol|procedure|referral)\b/i, type: 'bhw_protocols', priority: 2 }
    ] : []),
    
    ...(userRole === 'BNS' ? [
      { pattern: /\b(growth|weight|height|bmi|measure)\b/i, type: 'growth_tracking', priority: 2 },
        { pattern: /\b(feeding|malnutrition|underweight|severely wasted)\b/i, type: 'nutrition_program', priority: 2 },
        { pattern: /\b(update|edit|modify|change).*(child|children).*(record|data|information)\b/i, type: 'update_child_records', priority: 2 },
    { pattern: /\b(update|edit|modify|change).*(record|data|information)\b/i, type: 'update_records', priority: 2 },
    { pattern: /\b(how to|how do i).*(update|edit|modify|change).*(child|children).*(record)\b/i, type: 'update_child_records', priority: 2 },
    ] : []),
    
    ...(userRole === 'USER/MOTHER/GUARDIAN' ? [
      { pattern: /\b(my record|my health|personal record)\b/, type: 'personal_records', priority: 2 },
      { pattern: /\b(schedule|appointment|checkup|visit)\b/, type: 'appointments', priority: 2 },
      { pattern: /\b(growth|weight|height|measure|opt)\b/i, type: 'bns_growth_tracking', priority: 2 },
    { pattern: /\b(assessment|muac|status|classify)\b/i, type: 'bns_assessment', priority: 2 },
    { pattern: /\b(feeding|supplement|ration)\b/i, type: 'bns_feeding_program', priority: 2 },
    { pattern: /\b(malnutrition|wasting|edema|sam|mam)\b/i, type: 'bns_malnutrition_signs', priority: 2 }
    ] : []),

    { pattern: /\b(pregnant|prenatal|buntis|mabdos)\b/i, type: 'pregnancy', priority: 3 },
    { pattern: /\b(immuniz|vaccin|bakuna|injection)\b/i, type: 'immunization', priority: 3 },

  ];

  // Context-aware patterns
  if (context.season === 'rainy_season') {
    basePatterns.push(
      { pattern: /\b(dengue|mosquito|fever|rain)\b/, type: 'seasonal_health', priority: 2 }
    );
  }

  return basePatterns;
};

// Dynamic Action Checker
const checkDynamicActions = (message, userRole, context) => {
  const actionPatterns = [
    {
      pattern: /\b(schedule|book|make).*appointment\b/,
      action: {
        type: 'smart_navigate',
        label: '📅 Schedule Appointment',
        screen: getAppointmentScreen(userRole),
        prefill: extractAppointmentDetails(message)
      }
    },
    {
      pattern: /\b(add|new|create).*(patient|child)\b/,
      action: {
        type: 'smart_navigate', 
        label: '👥 Add New Record',
        screen: getRecordScreen(userRole),
        prefill: extractRecordDetails(message)
      }
    },
    {
      pattern: /\b(check|view).*(stock|inventory|medicine)\b/,
      action: {
        type: 'smart_navigate',
        label: '📦 Check Inventory',
        screen: 'Inventory',
        highlight: extractItemNames(message)
      }
    }
  ];

  for (const { pattern, action } of actionPatterns) {
    if (pattern.test(message)) {
      return {
        text: generateActionResponse(message, userRole),
        actions: [action],
        type: 'smart_action'
      };
    }
  }

  return null;
};

// Smart Navigation Helpers
const getAppointmentScreen = (userRole) => {
  const screens = {
    'BHW': 'BhwAppointment',
    'BNS': 'BnsAppointment', 
    'USER/MOTHER/GUARDIAN': 'ScheduleAppointment'
  };
  return screens[userRole] || 'Appointment';
};

const getRecordScreen = (userRole) => {
  const screens = {
    'BHW': 'PatientManagement',
    'BNS': 'ChildHealthRecords', 
    'USER/MOTHER/GUARDIAN': 'ViewUserRecords'
  };
  return screens[userRole] || 'Records';
};

// Contextual Response Generator
const generateContextualResponse = (type, language, userRole, context, healthDatabase) => {
  // Get base responses
  let responses;
  switch (language) {
    case 'tagalog':
      responses = RESPONSES_TAGALOG[type] || RESPONSES[type] || RESPONSES_TAGALOG.default;
      break;
    case 'bisaya':
      responses = RESPONSES_BISAYA[type] || RESPONSES[type] || RESPONSES_BISAYA.default;
      break;
    default:
      responses = RESPONSES[type] || RESPONSES.default;
  }

  // Select response
  let responseText = responses[Math.floor(Math.random() * responses.length)];
  
  // Enhance with contextual information
  responseText = enhanceWithContext(responseText, context, userRole, healthDatabase);
  
  // Add smart actions if applicable
  const actions = generateSmartActions(type, userRole, context);
  
  return {
    text: responseText,
    type: type,
    actions: actions,
    isEmergency: type === 'emergency',
    context: context
  };
};

// Context Enhancement
const enhanceWithContext = (response, context, userRole, healthDatabase) => {
  let enhancedResponse = response;

  // Add time-based greeting
  if (context.timeOfDay && response.includes('Hello')) {
    const timeGreetings = {
      morning: 'Good morning! ☀️',
      afternoon: 'Good afternoon! 🌤️', 
      evening: 'Good evening! 🌙'
    };
    enhancedResponse = enhancedResponse.replace('Hello', timeGreetings[context.timeOfDay]);
  }

  // Add seasonal tips
  if (context.season && context.season !== 'normal') {
    const seasonalTips = CHAT_CONFIG.seasonal[context.season];
    if (seasonalTips && enhancedResponse.includes('Tips:')) {
      enhancedResponse += `\n\n🌦️ Seasonal Advice (${context.season.replace('_', ' ')}):\n• ${seasonalTips.tips.join('\n• ')}`;
    }
  }

  // Add role-specific information
  if (userRole !== 'USER/MOTHER/GUARDIAN') {
    if (enhancedResponse.includes('You can')) {
      const roleActions = {
        'BHW': 'As a Health Worker, you have access to patient management and inventory tools.',
        'BNS': 'As a Nutrition Scholar, you can track child growth and nutritional status.'
      };
      enhancedResponse += `\n\n${roleActions[userRole]}`;
    }
  }

  return enhancedResponse;
};

// Smart Action Generator
const generateSmartActions = (type, userRole, context) => {
  const actions = [];

  switch (type) {
    case 'pregnancy':
      actions.push(
        { type: 'navigate', label: '📅 Schedule Prenatal Checkup', screen: getAppointmentScreen(userRole) }
      );
      if (userRole === 'BHW') {
        actions.push(
          { type: 'navigate', label: '📝 Add Patient Record', screen: 'PatientManagement' }
        );
      }
      break;

    case 'immunization':
      actions.push(
        { type: 'navigate', label: '💉 Schedule Immunization', screen: getAppointmentScreen(userRole) }
      );
      if (userRole !== 'USER/MOTHER/GUARDIAN') {
        actions.push(
          { type: 'navigate', label: '📊 View Immunization Schedule', screen: 'Reports' }
        );
      }
      break;

    case 'inventory':
      if (userRole !== 'USER/MOTHER/GUARDIAN') {
        actions.push(
          { type: 'navigate', label: '📦 Manage Inventory', screen: 'Inventory' }
        );
      }
      break;
    case 'bhw_add_patient':
       actions.push({ type: 'navigate', label: '👥 Go to Patient List', screen: 'PatientManagement' });
       break;
    case 'bhw_inventory':
       actions.push({ type: 'navigate', label: '📦 Open Inventory', screen: 'Inventory' });
       break;
    case 'bhw_reports':
       actions.push({ type: 'navigate', label: '📊 Open Reports', screen: 'Reports' });
       break;
    case 'bhw_protocols':
       actions.push({ type: 'call', label: '📞 Call Nurse/Midwife', number: '09123456789' }); // Example number
       break;

    // --- BNS Actions ---
    case 'bns_growth_tracking':
    case 'bns_assessment':
       actions.push({ type: 'navigate', label: '👶 Go to Child Records', screen: 'ChildHealthRecords' });
       break;
    case 'bns_malnutrition_signs':
       actions.push({ type: 'navigate', label: '⚠️ Report SAM Case', screen: 'ReferralForm' }); // Hypothethical screen
       actions.push({ type: 'call', label: '📞 Emergency Refer', number: '911' });
       break;

    // --- General Actions ---
    case 'pregnancy':
       actions.push({ type: 'navigate', label: '📅 Prenatal Schedule', screen: 'Appointment' });
       break;
    case 'emergency_warning':
       actions.push({ type: 'call', label: '🚑 Call Ambulance (911)', number: '911' });
       break;
    case 'update_child_records':
      if (userRole === 'BNS') {
        actions.push(
          { type: 'navigate', label: '👶 Go to Child Records', screen: 'ChildHealthRecords' }
        );
      }
      break;
      
    case 'update_records':
      if (userRole === 'BHW') {
        actions.push(
          { type: 'navigate', label: '👥 Update Patient Records', screen: 'PatientManagement' }
        );
      } else if (userRole === 'BNS') {
        actions.push(
          { type: 'navigate', label: '👶 Update Child Records', screen: 'ChildHealthRecords' }
        );
      }
      break;
  }

  // Add emergency action for health-related topics
  if (['pregnancy', 'child_care', 'emergency'].includes(type)) {
    actions.push(
      { type: 'call', label: '🚨 Emergency Help', number: '911' }
    );
  }

  return actions;
};

// Information Extraction (for smart pre-filling)
const extractAppointmentDetails = (message) => {
  const details = {};
  if (message.includes('prenatal')) details.type = 'prenatal';
  if (message.includes('immunization')) details.type = 'immunization';
  if (message.includes('checkup')) details.type = 'checkup';
  return details;
};

const extractRecordDetails = (message) => {
  const details = {};
  if (message.includes('child')) details.recordType = 'child';
  if (message.includes('pregnant')) details.recordType = 'pregnant_woman';
  return details;
};

const extractItemNames = (message) => {
  const medicines = ['paracetamol', 'vitamins', 'iron', 'folic acid', 'ors'];
  return medicines.find(med => message.includes(med)) || null;
};

const generateActionResponse = (message, userRole) => {
  if (message.includes('appointment')) {
    return "I can help you schedule an appointment. Would you like to go to the appointment screen now?";
  }
  if (message.includes('patient') || message.includes('child')) {
    return "I can help you add a new record. Would you like to go to the records screen now?";
  }
  if (message.includes('inventory')) {
    return "I can help you check inventory. Would you like to go to the inventory screen now?";
  }
  return "I can help you with that. Would you like to proceed?";
};

// Real-time Data Integration
export const getRealTimeAlerts = async (userRole, context) => {
  const alerts = [];

  try {
    // =================================================
    // 1. BHW ALERTS (Inventory & Patients)
    // =================================================
    if (userRole === 'BHW') {
      // CHECK 1: Low Stock Inventory
      // Query 'inventory' table where quantity is below a threshold (e.g., 20)
      const { data: lowStockItems, error: inventoryError } = await supabase
        .from('inventory')
        .select('item_name, quantity')
        .lt('quantity', 20) // Adjust '20' to your preferred low stock threshold
        .limit(2); // Limit to 2 to avoid cluttering the chat

      if (!inventoryError && lowStockItems?.length > 0) {
        lowStockItems.forEach(item => {
          alerts.push({
            type: 'inventory_alert',
            message: `Low stock: ${item.item_name} (${item.quantity} remaining)`,
            priority: 'medium',
            // Using 'smart_navigate' to potentially highlight the item in the future
            action: { type: 'smart_navigate', label: '📦 Restock', screen: 'BhwInventory', highlight: item.item_name }
          });
        });
      }

      // CHECK 2: High Risk Patients
      // Query 'patients' table for those marked as High Risk
      // Assuming risk_level is text or enum that includes 'High' or similar
      const { count: highRiskCount, error: patientError } = await supabase
         .from('patients')
         .select('*', { count: 'exact', head: true })
         .ilike('risk_level', '%High%'); // Case-insensitive match for 'High Risk'

      if (!patientError && highRiskCount > 0) {
         alerts.push({
             type: 'patient_alert',
             message: `⚠️ You have ${highRiskCount} high-risk patients requiring monitoring.`,
             priority: 'high',
             action: { type: 'navigate', label: '👥 View Patients', screen: 'PatientManagement' }
         });
      }
    }

    // =================================================
    // 2. BNS ALERTS (Malnutrition & Checkups)
    // =================================================
    if (userRole === 'BNS') {
      // CHECK 1: Malnutrition Cases
      // Query 'child_records' where nutrition_status is NOT 'Normal'
      const { count: malnutritionCount, error: nutritionError } = await supabase
        .from('child_records')
        .select('*', { count: 'exact', head: true })
        .not('nutrition_status', 'in', '("Normal","Normal Weight","Healthy")'); // Filter out healthy statuses

      if (!nutritionError && malnutritionCount > 0) {
        alerts.push({
          type: 'nutrition_alert',
          message: `⚠️ Attention: ${malnutritionCount} children identified with malnutrition concerns.`,
          priority: 'high',
          action: { type: 'navigate', label: '👶 View Child Records', screen: 'ChildHealthRecords' }
        });
      }

      // CHECK 2: Overdue Checkups (e.g., more than 30 days ago)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: overdueCount, error: checkupError } = await supabase
          .from('child_records')
          .select('*', { count: 'exact', head: true })
          .lt('last_checkup', thirtyDaysAgo.toISOString().split('T')[0]); // compare date YYYY-MM-DD

      if (!checkupError && overdueCount > 0) {
           alerts.push({
              type: 'checkup_alert',
              message: `📅 ${overdueCount} children are due for their monthly checkup.`,
              priority: 'medium',
              action: { type: 'navigate', label: '⚖️ Update Records', screen: 'ChildHealthRecords' }
           });
      }
    }

    // =================================================
    // 3. SEASONAL ALERTS (Context-based)
    // =================================================
    if (context.season === 'rainy_season') {
      alerts.push({
        type: 'seasonal_alert',
        message: '🌧️ Rainy Season Alert: Monitor for dengue and leptospirosis symptoms in your area.',
        priority: 'medium'
      });
    } else if (context.season === 'summer') {
       alerts.push({
        type: 'seasonal_alert',
        message: '☀️ Heat Advisory: Remind patients to stay hydrated to prevent heatstroke.',
        priority: 'medium'
      });
    }

  } catch (error) {
    console.error("Error fetching real-time alerts:", error);
    // Optionally push a generic error alert if critical, or just fail silently for chat supplements
  }

  return alerts;
};

// Dynamic Response Generator
export const generateDynamicResponse = (userMessage, context = {}, userRole = 'USER/MOTHER/GUARDIAN', currentTime = new Date()) => {
  const message = userMessage.toLowerCase().trim();
  const detectedLanguage = detectLanguage(message);
  const languageToUse = detectedLanguage !== 'english' ? detectedLanguage : context.currentLanguage || 'english';
  
  // Get current context
  const currentContext = getCurrentContext(currentTime, context);
  const healthDatabase = createDynamicHealthDatabase(userRole, currentContext);
  
  // Enhanced pattern matching with dynamic priorities
  const dynamicPatterns = createDynamicPatterns(userRole, context);
  
  // Check for dynamic actions first
  const dynamicAction = checkDynamicActions(message, userRole, context);
  if (dynamicAction) return dynamicAction;

  // Check patterns
  for (const { pattern, type, priority } of dynamicPatterns.sort((a, b) => a.priority - b.priority)) {
    if (pattern.test(message)) {
      return generateContextualResponse(type, languageToUse, userRole, context, healthDatabase);
    }
  }

  // Default contextual response
  return generateContextualResponse('default', languageToUse, userRole, context, healthDatabase);
};

// Enhanced generateResponse with dynamic features (main export)
export const generateResponse = (userMessage, context = {}, language = 'english', userRole = 'USER/MOTHER/GUARDIAN') => {
  return generateDynamicResponse(userMessage, { ...context, currentLanguage: language }, userRole);
};

// Export existing constants for backward compatibility
export {
  RESPONSES,
  RESPONSES_TAGALOG,
  RESPONSES_BISAYA,
  RESPONSES_WITH_ACTIONS
};