import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Clipboard, Platform, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { useUser } from '../../screen/UserContext';
import { Picker } from '@react-native-picker/picker';
import {Menu} from 'react-native-paper';

const ManagerReports = ({ navigation }) => {
  const [reportsData, setReportsData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [flag, setFlag] = useState(0);
  const { userId } = useUser();
  const [selectedDeviceOption, setSelectedDeviceOption]= useState('ALL');
  const [selectedGroupOption, setSelectedGroupOption] = useState('Select Vehicle Group');
  const [menuVisible, setMenuVisible] = useState(false);
  const [groups, setGroups] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); // New state for current page
  const itemsPerPage = 10; // Number of items per page
    
  const handleGroupOptionPress = (groupName) => {
      setSelectedGroupOption(groupName);
      
      setMenuVisible(false);
      // Optionally refetch or filter data based on the selected group
  };
    

  useEffect(() => {
      fetchVehicleGroups();
  }, []);

  useEffect(() => {
    fetchReportsData();
  }, [startDate, endDate]);

  useEffect(() => {
    setFilteredData(
      reportsData.filter(item =>
        Object.values(item).some(value =>
          value !== null && value.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    );
  }, [searchQuery, reportsData]);

  const fetchReportsData = async () => {
    try {
      const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
      const formattedEndDate = moment(endDate).format('YYYY-MM-DD');
      // console.log(formattedEndDate);
      // console.log(formattedStartDate);
      const group1 = selectedGroupOption==='Select Vehicle Group'?'null':selectedGroupOption;
      console.log(group1);
      const response = await axios.get(`https://www.novusomnifleet.com/hitech-api/report/download-report-by-custom-date/${formattedStartDate}/${formattedEndDate}/${userId}/${group1}`);
      setReportsData(response.data.data || []);
      setFlag(0);
    } catch (error) {
      setFlag(1);
      console.error('Error fetching reports data:', error);
    }
  };

  const fetchVehicleGroups = async () => {
    try {
        const response = await axios.get(`https://www.novusomnifleet.com/hitech-api/group/all/${userId}`);
        setGroups(response.data.data); // Set the vehicle groups
    } catch (error) {
        console.error('Error fetching vehicle groups:', error);
    }
};
  const exportToPDF = async () => {
    const htmlContent = `
      <html>
        <head>
          <style>
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid black; padding: 8px; text-align: left; }
            th { background-color: skyblue; }
          </style>
        </head>
        <body>
          <h1>Manager Reports</h1>
          <table>
            <tr>
              <th>Date Time</th>
              <th>Device ID</th>
              <th>Vehicle no</th>
              <th>Last Video Loc</th>
              <th>Total Km Today</th>
              <th>Total Drive Time</th>
              <th>ECA</th>
              <th>ETA</th>
              <th>Forward Collision Events</th>
              <th>Night Driving Alarm</th>
              <th>SOS Event</th>
              <th>Continuous Driving</th>
              <th>Overspeeding</th>
              <th>Lane Departure Events</th>
              <th>Vulnerable Road User</th>
              <th>Phone Calling Alarm</th>
              <th>Distracted Alarm</th>
              <th>Drowsiness Alarm</th>
              <th>Smoking Alarm</th>
              <th>Yawing Alarm</th>
              <th>Harsh Acceleration</th>
              <th>Hard Braking</th>
              <th>Harsh Turning</th>
              <th>Driver Without Seatbelt</th>
              <th>Potential Collision</th>
            </tr>
            ${filteredData.map(item => `
              <tr>
                <td>${item.date_time}</td>
                <td>${item.deviceId}</td>
                <td>${item.vehicle}</td>
                <td>${item.lastLatitude}, ${item.lastLongitude}</td>
                <td>${item.totalKmToday}</td>
                <td>${item.nightDrivingKm}</td>
                <td>N/A</td>
                <td>N/A</td>
                <td>${item.farwardCollisionCount}</td>
                <td>${item.nightDrivingCount}</td>
                <td>${item.sosEventCount}</td>
                <td>${item.continiuosDrivingCount}</td>
                <td>${item.overspeedingCount}</td>
                <td>${item.laneDeparterCount}</td>
                <td>${item.pedestarianCount}</td>
                <td>${item.callToCallCountVp1}</td>
                <td>${item.distractedCountVp1}</td>
                <td>${item.drowsinessCountVp1}</td>
                <td>${item.smokingCountVp1}</td>
                <td>${item.yawingCountVp1}</td>
                <td>${item.harshaccelerationFcwCount}</td>
                <td>${item.hardBrakingFcwCount}</td>
                <td>${item.harshTurningFcwCount}</td>
                <td>${item.driverWithoutSeatBeltCount}</td>
                <td>${item.suddenStoppageCount}</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `;

    try {
      const options = {
        html: htmlContent,
        fileName: 'ManagerReports',
        directory: 'Documents',
      };

      const file = await RNHTMLtoPDF.convert(options);
      Alert.alert('PDF Generated', `PDF has been saved to ${file.filePath}`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
};

  const starttime= (item)=>{
    
    const datetime= item.startTime;
    if(!datetime){
      return '';
    }
    const datepart= datetime.split(':')[0];
    return datepart;
  }
  const copyAllToClipboard = () => {
    const textContent = filteredData.map(item => `
      Date Time: ${item.date_time}
      Device ID: ${item.deviceId}
      Vehicle no: ${item.vehicle}
      Last Video Loc: ${item.lastLatitude}, ${item.lastLongitude}
      Total Km Today: ${item.totalKmToday}
      Total Drive Time: ${item.nightDrivingKm}
      ECA: N/A
      ETA: N/A
      Forward Collision Events: ${item.farwardCollisionCount}
      Night Driving Alarm: ${item.nightDrivingCount}
      SOS Event: ${item.sosEventCount}
      Continuous Driving: ${item.continiuosDrivingCount}
      Overspeeding: ${item.overspeedingCount}
      Lane Departure Events: ${item.laneDeparterCount}
      Vulnerable Road User: ${item.pedestarianCount}
      Phone Calling Alarm: ${item.callToCallCountVp1}
      Distracted Alarm: ${item.distractedCountVp1}
      Drowsiness Alarm: ${item.drowsinessCountVp1}
      Smoking Alarm: ${item.smokingCountVp1}
      Yawing Alarm: ${item.yawingCountVp1}
      Harsh Acceleration: ${item.harshaccelerationFcwCount}
      Hard Braking: ${item.hardBrakingFcwCount}
      Harsh Turning: ${item.harshTurningFcwCount}
      Driver Without Seatbelt: ${item.driverWithoutSeatBeltCount}
      Potential Collision: ${item.suddenStoppageCount}
    `).join('\n');

    Clipboard.setString(textContent);
    Alert.alert('Copied to Clipboard', 'All report data has been copied to the clipboard.');
};


  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const showDatePicker = (type) => {
    if (type === 'start') {
      setShowStartDatePicker(true);
    } else {
      setShowEndDatePicker(true);
    }
  };

  const onDateChange = (event, selectedDate, type) => {
    const currentDate = selectedDate || (type === 'start' ? startDate : endDate);
    if (type === 'start') {
      setShowStartDatePicker(Platform.OS === 'ios');
      setStartDate(currentDate);
    } else {
      setShowEndDatePicker(Platform.OS === 'ios');
      setEndDate(currentDate);
    }
  };

  const handleNextPage = () => {
    if (currentPage < Math.ceil(filteredData.length / itemsPerPage)) {
        setCurrentPage(currentPage + 1);
      }
  };

  const handlePreviousPage = () => {
      if (currentPage > 1) {
          setCurrentPage(currentPage - 1);
      }
  };

  // Sliced data for the current page
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <View style={styles.container}>
      <Text style= {styles.heading}>Manager Reports</Text>
      <View style={styles.datePickers}>
        <View style={styles.datePickerContainer}>
          <Text style={styles.datePickerLabel}>From Date:</Text>
          <TouchableOpacity onPress={() => showDatePicker('start')}>
            <Text style={styles.datePickerText}>{moment(startDate).format('YYYY-MM-DD')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.datePickerContainer}>
          <Text style={styles.datePickerLabel}>To Date:</Text>
          <TouchableOpacity onPress={() => showDatePicker('end')}>
            <Text style={styles.datePickerText}>{moment(endDate).format('YYYY-MM-DD')}</Text>
          </TouchableOpacity>
        </View>
        
      </View>
      <View style= {styles.drop}>
      <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                style={styles.dropdown}
                anchor={
                    <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.groupSelector}>
                        <Text style={styles.selectedGroupText}>{selectedGroupOption}</Text>
                        <Icon name="angle-down" size={16} color="#000" style= {styles.icon1}/>
                    </TouchableOpacity>
                }>
                <Menu.Item onPress={() => handleGroupOptionPress('Select Vehicle Group')} title="Select Vehicle Group" />
                {groups.length > 0 && (
                    <Menu.Item
                        onPress={() => handleGroupOptionPress(groups[0].groupName)}
                        title={groups[0].groupName} // Show the first group name for simplicity
                    />
                )}
              </Menu>
              
            </View>
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => onDateChange(event, selectedDate, 'start')}
        />
      )}
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => onDateChange(event, selectedDate, 'end')}
        />
      )}
      <View style= {styles.drop}>
        <Picker
            selectedValue={selectedDeviceOption}
            onValueChange={(itemValue) => setSelectedDeviceOption(itemValue)}
            style={styles.dropdown}
        >
            <Picker.Item label="ALL" value="ALL" />
            <Picker.Item label="FCW" value="FCW" />
            <Picker.Item label="DSM" value="DSM" />

        </Picker>
      </View>
      <TouchableOpacity style={styles.searchButton} onPress={fetchReportsData}>
        <Text style={styles.searchButtonText}>Search</Text>
      </TouchableOpacity>
      <View style={styles.exportButtons}>
        <TouchableOpacity onPress={exportToPDF}>
          <Icon name="file-pdf-o" size={24} color="red" />
        </TouchableOpacity>
        <TouchableOpacity onPress={copyAllToClipboard}>
          <Icon name="clipboard" size={24} color="blue" />
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="Search..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <ScrollView style={styles.scrollView}>
        {flag ? (
          <Text style={styles.noDataText}>No data found</Text>
        ) : (
          paginatedData.map((item, index) => (
            <View key={index} style={styles.card}>
              <TouchableOpacity onPress={() => toggleExpand(index)}>
              <View style={styles.cardHeader}>
                <View style= {styles.subheader}>
                  <Text style={styles.cardHeaderText}>DeviceId: </Text>
                  <Text style={styles.cardHeaderText}>{item.deviceId}</Text>
                </View>
                <View style= {styles.subheader}>
                  <Text style={styles.cardHeaderText}>Date: </Text>
                  <Text style={styles.cardHeaderText}>{starttime(item)}</Text>
                </View>
                <View style= {styles.subheader}>
                  <Text style={styles.cardHeaderText}>Vehicle No:</Text>
                  <Text style={styles.cardHeaderText}>{item.vehicle}</Text>
                </View>
                <Icon name={expandedIndex === index ? 'angle-up' : 'angle-down'} size={20} color="black" />
              </View>
              </TouchableOpacity>
              {expandedIndex === index && (
                <View style={styles.cardContent}>
                  <View style={styles.row}>
                    <Text style={styles.headerCell}>Last Video Loc:</Text>
                    <Text style={styles.cell}>{item.lastLatitude}, {item.lastLongitude}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.headerCell}>Total Km Today:</Text>
                    <Text style={styles.cell}>{item.totalKmToday}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.headerCell}>Total Drive Time:</Text>
                    <Text style={styles.cell}>{item.nightDrivingKm}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.headerCell}>ETA</Text>
                    <Text style={styles.cell}>N/A</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.headerCell}>CTA:</Text>
                    <Text style={styles.cell}>N/A</Text>
                  </View>

                  {selectedDeviceOption!=='DSM' && (<>
                    <View style={styles.row}>
                    <Text style={styles.headerCell}>Forward Collision Events:</Text>
                    <Text style={styles.cell}>{item.farwardCollisionCount}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.headerCell}>Lane Departure Events:</Text>
                    <Text style={styles.cell}>{item.laneDeparterCount}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.headerCell}>Vulnerable Road User:</Text>
                    <Text style={styles.cell}>{item.pedestarianCount}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.headerCell}>Continuous Driving:</Text>
                    <Text style={styles.cell}>{item.continiuosDrivingCount}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.headerCell}>Night Driving Alarm:</Text>
                    <Text style={styles.cell}>{item.nightDrivingCount}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.headerCell}>SOS Event:</Text>
                    <Text style={styles.cell}>{item.sosEventCount}</Text>
                  </View>
                  
                  <View style={styles.row}>
                    <Text style={styles.headerCell}>Overspeeding:</Text>
                    <Text style={styles.cell}>{item.overspeedingCount}</Text>
                  </View></>)}
                  
                  {selectedDeviceOption!=='FCW' && (<>
                    <View style={styles.row}>
                    <Text style={styles.headerCell}>Phone Calling Alarm:</Text>
                    <Text style={styles.cell}>{item.callToCallCountVp1}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.headerCell}>Distracted Alarm:</Text>
                    <Text style={styles.cell}>{item.distractedCountVp1}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.headerCell}>Drowsiness Alarm:</Text>
                    <Text style={styles.cell}>{item.drowsinessCountVp1}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.headerCell}>Smoking Alarm:</Text>
                    <Text style={styles.cell}>{item.smokingCountVp1}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.headerCell}>Yawing Alarm:</Text>
                    <Text style={styles.cell}>{item.yawingCountVp1}</Text>
                  </View></>)}
                    
                  <View style={styles.row}>
                    <Text style={styles.headerCell}>Harsh Acceleration:</Text>
                    <Text style={styles.cell}>{item.harshaccelerationFcwCount}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.headerCell}>Hard Braking:</Text>
                    <Text style={styles.cell}>{item.hardBrakingFcwCount}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.headerCell}>Harsh Turning:</Text>
                    <Text style={styles.cell}>{item.harshTurningFcwCount}</Text>
                  </View>
                  
                  <View style={styles.row}>
                    <Text style={styles.headerCell}>Potential Collision:</Text>
                    <Text style={styles.cell}>{item.suddenStoppageCount}</Text>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.headerCell}>Driver Without Seatbelt:</Text>
                    <Text style={styles.cell}>{item.driverWithoutSeatBeltCount}</Text>
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                <TouchableOpacity onPress={handlePreviousPage} disabled={currentPage === 1}>
                    <Icon name="arrow-left" size={24} color={currentPage === 1 ? 'gray' : 'black'} />
                </TouchableOpacity>
                <Text>Page {currentPage} of {Math.ceil(filteredData.length / itemsPerPage)}</Text>
                <TouchableOpacity onPress={handleNextPage} disabled={currentPage === Math.ceil(filteredData.length / itemsPerPage)}>
                    <Icon name="arrow-right" size={24} color={currentPage === Math.ceil(filteredData.length / itemsPerPage) ? 'gray' : 'black'} />
                </TouchableOpacity>
            </View>
            
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  datePickers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePickerLabel: {
    marginRight: 10,
    fontWeight: 'bold',
  },
  datePickerText: {
    fontSize:16,
    color: 'blue',
  },
  groupSelector:{
    marginBottom:2,
    flexDirection:'row',
    justifyContent:'space-between',
    marginRight:10
  },
  heading:{
    fontSize:25,
    textAlign:'center',
    paddingBottom:15,
    color:'black'
  },
  drop:{
    backgroundColor:'lightblue',
    height:50,
    marginBottom:7,
    borderRadius:5
},
  icon1:{
    marginTop:18,
    marginRight:7
  },
  searchButton: {
    backgroundColor: 'lightblue',
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 10,
  },
  searchButtonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  exportButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scrollView: {
    flex: 1,
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 18,
    color: 'red',
  },
  selectedGroupText:{
    padding:15,
    fontSize:15,
    textAlign:'center',
    color:'black',
 
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardContent: {
    marginTop: 10,
  },
  cardHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color:'black'
  },
  cell:{
    paddingHorizontal:10,
    padding:2,
    color:'black',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  headerCell: {
    fontWeight: 'bold',
    width: 120,
    color: 'grey',
},
searchInput: {
  borderWidth: 1,
  borderColor: 'gray',
  padding: 5,
  marginBottom: 10,
},
});

export default ManagerReports;
