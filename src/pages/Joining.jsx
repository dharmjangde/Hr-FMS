import React, { useState, useEffect } from 'react';
import { Search, Users, Clock, CheckCircle, Eye, X, Download, Upload, Share } from 'lucide-react';
import toast from 'react-hot-toast';

const Joining = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showJoiningModal, setShowJoiningModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [joiningData, setJoiningData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [error, setError] = useState(null);
  const [followUpData, setFollowUpData] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareFormData, setShareFormData] = useState({
    recipientName: '',
    recipientEmail: '',
    subject: 'Candidate Joining Details',
    message: 'Please find the candidate joining details attached below.',
  });
  const [formData, setFormData] = useState({
    candidateSays: '',
    status: '',
    nextDate: ''
  });
  const [joiningFormData, setJoiningFormData] = useState({
    joiningId: '',
    nameAsPerAadhar: '',
    fatherName: '',
    dateOfJoining: '',
    joiningPlace: '',
    designation: '',
    salary: '',
    aadharFrontPhoto: null,
    aadharBackPhoto: null,
    panCard: null,
    candidatePhoto: null,
    currentAddress: '',
    addressAsPerAadhar: '',
    dobAsPerAadhar: '',
    gender: '',
    mobileNo: '',
    familyMobileNo: '',
    relationshipWithFamily: '',
    pastPfId: '',
    currentBankAc: '',
    ifscCode: '',
    branchName: '',
    bloodGroup: '',
    identificationMarks: '',
    bankPassbookPhoto: null,
    personalEmail: '',
    esicNo: '',
    highestQualification: '',
    pfEligible: '',
    esicEligible: '',
    joiningCompanyName: '',
    emailToBeIssue: '',
    issueMobile: '',
    issueLaptop: '',
    aadharCardNo: '',
    modeOfAttendance: '',
    qualificationPhoto: null,
    paymentMode: '',
    salarySlip: null,
    resumeCopy: null,
    department: '',
    equipment: '',
    previousCompanyName: '',
    previousCompanyAddress: '',
    offerLetter: null,
    incrementLetter: null,
    paySlip: null,
    resignationLetter: null,
    enquiryNo: '',
  });

  const handleShareClick = (item) => {
    setSelectedItem(item);
    const shareLink = `https://hr-fms-passary-joining-form.vercel.app/?enquiry=${item.candidateEnquiryNo || ''}`;

    setShareFormData({
      recipientName: item.candidateName || '',
      recipientEmail: item.candidateEmail || '',
      subject: 'Candidate Joining Details - ' + item.candidateName,
      message: `Dear Recipient,\n\nPlease find the joining details for candidate ${item.candidateName} who is applying for the position of ${item.applyingForPost}.\n\nCandidate Details:\n- Name: ${item.candidateName}\n- Position: ${item.applyingForPost}\n- Department: ${item.department}\n- Phone: ${item.candidatePhone}\n- Email: ${item.candidateEmail}\n- Candidate Enquiry Number: ${item.candidateEnquiryNo}\n\nJoining Form Link: ${shareLink}\n\nBest regards,\nHR Team`,
    });

    console.log("Share Link:", shareLink);
    setShowShareModal(true);
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const documents = [{
        name: selectedItem.candidateName,
        serialNo: selectedItem.candidateEnquiryNo,
        documentType: selectedItem.applyingForPost,
        category: selectedItem.department,
        imageUrl: selectedItem.candidatePhoto || ''
      }];

      const URL = 'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec';

      const params = new URLSearchParams();
      params.append('action', 'shareViaEmail');
      params.append('recipientEmail', shareFormData.recipientEmail);
      params.append('subject', shareFormData.subject);
      params.append('message', shareFormData.message);
      params.append('documents', JSON.stringify(documents));

      const response = await fetch(URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to send email');
      }

      toast.success('Details shared successfully!');
      setShowShareModal(false);
    } catch (error) {
      console.error('Error sharing details:', error);
      toast.error(`Failed to share details: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareInputChange = (e) => {
    const { name, value } = e.target;
    setShareFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

const fetchJoiningData = async () => {
  setLoading(true);
  setTableLoading(true);
  setError(null);

  try {
    // Cache key for storing data
    const cacheKey = 'joiningDataCache';
    const cacheTimestampKey = 'joiningDataTimestamp';
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

    // Check if we have cached data that's still valid
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTimestamp = localStorage.getItem(cacheTimestampKey);
    const now = Date.now();

    if (cachedData && cachedTimestamp && (now - parseInt(cachedTimestamp)) < CACHE_DURATION) {
      const { joiningData: cachedJoiningData, historyData: cachedHistoryData } = JSON.parse(cachedData);
      setJoiningData(cachedJoiningData);
      setHistoryData(cachedHistoryData);
      setLoading(false);
      setTableLoading(false);
      return;
    }

    // Fetch data with timeout
    const fetchWithTimeout = async (url, timeout = 15000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };

    const baseUrl = "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec";
    
    const fetchPromises = [
      fetchWithTimeout(`${baseUrl}?sheet=ENQUIRY&action=fetch`),
      fetchWithTimeout(`${baseUrl}?sheet=Follow%20-%20Up&action=fetch`),
      fetchWithTimeout(`${baseUrl}?sheet=JOINING&action=fetch`)
    ];

    const results = await Promise.allSettled(fetchPromises);

    // Process ENQUIRY data
    const enquiryResult = results[0];
    if (enquiryResult.status === 'rejected') {
      throw new Error(`Failed to fetch ENQUIRY data: ${enquiryResult.reason.message}`);
    }

    const enquiryData = enquiryResult.value;
    
    if (!enquiryData.success || !enquiryData.data || enquiryData.data.length < 7) {
      throw new Error(enquiryData.error || "Not enough rows in enquiry sheet data");
    }

    // Create header index map
    const enquiryHeaders = enquiryData.data[5].map((h) => (h || '').toString().trim());
    
    const headerMap = {};
    const headerNames = [
      "Timestamp", "Indent Number", "Candidate Enquiry Number", 
      "Applying For the Post", "Department", "Candidate Name", 
      "DOB", "Candidate Phone Number", "Candidate Email",
      "Previous Company Name", "Job Experience", "Last Salary Drawn",
      "Previous Position", "Reason Of Leaving Previous Company",
      "Marital Status", "Last Employer Mobile Number", "Candidate Photo",
      "Reference By", "Present Address", "Aadhar Number"
    ];
    
    headerNames.forEach(name => {
      const index = enquiryHeaders.findIndex(h => h === name);
      if (index !== -1) {
        headerMap[name] = index;
      } else {
        console.warn(`Header "${name}" not found in ENQUIRY sheet`);
      }
    });

    // Process enquiry data
    const enquiryDataRows = enquiryData.data.slice(6);
    const processedEnquiryData = [];

    for (let i = 0; i < enquiryDataRows.length; i++) {
      const row = enquiryDataRows[i];
      processedEnquiryData.push({
        id: row[0] || `row-${i + 7}`, // Use timestamp or row number
        indentNo: row[headerMap["Indent Number"]] || "",
        candidateEnquiryNo: row[headerMap["Candidate Enquiry Number"]] || "",
        applyingForPost: row[headerMap["Applying For the Post"]] || "",
        department: row[headerMap["Department"]] || "",
        candidateName: row[headerMap["Candidate Name"]] || "",
        candidateDOB: row[headerMap["DOB"]] || "",
        candidatePhone: row[headerMap["Candidate Phone Number"]] || "",
        candidateEmail: row[headerMap["Candidate Email"]] || "",
        previousCompany: row[headerMap["Previous Company Name"]] || "",
        jobExperience: row[headerMap["Job Experience"]] || "",
        lastSalary: row[headerMap["Last Salary Drawn"]] || "",
        previousPosition: row[headerMap["Previous Position"]] || "",
        reasonForLeaving: row[headerMap["Reason Of Leaving Previous Company"]] || "",
        maritalStatus: row[headerMap["Marital Status"]] || "",
        lastEmployerMobile: row[headerMap["Last Employer Mobile Number"]] || "",
        candidatePhoto: row[16] || "",
        candidateResume: row[19] || "",
        referenceBy: row[headerMap["Reference By"]] || "",
        presentAddress: row[headerMap["Present Address"]] || "",
        aadharNo: row[headerMap["Aadhar Number"]] || "",
        designation: row[headerMap["Applying For the Post"]] || "",
        // Debug these columns
        actualDate: row[26] || "",
        plannedDate: row[27] || "",
        actualJoiningDate: row[28] || ""
      });
    }

    console.log("Sample enquiry data:", processedEnquiryData.slice(0, 3));
    console.log("ActualJoiningDate column values:", processedEnquiryData.map(item => item.actualJoiningDate).filter(Boolean));

    // Process FOLLOW-UP data
    const followUpResult = results[1];
    
    if (followUpResult.status === 'fulfilled' && followUpResult.value.success && followUpResult.value.data) {
      const rawFollowUpData = followUpResult.value.data || followUpResult.value;
      const followUpRows = Array.isArray(rawFollowUpData[0])
        ? rawFollowUpData.slice(1)
        : rawFollowUpData;

      // Create lookup map for follow-up status
      const followUpMap = new Map();
      followUpRows.forEach(row => {
        const enquiryNo = (row[2] || "").toString().trim();
        const status = (row[3] || "").toString().trim();
        if (enquiryNo) {
          followUpMap.set(enquiryNo, status);
        }
      });

      console.log("Follow-up map entries:", Array.from(followUpMap.entries()).slice(0, 5));

      // Get candidate enquiry numbers that have "Joining" status in follow-up
      const joiningCandidates = new Set();
      followUpMap.forEach((status, enquiryNo) => {
        if (status.toLowerCase() === 'joining') {
          joiningCandidates.add(enquiryNo);
        }
      });

      console.log("Candidates with 'Joining' status:", Array.from(joiningCandidates));

      // Filter enquiry data to only include candidates with "Joining" status
      const joiningItems = processedEnquiryData.filter(item => {
        return joiningCandidates.has(item.candidateEnquiryNo);
      });

      console.log("Joining items count:", joiningItems.length);

      // IMPORTANT FIX: Get data from JOINING sheet to determine history
      const joiningResult = results[2];
      const joinedCandidates = new Set();
      
      if (joiningResult.status === 'fulfilled' && joiningResult.value.success && joiningResult.value.data) {
        const joiningData = joiningResult.value.data;
        const joiningDataRows = joiningData.slice(1); // Skip header row
        
        // Extract enquiry numbers from column 89 (0-based index)
        joiningDataRows.forEach(row => {
          const enquiryNo = (row[89] || "").toString().trim();
          if (enquiryNo) {
            joinedCandidates.add(enquiryNo);
          }
        });
        
        console.log("Already joined candidates:", Array.from(joinedCandidates));
      }

      // NEW LOGIC: Separate pending vs history
      const pendingData = [];
      const historyData = [];

      joiningItems.forEach(item => {
        // If candidate has a record in JOINING sheet, they are history
        if (joinedCandidates.has(item.candidateEnquiryNo)) {
          historyData.push(item);
        } else {
          pendingData.push(item);
        }
      });

      console.log("Pending count:", pendingData.length);
      console.log("History count:", historyData.length);

      // Process history data with JOINING sheet details
      if (joiningResult.status === 'fulfilled' && joiningResult.value.success && joiningResult.value.data) {
        const joiningData = joiningResult.value.data;
        const joiningDataRows = joiningData.slice(1);
        
        // Create lookup map for joining details
        const joiningMap = new Map();
        joiningDataRows.forEach(row => {
          const enquiryNo = (row[89] || "").toString().trim();
          if (enquiryNo) {
            joiningMap.set(enquiryNo, {
              previousCompanyName: row[83] || "",
              previousCompanyAddress: row[84] || "",
              offerLetter: row[85] || "",
              incrementLetter: row[86] || "",
              paySlip: row[87] || "",
              resignationLetter: row[88] || ""
            });
          }
        });

        // Enhance history items with joining data
        const processedHistoryData = historyData.map(item => {
          const joiningRecord = joiningMap.get(item.candidateEnquiryNo) || {};
          return {
            ...item,
            ...joiningRecord
          };
        });

        setHistoryData(processedHistoryData);
        setJoiningData(pendingData);

        // Cache the processed data
        const cacheData = {
          joiningData: pendingData,
          historyData: processedHistoryData
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        localStorage.setItem(cacheTimestampKey, now.toString());
      } else {
        // If JOINING sheet fetch failed
        setHistoryData([]);
        setJoiningData(pendingData);
      }

      // Also set followUpData for reference
      setFollowUpData(Array.from(followUpMap, ([enquiryNo, status]) => ({ enquiryNo, status })));

    } else {
      console.warn('Follow-up data fetch failed:', followUpResult.reason);
      // If follow-up data fails, show empty data
      setJoiningData([]);
      setHistoryData([]);
    }

  } catch (error) {
    console.error("Error fetching data:", error);
    
    // Try to load from cache even if it's expired
    try {
      const cacheKey = 'joiningDataCache';
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const { joiningData: cachedJoiningData, historyData: cachedHistoryData } = JSON.parse(cachedData);
        setJoiningData(cachedJoiningData);
        setHistoryData(cachedHistoryData);
        toast.success('Showing cached data. Some data may be outdated.');
      } else {
        setError(error.message);
        toast.error("Failed to fetch data");
      }
    } catch (cacheError) {
      setError(error.message);
      toast.error("Failed to fetch data");
    }
  } finally {
    setLoading(false);
    setTableLoading(false);
  }
};


useEffect(() => {
  let isMounted = true;
  
  const fetchData = async () => {
    if (isMounted) {
      await fetchJoiningData();
    }
  };
  
  fetchData();
  
  // Cleanup function
  return () => {
    isMounted = false;
  };
}, []);

  useEffect(() => {
    fetchJoiningData();
  }, []);

  const handleViewClick = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleJoiningClick = (item) => {
    setSelectedItem(item);
    setJoiningFormData({
      joiningId: '',
      nameAsPerAadhar: item.candidateName || '',
      fatherName: '',
      dateOfJoining: '',
      joiningPlace: '',
      designation: item.designation || '',
      salary: '',
      bloodGroup: '',
      identificationMarks: '',
      aadharFrontPhoto: null,
      aadharBackPhoto: null,
      panCard: null,
      candidatePhoto: null,
      currentAddress: item.presentAddress || '',
      addressAsPerAadhar: '',
      dobAsPerAadhar: formatDOB(item.candidateDOB) || '',
      gender: '',
      mobileNo: item.candidatePhone || '',
      familyMobileNo: '',
      relationshipWithFamily: '',
      pastPfId: '',
      currentBankAc: '',
      ifscCode: '',
      branchName: '',
      bankPassbookPhoto: null,
      personalEmail: item.candidateEmail || '',
      esicNo: '',
      highestQualification: '',
      pfEligible: '',
      esicEligible: '',
      joiningCompanyName: '',
      emailToBeIssue: '',
      issueMobile: '',
      issueLaptop: '',
      aadharCardNo: item.aadharNo || '',
      modeOfAttendance: '',
      qualificationPhoto: null,
      paymentMode: '',
      salarySlip: null,
      resumeCopy: null,
      department: item.department || '',
      equipment: '',
      previousCompanyName: item.previousCompany || '',
      previousCompanyAddress: '',
      offerLetter: null,
      incrementLetter: null,
      paySlip: null,
      resignationLetter: null,
      enquiryNo: item.candidateEnquiryNo || '',
    });
    setShowJoiningModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';

    let date;

    if (dateString instanceof Date) {
      date = dateString;
    } else if (typeof dateString === 'string') {
      if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          date = new Date(parts[2], parts[1] - 1, parts[0]);
        }
      } else {
        date = new Date(dateString);
      }
    }

    if (!date || isNaN(date.getTime())) {
      return dateString || '';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const formatDOB = (dateString) => {
    if (!dateString) return '';

    if (typeof dateString === 'string' && dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);

        if (day > 0 && day <= 31 && month > 0 && month <= 12) {
          if (day > 12) {
            return dateString;
          } else if (month > 12) {
            return `${parts[1]}/${parts[0]}/${parts[2]}`;
          }
        }
      }
    }

    let date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const formatDateForStorage = (dateString) => {
    if (!dateString) return '';

    if (typeof dateString === 'string' && dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);

        if (day > 0 && day <= 31 && month > 0 && month <= 12 && day > 12) {
          return `${parts[1]}/${parts[0]}/${parts[2]}`;
        }
      }
    }

    let date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  };

  const handleJoiningInputChange = (e) => {
    const { name, value } = e.target;
    setJoiningFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setJoiningFormData(prev => ({
        ...prev,
        [fieldName]: file
      }));
    }
  };

  const postToJoiningSheet = async (rowData) => {
    const URL = 'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec';

    try {
      const params = new URLSearchParams();
      params.append('sheetName', 'JOINING');
      params.append('action', 'insert');
      params.append('rowData', JSON.stringify(rowData));

      const response = await fetch(URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Server returned unsuccessful response');
      }

      return data;
    } catch (error) {
      console.error('Full error details:', {
        error: error.message,
        stack: error.stack,
        rowData: rowData.slice(0, 30),
        timestamp: new Date().toISOString()
      });
      throw new Error(`Failed to update sheet: ${error.message}`);
    }
  };

  const uploadFileToDrive = async (file, folderId = '1Rb4DIzbZWSVyL5s_z4d0ntk0iM-JZWBq') => {
    try {
      const reader = new FileReader();
      const base64Data = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const params = new URLSearchParams();
      params.append('action', 'uploadFile');
      params.append('base64Data', base64Data);
      params.append('fileName', file.name);
      params.append('mimeType', file.type);
      params.append('folderId', folderId);

      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'File upload failed');
      }

      return data.fileUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(`Failed to upload file: ${error.message}`);
      throw error;
    }
  };

  const updateEnquirySheet = async (enquiryNo, timestamp) => {
    const URL = 'https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec';

    try {
      const params = new URLSearchParams();
      params.append('sheetName', 'ENQUIRY');
      params.append('action', 'updateEnquiryColumn');
      params.append('enquiryNo', enquiryNo);
      params.append('timestamp', timestamp);

      const response = await fetch(URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error updating enquiry sheet:', error);
      throw new Error(`Failed to update enquiry sheet: ${error.message}`);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobile = (mobile) => {
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(mobile);
  };

  const validateForm = () => {
    if (joiningFormData.mobileNo && !validateMobile(joiningFormData.mobileNo)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return false;
    }

    if (joiningFormData.familyMobileNo && !validateMobile(joiningFormData.familyMobileNo)) {
      toast.error('Please enter a valid 10-digit family mobile number');
      return false;
    }

    if (joiningFormData.personalEmail && !validateEmail(joiningFormData.personalEmail)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    if (!joiningFormData.aadharFrontPhoto) {
      toast.error('Aadhar Card front photo is required');
      return false;
    }

    if (!joiningFormData.bankPassbookPhoto) {
      toast.error('Bank Passbook photo is required');
      return false;
    }

    if (!joiningFormData.bloodGroup) {
      toast.error('Blood Group is required');
      return false;
    }

    return true;
  };

  const handleJoiningSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setSubmitting(true);

    try {
      const joiningSheetResponse = await fetch(
        "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch"
      );

      let serialNumber = 'SN-001';

      if (joiningSheetResponse.ok) {
        const joiningResult = await joiningSheetResponse.json();
        if (joiningResult.success && joiningResult.data && joiningResult.data.length > 1) {
          const lastRow = joiningResult.data[joiningResult.data.length - 1];
          const lastId = lastRow[1];

          if (lastId && lastId.startsWith('SN-')) {
            const lastNumber = parseInt(lastId.split('-')[1]);
            const newNumber = lastNumber + 1;
            serialNumber = 'SN-' + String(newNumber).padStart(3, '0');
          }
        }
      }

      const uploadPromises = {};
      const fileFields = [
        'aadharFrontPhoto',
        'aadharBackPhoto',
        'panCard',
        'candidatePhoto',
        'bankPassbookPhoto',
        'qualificationPhoto',
        'salarySlip',
        'resumeCopy',
        'offerLetter',
        'incrementLetter',
        'paySlip',
        'resignationLetter'
      ];

      for (const field of fileFields) {
        if (joiningFormData[field]) {
          uploadPromises[field] = uploadFileToDrive(joiningFormData[field]);
        } else {
          uploadPromises[field] = Promise.resolve('');
        }
      }

      const uploadedUrls = await Promise.all(
        Object.values(uploadPromises).map(promise =>
          promise.catch(error => {
            console.error('Upload failed:', error);
            return '';
          })
        )
      );

      const fileUrls = {};
      Object.keys(uploadPromises).forEach((field, index) => {
        fileUrls[field] = uploadedUrls[index];
      });

      const formatDateForSheet = (dateString) => {
        if (!dateString) return '';

        if (typeof dateString === 'string' && dateString.includes('/')) {
          const parts = dateString.split('/');
          if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const year = parseInt(parts[2]);

            if (day > 0 && day <= 31 && month > 0 && month <= 12) {
              const paddedDay = String(day).padStart(2, '0');
              const paddedMonth = String(month).padStart(2, '0');
              return `${paddedDay}/${paddedMonth}/${year}`;
            }
          }
        }

        if (typeof dateString === 'string' && dateString.includes('-')) {
          const parts = dateString.split('-');
          if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
        }

        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return dateString;
        }

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
      };

      const formatDOBForSheet = (dateString) => {
        if (!dateString) return '';

        if (typeof dateString === 'string' && dateString.includes('-')) {
          const parts = dateString.split('-');
          if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
        }

        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return dateString;
        }

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
      };

      const now = new Date();
      const formattedTimestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const rowData = [];

      for (let i = 0; i < 120; i++) {
        rowData[i] = '';
      }

      rowData[0] = formattedTimestamp;
      rowData[1] = serialNumber;
      rowData[2] = selectedItem.candidateName || '';
      rowData[3] = joiningFormData.fatherName || '';
      rowData[4] = formatDateForSheet(joiningFormData.dateOfJoining) || '';
      rowData[5] = selectedItem.designation || selectedItem.applyingForPost || '';
      rowData[6] = fileUrls.aadharFrontPhoto || '';
      rowData[7] = selectedItem.candidatePhoto || fileUrls.candidatePhoto || '';
      rowData[8] = joiningFormData.currentAddress || selectedItem.presentAddress || '';
      rowData[9] = formatDOBForSheet(joiningFormData.dobAsPerAadhar) || '';
      rowData[10] = joiningFormData.gender || '';
      rowData[11] = joiningFormData.mobileNo || selectedItem.candidatePhone || '';
      rowData[12] = joiningFormData.familyMobileNo || '';
      rowData[13] = joiningFormData.relationshipWithFamily || '';
      rowData[14] = joiningFormData.currentBankAc || '';
      rowData[15] = joiningFormData.ifscCode || '';
      rowData[16] = joiningFormData.branchName || '';
      rowData[17] = fileUrls.bankPassbookPhoto || '';
      rowData[18] = joiningFormData.personalEmail || selectedItem.candidateEmail || '';
      rowData[19] = joiningFormData.highestQualification || '';
      rowData[20] = selectedItem.department || '';
      rowData[21] = joiningFormData.aadharCardNo || selectedItem.aadharNo || '';
      rowData[22] = selectedItem.candidateResume || fileUrls.resumeCopy || '';
      rowData[83] = joiningFormData.previousCompanyName || selectedItem.previousCompany || '';
      rowData[84] = joiningFormData.previousCompanyAddress || '';
      rowData[85] = fileUrls.offerLetter || '';
      rowData[86] = fileUrls.incrementLetter || '';
      rowData[87] = fileUrls.paySlip || '';
      rowData[88] = fileUrls.resignationLetter || '';
      rowData[89] = joiningFormData.enquiryNo || selectedItem.candidateEnquiryNo || '';
      rowData[92] = joiningFormData.bloodGroup || '';
      rowData[93] = joiningFormData.identificationMarks || '';

      console.log("Submitting row data to JOINING sheet:", {
        timestamp: rowData[0],
        joiningId: rowData[1],
        name: rowData[2],
        currentAddress: rowData[8],
        dob: rowData[9],
        email: rowData[18],
        aadharNo: rowData[21],
        dateOfJoining: rowData[4],
        enquiryNo: rowData[89]
      });

      await postToJoiningSheet(rowData);

      console.log("Joining Form Data submitted successfully!");
      console.log("Joining ID:", serialNumber);
      console.log("Candidate Name:", selectedItem.candidateName);
      console.log("Current Address:", rowData[8]);
      console.log("Date of Birth:", rowData[9]);
      console.log("Email:", rowData[18]);
      console.log("Aadhar Number:", rowData[21]);

      toast.success('Employee added successfully! Joining ID: ' + serialNumber);
      setShowJoiningModal(false);
      setSelectedItem(null);
      fetchJoiningData();
    } catch (error) {
      console.error('Error submitting joining form:', error);
      toast.error(`Failed to submit joining form: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredJoiningData = joiningData.filter(item => {
    const matchesSearch = item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.applyingForPost?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.candidatePhone?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredHistoryData = historyData.filter(item => {
    const matchesSearch = item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.applyingForPost?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.candidatePhone?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Joining Management  </h1>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by name, post or phone number..."
              className="w-full pl-10 pr-4 py-2 border border-gray-400 border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 opacity-60"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-300 border-opacity-20">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${activeTab === "pending"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              onClick={() => setActiveTab("pending")}
            >
              <Clock size={16} className="inline mr-2" />
              Pending Joinings ({filteredJoiningData.length})
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

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "pending" && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Indent No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate Enquiry No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applying For Post
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Photo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resume
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="11" className="px-6 py-12 text-center">
                        <div className="flex justify-center flex-col items-center">
                          <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
                          <span className="text-gray-600 text-sm">
                            Loading pending joinings...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="11" className="px-6 py-12 text-center">
                        <p className="text-red-500">Error: {error}</p>
                        <button
                          onClick={fetchJoiningData}
                          className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ) : filteredJoiningData.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="px-6 py-12 text-center">
                        <p className="text-gray-500">
                          No pending joinings found.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredJoiningData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleJoiningClick(item)}
                              className="px-3 py-1 text-white bg-green-600 rounded-md hover:bg-opacity-90 text-sm"
                            >
                              Joining
                            </button>
                            {/* <button
                              onClick={() => handleShareClick(item)}
                              className="px-3 py-1 text-white bg-blue-600 rounded-md hover:bg-opacity-90 text-sm flex items-center"
                            >
                              <Share size={14} className="mr-1" />
                              Share
                            </button> */}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.indentNo || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidateEnquiryNo || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.applyingForPost || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.department || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidateName || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidatePhone || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidateEmail || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidatePhoto ? (
                            <a
                              href={item.candidatePhoto}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              View
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidateResume ? (
                            <a
                              href={item.candidateResume}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              View
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                            Joining Pending
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "history" && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate Enquiry No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applying For Post
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Previous Company Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Offer Letter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Increment Letter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pay Slip
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resignation Letter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="13" className="px-6 py-12 text-center">
                        <div className="flex justify-center flex-col items-center">
                          <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
                          <span className="text-gray-600 text-sm">
                            Loading history...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="13" className="px-6 py-12 text-center">
                        <p className="text-red-500">Error: {error}</p>
                        <button
                          onClick={fetchJoiningData}
                          className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ) : filteredHistoryData.length === 0 ? (
                    <tr>
                      <td colSpan="13" className="px-6 py-12 text-center">
                        <p className="text-gray-500">
                          No history records found.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredHistoryData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidateEnquiryNo || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidateName || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.department || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.applyingForPost || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidatePhone || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidateEmail || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.previousCompanyName || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.previousCompanyAddress || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.offerLetter ? (
                            <a
                              href={item.offerLetter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              View
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.incrementLetter ? (
                            <a
                              href={item.incrementLetter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              View
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.paySlip ? (
                            <a
                              href={item.paySlip}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              View
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.resignationLetter ? (
                            <a
                              href={item.resignationLetter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              View
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            Completed
                          </span>
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

      {/* Joining Modal - EXACT same as your original code */}
      {showJoiningModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-300">
              <h3 className="text-lg font-medium text-gray-900">
                Employee Joining Form
              </h3>
              <button
                onClick={() => setShowJoiningModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleJoiningSubmit} className="p-6 space-y-6">
              {/* Section 1: Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enquiry No.
                  </label>
                  <input
                    type="text"
                    name="enquiryNo"
                    value={joiningFormData.enquiryNo}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name As Per Aadhar
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedItem.candidateName}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Father Name
                  </label>
                  <input
                    type="text"
                    name="fatherName"
                    value={joiningFormData.fatherName}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Of Birth As per Aadhar *
                  </label>
                  <input
                    type="date"
                    name="dobAsPerAadhar"
                    value={joiningFormData.dobAsPerAadhar}
                    onChange={handleJoiningInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={joiningFormData.gender}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  >
                    <option value="">Select Gender </option>
                    <option value="Male">Male</option>
                    <option value="Female">Female  </option>
                    <option value="Other">Other </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedItem.department || ""}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700"
                  />
                </div>
              </div>

              {/* Section 2: Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile No. *
                  </label>
                  <input
                    type="tel"
                    name="mobileNo"
                    value={joiningFormData.mobileNo}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 10) {
                        handleJoiningInputChange({ target: { name: 'mobileNo', value } });
                      }
                    }}
                    maxLength="10"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                  {joiningFormData.mobileNo && !validateMobile(joiningFormData.mobileNo) && (
                    <p className="text-red-500 text-xs mt-1">Please enter a valid 10-digit mobile number</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Family Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="familyMobileNo"
                    value={joiningFormData.familyMobileNo}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 10) {
                        handleJoiningInputChange({ target: { name: 'familyMobileNo', value } });
                      }
                    }}
                    maxLength="10"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                  {joiningFormData.familyMobileNo && !validateMobile(joiningFormData.familyMobileNo) && (
                    <p className="text-red-500 text-xs mt-1">Please enter a valid 10-digit mobile number</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Email *
                  </label>
                  <input
                    type="email"
                    name="personalEmail"
                    value={joiningFormData.personalEmail}
                    onChange={handleJoiningInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                  {joiningFormData.personalEmail && !validateEmail(joiningFormData.personalEmail) && (
                    <p className="text-red-500 text-xs mt-1">Please enter a valid email address</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship With Family
                  </label>
                  <input
                    name="relationshipWithFamily"
                    value={joiningFormData.relationshipWithFamily}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                {/* Blood Group Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blood Group *
                  </label>
                  <select
                    name="bloodGroup"
                    value={joiningFormData.bloodGroup}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                    required
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>

                {/* Identification Marks Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Identification Marks
                  </label>
                  <textarea
                    name="identificationMarks"
                    value={joiningFormData.identificationMarks}
                    onChange={handleJoiningInputChange}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                    placeholder="Enter any visible identification marks..."
                  />
                </div>
              </div>

              {/* Section 3: Address Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Address
                  </label>
                  <textarea
                    name="currentAddress"
                    value={joiningFormData.currentAddress}
                    onChange={handleJoiningInputChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                    placeholder="Enter current address..."
                  />
                </div>
              </div>

              {/* Section 4: Employment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Of Joining
                  </label>
                  <input
                    type="date"
                    name="dateOfJoining"
                    value={joiningFormData.dateOfJoining}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedItem.designation}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Highest Qualification
                  </label>
                  <input
                    name="highestQualification"
                    value={joiningFormData.highestQualification}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
              </div>

              {/* Section 5: Bank & Financial Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aadhar Card Number
                  </label>
                  <input
                    type="text"
                    name="aadharCardNo"
                    value={joiningFormData.aadharCardNo}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                    placeholder="Enter Aadhar number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Bank Account No
                  </label>
                  <input
                    name="currentBankAc"
                    value={joiningFormData.currentBankAc}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IFSC Code
                  </label>
                  <input
                    name="ifscCode"
                    value={joiningFormData.ifscCode}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch Name
                  </label>
                  <input
                    name="branchName"
                    value={joiningFormData.branchName}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
              </div>

              {/* Section 6: Document Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aadhar Card (Front) *
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, "aadharFrontPhoto")}
                      className="hidden"
                      id="aadhar-front-upload"
                      required
                    />
                    <label
                      htmlFor="aadhar-front-upload"
                      className="flex items-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-gray-700"
                    >
                      <Upload size={16} className="mr-2" />
                      Upload Photo *
                    </label>
                    {joiningFormData.aadharFrontPhoto ? (
                      <span className="text-sm text-green-600">
                        {joiningFormData.aadharFrontPhoto.name}
                      </span>
                    ) : (
                      <span className="text-sm text-red-500">Required</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Photo Of Front Bank Passbook *
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, "bankPassbookPhoto")}
                      className="hidden"
                      id="bank-passbook-upload"
                      required
                    />
                    <label
                      htmlFor="bank-passbook-upload"
                      className="flex items-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-gray-700"
                    >
                      <Upload size={16} className="mr-2" />
                      Upload Photo *
                    </label>
                    {joiningFormData.bankPassbookPhoto ? (
                      <span className="text-sm text-green-600">
                        {joiningFormData.bankPassbookPhoto.name}
                      </span>
                    ) : (
                      <span className="text-sm text-red-500">Required</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 6: Previous Company Details */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4 border-b border-gray-200 pb-2">
                  Previous Company Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Previous Company Name
                    </label>
                    <input
                      type="text"
                      name="previousCompanyName"
                      value={joiningFormData.previousCompanyName}
                      onChange={handleJoiningInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Previous Company Address
                    </label>
                    <textarea
                      name="previousCompanyAddress"
                      value={joiningFormData.previousCompanyAddress}
                      onChange={handleJoiningInputChange}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* Section 7: Previous Company Document Uploads */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4 border-b border-gray-200 pb-2">
                  Previous Company Documents
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Offer Letter
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, "offerLetter")}
                        className="hidden"
                        id="offer-letter-upload"
                      />
                      <label
                        htmlFor="offer-letter-upload"
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-gray-700"
                      >
                        <Upload size={16} className="mr-2" />
                        Upload File
                      </label>
                      {joiningFormData.offerLetter && (
                        <span className="text-sm text-gray-700">
                          {joiningFormData.offerLetter.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Increment Letter
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, "incrementLetter")}
                        className="hidden"
                        id="increment-letter-upload"
                      />
                      <label
                        htmlFor="increment-letter-upload"
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-gray-700"
                      >
                        <Upload size={16} className="mr-2" />
                        Upload File
                      </label>
                      {joiningFormData.incrementLetter && (
                        <span className="text-sm text-gray-700">
                          {joiningFormData.incrementLetter.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pay Slip
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, "paySlip")}
                        className="hidden"
                        id="pay-slip-upload"
                      />
                      <label
                        htmlFor="pay-slip-upload"
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-gray-700"
                      >
                        <Upload size={16} className="mr-2" />
                        Upload File
                      </label>
                      {joiningFormData.paySlip && (
                        <span className="text-sm text-gray-700">
                          {joiningFormData.paySlip.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resignation Letter
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, "resignationLetter")}
                        className="hidden"
                        id="resignation-letter-upload"
                      />
                      <label
                        htmlFor="resignation-letter-upload"
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-gray-700"
                      >
                        <Upload size={16} className="mr-2" />
                        Upload File
                      </label>
                      {joiningFormData.resignationLetter && (
                        <span className="text-sm text-gray-700">
                          {joiningFormData.resignationLetter.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowJoiningModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white bg-indigo-700 rounded-md hover:bg-indigo-800 flex items-center justify-center min-h-[42px] ${submitting ? "opacity-90 cursor-not-allowed" : ""
                    }`}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
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
                      Submitting...
                    </>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal - EXACT same as your original code */}
      {showShareModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Share Details</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleShareSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  name="recipientName"
                  value={shareFormData.recipientName}
                  onChange={handleShareInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  name="recipientEmail"
                  value={shareFormData.recipientEmail}
                  onChange={handleShareInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={shareFormData.subject}
                  onChange={handleShareInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  name="message"
                  value={shareFormData.message}
                  onChange={handleShareInputChange}
                  rows={6}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 text-white bg-indigo-700 rounded-md hover:bg-indigo-800 ${submitting ? 'opacity-90 cursor-not-allowed' : ''
                    }`}
                >
                  {submitting ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Joining;