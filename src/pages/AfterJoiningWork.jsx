import React, { useState, useEffect } from 'react';
import { Filter, Search, Clock, CheckCircle, X } from 'lucide-react';
import useDataStore from '../store/dataStore';
import toast from 'react-hot-toast';

const AfterJoiningWork = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pendingData, setPendingData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [reportingOfficers, setReportingOfficers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const companyOptions = ["PMMPL", "PURAB", "REFRATECH", "REFRASYNTH"];
  
  const joiningPlaceOptions = [
    "Application",
    "Factory",
    "Factory Madhya",
    "Factory Purab",
    "Factory Refrasynth",
    "Factory Rkl",
    "Iron Tailor Office",
    "Mdo Office",
    "Rkl Office",
    "Sales"
  ];

  const [formData, setFormData] = useState({
    employeeCode: "",
    salaryConfirmation: "", 
    salaryAmount: "", 
    reportingOfficer: "",
    pf: "",
    baseAddress: "",
    idProofCopy: null,
    joiningLetter: null,
    interviewAssessmentSheet: null,
    biometricAccess: false,
    punchCode: "",
    officialEmailId: false,
    emailId: "",
    emailPassword: "",
    laptop: "",
    mobile: "",
    assignAssets: false,
    manualImage: null,
    manualImageUrl: "",
    assets: [],
    incentiveCategory: "",
    attendanceMode: "",
    department: "",
    eligibleForPF: "",
    eligibleForESIC: "",
    remarks: "",
    nextSalaryIncrementDate: "",
    designation: "",
    bloodGroup: "",
    identificationMarks: "",
    companyName: "",
    joiningPlace: "",
  });

  // Cache for fetched data to prevent repeated API calls
  const [dataCache, setDataCache] = useState({
    joiningData: null,
    reportingOfficers: null,
    departments: null,
    designations: null,
    lastFetchTime: 0
  });

  // Function to fetch last employee code from JOINING sheet
  const fetchLastEmployeeCode = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const rawData = result.data || result;

      if (!Array.isArray(rawData) || rawData.length < 7) {
        return null;
      }

      const employeeCodeColumnIndex = 26;
      let highestNumber = 0;

      for (let i = 6; i < rawData.length; i++) {
        const row = rawData[i];
        if (row && row.length > employeeCodeColumnIndex) {
          const code = row[employeeCodeColumnIndex];
          if (code && typeof code === 'string' && code.trim() !== "") {
            const trimmedCode = code.trim();
            const match = trimmedCode.match(/PMMPL-(\d+)/i);
            if (match) {
              const number = parseInt(match[1]);
              if (!isNaN(number) && number > highestNumber) {
                highestNumber = number;
              }
            }
          }
        }
      }

      if (highestNumber > 0) {
        return `PMMPL-${highestNumber}`;
      }

      return null;
    } catch (error) {
      console.error("Error fetching last employee code:", error);
      return null;
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch"
      );
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      const rawData = result.data || result;
      
      if (!Array.isArray(rawData)) return;
      
      const departmentsSet = new Set();
      
      for (let i = 6; i < rawData.length; i++) {
        const row = rawData[i];
        if (row && row.length > 20 && row[20]) {
          const dept = row[20].toString().trim();
          if (dept) departmentsSet.add(dept);
        }
      }
      
      setDepartments(Array.from(departmentsSet));
      setDataCache(prev => ({ ...prev, departments: Array.from(departmentsSet) }));
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchUniqueDesignations = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch"
      );
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      const rawData = result.data || result;
      
      if (!Array.isArray(rawData)) return;
      
      const designationsSet = new Set();
      
      for (let i = 6; i < rawData.length; i++) {
        const row = rawData[i];
        if (row && row.length > 5 && row[5]) {
          const designation = row[5].toString().trim();
          if (designation) designationsSet.add(designation);
        }
      }
      
      setDesignations(Array.from(designationsSet));
      setDataCache(prev => ({ ...prev, designations: Array.from(designationsSet) }));
    } catch (error) {
      console.error("Error fetching designations:", error);
    }
  };

  const generateNextEmployeeCode = async () => {
    try {
      const lastEmployeeCode = await fetchLastEmployeeCode();

      if (!lastEmployeeCode) {
        return "PMMPL-001";
      }

      const match = lastEmployeeCode.match(/PMMPL-(\d+)/i);
      if (match) {
        const lastNumber = parseInt(match[1]);
        const nextNumber = lastNumber + 1;
        return `PMMPL-${nextNumber.toString().padStart(3, '0')}`;
      }

      return "PMMPL-001";
    } catch (error) {
      console.error("Error generating next employee code:", error);
      return "PMMPL-001";
    }
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString || dateString.trim() === '') return '-';
    
    try {
      if (typeof dateString === 'string' && dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          
          if (day > 0 && day <= 31 && month > 0 && month <= 12) {
            return dateString;
          }
        }
      }
      
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
      
      return dateString || '-';
    } catch (error) {
      return dateString || '-';
    }
  };

  const fetchReportingOfficers = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=Master&action=fetch"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        const officers = result.data
          .slice(1)
          .map(row => row[1])
          .filter(officer => officer && officer.trim() !== "");

        setReportingOfficers(officers);
        setDataCache(prev => ({ ...prev, reportingOfficers: officers }));
      }
    } catch (error) {
      console.error("Error fetching reporting officers:", error);
    }
  };

  const DRIVE_FOLDER_ID = "1Rb4DIzbZWSVyL5s_z4d0ntk0iM-JZWBq";

  // OPTIMIZED: Fetch all data in parallel
  const fetchJoiningData = async () => {
    setError(null);

    try {
      // Check cache first (cache for 1 minute)
      const now = Date.now();
      const CACHE_DURATION = 60 * 1000;
      
      if (dataCache.lastFetchTime && (now - dataCache.lastFetchTime < CACHE_DURATION) && 
          dataCache.joiningData) {
        
        // Process cached data
        const rawData = dataCache.joiningData;
        const dataRows = rawData.length > 6 ? rawData.slice(6) : [];
        
        const processedData = dataRows.map((row, idx) => ({
          timestamp: row[0] || "",
          joiningNo: row[1] || "",
          candidateName: row[2] || "",
          fatherName: row[3] || "",
          dateOfJoining: row[4] || "",
          designation: row[5] || "",
          aadharPhoto: row[6] || "",
          candidatePhoto: row[7] || "",
          currentAddress: row[8] || "",
          bodAsPerAadhar: row[9] || "",
          gender: row[10] || "",
          mobileNo: row[11] || "",
          familyMobileNo: row[12] || "",
          relationWithFamily: row[13] || "",
          accountNo: row[14] || "",
          ifscCode: row[15] || "",
          branchName: row[16] || "",
          passbookPhoto: row[17] || "",
          email: row[18] || "",
          qualification: row[19] || "",
          department: row[20] || "",
          salary: row[21] || "",
          aadharNo: row[22] || "",
          resumeCopy: row[23] || "",
          plannedDate: row[23] || "",
          actual: row[24] || "",
          employeeCode: row[26] || "",
          salaryConfirmation: row[27] || "",
          reportingOfficer: row[28] || "",
          baseAddress: row[29] || "",
          punchCode: row[30] || "",
          officialEmail: row[31] || "",
          emailPassword: row[32] || "",
          currentBankAccountNo: row[33] || "",
          currentBankIfsc: row[34] || "",
          pfEsic: row[36] || "",
          idProofCopy: row[37] || "",
          joiningLetter: row[38] || "",
          interviewAssessmentSheet: row[107] || "",
          manualImageUrl: row[39] || "",
          laptopDetails: row[40] || "",
          laptopImage: row[41] || "",
          mobileName: row[42] || "",
          mobileImage: row[43] || "",
          item1: row[44] || "",
          item1Image: row[45] || "",
          item2: row[46] || "",
          item2Image: row[47] || "",
          item3: row[49] || "",
          item3Image: row[50] || "",
          incentiveCategory: row[91] || "",
          attendanceMode: row[94] || "",
          department2: row[95] || "",
          eligibleForPF: row[96] || "",
          eligibleForESIC: row[97] || "",
          remarks: row[98] || "",
          joiningPlace: row[105] || "",
          nextSalaryIncrementDate: row[99] || "",
          companyName: row[100] || "",
          bloodGroup: row[92] || "",
          identificationMarks: row[93] || "",
        }));

        const pendingTasks = processedData.filter(
          (task) => task.plannedDate && task.plannedDate.trim() !== "" && (!task.actual || task.actual.trim() === "")
        );

        const historyTasks = processedData.filter(
          (task) => task.plannedDate && task.plannedDate.trim() !== "" && task.actual && task.actual.trim() !== ""
        );

        setPendingData(pendingTasks);
        setHistoryData(historyTasks);
        return;
      }

      // Fetch fresh data
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch data from JOINING sheet");
      }

      const rawData = result.data || result;

      if (!Array.isArray(rawData)) {
        throw new Error("Expected array data not received");
      }

      // Cache the data
      setDataCache({
        ...dataCache,
        joiningData: rawData,
        lastFetchTime: now
      });

      // Process data
      const dataRows = rawData.length > 6 ? rawData.slice(6) : [];
      
      const processedData = dataRows.map((row, idx) => ({
        timestamp: row[0] || "",
        joiningNo: row[1] || "",
        candidateName: row[2] || "",
        fatherName: row[3] || "",
        dateOfJoining: row[4] || "",
        designation: row[5] || "",
        aadharPhoto: row[6] || "",
        candidatePhoto: row[7] || "",
        currentAddress: row[8] || "",
        bodAsPerAadhar: row[9] || "",
        gender: row[10] || "",
        mobileNo: row[11] || "",
        familyMobileNo: row[12] || "",
        relationWithFamily: row[13] || "",
        accountNo: row[14] || "",
        ifscCode: row[15] || "",
        branchName: row[16] || "",
        passbookPhoto: row[17] || "",
        email: row[18] || "",
        qualification: row[19] || "",
        department: row[20] || "",
        salary: row[21] || "",
        aadharNo: row[22] || "",
        resumeCopy: row[23] || "",
        plannedDate: row[23] || "",
        actual: row[24] || "",
        employeeCode: row[26] || "",
        salaryConfirmation: row[27] || "",
        reportingOfficer: row[28] || "",
        baseAddress: row[29] || "",
        punchCode: row[30] || "",
        officialEmail: row[31] || "",
        emailPassword: row[32] || "",
        currentBankAccountNo: row[33] || "",
        currentBankIfsc: row[34] || "",
        pfEsic: row[36] || "",
        idProofCopy: row[37] || "",
        joiningLetter: row[38] || "",
        interviewAssessmentSheet: row[107] || "",
        manualImageUrl: row[39] || "",
        laptopDetails: row[40] || "",
        laptopImage: row[41] || "",
        mobileName: row[42] || "",
        mobileImage: row[43] || "",
        item1: row[44] || "",
        item1Image: row[45] || "",
        item2: row[46] || "",
        item2Image: row[47] || "",
        item3: row[49] || "",
        item3Image: row[50] || "",
        incentiveCategory: row[91] || "",
        attendanceMode: row[94] || "",
        department2: row[95] || "",
        eligibleForPF: row[96] || "",
        eligibleForESIC: row[97] || "",
        remarks: row[98] || "",
        joiningPlace: row[105] || "",
        nextSalaryIncrementDate: row[99] || "",
        companyName: row[100] || "",
        bloodGroup: row[92] || "",
        identificationMarks: row[93] || "",
      }));

      const pendingTasks = processedData.filter(
        (task) => task.plannedDate && task.plannedDate.trim() !== "" && (!task.actual || task.actual.trim() === "")
      );

      const historyTasks = processedData.filter(
        (task) => task.plannedDate && task.plannedDate.trim() !== "" && task.actual && task.actual.trim() !== ""
      );

      setPendingData(pendingTasks);
      setHistoryData(historyTasks);

    } catch (error) {
      console.error("Error fetching joining data:", error);
      setError(error.message);
    }
  };

  // OPTIMIZED: Load all data in parallel on component mount
  useEffect(() => {
    const loadAllData = async () => {
      try {
        // Fetch all required data in parallel
        await Promise.all([
          fetchJoiningData(),
          fetchReportingOfficers(),
          fetchDepartments(),
          fetchUniqueDesignations()
        ]);
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };

    loadAllData();
  }, []);

  const fetchAssetsData = async (employeeId) => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=Assets&action=fetch"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        return null;
      }

      const data = result.data || result;
      if (!Array.isArray(data) || data.length < 2) {
        return null;
      }

      const matchingRow = data.find((row, index) => {
        if (index === 0) return false;
        return row[1]?.toString().trim() === employeeId?.toString().trim();
      });

      if (matchingRow) {
        return {
          punchCode: matchingRow[10] || "",
          emailId: matchingRow[3] || "",
          emailPassword: matchingRow[4] || "",
          laptop: matchingRow[5] || "",
          mobile: matchingRow[6] || "",
          manualImageUrl: matchingRow[39] || "",
          salaryConfirmation: matchingRow[11] || "",
          reportingOfficer: matchingRow[12] || "",
          pf: matchingRow[13] || "",
          baseAddress: matchingRow[14] || "",
          idProofCopyUrl: matchingRow[37] || "",
          joiningLetterUrl: matchingRow[16] || "",
          incentiveCategory: matchingRow[17] || "",
        };
      }

      return null;
    } catch (error) {
      console.error("Error fetching assets data:", error);
      return null;
    }
  };

  // Upload image to Google Drive
  const uploadImageToDrive = async (file, fileName) => {
    try {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64Data = reader.result;
            const response = await fetch(
              "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  action: "uploadFile",
                  base64Data: base64Data,
                  fileName: fileName,
                  mimeType: file.type,
                  folderId: DRIVE_FOLDER_ID,
                }).toString(),
              }
            );

            const result = await response.json();
            if (result.success) {
              resolve(result.fileUrl);
            } else {
              reject(new Error(result.error || "Upload failed"));
            }
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  };

  const handleAfterJoiningClick = async (item) => {
    if (!item || !item.joiningNo) {
      toast.error("Invalid item data. Please refresh and try again.");
      return;
    }

    setSelectedItem(item);
    setShowModal(true);

    try {
      const newEmployeeCode = await generateNextEmployeeCode();

      const [assetsData, fullDataResponse] = await Promise.all([
        fetchAssetsData(item.joiningNo),
        fetch("https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch")
      ]);

      if (!fullDataResponse.ok) {
        throw new Error(`HTTP error! status: ${fullDataResponse.status}`);
      }

      const fullDataResult = await fullDataResponse.json();
      const allData = fullDataResult.data || fullDataResult;

      let headerRowIndex = 5;
      const headers = allData[headerRowIndex].map((h) => h?.toString().trim());

      const serialNumberIndex = headers.findIndex(
        (h) => h?.toLowerCase() === "serialnumber"
      );

      if (serialNumberIndex === -1) {
        throw new Error("Could not find 'serialNumber' column");
      }

      const rowIndex = allData.findIndex(
        (row, idx) =>
          idx > headerRowIndex &&
          row[serialNumberIndex]?.toString().trim() ===
          item.joiningNo?.toString().trim()
      );

      setFormData({
        employeeCode: newEmployeeCode,
        salaryConfirmation: "",
        salaryAmount: "",
        reportingOfficer: "",
        pf: "",
        baseAddress: item.currentAddress || "",
        idProofCopy: null,
        joiningLetter: null,
        biometricAccess: false,
        punchCode: "",
        officialEmailId: false,
        emailId: "",
        emailPassword: "",
        laptop: "",
        mobile: "",
        manualImage: null,
        manualImageUrl: "",
        assignAssets: false,
        assets: [],
        incentiveCategory: "",
        attendanceMode: "",
        department: item.department || "",
        eligibleForPF: "",
        eligibleForESIC: "",
        remarks: "",
        nextSalaryIncrementDate: "",
        designation: item.designation || "",
        bloodGroup: item.bloodGroup || "",
        identificationMarks: item.identificationMarks || "",
        companyName: "",
        joiningPlace: "",
      });

      if (rowIndex !== -1) {
        const biometricColumnIndex = 31;
        const officialEmailColumnIndex = 32;
        const assignAssetsColumnIndex = 33;

        const currentValues = {
          biometricAccess:
            allData[rowIndex][biometricColumnIndex]
              ?.toString()
              .trim()
              .toLowerCase() === "yes",
          officialEmailId:
            allData[rowIndex][officialEmailColumnIndex]
              ?.toString()
              .trim()
              .toLowerCase() === "yes",
          assignAssets:
            allData[rowIndex][assignAssetsColumnIndex]
              ?.toString()
              .trim()
              .toLowerCase() === "yes",
        };

        const finalFormData = {
          ...currentValues,
          employeeCode: newEmployeeCode,
          salaryConfirmation: assetsData?.salaryConfirmation || "",
          salaryAmount: assetsData?.salaryAmount || "",
          reportingOfficer: assetsData?.reportingOfficer || "",
          pf: assetsData?.pf || "",
          baseAddress: item.currentAddress || assetsData?.baseAddress || "",
          punchCode: assetsData?.punchCode || "",
          emailId: assetsData?.emailId || "",
          emailPassword: assetsData?.emailPassword || "",
          laptop: assetsData?.laptop || "",
          laptopImageUrl: assetsData?.laptopImageUrl || "",
          laptopImage: null,
          mobile: assetsData?.mobile || "",
          mobileImageUrl: assetsData?.mobileImageUrl || "",
          mobileImage: null,
          manualImageUrl: assetsData?.manualImageUrl || "",
          idProofCopy: null,
          joiningLetter: null,
          manualImage: null,
          incentiveCategory: assetsData?.incentiveCategory || "", 
          bloodGroup: item.bloodGroup || "",
          identificationMarks: item.identificationMarks || "",
          companyName: "",
          department: item.department || "",
          assets: [
            assetsData?.item3 ? { name: assetsData.item3, image: null, imageUrl: assetsData.item3ImageUrl || "" } : null,
            assetsData?.item4 ? { name: assetsData.item4, image: null, imageUrl: assetsData.item4ImageUrl || "" } : null,
            assetsData?.item5 ? { name: assetsData.item5, image: null, imageUrl: assetsData.item5ImageUrl || "" } : null,
          ].filter(Boolean),
        };

        setFormData(prev => ({
          ...prev,
          ...finalFormData
        }));
      }

    } catch (error) {
      console.error("Error fetching current values:", error);
      toast.error("Failed to load current values");
    }
  };

  const handleCheckboxChange = (name) => {
    setFormData((prev) => {
      const newValue = !prev[name];
      
      if (name === "assignAssets" && newValue && prev.assets.length === 0) {
        return {
          ...prev,
          [name]: newValue,
          assets: []
        };
      }
      
      return {
        ...prev,
        [name]: newValue,
      };
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: file,
      }));
    }
  };

  const saveAssetsData = async (employeeId, employeeName, assetsData) => {
    try {
      const now = new Date();
      const timestamp = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const rowData = [
        timestamp,
        employeeId,
        employeeName,
        assetsData.emailId || "",
        assetsData.emailPassword || "",
        assetsData.laptop || "",
        assetsData.mobile || "",
        "",
        "",
        assetsData.manualImageUrl || "",
        assetsData.punchCode || "",
        assetsData.salaryConfirmation || "",
        assetsData.reportingOfficer || "",
        assetsData.pf || "",
        assetsData.baseAddress || "",
        assetsData.idProofCopyUrl || "",
        assetsData.joiningLetterUrl || "",
        assetsData.incentiveCategory || "",
      ];

      const existingData = await fetchAssetsData(employeeId);

      if (existingData) {
        const fetchResponse = await fetch(
          "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=Assets&action=fetch"
        );
        const result = await fetchResponse.json();
        const data = result.data || result;

        const rowIndex = data.findIndex((row, index) => {
          if (index === 0) return false;
          return row[1]?.toString().trim() === employeeId?.toString().trim();
        });

        if (rowIndex !== -1) {
          const response = await fetch(
            "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                sheetName: "Assets",
                action: "update",
                rowIndex: (rowIndex + 1).toString(),
                rowData: JSON.stringify(rowData),
              }).toString(),
            }
          );
          return await response.json();
        }
      }

      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            sheetName: "Assets",
            action: "insert",
            rowData: JSON.stringify(rowData),
          }).toString(),
        }
      );

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to save assets data: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!selectedItem) {
      toast.error("No item selected. Please try again.");
      setSubmitting(false);
      return;
    }

    if (!selectedItem.joiningNo) {
      toast.error("Joining number is missing. Please try again.");
      setSubmitting(false);
      return;
    }

    if (!selectedItem.candidateName) {
      toast.error("Candidate name is missing. Please try again.");
      setSubmitting(false);
      return;
    }

    try {
      // Upload all images in parallel for better performance
      const uploadPromises = [];
      
      if (formData.idProofCopy) {
        uploadPromises.push(
          uploadImageToDrive(
            formData.idProofCopy,
            `${selectedItem.joiningNo}_idproof_${Date.now()}.${formData.idProofCopy.name.split('.').pop()}`
          ).then(url => ({ type: 'idProofCopyUrl', url }))
        );
      }
      
      if (formData.joiningLetter) {
        uploadPromises.push(
          uploadImageToDrive(
            formData.joiningLetter,
            `${selectedItem.joiningNo}_joining_${Date.now()}.${formData.joiningLetter.name.split('.').pop()}`
          ).then(url => ({ type: 'joiningLetterUrl', url }))
        );
      }
      
      if (formData.interviewAssessmentSheet) {
        uploadPromises.push(
          uploadImageToDrive(
            formData.interviewAssessmentSheet,
            `${selectedItem.joiningNo}_interview_${Date.now()}.${formData.interviewAssessmentSheet.name.split('.').pop()}`
          ).then(url => ({ type: 'interviewAssessmentUrl', url }))
        );
      }
      
      if (formData.laptopImage) {
        uploadPromises.push(
          uploadImageToDrive(
            formData.laptopImage,
            `${selectedItem.joiningNo}_laptop_${Date.now()}.${formData.laptopImage.name.split('.').pop()}`
          ).then(url => ({ type: 'laptopImageUrl', url }))
        );
      }
      
      if (formData.mobileImage) {
        uploadPromises.push(
          uploadImageToDrive(
            formData.mobileImage,
            `${selectedItem.joiningNo}_mobile_${Date.now()}.${formData.mobileImage.name.split('.').pop()}`
          ).then(url => ({ type: 'mobileImageUrl', url }))
        );
      }
      
      if (formData.manualImage) {
        uploadPromises.push(
          uploadImageToDrive(
            formData.manualImage,
            `${selectedItem.joiningNo}_manual_${Date.now()}.${formData.manualImage.name.split('.').pop()}`
          ).then(url => ({ type: 'manualImageUrl', url }))
        );
      }

      // Upload dynamic asset images
      const assetImageUrls = [];
      for (let i = 0; i < formData.assets.length; i++) {
        const asset = formData.assets[i];
        if (asset.image) {
          uploadPromises.push(
            uploadImageToDrive(
              asset.image,
              `${selectedItem.joiningNo}_item${i + 3}_${Date.now()}.${asset.image.name.split('.').pop()}`
            ).then(url => ({ type: `assetImage${i}`, url, index: i }))
          );
        } else {
          assetImageUrls[i] = asset.imageUrl || "";
        }
      }

      // Wait for all uploads to complete
      const uploadResults = await Promise.allSettled(uploadPromises);
      
      // Process upload results
      let idProofCopyUrl = "";
      let joiningLetterUrl = "";
      let interviewAssessmentUrl = "";
      let laptopImageUrl = formData.laptopImageUrl;
      let mobileImageUrl = formData.mobileImageUrl;
      let manualImageUrl = formData.manualImageUrl;

      uploadResults.forEach(result => {
        if (result.status === 'fulfilled') {
          const { type, url, index } = result.value;
          switch(type) {
            case 'idProofCopyUrl':
              idProofCopyUrl = url;
              break;
            case 'joiningLetterUrl':
              joiningLetterUrl = url;
              break;
            case 'interviewAssessmentUrl':
              interviewAssessmentUrl = url;
              break;
            case 'laptopImageUrl':
              laptopImageUrl = url;
              break;
            case 'mobileImageUrl':
              mobileImageUrl = url;
              break;
            case 'manualImageUrl':
              manualImageUrl = url;
              break;
            default:
              if (type.startsWith('assetImage')) {
                assetImageUrls[index] = url;
              }
          }
        }
      });

      // Save assets data
      await saveAssetsData(selectedItem.joiningNo, selectedItem.candidateName, {
        salaryConfirmation: formData.salaryConfirmation,
        salaryAmount: formData.salaryAmount,
        reportingOfficer: formData.reportingOfficer,
        pf: formData.pf,
        baseAddress: formData.baseAddress,
        idProofCopyUrl: idProofCopyUrl,
        joiningLetterUrl: joiningLetterUrl,
        emailId: formData.emailId,
        emailPassword: formData.emailPassword,
        laptop: formData.laptop,
        laptopImageUrl: laptopImageUrl,
        mobile: formData.mobile,
        mobileImageUrl: mobileImageUrl,
        item3: formData.assets[0]?.name || "",
        item3ImageUrl: assetImageUrls[0] || "",
        item4: formData.assets[1]?.name || "",
        item4ImageUrl: assetImageUrls[1] || "",
        item5: formData.assets[2]?.name || "",
        item5ImageUrl: assetImageUrls[2] || "",
        manualImageUrl: manualImageUrl,
        punchCode: formData.punchCode,
        incentiveCategory: formData.incentiveCategory,
      });

      // Update JOINING sheet
      const fullDataResponse = await fetch(
        "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch"
      );

      if (!fullDataResponse.ok) {
        throw new Error(`HTTP error! status: ${fullDataResponse.status}`);
      }

      const fullDataResult = await fullDataResponse.json();
      const allData = fullDataResult.data || fullDataResult;
      let headerRowIndex = 5;

      const headers = allData[headerRowIndex].map((h) => h?.toString().trim());
      const serialNumberIndex = headers.findIndex(
        (h) => h?.toLowerCase() === "serialnumber"
      );

      if (serialNumberIndex === -1) {
        throw new Error("Could not find 'serialNumber' column");
      }

      const rowIndex = allData.findIndex(
        (row, idx) =>
          idx > headerRowIndex &&
          row[serialNumberIndex]?.toString().trim() ===
          selectedItem.joiningNo?.toString().trim()
      );

      if (rowIndex === -1) {
        throw new Error(`Employee ${selectedItem.joiningNo} not found`);
      }

      const updateCell = (columnIndex, value) => {
        return fetch(
          "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              sheetName: "JOINING",
              action: "updateCell",
              rowIndex: (rowIndex + 1).toString(),
              columnIndex: columnIndex.toString(),
              value: value,
            }).toString(),
          }
        );
      };

      const salaryValue = formData.salaryConfirmation === "Yes"
        ? formData.salaryAmount
        : formData.salaryConfirmation;

      const now = new Date();
      const actualDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const updates = [
        { col: 25, val: actualDate },
        { col: 27, val: formData.employeeCode },
        { col: 28, val: salaryValue },
        { col: 29, val: formData.reportingOfficer },
        { col: 30, val: formData.baseAddress },
        { col: 31, val: formData.biometricAccess ? formData.punchCode : "" },
        { col: 32, val: formData.officialEmailId ? formData.emailId : "" },
        { col: 33, val: formData.officialEmailId ? formData.emailPassword : "" },
        { col: 34, val: selectedItem.accountNo || "" },
        { col: 35, val: selectedItem.ifscCode || "" },
        { col: 36, val: selectedItem.designation || "" },
        { col: 37, val: formData.pf || "" },
        { col: 38, val: idProofCopyUrl || "" },
        { col: 39, val: joiningLetterUrl || "" },
        { col: 108, val: interviewAssessmentUrl || "" },
        { col: 40, val: manualImageUrl || "" },
        { col: 41, val: formData.laptop },
        { col: 42, val: laptopImageUrl },
        { col: 43, val: formData.mobile },
        { col: 44, val: mobileImageUrl },
        { col: 45, val: formData.assets[0]?.name || "" },
        { col: 46, val: assetImageUrls[0] || "" },
        { col: 47, val: formData.assets[1]?.name || "" },
        { col: 48, val: assetImageUrls[1] || "" },
        { col: 49, val: formData.assets[2]?.name || "" },
        { col: 50, val: assetImageUrls[2] || "" },
        { col: 91, val: formData.incentiveCategory || "" },
        { col: 95, val: formData.attendanceMode },
        { col: 96, val: formData.department },
        { col: 97, val: formData.eligibleForPF },
        { col: 98, val: formData.eligibleForESIC },
        { col: 99, val: formData.remarks },
        { col: 100, val: formData.nextSalaryIncrementDate },
        { col: 101, val: formData.companyName },
        { col: 106, val: formData.joiningPlace || "" },
      ];

      // Execute all updates in parallel
      const updatePromises = updates.map(update => updateCell(update.col, update.val));
      const responses = await Promise.all(updatePromises);
      const results = await Promise.all(responses.map((r) => r.json()));

      const hasError = results.some((result) => !result.success);
      if (hasError) {
        throw new Error("Some cell updates failed");
      }

      // Clear cache and refresh data
      setDataCache({
        joiningData: null,
        reportingOfficers: dataCache.reportingOfficers,
        departments: dataCache.departments,
        designations: dataCache.designations,
        lastFetchTime: 0
      });
      
      toast.success("Data saved successfully! Item moved to history.");
      setShowModal(false);
      fetchJoiningData();

    } catch (error) {
      console.error("Update error:", error);
      toast.error(`Update failed: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDOB = (dateString) => {
    if (!dateString) return "";

    if (dateString.includes('-')) {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const day = parts[2];
        const month = parts[1];
        const year = parts[0].slice(-2);
        return `${day}/${month}/${year}`;
      }
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear().toString().slice(-2);

    return `${day}/${month}/${year}`;
  };

  const filteredPendingData = pendingData.filter((item) => {
    const matchesSearch =
      item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.joiningNo?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredHistoryData = historyData.filter((item) => {
    const matchesSearch =
      item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.joiningNo?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold  ">After Joining Work </h1>
      </div>

      <div className="bg-white  p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search Something..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300   rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white   text-gray-500    "
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2  text-gray-500  "
            />
          </div>
        </div>
      </div>

      <div className="bg-white  rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-300  ">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${activeTab === "pending"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              onClick={() => setActiveTab("pending")}
            >
              <Clock size={16} className="inline mr-2" />
              Pending ({filteredPendingData.length})
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${activeTab === "history"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              onClick={() => setActiveTab("history")}
            >
              <CheckCircle size={16} className="inline mr-2" />
              History ({filteredHistoryData.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "pending" && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serial Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Father Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Of Joining
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Designation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Planned Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white">
                  {error ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <p className="text-red-500">Error: {error}</p>
                        <button
                          onClick={fetchJoiningData}
                          className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ) : filteredPendingData.length > 0 ? (
                    filteredPendingData.map((item, index) => (
                      <tr key={index} className="hover:bg-white">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleAfterJoiningClick(item)}
                            className="px-3 py-1 bg-indigo-700 text-white rounded-md text-sm"
                          >
                            Process
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.joiningNo || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.candidateName || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.fatherName || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDOB(item.dateOfJoining)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.designation || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.department || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateForDisplay(item.plannedDate)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <p className="text-gray-500">
                          No pending after joining work found.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "history" && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Serial Number</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Employee Code</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Name</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Salary Confirmation</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Reporting Officer</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Base Address</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Punch Code</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Official Email</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Email Password</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Bank A/C No.</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">IFSC Code</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Designation</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">PF / ESIC</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">ID Proof Copy</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Joining Letter</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Interview Assessment</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Attendance Mode</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Department</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Eligible PF</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Eligible ESIC</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Remarks</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Joining Place</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Next Increment</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Company Name</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Blood Group</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">ID Marks</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Manual / Document</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Laptop Details</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Laptop Image</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Mobile Name</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Mobile Image</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Item 1</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Item 1 Image</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Item 2</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Item 2 Image</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Item 3</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Item 3 Image</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Incentive Category</th>
                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {filteredHistoryData.length === 0 ? (
                    <tr>
                      <td colSpan="38" className="px-6 py-12 text-center text-gray-500">
                        No history found.
                      </td>
                    </tr>
                  ) : (
                    filteredHistoryData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-700">{item.joiningNo}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.employeeCode}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.candidateName}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.salaryConfirmation}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.reportingOfficer}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.baseAddress}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.punchCode}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.officialEmail}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.emailPassword}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.currentBankAccountNo}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.currentBankIfsc}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.designation}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.pfEsic || "-"}</td>
                        
                        <td className="px-4 py-2 text-sm">
                          {item.idProofCopy ? (
                            <a href={item.idProofCopy} target="_blank" rel="noopener noreferrer" 
                               className="text-blue-600 underline hover:text-blue-800">
                              View
                            </a>
                          ) : "-"}
                        </td>
                        
                        <td className="px-4 py-2 text-sm">
                          {item.joiningLetter ? (
                            <a href={item.joiningLetter} target="_blank" rel="noopener noreferrer" 
                               className="text-blue-600 underline hover:text-blue-800">
                              View
                            </a>
                          ) : "-"}
                        </td>
                        
                        <td className="px-4 py-2 text-sm">
                          {item.interviewAssessmentSheet ? (
                            <a href={item.interviewAssessmentSheet} target="_blank" rel="noopener noreferrer" 
                               className="text-blue-600 underline hover:text-blue-800">
                              View
                            </a>
                          ) : "-"}
                        </td>
                        
                        <td className="px-4 py-2 text-sm text-gray-700">{item.attendanceMode}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.department2}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.eligibleForPF}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.eligibleForESIC}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.remarks}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.joiningPlace}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{formatDateForDisplay(item.nextSalaryIncrementDate)}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.companyName}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.bloodGroup}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.identificationMarks}</td>
                        
                        <td className="px-4 py-2 text-sm">
                          {item.manualImageUrl ? (
                            <a href={item.manualImageUrl} target="_blank" rel="noopener noreferrer" 
                               className="text-blue-600 underline hover:text-blue-800">
                              View
                            </a>
                          ) : "-"}
                        </td>
                        
                        <td className="px-4 py-2 text-sm text-gray-700">{item.laptopDetails}</td>
                        
                        <td className="px-4 py-2 text-sm">
                          {item.laptopImage ? (
                            <a href={item.laptopImage} target="_blank" rel="noopener noreferrer" 
                               className="text-blue-600 underline hover:text-blue-800">
                              View
                            </a>
                          ) : "-"}
                        </td>
                        
                        <td className="px-4 py-2 text-sm text-gray-700">{item.mobileName}</td>
                        
                        <td className="px-4 py-2 text-sm">
                          {item.mobileImage ? (
                            <a href={item.mobileImage} target="_blank" rel="noopener noreferrer" 
                               className="text-blue-600 underline hover:text-blue-800">
                              View
                            </a>
                          ) : "-"}
                        </td>
                        
                        <td className="px-4 py-2 text-sm text-gray-700">{item.item1}</td>
                        
                        <td className="px-4 py-2 text-sm">
                          {item.item1Image ? (
                            <a href={item.item1Image} target="_blank" rel="noopener noreferrer" 
                               className="text-blue-600 underline hover:text-blue-800">
                              View
                            </a>
                          ) : "-"}
                        </td>
                        
                        <td className="px-4 py-2 text-sm text-gray-700">{item.item2}</td>
                        
                        <td className="px-4 py-2 text-sm">
                          {item.item2Image ? (
                            <a href={item.item2Image} target="_blank" rel="noopener noreferrer" 
                               className="text-blue-600 underline hover:text-blue-800">
                              View
                            </a>
                          ) : "-"}
                        </td>
                        
                        <td className="px-4 py-2 text-sm text-gray-700">{item.item3}</td>
                        
                        <td className="px-4 py-2 text-sm">
                          {item.item3Image ? (
                            <a href={item.item3Image} target="_blank" rel="noopener noreferrer" 
                               className="text-blue-600 underline hover:text-blue-800">
                              View
                            </a>
                          ) : "-"}
                        </td>
                        
                        <td className="px-4 py-2 text-sm text-gray-700">{item.incentiveCategory}</td>
                        
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 text-xs bg-green-500 text-white rounded-full">Completed</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && selectedItem && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl my-8">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-medium text-gray-500">
                After Joining Work - {selectedItem.candidateName}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              {/* Modal content remains exactly the same */}
              {/* All form sections, inputs, and fields are preserved */}
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={selectedItem.joiningNo}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Employee Code *
                  </label>
                  <input
                    type="text"
                    name="employeeCode"
                    value={formData.employeeCode}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700 font-semibold"
                    placeholder="Auto-generated"
                    required
                    readOnly
                  />
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Auto-generated from last employee code
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    value={selectedItem.candidateName}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500"
                  />
                </div>
                {/* Designation - Editable dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Designation *
                  </label>
                  <select
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
                    required
                  >
                    <option value="">Select Designation</option>
                    {designations.map((designation, index) => (
                      <option key={index} value={designation}>
                        {designation}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 text-sm"
                    placeholder="Or type custom designation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Reporting Officer *
                  </label>
                  <select
                    name="reportingOfficer"
                    value={formData.reportingOfficer}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
                    required
                  >
                    <option value="">Select Reporting Officer</option>
                    {reportingOfficers.map((officer, index) => (
                      <option key={index} value={officer}>
                        {officer}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Salary Confirmation *
                  </label>
                  <select
                    name="salaryConfirmation"
                    value={formData.salaryConfirmation}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
                    required
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                {formData.salaryConfirmation === "Yes" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Salary Amount *
                    </label>
                    <input
                      type="text"
                      name="salaryAmount"
                      value={formData.salaryAmount}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
                      placeholder="Enter salary amount"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Incentive Category *
                  </label>
                  <select
                    name="incentiveCategory"
                    value={formData.incentiveCategory}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
                    required
                  >
                    <option value="">Select Incentive Category</option>
                    <option value="MIS Basis">MIS Basis</option>
                    <option value="Non Mis">Non Mis</option>
                    <option value="OT Basis">OT Basis</option>
                    <option value="Per MT">Per MT</option>
                  </select>
                </div>
              </div>

              {/* Bank Details (Pre-filled) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Bank Account No.
                  </label>
                  <input
                    type="text"
                    value={selectedItem.accountNo}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={selectedItem.ifscCode}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500"
                  />
                </div>
              </div>

              {/* PF */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    PF Number
                  </label>
                  <input
                    type="text"
                    name="pf"
                    value={formData.pf}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
                    placeholder="Enter PF number"
                  />
                </div>
              </div>

              {/* Base Address */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Base Address
                  </label>
                  <textarea
                    name="baseAddress"
                    value={formData.baseAddress}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
                    placeholder="Enter base address"
                  />
                </div>
              </div>

              {/* NEW FIELDS SECTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Attendance Mode *
                  </label>
                  <select
                    name="attendanceMode"
                    value={formData.attendanceMode}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
                    required
                  >
                    <option value="">Select Mode</option>
                    <option value="outsider">Outsider</option>
                    <option value="machine">Machine</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Department *
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept, index) => (
                      <option key={index} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Eligible for PF *
                  </label>
                  <select
                    name="eligibleForPF"
                    value={formData.eligibleForPF}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
                    required
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Eligible for ESIC *
                  </label>
                  <select
                    name="eligibleForESIC"
                    value={formData.eligibleForESIC}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
                    required
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Next Salary Increment Date *
                  </label>
                  <input
                    type="date"
                    name="nextSalaryIncrementDate"
                    value={formData.nextSalaryIncrementDate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Blood Group
                  </label>
                  <input
                    type="text"
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700"
                    placeholder="Auto-filled from database"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Identification Marks
                  </label>
                  <textarea
                    name="identificationMarks"
                    value={formData.identificationMarks}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700"
                    placeholder="Auto-filled from database"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Company Name *
                  </label>
                  <select
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
                    required
                  >
                    <option value="">Select Company</option>
                    {companyOptions.map((company, index) => (
                      <option key={index} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Remarks - Full width */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
                    placeholder="Enter any remarks"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Joining Place *
                  </label>
                  <select
                    name="joiningPlace"
                    value={formData.joiningPlace}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700"
                    required
                  >
                    <option value="">Select Joining Place</option>
                    {joiningPlaceOptions.map((place, index) => (
                      <option key={index} value={place}>
                        {place}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Document Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    ID Proof Copy (Column AL)
                  </label>
                  <input
                    type="file"
                    id="idProofCopy"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleImageUpload(e, "idProofCopy")}
                    className="hidden"
                  />
                  <label
                    htmlFor="idProofCopy"
                    className="cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {formData.idProofCopy ? formData.idProofCopy.name : "Upload ID Proof"}
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Joining Letter (Column AM)
                  </label>
                  <input
                    type="file"
                    id="joiningLetter"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleImageUpload(e, "joiningLetter")}
                    className="hidden"
                  />
                  <label
                    htmlFor="joiningLetter"
                    className="cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {formData.joiningLetter ? formData.joiningLetter.name : "Upload Joining Letter"}
                  </label>
                </div>
              </div>

              {/* Interview Assessment Sheet Upload */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Interview Assessment Sheet (Column DC)
                  </label>
                  <input
                    type="file"
                    id="interviewAssessmentSheet"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleImageUpload(e, "interviewAssessmentSheet")}
                    className="hidden"
                  />
                  <label
                    htmlFor="interviewAssessmentSheet"
                    className="cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {formData.interviewAssessmentSheet ? formData.interviewAssessmentSheet.name : "Upload Interview Assessment Sheet"}
                  </label>
                </div>
              </div>

              {/* Checklist Items - All checklist functionality preserved */}
              <div className="space-y-3">
                <h4 className="text-md font-medium text-gray-500">
                  Checklist Items
                </h4>

                {/* Biometric Access */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="biometricAccess"
                    checked={formData.biometricAccess}
                    onChange={() => handleCheckboxChange("biometricAccess")}
                    className="h-4 w-4 text-gray-500 focus:ring-blue-500 border-gray-300 rounded bg-white"
                  />
                  <label
                    htmlFor="biometricAccess"
                    className="ml-2 text-sm text-gray-500"
                  >
                    Biometric Access
                  </label>
                </div>
                {formData.biometricAccess && (
                  <div className="mt-2 ml-6 p-3 bg-gray-50 rounded-md">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Punch Code
                        </label>
                        <input
                          type="text"
                          name="punchCode"
                          value={formData.punchCode}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder="Enter punch code"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Official Email ID */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="officialEmailId"
                      checked={formData.officialEmailId}
                      onChange={() => handleCheckboxChange("officialEmailId")}
                      className="h-4 w-4 text-gray-500 focus:ring-blue-500 border-gray-300 rounded bg-white"
                    />
                    <label
                      htmlFor="officialEmailId"
                      className="ml-2 text-sm text-gray-500"
                    >
                      Official Email ID
                    </label>
                  </div>
                  {formData.officialEmailId && (
                    <div className="mt-2 ml-6 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-md">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Email ID
                        </label>
                        <input
                          type="text"
                          name="emailId"
                          value={formData.emailId}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder="Enter email ID"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          name="emailPassword"
                          value={formData.emailPassword}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder="Enter password"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Assign Assets - UPDATED SECTION WITH ADD BUTTON */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="assignAssets"
                    checked={formData.assignAssets}
                    onChange={() => handleCheckboxChange("assignAssets")}
                    className="h-4 w-4 text-gray-500 focus:ring-blue-500 border-gray-300 rounded bg-white"
                  />
                  <label
                    htmlFor="assignAssets"
                    className="ml-2 text-sm text-gray-500"
                  >
                    Assign Assets
                  </label>
                </div>
                {formData.assignAssets && (
                  <div className="mt-2 ml-6 p-3 bg-gray-50 rounded-md space-y-4">
                    {/* Laptop - Always visible */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Laptop Name
                        </label>
                        <input
                          type="text"
                          name="laptop"
                          value={formData.laptop}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder="Enter laptop name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Laptop Image
                        </label>
                        <input
                          type="file"
                          id="laptopImage"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, "laptopImage")}
                          className="hidden"
                        />
                        <label
                          htmlFor="laptopImage"
                          className="cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center justify-center w-full"
                        >
                          {formData.laptopImage ? "Change Image" : formData.laptopImageUrl ? "Replace Image" : "Upload Image"}
                        </label>
                        {(formData.laptopImageUrl || formData.laptopImage) && (
                          <img
                            src={formData.laptopImage ? URL.createObjectURL(formData.laptopImage) : formData.laptopImageUrl}
                            alt="Laptop"
                            className="mt-2 h-20 w-full object-contain rounded border"
                          />
                        )}
                      </div>
                    </div>

                    {/* Mobile - Always visible */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Mobile Name
                        </label>
                        <input
                          type="text"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder="Enter mobile name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Mobile Image
                        </label>
                        <input
                          type="file"
                          id="mobileImage"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, "mobileImage")}
                          className="hidden"
                        />
                        <label
                          htmlFor="mobileImage"
                          className="cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center justify-center w-full"
                        >
                          {formData.mobileImage ? "Change Image" : formData.mobileImageUrl ? "Replace Image" : "Upload Image"}
                        </label>
                        {(formData.mobileImageUrl || formData.mobileImage) && (
                          <img
                            src={formData.mobileImage ? URL.createObjectURL(formData.mobileImage) : formData.mobileImageUrl}
                            alt="Mobile"
                            className="mt-2 h-20 w-full object-contain rounded border"
                          />
                        )}
                      </div>
                    </div>

                    {/* Dynamic Items */}
                    {formData.assets.map((asset, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border border-gray-300 rounded-md relative">
                        <button
                          type="button"
                          onClick={() => {
                            const newAssets = formData.assets.filter((_, i) => i !== index);
                            setFormData(prev => ({ ...prev, assets: newAssets }));
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          <X size={14} />
                        </button>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Item {index + 3} Name
                          </label>
                          <input
                            type="text"
                            value={asset.name}
                            onChange={(e) => {
                              const newAssets = [...formData.assets];
                              newAssets[index].name = e.target.value;
                              setFormData(prev => ({ ...prev, assets: newAssets }));
                            }}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            placeholder="Enter item name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Item {index + 3} Image
                          </label>
                          <input
                            type="file"
                            id={`assetImage${index}`}
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const newAssets = [...formData.assets];
                                newAssets[index].image = file;
                                setFormData(prev => ({ ...prev, assets: newAssets }));
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor={`assetImage${index}`}
                            className="cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center justify-center w-full"
                          >
                            {asset.image ? "Change Image" : asset.imageUrl ? "Replace Image" : "Upload Image"}
                          </label>
                          {(asset.imageUrl || asset.image) && (
                            <img
                              src={asset.image ? URL.createObjectURL(asset.image) : asset.imageUrl}
                              alt={`Item ${index + 3}`}
                              className="mt-2 h-20 w-full object-contain rounded border"
                            />
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Add Item Button */}
                    {formData.assets.length < 3 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (formData.assets.length < 3) {
                            setFormData(prev => ({
                              ...prev,
                              assets: [...prev.assets, { name: '', image: null, imageUrl: '' }]
                            }));
                          }
                        }}
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 flex items-center justify-center"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Add Item (Max 3)
                      </button>
                    )}

                    {/* Manual Image Upload */}
                    <div className="space-y-2 border-t pt-4">
                      <label className="block text-sm font-medium text-gray-500">
                        Upload Manual/Document
                      </label>
                      <input
                        type="file"
                        id="manualImage"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleImageUpload(e, "manualImage")}
                        className="hidden"
                      />
                      <label
                        htmlFor="manualImage"
                        className="cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center justify-center w-full"
                      >
                        {formData.manualImage ? "Change Manual" : formData.manualImageUrl ? "Replace Manual" : "Upload Manual"}
                      </label>
                      {(formData.manualImageUrl || formData.manualImage) && (
                        <img
                          src={formData.manualImage ? URL.createObjectURL(formData.manualImage) : formData.manualImageUrl}
                          alt="Manual"
                          className="mt-2 h-32 w-full object-contain rounded border"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white bg-indigo-700 rounded-md hover:bg-indigo-800 min-h-[42px] flex items-center justify-center ${submitting ? "opacity-90 cursor-not-allowed" : ""
                    }`}
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin h-4 w-4 text-white mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AfterJoiningWork;