import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Clipboard, Platform,TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { useUser } from '../../screen/UserContext';
import { Picker } from '@react-native-picker/picker';
import {Menu} from 'react-native-paper';


const Driverhealth = ({ navigation }) => {
    const [reportsData, setReportsData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredData, setFilteredData] = useState([]);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [flag, setFlag] = useState(0);
    const [selectedGroupOption, setSelectedGroupOption] = useState('Open State');
    const [selectedDeviceOption, setSelectedDeviceOption]= useState('FCW');
    const { userId } = useUser();
    const [selectedGroupOption1, setSelectedGroupOption1] = useState('Select Vehicle Group');
    const [menuVisible, setMenuVisible] = useState(false);
    const [groups, setGroups] = useState([]);
    const [currentPage, setCurrentPage] = useState(1); // New state for current page
    const itemsPerPage = 10; // Number of items per page
        
    const handleGroupOptionPress = (groupName) => {
        setSelectedGroupOption1(groupName);
        
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
        if (reportsData.length) {
            setFilteredData(
                reportsData.filter(item =>
                    Object.values(item).some(value =>
                        value !== null && value.toString().toLowerCase().includes(searchQuery.toLowerCase())
                    )
                )
            );
        }
    }, [searchQuery, reportsData]);

    const fetchReportsData = async () => {
        try {
            const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
            const formattedEndDate = moment(endDate).format('YYYY-MM-DD');
            const Group = selectedGroupOption=='Open State'?'openError':'closeError'
            const group1 = selectedGroupOption1=='Select Vehicle Group'?'null':selectedGroupOption1;
            console.log(group1);
            const response = await axios.get(`https://www.novusomnifleet.com/hitech-api/report/get-fcw-device-health-report/${formattedStartDate}/${formattedEndDate}/${Group}/${userId}/${group1}`);
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
                    <h1>Device Health Report</h1>
                    <table>
                        <thead>
                            <tr>
                                <th>Date Range</th>
                                <th>Last Location</th>
                                <th>Error Start Time</th>
                                <th>Error End Time</th>
                                <th>Ignition Status</th>
                                <th>GPS Status</th>
                                <th>IMU Status</th>
                                <th>Power Tampering Status</th>
                                <th>Signal Strength Status</th>
                                <th>Camera Malfunction Status</th>
                                <th>Camera Block Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredData.map(item => `
                                <tr>
                                    <td>${starttime(item)}</td>
                                    <td>${item.lastLatitude}, ${item.lastLongitude}</td>
                                    <td>${item.errorStartTime}</td>
                                    <td>${item.errorEndTime}</td>
                                    <td>${item.ignitionStatus == 1 ? 'Ignition On' : 'Ignition Off'}</td>
                                    <td>${item.gpsStatus}</td>
                                    <td>${item.imuStatus}</td>
                                    <td>${item.powerTamperingStatus}</td>
                                    <td>${item.signalStrengthStatus}</td>
                                    <td>${item.cameraMalFunctionStatus}</td>
                                    <td>${item.cameraBlockStatus}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `;
    
        try {
            const options = {
                html: htmlContent,
                fileName: 'DeviceHealthReport',
                directory: 'Documents',
            };
    
            const file = await RNHTMLtoPDF.convert(options);
            Alert.alert('PDF Generated', `PDF has been saved to ${file.filePath}`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
    };
    

    const copyAllToClipboard = () => {
        const textContent = filteredData.map(item => `
            Date Range: ${starttime(item)}
            Last Location: ${item.lastLatitude}, ${item.lastLongitude}
            Error Start Time: ${item.errorStartTime}
            Error End Time: ${item.errorEndTime}
            Ignition Status: ${item.ignitionStatus == 1 ? 'Ignition On' : 'Ignition Off'}
            GPS Status: ${item.gpsStatus}
            IMU Status: ${item.imuStatus}
            Power Tampering Status: ${item.powerTamperingStatus}
            Signal Strength Status: ${item.signalStrengthStatus}
            Camera Malfunction Status: ${item.cameraMalFunctionStatus}
            Camera Block Status: ${item.cameraBlockStatus}
        `).join('\n\n');
    
        Clipboard.setString(textContent);
        Alert.alert('Copied to Clipboard', 'All filtered report data has been copied to the clipboard.');
    };
    

    const toggleExpand = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };
    const starttime=(item)=>{
        const timestamp = item.warningSortKey;
        const dateTimePart = timestamp.split('#')[1];
        const date= dateTimePart.split(':')[0];
        // console.log(date);
        return date;
    }
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
    

    const formatDate = (date) => {
        return moment(date).format('YYYY-MM-DD');
    };

    const handleSearch = () => {
        fetchReportsData();
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
            <Text style= {styles.heading}>Device Health Report</Text>
            <View style={styles.filterContainer}>
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
                anchor={
                    <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.groupSelector}>
                        <Text style={styles.selectedGroupText}>{selectedGroupOption1}</Text>
                        <Icon name="chevron-down" size={16} color="#000" style= {styles.icon1} />
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
                selectedValue={selectedGroupOption}
                onValueChange={(itemValue) => setSelectedGroupOption(itemValue)}
                style={styles.dropdown}
            >
                <Picker.Item label="Open State" value="Open State" />
                <Picker.Item label="Close State" value="Close State" />
            </Picker>
            
            </View>
            <View style= {styles.drop}>

            <Picker
                selectedValue={selectedDeviceOption}
                onValueChange={(itemValue) => setSelectedDeviceOption(itemValue)}
                style={styles.dropdown}
            >
                <Picker.Item label="FCW" value="FCW" />
            </Picker>
            </View>
            <TouchableOpacity style={styles.searchButton} onPress={fetchReportsData}>
                <Text style={styles.searchButtonText}>Search Filter</Text>
            </TouchableOpacity>
                <View style={styles.buttonContainer}>
                <View style={styles.exportButtons}>
                <TouchableOpacity onPress={exportToPDF}>
                    <Icon name="file-pdf-o" size={24} color="red" />
                </TouchableOpacity>
                <TouchableOpacity onPress={copyAllToClipboard}>
                    <Icon name="clipboard" size={24} color="blue" />
                </TouchableOpacity>
            </View>
            </View>
                
                
            </View>
            
            <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            <ScrollView style={styles.scrollContainer}>
            {flag ? (
                    <Text style={styles.noDataText}>No data found</Text>
                ) : (
                    paginatedData.map((item, index) => (
                    <View key={index} style={styles.card}>
                            <TouchableOpacity onPress={() => toggleExpand(index)}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.subheader}>
                                        <Text style={styles.cardHeaderText}>DeviceId: </Text>
                                        <Text style={styles.cardHeaderText}>{item.device_id}</Text>
                                    </View>
                                    <View style={styles.subheader}>
                                        <Text style={styles.cardHeaderText}>Vehicle No:</Text>
                                        <Text style={styles.cardHeaderText}>{item.vehicleRegistrationNo}</Text>
                                    </View>
                                    <Icon name={expandedIndex === index ? 'angle-up' : 'angle-down'} size={20} color="black" />
                                </View>
                            </TouchableOpacity>
                            {expandedIndex === index && (
                                <View style={styles.cardContent}>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Date Range:</Text>
                                        <Text style={styles.cell}>{starttime(item)}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Last Location </Text>
                                        <Text style={styles.cell}>{item.lastLatitude} , {item.lastLongitude}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Error start time:</Text>
                                        <Text style={styles.cell}>{item.errorStartTime}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Error end time:</Text>
                                        <Text style={styles.cell}>{item.errorEndTime}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>IgnitionStatus:</Text>
                                        <Text style={styles.cell}>{item.ignitionStatus==1?'Ignition On':'Ignition Off'}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>GPS status:</Text>
                                        <Text style={styles.cell}>{item.gpsStatus}</Text>
                                    </View><View style={styles.row}>
                                        <Text style={styles.headerCell}>IMU Status:</Text>
                                        <Text style={styles.cell}>{item.imuStatus}</Text>
                                    </View><View style={styles.row}>
                                        <Text style={styles.headerCell}>Power Tempering Status:</Text>
                                        <Text style={styles.cell}>{item.powerTamperingStatus}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Sigal Strength Status :</Text>
                                        <Text style={styles.cell}>{item.signalStrengthStatus}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Camera Malfunction Status:</Text>
                                        <Text style={styles.cell}>{item.cameraMalFunctionStatus}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Camera Block Status:</Text>
                                        <Text style={styles.cell}>{item.cameraBlockStatus}</Text>
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
        color: 'blue',
    },
    selectedGroupText:{
        padding:15,
        fontSize:15,
        textAlign:'center',
        color:'black',
     
      },
      groupSelector:{
        marginBottom:2,
        flexDirection:'row',
        justifyContent:'space-between',
        marginRight:10
      },
      icon1:{
        marginTop:18,
        marginRight:7
      },
      drop:{
        backgroundColor:'lightblue',
        height:50,
        marginBottom:7,
        borderRadius:5
    },
    heading:{
        fontSize:25,
        textAlign:'center',
        paddingBottom:15,
        color:'black'
      },
    searchButton: {
        backgroundColor: 'blue',
        padding: 10,
        alignItems: 'center',
        borderRadius: 5,
        marginBottom: 10,
    },
    searchButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    searchInput: {
        borderWidth: 1,
        borderColor: 'gray',
        padding: 5,
        marginBottom: 10,
      },
    exportButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
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
    scrollView: {
        flex: 1,
    },
    noDataText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 18,
        color: 'red',
    },
    drop:{
        backgroundColor:'lightblue',
        height:50,
        marginBottom:7,
        borderRadius:5
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
        color: 'black'
    },
    cell: {
        paddingHorizontal: 10,
        padding: 2,
        color: 'black',
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
});




export default Driverhealth;









// <View key={index} style={styles.card}>
//                             <TouchableOpacity onPress={() => toggleExpand(index)}>
//                                 <View style={styles.cardHeader}>
//                                     <View style={styles.subheader}>
//                                         <Text style={styles.cardHeaderText}>DeviceId: </Text>
//                                         <Text style={styles.cardHeaderText}>{item.device_id}</Text>
//                                     </View>
//                                     <View style={styles.subheader}>
//                                         <Text style={styles.cardHeaderText}>Vehicle No:</Text>
//                                         <Text style={styles.cardHeaderText}>{item.vehicleRegistrationNo}</Text>
//                                     </View>
//                                     <Icon name={expandedIndex === index ? 'angle-up' : 'angle-down'} size={20} color="black" />
//                                 </View>
//                             </TouchableOpacity>
//                             {expandedIndex === index && (
//                                 <View style={styles.cardContent}>
//                                     <View style={styles.row}>
//                                         <Text style={styles.headerCell}>Date Range:</Text>
//                                         <Text style={styles.cell}></Text>
//                                     </View>
//                                     <View style={styles.row}>
//                                         <Text style={styles.headerCell}>Last Location </Text>
//                                         <Text style={styles.cell}>{item.lastLatitude} {item.lastLongitude}</Text>
//                                     </View>
//                                     <View style={styles.row}>
//                                         <Text style={styles.headerCell}>Error start time:</Text>
//                                         <Text style={styles.cell}>{item.errorStartTime}</Text>
//                                     </View>
//                                     <View style={styles.row}>
//                                         <Text style={styles.headerCell}>Error end time:</Text>
//                                         <Text style={styles.cell}>{item.errorEndTime}</Text>
//                                     </View>
//                                     <View style={styles.row}>
//                                         <Text style={styles.headerCell}>IgnitionStatus:</Text>
//                                         <Text style={styles.cell}>{item.ignitionStatus}</Text>
//                                     </View>
//                                     <View style={styles.row}>
//                                         <Text style={styles.headerCell}>GPS status:</Text>
//                                         <Text style={styles.cell}>{item.gpsStatus}</Text>
//                                     </View><View style={styles.row}>
//                                         <Text style={styles.headerCell}>IMU Status:</Text>
//                                         <Text style={styles.cell}>{item.imuStatus}</Text>
//                                     </View><View style={styles.row}>
//                                         <Text style={styles.headerCell}>Power Tempering Status:</Text>
//                                         <Text style={styles.cell}>{item.powerTamperingStatus}</Text>
//                                     </View>
//                                     <View style={styles.row}>
//                                         <Text style={styles.headerCell}>Sigal Strength Status :</Text>
//                                         <Text style={styles.cell}>{item.signalStrengthStatus}</Text>
//                                     </View>
//                                     <View style={styles.row}>
//                                         <Text style={styles.headerCell}>Camera Malfunction Status:</Text>
//                                         <Text style={styles.cell}>{item.cameraMalFunctionStatus}</Text>
//                                     </View>
                                    
//                                 </View>
//                             )}
//                         </View>