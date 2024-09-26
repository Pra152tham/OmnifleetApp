import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Clipboard} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from "axios";
import CardTemplate from './CardTemplate';
import { useUser } from '../screen/UserContext';
import { useDate } from './DateContext';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import XLSX from 'xlsx';

const AllDriversPopup = ({ visible, onClose }) => {
  const [driversData, setDriversData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalData, setModalData] = useState([]);
  const { userId } = useUser();
  const {startDate} = useDate();
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  const handleIconPress = async (iconName) => {
    if (iconName === 'copy') {
      copyToClipboard();
    } else if (iconName === 'file-text-o') {
      await exportToText();
    } else if (iconName === 'file-excel-o') {
      await exportToExcel();
    } else if (iconName === 'file-pdf-o') {
      await exportToPDF();
    } else {
      Alert.alert(`Icon ${iconName} pressed!`);
    }
  };

  const copyToClipboard = () => {
    const dataToCopy = modalData.map(item => ({
        Date: item.date_time,
        DriverName: item.driverFullName,
        VehicleID: item.vehicle,
        DeviceID: item.deviceId,
        DeviceType: item.DeviceType || 'FCW',
        TotalDistance: item.totalKmToday,
        RashDrivingSafetyScore: item.rashDrivingSafetyScore,
        NightDrivingSafetyScore: item.nightDrivingSafetyScore,
        OverSpeedingSafetyScore: item.overspeedingSafetyScore,
        ContinuousDrivingSafetyScore:item.continiuosDrivingSafetyScore,
        DrivingWithoutSeatBeltSafetyScore:item.seatBeltCountVp1,
        TotalSafetyScore: item.totalSafetyScore,
    }));
    Clipboard.setString(JSON.stringify(dataToCopy, null, 2));
    Alert.alert("Data copied to clipboard!");
};

const exportToText = async () => {
  const data = modalData.map(item => JSON.stringify(item)).join('\n');
  const path = `${RNFS.DocumentDirectoryPath}/AllDriversData.txt`;
  await RNFS.writeFile(path, data, 'utf8');
  Alert.alert('Data exported to text file!');
};
  
const exportToExcel = async () => {
  try {
    const ws = XLSX.utils.json_to_sheet(modalData.map(item => ({
      'Date': item[0],
      'Driver Name': item[1],
      'Vehicle ID': item[2],
      'Device ID': item[3],
      'Device Type': item[4],
      'Total Distance': item[5],
      'Rash Driving Safety Score': item[6],
      'Night Driving Safety Score': item[7],
      'Over Speeding Safety Score': item[8],
      'Continuous Driving Safety Score': item[9],
      'Driving Without Seat Belt Safety Score': item[10],
      'Total Safety Score': item[11]
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'All Drivers Data');
    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const path = `${RNFS.DocumentDirectoryPath}/AllDriversData.xlsx`;
    await RNFS.writeFile(path, wbout, 'ascii');
    Alert.alert('Data exported to Excel file!');
  } catch (error) {
    console.error('Error exporting to Excel:', error);
  }
};

const exportToPDF = async () => {
  const html = `
    <html>
      <body>
        <h1>All Drivers Data</h1>
        <table border="1">
          <thead>
            <tr>
              ${Object.keys(modalData[0]).map(key => `<th>${key}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${modalData.map(item => `
              <tr>
                ${Object.values(item).map(value => `<td>${value}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
  const options = {
    html,
    fileName: 'AllDriversData',
    directory: 'Documents',
  };
  const file = await RNHTMLtoPDF.convert(options);
  Alert.alert('Data exported to PDF file!');
};
  
  useEffect(() => {
    if (visible) {
      fetchDriversData();
    }
  }, [userId, startDate, visible]);

  const fetchDriversData = async () => {
    try {
      const response = await axios.get(`https://www.novusomnifleet.com/hitech-api/driver/get-all-driver-score-data/${startDate}/${startDate}/${userId}/NOVU-GRP`);
      const transformedData = response.data.data.map(item => ([
        item.date_time,
        item.driverFullName,
        item.vehicle,
        item.deviceId,
        item.DeviceType || 'FCW',
        item.totalKmToday,
        item.rashDrivingSafetyScore,
        item.nightDrivingSafetyScore,
        item.overspeedingSafetyScore,
        item.continiuosDrivingSafetyScore,
        item.seatBeltCountVp1,
        item.totalSafetyScore,
      ]));
      setDriversData(transformedData);
      setModalData(transformedData);
    } catch (error) {
      console.error('Error fetching drivers data:', error);
    }
  };

  const filteredData = modalData.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (item[3] && item[3].toLowerCase().includes(searchLower)) || 
      (item[2] && item[2].toLowerCase().includes(searchLower)) || 
      (item[1] && item[1].toLowerCase().includes(searchLower))   
    );
  });

  const paginatedData = filteredData.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const entriesFrom = (currentPage - 1) * entriesPerPage + 1;
  const entriesTo = Math.min(currentPage * entriesPerPage, filteredData.length);

  const renderCards = (data) => {
    return data.map((item, index) => (
      <CardTemplate key={index} data={{
        'Date': item[0],
        'Driver Name': item[1],
        'Vehicle ID': item[2],
        'Device ID': item[3],
        'Device Type': item[4],
        'Total Distance': item[5],
        'Rash Driving Safety Score': item[6],
        'Night Driving Safety Score': item[7],
        'Over Speeding Safety Score': item[8],
        'Continuous Driving Safety Score': item[9],
        'Driving Without Seat Belt Safety Score': item[10],
        'Total Safety Score': item[11]
      }} />
    ));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Driver Details</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <View style={styles.iconContainer}>
                    <TouchableOpacity style={styles.icon} onPress={() => handleIconPress('copy')}>
                        <Icon name="copy" size={24} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.icon} onPress={() => handleIconPress('file-text-o')}>
                        <Icon name="file-text-o" size={24} color="blue" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.icon} onPress={() => handleIconPress('file-excel-o')}>
                        <Icon name="file-excel-o" size={24} color="green" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.icon} onPress={() => handleIconPress('file-pdf-o')}>
                        <Icon name="file-pdf-o" size={24} color="red" />
                    </TouchableOpacity>
                </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          value={searchQuery}
          onChangeText={text => setSearchQuery(text)}
        />
        <ScrollView>
          {renderCards(paginatedData)}
        </ScrollView>
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Showing {entriesFrom} to {entriesTo} entries from {filteredData.length} entries
          </Text>
        </View>
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === 1 && styles.disabledButton]}
            disabled={currentPage === 1}
            onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            <Text style={styles.paginationText}>Previous</Text>
          </TouchableOpacity>
          <Text style={styles.paginationText}>{currentPage} / {totalPages}</Text>
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === totalPages && styles.disabledButton]}
            disabled={currentPage === totalPages}
            onPress={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          >
            <Text style={styles.paginationText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchInput: {
    height: 40,
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  icon: {
      marginLeft: 10,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  paginationButton: {
    padding: 10,
    backgroundColor: 'skyblue',
    borderRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  paginationText: {
    fontSize: 16,
  },
  infoContainer: {
    marginVertical: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold'
  },
});

export default AllDriversPopup;
