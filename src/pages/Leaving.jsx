import React, { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Leaving = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pendingData, setPendingData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    dateOfLeaving: '',
    mobileNumber: '',
    reasonOfLeaving: '',
    typeOfLeave: '',
    lastWorkingDate: '',
    workingDays: '',
    amount: ''
  });

  // Fetch both datasets in parallel
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching leaving data from API...');
      
      // Fetch both JOINING and LEAVING data in parallel
      const [joiningResponse, leavingResponse] = await Promise.all([
        fetch('https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=JOINING&action=fetch'),
        fetch('https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec?sheet=LEAVING&action=fetch')
      ]);
      
      console.log('JOINING Response status:', joiningResponse.status);
      console.log('LEAVING Response status:', leavingResponse.status);
      
      if (!joiningResponse.ok || !leavingResponse.ok) {
        throw new Error(`HTTP error! status: ${joiningResponse.status}/${leavingResponse.status}`);
      }
      
      const joiningResult = await joiningResponse.json();
      const leavingResult = await leavingResponse.json();
      
      console.log('JOINING API Response:', joiningResult.success ? 'Success' : 'Failed');
      console.log('LEAVING API Response:', leavingResult.success ? 'Success' : 'Failed');
      
      if (joiningResult.success) {
        const processedJoiningData = processJoiningData(joiningResult.data);
        console.log('Processed JOINING Data:', processedJoiningData.length, 'records');
        setPendingData(processedJoiningData);
      } else {
        throw new Error(joiningResult.error || 'Failed to fetch data from JOINING sheet');
      }
      
      if (leavingResult.success) {
        const processedLeavingData = processLeavingData(leavingResult.data);
        console.log('Processed LEAVING Data:', processedLeavingData.length, 'records');
        setHistoryData(processedLeavingData);
      } else {
        throw new Error(leavingResult.error || 'Failed to fetch data from LEAVING sheet');
      }
      
    } catch (err) {
      console.error('Error fetching leaving data:', err);
      setError(err.message);
      toast.error(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Process JOINING sheet data
  const processJoiningData = (sheetData) => {
    if (!sheetData || sheetData.length === 0) {
      console.log('No JOINING sheet data available');
      return [];
    }
    
    console.log('JOINING Raw Sheet Data rows:', sheetData.length);
    
    // Headers are at row 6 (index 5)
    const headers = sheetData[5] || [];
    const rows = sheetData.length > 6 ? sheetData.slice(6) : [];
    
    console.log('JOINING Headers:', headers);
    console.log('JOINING Data rows:', rows.length);
    
    // Create column map for faster access
    const columnMap = {};
    headers.forEach((header, index) => {
      if (header) {
        const cleanHeader = header.toString().trim();
        columnMap[cleanHeader] = index;
        columnMap[cleanHeader.toLowerCase()] = index;
        columnMap[cleanHeader.toUpperCase()] = index;
      }
    });
    
    console.log('JOINING Column Map keys:', Object.keys(columnMap));
    
    const processedRows = rows.map((row, index) => {
      // Get values using column map with fallbacks
      const employeeCode = row[columnMap['Employee Code']] || row[0] || '';
      const employeeNo = row[columnMap['SKA-Joining ID']] || row[1] || '';
      const candidateName = row[columnMap['Name As Per Aadhar']] || row[2] || '';
      const fatherName = row[columnMap['Father Name']] || row[3] || '';
      const dateOfJoining = row[columnMap['Date Of Joining']] || row[4] || '';
      const designation = row[columnMap['Designation']] || row[5] || '';
      const department = row[columnMap['Department']] || row[20] || '';
      const mobileNo = row[columnMap['Mobile No.']] || '';
      const firmName = row[columnMap['Joining Company Name']] || '';
      const workingPlace = row[columnMap['Joining Place']] || '';
      const plannedDate = row[columnMap['Planned Date']] || '';
      const actual = row[columnMap['Actual']] || '';
      const leavingDate = row[24] || '';
      const reason = row[25] || '';
      const columnAZ = row[51] || '';
      const columnBA = row[52] || '';
      
      return {
        rowIndex: index + 7,
        employeeCode,
        employeeNo,
        candidateName,
        fatherName,
        dateOfJoining,
        designation,
        department,
        mobileNo,
        firmName,
        workingPlace,
        plannedDate,
        actual,
        leavingDate,
        reason,
        columnAZ,
        columnBA
      };
    }).filter(task => 
      task.columnAZ && task.columnAZ !== '' && (!task.columnBA || task.columnBA === '')
    );
    
    console.log('JOINING Processed rows for pending:', processedRows.length);
    return processedRows;
  };

  // Process LEAVING sheet data
  const processLeavingData = (sheetData) => {
    if (!sheetData || sheetData.length === 0) {
      console.log('No LEAVING sheet data available');
      return [];
    }
    
    console.log('LEAVING Raw Sheet Data rows:', sheetData.length);
    
    // Process data starting from row 7 (index 6)
    const rows = sheetData.length > 6 ? sheetData.slice(6) : [];
    
    const processedRows = rows.map(row => ({
      timestamp: row[0] || '',
      employeeId: row[1] || '',
      name: row[2] || '',
      dateOfLeaving: row[3] || '',
      mobileNo: row[4] || '',
      reasonOfLeaving: row[5] || '',
      firmName: row[6] || '',
      fatherName: row[7] || '',
      dateOfJoining: row[8] || '',
      workingLocation: row[9] || '',
      designation: row[10] || '',
      department: row[11] || '',
      plannedDate: row[12] || '',
      actual: row[13] || '',
    }));
    
    console.log('LEAVING Processed rows:', processedRows.length);
    return processedRows;
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter pending data to remove employees already in history
  const filteredPendingData = pendingData
    .filter(item => {
      const isInHistory = historyData.some(historyItem => 
        historyItem.employeeId === item.employeeNo
      );
      return !isInHistory;
    })
    .filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        item.candidateName?.toLowerCase().includes(searchLower) ||
        item.employeeNo?.toLowerCase().includes(searchLower);
      return matchesSearch;
    });

  // Filter history data
  const filteredHistoryData = historyData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      item.name?.toLowerCase().includes(searchLower) ||
      item.employeeId?.toLowerCase().includes(searchLower);
    return matchesSearch;
  });

  const handleLeavingClick = (item) => {
    setSelectedItem(item);
    setFormData({
      dateOfLeaving: '',
      mobileNumber: item.mobileNo || '',
      reasonOfLeaving: '',
      typeOfLeave: '',
      lastWorkingDate: '',
      workingDays: '',
      amount: ''
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDOB = (dateString) => {
    if (!dateString) return '';
    
    if (typeof dateString === 'string' && dateString.includes('/')) {
      return dateString;
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.dateOfLeaving || !formData.reasonOfLeaving || !formData.typeOfLeave || !formData.lastWorkingDate) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const now = new Date();
      const formattedTimestamp = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
      
      const leavingDate = new Date(formData.dateOfLeaving);
      const formattedLeavingDate = `${leavingDate.getDate().toString().padStart(2, '0')}/${(leavingDate.getMonth() + 1).toString().padStart(2, '0')}/${leavingDate.getFullYear()}`;

      const lastWorkingDate = new Date(formData.lastWorkingDate);
      const formattedLastWorkingDate = `${lastWorkingDate.getDate().toString().padStart(2, '0')}/${(lastWorkingDate.getMonth() + 1).toString().padStart(2, '0')}/${lastWorkingDate.getFullYear()}`;

      // Prepare all update promises
      const updatePromises = [];

      // Update Column BA with actual date
      updatePromises.push(
        fetch('https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec', {
          method: 'POST',
          body: new URLSearchParams({
            sheetName: 'JOINING',
            action: 'updateCell',
            rowIndex: selectedItem.rowIndex.toString(),
            columnIndex: '53',
            value: formattedTimestamp,
          }),
        })
      );

      // Update Column BC with Type of Leave
      updatePromises.push(
        fetch('https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec', {
          method: 'POST',
          body: new URLSearchParams({
            sheetName: 'JOINING',
            action: 'updateCell',
            rowIndex: selectedItem.rowIndex.toString(),
            columnIndex: '55',
            value: formData.typeOfLeave,
          }),
        })
      );

      // Update Column BD with Date
      updatePromises.push(
        fetch('https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec', {
          method: 'POST',
          body: new URLSearchParams({
            sheetName: 'JOINING',
            action: 'updateCell',
            rowIndex: selectedItem.rowIndex.toString(),
            columnIndex: '56',
            value: formattedLeavingDate,
          }),
        })
      );

      // Update Column BE with Reason
      updatePromises.push(
        fetch('https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec', {
          method: 'POST',
          body: new URLSearchParams({
            sheetName: 'JOINING',
            action: 'updateCell',
            rowIndex: selectedItem.rowIndex.toString(),
            columnIndex: '57',
            value: formData.reasonOfLeaving,
          }),
        })
      );

      // Update Column BG with Working Days
      updatePromises.push(
        fetch('https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec', {
          method: 'POST',
          body: new URLSearchParams({
            sheetName: 'JOINING',
            action: 'updateCell',
            rowIndex: selectedItem.rowIndex.toString(),
            columnIndex: '104',
            value: formData.workingDays,
          }),
        })
      );

      // Update Column BH with Amount
      updatePromises.push(
        fetch('https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec', {
          method: 'POST',
          body: new URLSearchParams({
            sheetName: 'JOINING',
            action: 'updateCell',
            rowIndex: selectedItem.rowIndex.toString(),
            columnIndex: '105',
            value: formData.amount,
          }),
        })
      );

      // Update Column BF with Last Working Date
      updatePromises.push(
        fetch('https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec', {
          method: 'POST',
          body: new URLSearchParams({
            sheetName: 'JOINING',
            action: 'updateCell',
            rowIndex: selectedItem.rowIndex.toString(),
            columnIndex: '58',
            value: formattedLastWorkingDate,
          }),
        })
      );

      // Prepare row data for LEAVING sheet
      const rowData = [
        formattedTimestamp,
        selectedItem.employeeNo,
        selectedItem.candidateName,
        formattedLeavingDate,
        formData.mobileNumber,
        formData.reasonOfLeaving,
        selectedItem.firmName,
        selectedItem.fatherName,
        formatDOB(selectedItem.dateOfJoining),
        selectedItem.workingPlace,
        selectedItem.designation,
        selectedItem.department,
      ];

      // Insert into LEAVING sheet
      updatePromises.push(
        fetch('https://script.google.com/macros/s/AKfycbwXmzJ1VXIL4ZCKubtcsqrDcnAgxB3byiIWAC2i9Z3UVvWPaijuRJkMJxBvj3gNOBoJ/exec', {
          method: 'POST',
          body: new URLSearchParams({
            sheetName: 'LEAVING',
            action: 'insert',
            rowData: JSON.stringify(rowData),
          }),
        })
      );

      // Execute all updates
      const responses = await Promise.all(updatePromises);
      const results = await Promise.all(responses.map(async (r) => {
        const text = await r.text();
        try {
          return JSON.parse(text);
        } catch (parseError) {
          console.error('Failed to parse response:', text);
          return { success: false, error: 'Invalid response' };
        }
      }));

      const hasError = results.some((result) => !result.success);
      if (hasError) {
        console.error('Update errors:', results.filter(r => !r.success));
        throw new Error("Some updates failed");
      }

      setFormData({
        dateOfLeaving: '',
        reasonOfLeaving: '',
        typeOfLeave: '',
        mobileNumber: '',
        lastWorkingDate: '',
        workingDays: '',
        amount: ''
      });
      setShowModal(false);
      toast.success('Leaving request added successfully!');
      setSelectedItem(null);
      
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Something went wrong: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Leaving</h1>
        </div>
        <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex flex-1 max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search by name or employee ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-500"
                disabled
              />
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading leaving data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Leaving</h1>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 text-center">
            <div className="text-red-500 text-xl mb-4">Error Loading Data</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leaving</h1>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by name or employee ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-300">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === 'pending'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('pending')}
            >
              <Clock size={16} className="inline mr-2" />
              Pending ({filteredPendingData.length})
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('history')}
            >
              <CheckCircle size={16} className="inline mr-2" />
              History ({filteredHistoryData.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'pending' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Father Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Of Joining</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white">
                  {filteredPendingData.length > 0 ? (
                    filteredPendingData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleLeavingClick(item)}
                            className="px-3 py-1 bg-indigo-700 text-white rounded-md text-sm hover:bg-indigo-800"
                          >
                            Leaving
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.employeeNo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.candidateName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.fatherName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.dateOfJoining ? formatDOB(item.dateOfJoining) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.designation}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.department}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <p className="text-gray-500">No pending leaving requests found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Of Joining</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Of Leaving</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason Of Leaving</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white">
                  {filteredHistoryData.length > 0 ? (
                    filteredHistoryData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.employeeId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.dateOfJoining ? formatDOB(item.dateOfJoining) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.dateOfLeaving ? formatDOB(item.dateOfLeaving) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.designation}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.reasonOfLeaving}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <p className="text-gray-500">No leaving history found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-300 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-medium text-gray-700">Leaving Form</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                <input
                  type="text"
                  value={selectedItem.employeeNo}
                  disabled
                  className="w-full border border-gray-500 rounded-md px-3 py-2 bg-gray-100 text-gray-700"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee Code</label>
                <input
                  type="text"
                  value={selectedItem.employeeCode || ''}
                  disabled
                  className="w-full border border-gray-500 rounded-md px-3 py-2 bg-gray-100 text-gray-700"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={selectedItem.candidateName}
                  disabled
                  className="w-full border border-gray-500 rounded-md px-3 py-2 bg-gray-100 text-gray-700"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Type of Leave *</label>
                <select
                  name="typeOfLeave"
                  value={formData.typeOfLeave}
                  onChange={handleInputChange}
                  className="w-full border border-gray-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                  required
                >
                  <option value="">Select Type of Leave</option>
                  <option value="Resignation">Resignation</option>
                  <option value="Termination">Termination</option>
                </select>
              </div>
              
              {formData.typeOfLeave === 'Resignation' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Date Of Leaving *</label>
                    <input
                      type="date"
                      name="dateOfLeaving"
                      value={formData.dateOfLeaving}
                      onChange={handleInputChange}
                      className="w-full border border-gray-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason Of Leaving *</label>
                    <textarea
                      name="reasonOfLeaving"
                      value={formData.reasonOfLeaving}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full border border-gray-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 resize-none"
                      required
                    />
                  </div>
                </>
              )}
              
              {formData.typeOfLeave === 'Termination' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Date Of Termination *</label>
                    <input
                      type="date"
                      name="dateOfLeaving"
                      value={formData.dateOfLeaving}
                      onChange={handleInputChange}
                      className="w-full border border-gray-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason Of Termination *</label>
                    <textarea
                      name="reasonOfLeaving"
                      value={formData.reasonOfLeaving}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full border border-gray-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 resize-none"
                      required
                    />
                  </div>
                </>
              )}
              
              {formData.typeOfLeave && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Last Working Date *</label>
                  <input
                    type="date"
                    name="lastWorkingDate"
                    value={formData.lastWorkingDate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Working Days *</label>
                <input
                  type="number"
                  name="workingDays"
                  value={formData.workingDays}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full border border-gray-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                  placeholder="Enter number of working days"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                  placeholder="Enter amount"
                  required
                />
              </div>
            
              <div className="flex justify-end space-x-2 pt-4 sticky bottom-0 bg-white border-t border-gray-100 -mx-6 px-6 py-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white bg-indigo-700 rounded-md hover:bg-indigo-800 min-h-[42px] flex items-center justify-center ${
                    submitting ? 'opacity-90 cursor-not-allowed' : ''
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
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Submitting...</span>
                    </div>
                  ) : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaving;