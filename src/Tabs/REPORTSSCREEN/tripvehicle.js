import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Clipboard, Platform, TextInput ,FlatList, Button} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { useUser } from '../../screen/UserContext';
import {Menu} from 'react-native-paper';

const Tripvehiclereport = ({ navigation }) => {
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
    const [groups, setGroups] = useState([]);
    const [currentPage, setCurrentPage] = useState(1); // New state for current page
    const itemsPerPage = 10; // Number of items per page
    const [registrationNumbers, setRegistrationNumbers] = useState([]);
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [filteredNumbers, setFilteredNumbers] = useState([]);
    const [searchText, setSearchText] = useState('');
    const[Vehiclenumber , setVehiclenumber]= useState('all');
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
            const group1 = selectedGroupOption==='Select Vehicle Group'?'null':selectedGroupOption;
            // console.log(formattedStartDate);
            // console.log(formattedEndDate);
            console.log(userId);
            console.log(Vehiclenumber);
            const response = await axios.get(`https://www.novusomnifleet.com/hitech-api/report/getVehicleReportRunning/startDate/${formattedStartDate}/endDate/${formattedEndDate}/vehicleId/${Vehiclenumber}/fleetManagerId/${userId}/groupName/${group1}`);
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
             <th>Device ID</th>
                <th>Date Range</th>
                <th>Vehicle No</th>
                <th>Running Status</th>
                <th>Start Date</th>
                <th>Start Location</th>
                <th>End Date</th>
                <th>End Location</th>
        </tr>
    </thead>
    <tbody>
        ${filteredData.map(item => `
            <tr>
                 <td>${item.deviceId || ''}</td>
                  <td>${formate(item,0) || ''}/${formate(item, 1) || ''}</td>
                  <td>${item.vehicleId || ''}</td>
                  <td>${item.vehicleStatus || ''}</td>
                  <td>${item.startDate || ''}</td>
                  <td>${item.startAddress || ''}</td>
                  <td>${item.endDate || ''}</td>
                  <td>${item.endAddress || ''}</td>
            </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `;

        try {
            const options = {
                html: htmlContent,
                fileName: 'Triptreports',
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
        Device ID: ${item.deviceId || ''}
      Date Range: ${formate(item,0) || ''}/${formate(item, 1) || ''}
      Vehicle No: ${item.vehicleId || ''}
      Running Status: ${item.vehicleStatus || ''}
      Start Date: ${item.startDate || ''}
      Start Location: ${item.startAddress || ''}
      End Date: ${item.endDate || ''}
      End Location: ${item.endAddress || ''}
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
            const datetime=item.startDate;
            const datepart= datetime.split(':')[0];
            return datepart
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
            <Text style= {styles.heading}>Triple vehicle Report</Text>
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
                                        <Text style={styles.cardHeaderText}>Device ID:</Text>
                                        <Text style={styles.cardHeaderText}>{item.deviceId}</Text>
                                    </View>
                                    <View style={styles.subheader}>
                                        <Text style={styles.cardHeaderText}>Date Range:</Text>
                                        <Text style={styles.cardHeaderText}>{formate(item,0)}/{formate(item, 1)}</Text>
                                    </View>
                                   
                                    <Icon name={expandedIndex === index ? 'angle-up' : 'angle-down'} size={20} color="black" />
                                </View>
                            </TouchableOpacity>
                            {expandedIndex === index && (
                                <View style={styles.cardContent}>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Vehicle No:</Text>
                                        <Text style={styles.cell}>{item.vehicleId}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Running Status:</Text>
                                        <Text style={styles.cell}>{item.vehicleStatus}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Start Date</Text>
                                        <Text style={styles.cell}>{item.startDate}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Start Location:</Text>
                                        <Text style={styles.cell}>{item.startAddress}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>End Date:</Text>
                                        <Text style={styles.cell}>{item.endDate}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>End Location:</Text>
                                        <Text style={styles.cell}>{item.endAddress}</Text>
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

export default Tripvehiclereport;
