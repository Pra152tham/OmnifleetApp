import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Clipboard , Button} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import CardTemplate from './CardTemplate';
import { useUser } from '../screen/UserContext';
import { useDate } from './DateContext';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import XLSX from 'xlsx';
import Video from 'react-native-video';
import axios from 'axios';

const ViolationTilesPopup = ({ visible, onClose, selectedViolation, errorDetails }) => {
  const [violationData, setViolationData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalData, setModalData] = useState([]);
  const { userId } = useUser();
  const {startDate} = useDate();
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;
  const [showVideo, setShowVideo] = useState(false);
  const [currentVideoUrls, setCurrentVideoUrls] = useState([]);
  
  const errorTypes = ['Pedestrian Collision Warning', 'Forward Collision Warning', 'Continuous Driving', 'SOS', 'Seatbelt Warning', 'Lane Departure Warning', 'Phone Usage', 'Drowsiness', 'Camera Obstruction', 'Yawning', 'Over Speeding', 'Harsh Acceleration', 'Harsh Turning', 'Harsh Braking', 'Blind Spot', 'Distraction Warning', 'Cross Traffic Alert', 'Vehicle Idling', 'Night Driving', 'Regular Interval Video', 'Regular Snapshot'];

  const errorCodes = {
    "Pedestrian Collision Warning": [607, 606],
    "Forward Collision Warning": [601, 600, 605],
    "Camera Obstruction": [513],
    "Drowsiness": [619, 618],
    "Phone Usage": [621],
    "Lane Departure Warning": [603],
    "Distraction Warning": [625],
    "Over Speeding": [609],
    "Continuous Driving": [610],
    "Night Driving": [612],
    "Smoking": [623],
    "Yawning": [638],
    "Harsh Acceleration": [613],
    "Harsh Turning": [615],
    "Harsh Braking": [614],
    "Seatbelt Warning": [639, 633],
    "Cross Traffic Alert": [599, 598, 597, 596],
    "Blind Spot": [595, 594],
    "Sudden Stoppage": [637],
    "Vehicle Idling": [640],
    "SOS": [611],
    "Regular Interval Video": [641],
    "Regular Snapshot": [617]
  };

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
        DeviceID: item.device_id,
        VehicleID: item.vehicleId,
        Timestamp: item.lastDateTime,
        ErrorType: selectedViolation,
        Speed: item.gpsSpeed,
        Comment: item.comment,
        WarningStatus: item.warningStatus,
        Location : item.location,
        WarningVideo: item.warningVideo == null ? 'N/A' : `Watch Video`
    }));
    Clipboard.setString(JSON.stringify(dataToCopy, null, 2));
    Alert.alert("Data copied to clipboard!");
};

const exportToText = async () => {
  const data = modalData.map(item => JSON.stringify(item)).join('\n');
  const path = `${RNFS.DocumentDirectoryPath}/ViolationData.txt`;
  await RNFS.writeFile(path, data, 'utf8');
  Alert.alert('Data exported to text file!');
};

const exportToExcel = async () => {
  try {
    const ws = XLSX.utils.json_to_sheet(modalData.map(item => ({
      'Device ID': item[0],
      'Vehicle ID': item[1],
      'Timestamp': item[2],
      'Error Type': item[3],
      'Speed': item[4],
      'Comment': item[5],
      'Warning Status': item[6],
      'Location' : item[7],
      'Warning Video': item[8]
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Violation Data');
    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const path = `${RNFS.DocumentDirectoryPath}/ViolationData.xlsx`;
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
          <h1>Violation Data</h1>
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
      fileName: 'ViolationData',
      directory: 'Documents',
    };
    const file = await RNHTMLtoPDF.convert(options);
    Alert.alert('Data exported to PDF file!');
  };

  const constructVideoUrl = (deviceId, dateTime, warningVideo) => {
    const url=  `https://www.novusomnifleet.com/hitech-api/device/getVp1VideoOnDemand/${deviceId}/${dateTime}/${warningVideo}`;
    console.log(url);
    return url
};

// const handleWatchVideoPress = async (item) => {
//   if (item[7]) {
//       const warningSortKeyParts = item[8].split('#');
//       const dateTime = warningSortKeyParts.length > 1 ? warningSortKeyParts[1].split(':')[0] : '';
//       const url = constructVideoUrl(item[0], dateTime, item[7]);
//       try {
//           const response = await axios.get(url);
//           if (response.data.status === 200 && response.data.data && response.data.data.length > 0) {
//               setCurrentVideoUrls(response.data.data);
//               setShowVideo(true);
//           } else {
//               Alert.alert("Video Not Available", "The requested video URL is not available.");
//           }
//       } catch (error) {
//           console.error('Error fetching video URL:', error);
//           Alert.alert("Error", "Unable to fetch video URL.");
//       }
//   } else {
//       Alert.alert("No Video Available", "This item does not have a video associated with it.");
//   }
// };

const handleWatchVideoPress = async (item) => {
  if (!item[7]) {
    Alert.alert("No Video Available", "This item does not have a video associated with it.");
    return;
  }
  const deviceType = item[9];
  const warningSortKeyParts = item[8].split('#');
  const dateTime = warningSortKeyParts.length > 1 ? warningSortKeyParts[1].split(':')[0] : '';

  if (deviceType !== 'android') {
    const url = constructVideoUrl(item[0], dateTime, item[7]);
    try {
      const response = await axios.get(url);
      if (response.data.status === 200 && response.data.data && response.data.data.length > 0) {
        setCurrentVideoUrls(response.data.data);
        setShowVideo(true);
      } else {
        Alert.alert("Video Not Available", "The requested video URL is not available.");
      }
    } catch (error) {
      console.error('Error fetching video URL:', error);
      Alert.alert("Error", "Unable to fetch video URL.");
    }
  } else {
    const videoRequest = {
      deviceId: item[0],
      fleetId: userId,
      date: dateTime,
      fileNames: item[7].split(",")
    };

    try {
      const response = await axios.post('alarm/fetch-video-for-android', videoRequest, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 200 && response.data.data && response.data.data.length > 0) {
        setCurrentVideoUrls(response.data.data);
        setShowVideo(true);
      } else {
        Alert.alert("Video Not Available", "The requested video URLs are not available.");
      }
    } catch (error) {
      console.error('Error fetching video URL:', error);
      Alert.alert("Error", "Unable to fetch video URLs.");
    }
  }
};


useEffect(() => {
  if (visible) {
    filterErrorData();
  }
}, [userId, startDate, selectedViolation, visible]);

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

const filterErrorData = () => {
  const filteredErrorDetails = errorDetails[selectedViolation] || [];
  const transformedData = filteredErrorDetails.map(item => [
    item.device_id,
    item.vehicleId,
    item.lastDateTime,
    item.gpsSpeed,
    item.comment,
    item.warningStatus,
    item.location,
    item.warningVideo,
    item.warningSortKey,
    item.deviceType
    ]);
  setViolationData(transformedData);
  setModalData(transformedData);
};

const renderCards = (data) => {
  return data
    .map((item, index) => (
      <CardTemplate key={index} data={{
        'Device ID': item[0],
        'Vehicle ID': item[1],
        'Timestamp': item[2],
        'Error Type': selectedViolation,
        'Speed': item[3],
        'Comment': item[4],
        'Warning Status': item[5],
        'Location' : item[6],
        'Warning Video': item[7] ? (
          <TouchableOpacity onPress={() => handleWatchVideoPress(item)}>
            <Text style={{ color: 'red', textDecorationLine: 'underline' }}>
              Watch Video
            </Text>
          </TouchableOpacity>
        ) : 'N/A'
      }} />
    ));
};

const renderVideoPlayer = () => (
  <View>
  <View style={styles.videoGridContainer}>
      {currentVideoUrls.map((url, index) => (
          <View key={index} style={styles.videoWrapper}>
              {url ? (
                  <Video
                      source={{ uri: url }}
                      style={styles.video}
                      controls={true}
                      onError={(e) => console.log('Video Error:', e)}
                  />
              ) : (
                  <Text style={styles.unavailableText}>Video Unavailable</Text>
              )}
          </View>
      ))}
  </View>
  <Button title="Close Video" onPress={() => setShowVideo(false)} style={styles.closeButton} />
  </View>
);

return (
  <Modal
    visible={visible}
    animationType="slide"
    onRequestClose={onClose}
  >
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Violations Summary</Text>
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
      {showVideo && renderVideoPlayer()}
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
  videoGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  videoWrapper: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
    unavailableText: {
    textAlign: 'center',
    color: 'red',
    fontSize: 16,
    width: '48%',
    aspectRatio: 1,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ViolationTilesPopup;