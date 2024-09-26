import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Clipboard, Platform, TextInput ,FlatList, Button} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { useUser } from '../../screen/UserContext';
import {Menu} from 'react-native-paper';

const Alarmreport = ({ navigation }) => {
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
    const [selectedGroupOption, setSelectedGroupOption] = useState('Select Vehicle Group');
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuVisible1, setMenuVisible1] = useState(false);
    const [groups, setGroups] = useState([]);
    const [currentPage, setCurrentPage] = useState(1); // New state for current page
    const itemsPerPage = 10; // Number of items per page
    const [registrationNumbers, setRegistrationNumbers] = useState([]);
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [filteredNumbers, setFilteredNumbers] = useState([]);
    const [searchText, setSearchText] = useState('');
    const[Vehiclenumber , setVehiclenumber]= useState('all');
    const[errorcodenumber, seterrorcodenumber]= useState('0');

    const handleGroupOptionPress = (groupName) => {
        setSelectedGroupOption(groupName);
        
        setMenuVisible(false);
        // Optionally refetch or filter data based on the selected group
    };
    const errorcodePress = (item)=>{
        if(item =='Select Warning Type'){
            seterrorcodenumber(0);
            setMenuVisible1(false)
        }
        else{
            seterrorcodenumber(item);
            setMenuVisible1(false)
        }
    }

    useEffect(() => {
        fetchVehicleGroups();
    }, []);

    const errorCodes = {
        607: "Pedestrian Collision Warning-Mandatory",
        601: "Forward Collision Warning-Mandatory",
        513: "Camera Obstruction",
        619: "Drowsiness Level 3",
        618: "Drowsiness Level 2",
        618: "Drowsiness Level 1",
        606: "Pedestrian Collision Warning-Preliminary",
        600: "Forward Collision Warning-Preliminary",
        621: "Phone Usage",
        603: "Left Lane Departure Warning",
        603: "Right Lane Departure Warning",
        625: "Distraction Warning",
        609: "Over Speeding",
        610: "Continuous Driving",
        612: "Night Driving",
        623: "Smoking",
        638: "Yawning",
        613: "Harsh Acceleration",
        615: "Harsh Turning",
        614: "Harsh Braking",
        639: "Seatbelt Warning",
        599: "Left Cross Traffic Alert",
        598: "Right Cross Traffic Alert",
        597: "Rear Left Cross Traffic Alert",
        596: "Rear Right Cross Traffic Alert",
        595: "Left Blind Spot",
        594: "Right Blind Spot",
        637: "Sudden Stoppage",
        640: "Vehicle Idling",
        611: "SOS",
        641: "Regular Interval Video",
        617: "Regular Snapshot",
      };

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
            const group1 = selectedGroupOption==='Select Vehicle Group'?'null':selectedGroupOption;
            // console.log(formattedStartDate);
            // console.log(formattedEndDate);
            console.log(userId);
            console.log(Vehiclenumber);
            console.log(errorcodenumber);
            const response = await axios.get(`https://www.novusomnifleet.com/hitech-api/report/get-fcw-alarm-report/${formattedStartDate}/${formattedEndDate}/${errorcodenumber}/${userId}/${Vehiclenumber}/null`);
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

    const fetchRegistrationNumbers = async () => {
        try {
          const response = await fetch(`https://www.novusomnifleet.com/hitech-api/vehicle/get-all-vehicle-by-fleet-manager-id/${userId}`);
          const data = await response.json();
          if (data.status === 200) {
            const registrations = data.data.map(vehicle => vehicle.registrationNo);
            setRegistrationNumbers(registrations);
            setFilteredNumbers(registrations); // Initialize with full list
          } else {
            console.error('Failed to fetch vehicle data:', data.message);
          }
        } catch (error) {
          console.error('Error fetching vehicle data:', error);
        }
      };
    
      useEffect(() => {
        fetchRegistrationNumbers();
      }, [userId]);
    
      // Handle search input change
      const handleSearchChange = (text) => {
        setSearchText(text);
        // Filter registration numbers based on search input
        const filtered = registrationNumbers.filter((reg) =>
          reg.toLowerCase().includes(text.toLowerCase())
        );
        setFilteredNumbers(filtered);
        setDropdownVisible(true); // Show dropdown when searching
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
            <th>Date Range</th>
            <th>Driver Name</th>
            <th>Driver Id</th>
            <th>Group</th>
            <th>Managed Fleet</th>
            <th>Timestamp (IST)</th>
            <th>Watch Video</th>
            <th>Warning Status</th>
            <th>Warning Comment</th>
            <th>Speed (Km/hr)</th>
            <th>LatLong</th>
        </tr>
    </thead>
    <tbody>
        ${filteredData.map(item => `
            <tr>
                
            </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `;

        try {
            const options = {
                html: htmlContent,
                fileName: 'Alarmreports',
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
       Date Range: ${item.dateRange || ''}
      Driver Name: ${item.driverName || ''}
      Driver Id: ${item.driverId || ''}
      Group: ${item.group || ''}
      Managed Fleet: ${item.managedFleet || ''}
      Timestamp (IST): ${item.timestamp || ''}
      Watch Video: ${item.watchVideo || ''}
      Warning Status: ${item.warningStatus || ''}
      Warning Comment: ${item.warningComment || ''}
      Speed (Km/hr): ${item.speed || ''}
      LatLong: ${item.latLong || ''}
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
    const formate= (item, flag)=>{
        if(flag==0){
            const datetime=item.warningSortKey;
            const datepart= datetime.split('#')[1].split(':')[0];
            return datepart;
        }
        else if(flag==1){
            const datetime=item.endDate;
            const datepart= datetime.split(':')[0];
            return datepart;
        }
    }

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
            <Text style= {styles.heading}>Alarm Report</Text>
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
            <View style= {styles.drop}>

            <Menu
                visible={menuVisible1}
                onDismiss={() => setMenuVisible1(false)}
                anchor={
                    <TouchableOpacity onPress={() => setMenuVisible1(true)} style={styles.groupSelector}>
                        <Text style={styles.selectedGroupText}>{(errorcodenumber!=0?errorCodes[errorcodenumber]:'Select Warning Type')}</Text>
                        <Icon name="angle-down" size={16} color="#000" style= {styles.icon1}/>
                    </TouchableOpacity>
                }>
                <Menu.Item onPress={() => errorcodePress('Select Warning Type')} title="Select Warning Type" />
                {Object.entries(errorCodes).map(([code, description]) => (
                    <Menu.Item
                        key={code}
                        onPress={() => errorcodePress(code)}
                        title={`${description}`}
                    />
                ))}
            </Menu>
            </View>
            <View style={styles.container1}>
            <TextInput
                style={styles.searchInput}
                placeholder="Search Registration Number"
                value={searchText}
                onChangeText={handleSearchChange}
            />

            {dropdownVisible && filteredNumbers.length > 0 && (
                <View style={styles.dropdownList}>
                <FlatList
                    data={filteredNumbers}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => {
                        setSearchText(item);
                        setDropdownVisible(false); // Hide dropdown after selection
                        setVehiclenumber(item);
                        }}
                    >   
                        
                        <Text style={styles.itemText}>{item}</Text>
                        
                    </TouchableOpacity>
                    )}
                />
                </View>
            )}
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
                                    {/* <View style={styles.subheader}>
                                        <Text style={styles.cardHeaderText}>Date Range:</Text>
                                        <Text style={styles.cardHeaderText}>{startDate}/{endDate}</Text>
                                    </View> */}
                                    <View style={styles.subheader}>
                                        <Text style={styles.cardHeaderText}>Date Range:</Text>
                                        <Text style={styles.cardHeaderText}>{formate(item, 0)}</Text>
                                    </View>
                                    <View style={styles.subheader}>
                                        <Text style={styles.cardHeaderText}>Driver Name:</Text>
                                        <Text style={styles.cardHeaderText}>{item.driverName}</Text>
                                    </View>
                                   
                                    <Icon name={expandedIndex === index ? 'angle-up' : 'angle-down'} size={20} color="black" />
                                </View>
                            </TouchableOpacity>
                            {expandedIndex === index && (
                                <View style={styles.cardContent}>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Driver Id:</Text>
                                        <Text style={styles.cell}>{item.driverId}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Group:</Text>
                                        <Text style={styles.cell}>{item.vehicle_group}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Managed Fleet</Text>
                                        <Text style={styles.cell}>{item.managedFLeetName}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Timestamp(IST)</Text>
                                        <Text style={styles.cell}>{item.dateTimeStamp}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Watch Video</Text>
                                        <Text style={styles.cell}>N/A</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Warning Status:</Text>
                                        <Text style={styles.cell}>{item.warningStatus}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Warning Comment:</Text>
                                        <Text style={styles.cell}>{item.warningComment}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Speed(Km/hr):</Text>
                                        <Text style={styles.cell}>{item.speed}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>LatLong:</Text>
                                        <Text style={styles.cell}>{item.startLat} , {item.startLong}</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>
            {/* Pagination Controls */}
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
    heading:{
        fontSize:25,
        textAlign:'center',
        paddingBottom:15,
        color:'black'
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
    searchInput: {
        borderWidth: 1,
        borderColor: 'gray',
        padding: 5,
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
    container1: {
        marginTop: 2,
        padding: 2,
        marginBottom:1
      },
      searchInput: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 5,
        padding: 10,
        fontSize:16,
        color:'black',
        marginBottom: 10,
        backgroundColor:'lightblue'
      },
      dropdownList: {
        maxHeight: 150,
        backgroundColor: 'lightblue',
        borderColor: '#DDD',
        
        borderWidth: 1,
        borderRadius: 5,
      },
      dropdownItem: {
        padding: 10,
        
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
      },
      itemText: {
        color: 'black',
        fontSize:15,
      },
});

export default Alarmreport;
