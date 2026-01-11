import React, { useState, useEffect } from 'react';
import { Upload, FileText, Download, Eye, Trash2, Search, Filter, Plus, ChevronDown, ChevronUp, X, File, Calendar, User, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const HRPolicyPage = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedSections, setExpandedSections] = useState({});
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Google Drive folder ID for HR Policies (create this folder in your Drive)
  const HR_POLICY_FOLDER_ID = "1loe1YQxl0S_Ez98PyUaOsdtgzTgX92hy";

  // Categories for HR Policies
  const policyCategories = [
    'Employee Handbook',
    'Code of Conduct',
    'Leave Policy',
    'Attendance Policy',
    'Recruitment Policy',
    'Performance Management',
    'Grievance Policy',
    'Health & Safety',
    'IT Policy',
    'Training Materials',
    'Other'
  ];

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    effectiveDate: '',
    version: '1.0',
    file: null,
    isActive: true,
    requiresAcknowledgment: false
  });

  // Get current user from localStorage
  const getUser = () => {
    const userString = localStorage.getItem('user');
    return userString ? JSON.parse(userString) : { Name: 'HR Admin' };
  };

  // Fetch files from Google Drive
 // Replace your fetchPoliciesFromDrive function with this:

// Update your fetchPoliciesFromDrive function:

const fetchPoliciesFromDrive = async () => {
  setLoading(true);
  try {
    console.log('Fetching files from folder ID:', HR_POLICY_FOLDER_ID);
    
    const response = await fetch(
      `https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?action=getFiles&folderId=${HR_POLICY_FOLDER_ID}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Drive API response:", result);

    if (result.success) {
      // Check if files array exists
      if (result.files && Array.isArray(result.files)) {
        
        if (result.files.length === 0) {
          toast.info("HR Policy folder is empty. Upload your first policy!");
          setPolicies([]);
          return;
        }
        
        // Process files from Drive
        const processedFiles = result.files.map(file => {
          // Extract metadata from filename and description
          const fileName = file.name || '';
          let category = 'Other';
          let title = fileName.replace(/\.[^/.]+$/, ""); // Remove extension
          let version = '1.0';
          let effectiveDate = new Date(file.createdTime || Date.now()).toLocaleDateString();
          let description = file.description || '';
          
          // Try to parse metadata from file description first
          if (description && description.trim() !== '') {
            const descLines = description.split('\n');
            descLines.forEach(line => {
              if (line.startsWith('Title:')) title = line.replace('Title:', '').trim();
              if (line.startsWith('Category:')) category = line.replace('Category:', '').trim();
              if (line.startsWith('Description:')) description = line.replace('Description:', '').trim();
              if (line.startsWith('Version:')) version = line.replace('Version:', '').trim();
              if (line.startsWith('Effective Date:')) effectiveDate = line.replace('Effective Date:', '').trim();
            });
          }
          
          // Fallback: Parse from filename if no description
          if (description === '' && fileName.includes('_')) {
            const fileParts = fileName.split('_');
            if (fileParts.length >= 2) {
              category = fileParts[0];
              title = fileParts.slice(1).join(' ').replace(/\.[^/.]+$/, "");
            }
          }
          
          // Ensure we have a valid file URL
          let fileUrl = file.webViewLink || file.webContentLink;
          if (!fileUrl && file.id) {
            fileUrl = `https://drive.google.com/file/d/${file.id}/view`;
          }
          
          return {
            id: file.id,
            title: title || fileName,
            category: category,
            description: description,
            fileName: fileName,
            fileUrl: fileUrl,
            uploadDate: new Date(file.createdTime || Date.now()).toLocaleDateString(),
            effectiveDate: effectiveDate,
            version: version,
            uploadedBy: (file.owners && file.owners[0] && file.owners[0].displayName) || 'HR Department',
            isActive: true,
            requiresAcknowledgment: false,
            lastAcknowledged: '',
            fileType: file.mimeType ? file.mimeType.split('/').pop() : 'pdf',
            fileSize: formatFileSize(file.size || 0),
            createdTime: file.createdTime,
            modifiedTime: file.modifiedTime,
            thumbnailLink: file.thumbnailLink || null
          };
        });
        
        console.log("Processed files:", processedFiles);
        setPolicies(processedFiles);
        
        toast.success(`Loaded ${processedFiles.length} policies from Google Drive`);
        
      } else {
        // Files array doesn't exist
        console.error("No files array in response:", result);
        toast.error("Invalid response format from Google Drive");
        setPolicies([]);
      }
    } else {
      // API returned success: false
      console.error("Drive API error response:", result);
      toast.error(result.error || result.message || "Failed to load HR policies");
      setPolicies([]);
    }
  } catch (error) {
    console.error("Error fetching policies from Drive:", error);
    toast.error("Failed to load HR policies. Please check your internet connection.");
    // Fallback to mock data for testing
    setMockPolicies();
  } finally {
    setLoading(false);
  }
};


  const setMockPolicies = () => {
    const mockData = [
      {
        id: '1',
        title: 'Employee Code of Conduct',
        category: 'Code of Conduct',
        description: 'Guidelines for professional behavior and ethics in the workplace',
        fileName: 'code_of_conduct.pdf',
        fileUrl: 'https://drive.google.com/file/d/1_sample_id/view?usp=sharing',
        uploadDate: '15/01/2024',
        effectiveDate: '01/02/2024',
        version: '2.1',
        uploadedBy: 'HR Manager',
        isActive: true,
        requiresAcknowledgment: true,
        fileType: 'pdf',
        fileSize: '2.4 MB',
        createdTime: '2024-01-15T10:30:00Z',
        modifiedTime: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        title: 'Leave Policy 2024',
        category: 'Leave Policy',
        description: 'Updated leave entitlements and procedures for all employees',
        fileName: 'leave_policy_2024.pdf',
        fileUrl: 'https://drive.google.com/file/d/2_sample_id/view?usp=sharing',
        uploadDate: '10/01/2024',
        effectiveDate: '01/01/2024',
        version: '1.0',
        uploadedBy: 'HR Department',
        isActive: true,
        requiresAcknowledgment: true,
        fileType: 'pdf',
        fileSize: '1.8 MB',
        createdTime: '2024-01-10T14:20:00Z',
        modifiedTime: '2024-01-10T14:20:00Z'
      },
      {
        id: '3',
        title: 'IT Security Policy',
        category: 'IT Policy',
        description: 'Guidelines for IT resource usage and security protocols',
        fileName: 'it_security_policy.pdf',
        fileUrl: 'https://drive.google.com/file/d/3_sample_id/view?usp=sharing',
        uploadDate: '05/01/2024',
        effectiveDate: '15/01/2024',
        version: '1.2',
        uploadedBy: 'IT Department',
        isActive: true,
        requiresAcknowledgment: true,
        fileType: 'pdf',
        fileSize: '3.2 MB',
        createdTime: '2024-01-05T09:15:00Z',
        modifiedTime: '2024-01-05T09:15:00Z'
      },
      {
        id: '4',
        title: 'Employee Handbook',
        category: 'Employee Handbook',
        description: 'Complete employee handbook with company policies and procedures',
        fileName: 'employee_handbook_2024.docx',
        fileUrl: 'https://drive.google.com/file/d/4_sample_id/view?usp=sharing',
        uploadDate: '20/01/2024',
        effectiveDate: '01/02/2024',
        version: '3.0',
        uploadedBy: 'HR Manager',
        isActive: true,
        requiresAcknowledgment: true,
        fileType: 'docx',
        fileSize: '5.1 MB',
        createdTime: '2024-01-20T11:45:00Z',
        modifiedTime: '2024-01-20T11:45:00Z'
      }
    ];
    setPolicies(mockData);
  };

  useEffect(() => {
    fetchPoliciesFromDrive();
  }, []);

  // Upload file to Google Drive
  const uploadFileToDrive = async (file, metadata) => {
    try {
      console.log('Starting file upload:', file.name, file.type, file.size);
      
      const reader = new FileReader();
      const base64Data = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Create filename with metadata: Category_Title_Version_Date
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const cleanTitle = metadata.title.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${metadata.category}_${cleanTitle}_v${metadata.version}_${date}.${file.name.split('.').pop()}`;

      const params = new URLSearchParams();
      params.append('action', 'uploadFileWithMetadata');
      params.append('base64Data', base64Data);
      params.append('fileName', fileName);
      params.append('mimeType', file.type);
      params.append('folderId', HR_POLICY_FOLDER_ID);
      params.append('title', metadata.title);
      params.append('category', metadata.category);
      params.append('description', metadata.description || '');
      params.append('version', metadata.version);
      params.append('effectiveDate', metadata.effectiveDate);
      params.append('uploadedBy', getUser().Name || 'HR Admin');

      console.log('Uploading with params:', {
        fileName,
        title: metadata.title,
        category: metadata.category
      });

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
        const errorText = await response.text();
        console.error('Upload failed:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Upload response:', data);

      if (!data.success) {
        throw new Error(data.error || 'File upload failed');
      }

      return data;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(`Failed to upload file: ${error.message}`);
      throw error;
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'image/png',
        'image/jpeg'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF, Word, Excel, text, and image files are allowed');
        return;
      }

      if (file.size > 25 * 1024 * 1024) { // 25MB limit
        toast.error('File size must be less than 25MB');
        return;
      }

      setFormData(prev => ({
        ...prev,
        file: file
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Basic validation
      if (!formData.title.trim()) {
        toast.error('Please enter a policy title');
        return;
      }

      if (!formData.category) {
        toast.error('Please select a category');
        return;
      }

      if (!formData.file) {
        toast.error('Please select a file to upload');
        return;
      }

      if (!formData.effectiveDate) {
        toast.error('Please select an effective date');
        return;
      }

      console.log('Starting policy upload process...');

      // Upload file to Google Drive with metadata
      toast.loading('Uploading policy to Google Drive...', { id: 'upload' });
      const result = await uploadFileToDrive(formData.file, {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        version: formData.version,
        effectiveDate: formData.effectiveDate
      });
      
      toast.success('Policy uploaded successfully!', { id: 'upload' });

      // Close modal and reset form
      setShowUploadModal(false);
      
      // Reset form
      setFormData({
        title: '',
        category: '',
        description: '',
        effectiveDate: '',
        version: '1.0',
        file: null,
        isActive: true,
        requiresAcknowledgment: false
      });

      // Refresh policies list
      setTimeout(() => {
        fetchPoliciesFromDrive();
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload policy: ${error.message}`, { id: 'upload' });
    } finally {
      setUploading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // View policy details
  const handleViewPolicy = (policy) => {
    setSelectedPolicy(policy);
    setShowViewModal(true);
  };

  // Delete policy from Drive
  const handleDeletePolicy = async (policyId, policyName) => {
    if (window.confirm(`Are you sure you want to delete "${policyName}"?`)) {
      try {
        const response = await fetch(
          "https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              action: 'deleteFile',
              fileId: policyId
            }).toString(),
          }
        );

        const result = await response.json();
        if (result.success) {
          toast.success('Policy deleted successfully!');
          fetchPoliciesFromDrive(); // Refresh the list
        } else {
          throw new Error(result.error || 'Delete failed');
        }
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete policy');
      }
    }
  };

  // Download file
  const handleDownload = (policy) => {
    if (policy.fileUrl) {
      window.open(policy.fileUrl, '_blank');
    } else {
      toast.error('File not available for download');
    }
  };

  // Filter policies
  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || policy.category === categoryFilter;
    const matchesActive = activeFilter === 'all' || 
                         (activeFilter === 'active' && policy.isActive) ||
                         (activeFilter === 'inactive' && !policy.isActive);
    
    return matchesSearch && matchesCategory && matchesActive;
  });

  // Group policies by category
  const policiesByCategory = filteredPolicies.reduce((acc, policy) => {
    if (!acc[policy.category]) {
      acc[policy.category] = [];
    }
    acc[policy.category].push(policy);
    return acc;
  }, {});

  // Toggle section expansion
  const toggleSection = (category) => {
    setExpandedSections(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      case 'txt':
        return '📃';
      default:
        return '📎';
    }
  };

  // Get file icon component
  const getFileIconComponent = (fileType) => {
    const className = "h-6 w-6";
    switch (fileType) {
      case 'pdf':
        return <FileText className={`${className} text-red-500`} />;
      case 'doc':
      case 'docx':
        return <FileText className={`${className} text-blue-500`} />;
      case 'xls':
      case 'xlsx':
        return <FileText className={`${className} text-green-500`} />;
      default:
        return <File className={`${className} text-gray-500`} />;
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (typeof bytes === 'string') return bytes;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      'Employee Handbook': 'bg-blue-100 text-blue-800 border border-blue-200',
      'Code of Conduct': 'bg-purple-100 text-purple-800 border border-purple-200',
      'Leave Policy': 'bg-green-100 text-green-800 border border-green-200',
      'Attendance Policy': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      'Recruitment Policy': 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      'Performance Management': 'bg-pink-100 text-pink-800 border border-pink-200',
      'Grievance Policy': 'bg-red-100 text-red-800 border border-red-200',
      'Health & Safety': 'bg-orange-100 text-orange-800 border border-orange-200',
      'IT Policy': 'bg-teal-100 text-teal-800 border border-teal-200',
      'Training Materials': 'bg-cyan-100 text-cyan-800 border border-cyan-200',
      'Other': 'bg-gray-100 text-gray-800 border border-gray-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  // Get relative time
  const getRelativeTime = (dateString) => {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Count stats
  const totalPolicies = policies.length;
  const activePolicies = policies.filter(p => p.isActive).length;
  const recentPolicies = policies.filter(p => {
    const uploadDate = new Date(p.createdTime || p.uploadDate);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return uploadDate > monthAgo;
  }).length;

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">HR Policies & Documents</h1>
          <p className="text-gray-600 mt-1">Manage and access all company HR policies and documents</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center shadow-md hover:shadow-lg"
        >
          <Plus size={20} className="mr-2" />
          Upload New Policy
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-xl">
              <FileText className="text-blue-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Policies</p>
              <p className="text-2xl font-bold text-gray-800">{totalPolicies}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-white p-5 rounded-xl border border-green-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-xl">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Policies</p>
              <p className="text-2xl font-bold text-gray-800">{activePolicies}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-xl border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-xl">
              <Clock className="text-purple-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-800">{recentPolicies}</p>
            </div>
          </div>
        </div>
        

      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow border border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search policies by title, category or description..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={20}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center">
            <Filter size={20} className="text-gray-400 mr-2" />
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {policyCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center">
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Policies List */}
      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading HR policies...</p>
          </div>
        ) : filteredPolicies.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {Object.entries(policiesByCategory).map(([category, categoryPolicies]) => (
              <div key={category} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <button
                  onClick={() => toggleSection(category)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${getCategoryColor(category)}`}>
                      {category}
                    </span>
                    <span className="ml-4 text-sm text-gray-500 font-medium">
                      {categoryPolicies.length} {categoryPolicies.length === 1 ? 'document' : 'documents'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    {expandedSections[category] ? (
                      <ChevronUp size={20} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-400" />
                    )}
                  </div>
                </button>
                
                {expandedSections[category] && (
                  <div className="px-6 pb-6 bg-gradient-to-b from-gray-50 to-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {categoryPolicies.map(policy => (
                        <div 
                          key={policy.id} 
                          className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 hover:-translate-y-1"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start space-x-3">
                              <div className="bg-gray-100 p-2 rounded-lg">
                                {getFileIconComponent(policy.fileType)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">{policy.title}</h3>
                                <p className="text-xs text-gray-500 mt-1 flex items-center">
                                  <span className="truncate">{policy.fileName}</span>
                                  {policy.fileSize && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                                      {policy.fileSize}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {policy.description && (
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                              {policy.description}
                            </p>
                          )}
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar size={12} className="mr-1.5" />
                              <span>Effective: {policy.effectiveDate}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <User size={12} className="mr-1.5" />
                              <span>By: {policy.uploadedBy}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock size={12} className="mr-1.5" />
                              <span>{getRelativeTime(policy.createdTime || policy.uploadDate)}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewPolicy(policy)}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleDownload(policy)}
                                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Download"
                              >
                                <Download size={16} />
                              </button>
                              <button
                                onClick={() => handleDeletePolicy(policy.id, policy.title)}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            {policy.requiresAcknowledgment && (
                              <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                                Requires Ack
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <FileText size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No policies found</h3>
            <p className="mt-2 text-gray-600 max-w-md mx-auto">
              {searchTerm || categoryFilter !== 'all' || activeFilter !== 'all'
                ? 'No policies match your search criteria. Try adjusting your filters.'
                : 'Get started by uploading your first HR policy document.'
              }
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-6 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center"
            >
              <Upload size={18} className="mr-2" />
              Upload Policy Document
            </button>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Upload New Policy Document</h3>
                <p className="text-sm text-gray-600 mt-1">Add new HR policy to Google Drive</p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Policy Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Employee Code of Conduct"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Category</option>
                    {policyCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the policy..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Effective Date *
                  </label>
                  <input
                    type="date"
                    name="effectiveDate"
                    value={formData.effectiveDate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Version
                  </label>
                  <input
                    type="text"
                    name="version"
                    value={formData.version}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 1.0, 2.1"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Policy Document *
                </label>
                <div className={`mt-1 flex justify-center px-6 pt-8 pb-8 border-2 ${formData.file ? 'border-green-300 bg-green-50' : 'border-gray-300 border-dashed'} rounded-xl transition-colors`}>
                  <div className="space-y-3 text-center">
                    <Upload className={`mx-auto h-12 w-12 ${formData.file ? 'text-green-500' : 'text-gray-400'}`} />
                    <div className="flex flex-col items-center">
                      <label className="relative cursor-pointer bg-white rounded-lg font-medium text-indigo-600 hover:text-indigo-500 px-4 py-2 border border-indigo-200 hover:border-indigo-300">
                        <span>Choose a file</span>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                        />
                      </label>
                      <p className="mt-2 text-xs text-gray-500">
                        or drag and drop
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, XLS, TXT, Images up to 25MB
                    </p>
                    {formData.file && (
                      <div className="mt-4 p-3 bg-green-100 rounded-lg">
                        <p className="text-sm text-green-800 flex items-center justify-center">
                          <FileText className="mr-2" size={16} />
                          {formData.file.name}
                          <span className="ml-2 text-xs px-2 py-1 bg-green-200 rounded">
                            {(formData.file.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                    Mark as Active
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requiresAcknowledgment"
                    name="requiresAcknowledgment"
                    checked={formData.requiresAcknowledgment}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requiresAcknowledgment" className="ml-2 text-sm text-gray-700">
                    Requires Employee Acknowledgment
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className={`px-5 py-2.5 rounded-lg text-white transition-colors ${uploading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  {uploading ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </span>
                  ) : (
                    'Upload to Google Drive'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Policy Modal */}
      {showViewModal && selectedPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="bg-gray-100 p-3 rounded-xl">
                  {getFileIconComponent(selectedPolicy.fileType)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedPolicy.title}</h3>
                  <p className="text-sm text-gray-600">{selectedPolicy.category}</p>
                </div>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Description</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-600">{selectedPolicy.description || 'No description available'}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Document Details</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">File Name:</span>
                        <span className="text-sm font-medium">{selectedPolicy.fileName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">File Type:</span>
                        <span className="text-sm font-medium uppercase">{selectedPolicy.fileType}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">File Size:</span>
                        <span className="text-sm font-medium">{selectedPolicy.fileSize || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Version:</span>
                        <span className="text-sm font-medium">v{selectedPolicy.version}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Timeline</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Effective Date:</span>
                        <span className="text-sm font-medium">{selectedPolicy.effectiveDate}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Upload Date:</span>
                        <span className="text-sm font-medium">{selectedPolicy.uploadDate}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Uploaded By:</span>
                        <span className="text-sm font-medium">{selectedPolicy.uploadedBy}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Actions</h4>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleDownload(selectedPolicy)}
                    className="flex items-center px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
                  >
                    <Download size={18} className="mr-2" />
                    Download Document
                  </button>
                  <button
                    onClick={() => {
                      window.open(selectedPolicy.fileUrl, '_blank');
                      setShowViewModal(false);
                    }}
                    className="flex items-center px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Eye size={18} className="mr-2" />
                    View in Google Drive
                  </button>
                  <button
                    onClick={() => handleDeletePolicy(selectedPolicy.id, selectedPolicy.title)}
                    className="flex items-center px-4 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={18} className="mr-2" />
                    Delete Document
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRPolicyPage;