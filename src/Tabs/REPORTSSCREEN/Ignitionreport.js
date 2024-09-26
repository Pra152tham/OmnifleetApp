import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Clipboard, Platform, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { useUser } from '../../screen/UserContext';
import {Menu} from 'react-native-paper';

const  Ignitionreport = ({ navigation }) => {
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
            console.log(group1);
            const response = await axios.get(`https://www.novusomnifleet.com/hitech-api/report/getIgnitionData/${formattedStartDate}/${formattedEndDate}/${userId}/${group1}`);
            setReportsData(response.data.data);
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
              <h1>Ignition Reports</h1>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Start Location</th>
                    <th>End Location</th>
                    <th>Status</th>
                    <th>Distance(m)</th>
                    <th>Duration(min)</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredData.map(item => `
                    <tr>
                      <td>${datetime(item, -1)}</td>
                      <td>${datetime(item, 1)}</td>
                      <td>${datetime(item, 0)}</td>
                      <td>${item.startLatitude}, ${item.startLongitude}</td>
                      <td>${item.endLatitude}, ${item.endLongitude}</td>
                      <td>${item.ignitionStatus}</td>
                      <td>${item.distance}</td>
                      <td>${duration(datetime(item, 1), datetime(item, 0))}</td>
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
                fileName: 'IgnitionReports',
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
            Date: ${datetime(item, -1)}
            Start Time: ${datetime(item, 1)}
            End Time: ${datetime(item, 0)}
            Start Location: ${item.startLatitude}, ${item.startLongitude}
            End Location: ${item.endLatitude}, ${item.endLongitude}
            Status: ${item.ignitionStatus}
            Distance(m): ${item.distance}
            Duration(min): ${duration(datetime(item, 1), datetime(item, 0))}
        `).join('\n\n');
    
        Clipboard.setString(textContent);
        Alert.alert('Copied to Clipboard', 'Filtered report data has been copied to the clipboard.');
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
    const datetime= (item, flag)=>{
        if(flag==0){
            const datetimeString= item.ignitionStartTime;
            const date = new Date(datetimeString);
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const seconds = date.getSeconds().toString().padStart(2, '0');
            const timeString = `${hours}:${minutes}:${seconds}`;
            console.log(timeString);
            return timeString;
        }else if(flag==1){
            const datetimeString= item.ignitionEndTime;
            const date = new Date(datetimeString);
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const seconds = date.getSeconds().toString().padStart(2, '0');
            const timeString = `${hours}:${minutes}:${seconds}`;
            console.log(timeString);
            return timeString;
        }else if(flag==-1){
            const datetimeString= item.warningSortKey;
            const timeMatch = datetimeString.match(/\d{4}-\d{2}-\d{2}/);
            const timeString = timeMatch ? timeMatch[0] : null;
            return timeString;

        }
    }   
    const duration = (S1, S2) => {
        if (!S1 || !S2) {
            return 'N/A'; // or another appropriate default value
        }
    
        const [hours1, minutes1, seconds1] = S1.split(':').map(Number);
        const [hours2, minutes2, seconds2] = S2.split(':').map(Number);
    
        const date1 = new Date(0, 0, 0, hours1, minutes1, seconds1);
        const date2 = new Date(0, 0, 0, hours2, minutes2, seconds2);
    
        const diffInMs = date2 - date1;
        const diffInMinutes = diffInMs / (1000 * 60);
        return diffInMinutes.toFixed(2); // returns duration in minutes with 2 decimal places
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
                <Text style= {styles.heading}>Ignition Report</Text>
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
                                        <Text style={styles.headerCell}>Date:</Text>
                                        <Text style={styles.cell}>{datetime(item, -1)}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Start Time:</Text>
                                        <Text style={styles.cell}>{datetime(item, 1)}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>End Time: </Text>
                                        <Text style={styles.cell}>{datetime(item, 0)}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Start Location:</Text>
                                        <Text style={styles.cell}>{item.startLatitude}, {item.startLongitude}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>End Location:</Text>
                                        <Text style={styles.cell}>{item.endLatitude}, {item.endLongitude}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Status:</Text>
                                        <Text style={styles.cell}>{item.ignitionStatus}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Distance(m):</Text>
                                        <Text style={styles.cell}>{item.distance}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Duration(min):</Text>
                                        <Text style={styles.cell}>{duration(datetime(item,1), datetime(item,0))}</Text>
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
    searchInput: {
        borderWidth: 1,
        borderColor: 'gray',
        padding: 5,
        marginBottom: 10,
        paddingBottom:5
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

export default Ignitionreport;