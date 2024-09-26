import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Clipboard, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import {Menu} from 'react-native-paper';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { useUser } from '../../screen/UserContext';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const days = {
    1: 'dayOneKm',
    2: 'dayTwoKm',
    3: 'dayThreeKm',
    4: 'dayFourKm',
    5: 'dayFiveKm',
    6: 'daySixthKm',
    7: 'daySeventhKm',
    8: 'dayEightKm',
    9: 'dayNineKm',
    10: 'dayTenthKm',
    11: 'dayElevenKm',
    12: 'dayTwelvethKm',
    13: 'dayThirteenthKm',
    14: 'dayFourteenthKm',
    15: 'dayFifteenthKm',
    16: 'daySixteenthKm',
    17: 'daySeventeenthKm',
    18: 'dayEighteenthKm',
    19: 'dayNineteenthKm',
    20: 'dayTwenteenthKm',
    21: 'dayTwentyFirstKm',
    22: 'dayTwentySecondKm',
    23: 'dayTwentyThirdKm',
    24: 'dayTwentyFourthKm',
    25: 'dayTwentyFifthKm',
    26: 'dayTwentySixthKm',
    27: 'dayTwentySeventhKm',
    28: 'dayTwentyEighthKm',
    29: 'dayTwentyNinthKm',
    30: 'dayThirteeKm',
    31: 'dayThirteeFirstKm',
};

const DailyKMreports = ({ navigation }) => {
    const [reportsData, setReportsData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredData, setFilteredData] = useState([]);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(moment().format('MMMM YYYY'));
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
        fetchReportsData();
    }, [startDate, endDate]);
    
    useEffect(() => {
        fetchVehicleGroups();
    }, []);

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
            console.log(formattedEndDate);
            console.log(userId);
            console.log(selectedGroupOption);
            const group1 = selectedGroupOption==='Select Vehicle Group'?'null':selectedGroupOption;
            console.log(group1);
            
            
            const response = await axios.get(`https://www.novusomnifleet.com/hitech-api/report/getDailyKmReport/${formattedStartDate}/${formattedEndDate}/${userId}/${group1}`);

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
        const numberOfDays = getNumberOfDaysInSelectedMonth();
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
                <h1>Daily KM Reports</h1>
                <table>
                  <thead>
                    <tr>
                      <th>Vehicle No</th>
                      <th>Device ID</th>
                      ${Array.from({ length: numberOfDays }, (_, index) => `<th>Day ${index + 1}</th>`).join('')}
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredData.map(item => 
                      `<tr>
                        <td>${item.vehicleNo}</td>
                        <td>${item.deviceID}</td>
                        ${Array.from({ length: numberOfDays }, (_, index) => `<td>${item[days[index + 1]]}</td>`).join('')}
                      </tr>`
                    ).join('')}
                  </tbody>
                </table>
              </body>
            </html>
          `;

        try {
            const options = {
                html: htmlContent,
                fileName: 'DailyKMReports',
                directory: 'Documents',
            };

            const file = await RNHTMLtoPDF.convert(options);
            Alert.alert('PDF Generated', `PDF has been saved to ${file.filePath}`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
    };

    const copyAllToClipboard = () => {
        const numberOfDays = getNumberOfDaysInSelectedMonth();
        const textContent = filteredData.map(item => 
            `Vehicle No: ${item.vehicleNo}\nDevice ID: ${item.deviceID}\n${Array.from({ length: numberOfDays }, (_, index) => `Day ${index + 1}: ${item[days[index + 1]]}`).join('\n')}`
        ).join('\n\n');

        Clipboard.setString(textContent);
        Alert.alert('Copied to Clipboard', 'All report data has been copied to the clipboard.');
    };

    const toggleExpand = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const showDatePickerHandler = () => {
        setShowDatePicker(true);
    };

    const calculateTotalKm = (item) => {
        return Array.from({ length: getNumberOfDaysInSelectedMonth() }, (_, dayIndex) => item[days[dayIndex + 1]])
            .reduce((total, km) => total + (parseFloat(km) || 0), 0);
    };

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const monthStartDate = moment(selectedDate).startOf('month').toDate();
            const monthEndDate = moment(selectedDate).endOf('month').toDate();
            const isCurrentMonth = moment().isSame(moment(selectedDate), 'month');
            setStartDate(monthStartDate);
            setEndDate(isCurrentMonth ? new Date() : monthEndDate);
            setSelectedMonth(moment(selectedDate).format('MMMM YYYY'));
        }
    };

    const getNumberOfDaysInSelectedMonth = () => {
        const isCurrentMonth = moment().isSame(moment(endDate), 'month');
        return isCurrentMonth ? moment().date() : moment(endDate).daysInMonth();
    };

    const numberOfDays = getNumberOfDaysInSelectedMonth();

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
                <Text style= {styles.heading}> Daily KM Report</Text>
            <View style={styles.header}>
                <TouchableOpacity onPress={showDatePickerHandler} style={styles.calendarIcon}>
                    <Icon name="calendar" size={20} color="#007BFF" />
                </TouchableOpacity>
                <Text style={styles.selectedMonthText}>{selectedMonth}</Text>
                <View style={styles.actions}>
                    <TouchableOpacity onPress={copyAllToClipboard} style={styles.actionButton}>
                        <Icon name="clipboard" size={20} color="#007BFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={exportToPDF} style={styles.actionButton}>
                        <Icon name="file-pdf-o" size={20} color="#D9534F" />
                    </TouchableOpacity>
                </View>
                    {/* <Menu
                        visible={menuVisible}
                        onDismiss={() => setMenuVisible(false)}
                        anchor={
                            <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
                            <Text>{selectedGroupOption}</Text>
                            <Icon name="chevron-down" size={20} />
                            </TouchableOpacity>
                        }
                        >
                        <Menu.Item onPress={ handleGroupOptionPress} title="Select Vehicle Group" />
                        <Menu.Item onPress={handleGroupOptionPress} title={selectedGroupOption} />

                        <Menu.Item onPress={() => { handleGroupOptionPress('Select Vehicle Group'); setMenuVisible(false); }} title="Select Vehicle Group" />
                        <Menu.Item onPress={() => { handleGroupOptionPress(`${givegroup()}`); setMenuVisible(false); }} title={givegroup()} />
                    </Menu> */}
            <View style= {styles.drop}>

            <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                    <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.groupSelector}>
                        <Text style={styles.selectedGroupText}>{selectedGroupOption}</Text>
                        <Icon name="chevron-down" size={16} color="#000"  style= {styles.icon1}/>
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
            </View>
            {showDatePicker && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={startDate}
                    mode="date"
                    display="spinner"
                    onChange={onDateChange}
                    minimumDate={new Date(new Date().setMonth(new Date().getMonth() - 2))}
                />
            )}
            <TouchableOpacity style={styles.searchButton} onPress={fetchReportsData}>
                <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
            <View style={styles.searchContainer}>
                <TextInput 
                    style={styles.searchInput} 
                    placeholder="Search..." 
                    value={searchQuery} 
                    onChangeText={setSearchQuery} 
                />
                <TouchableOpacity onPress={fetchReportsData} style={styles.searchButton}>
                    <Icon name="search" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
            <ScrollView style={styles.tableContainer}>
                {flag === 1 || filteredData.length==0 ? (
                    <View style={styles.noRecords}>
                        <Text>No records found</Text>
                    </View>
                ) : (
                    filteredData.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.card}
                            onPress={() => toggleExpand(index)}
                        >
                           <View style= {styles.rowdrop}>
                                <Text style={styles.cardHeader}>Vehicle No: {item.vehicleNo}</Text>
                                <Icon name={expandedIndex === index ? 'angle-up' : 'angle-down'} size={20} color="black" />
                            </View>
                            {expandedIndex === index && (
                                <View>
                                    <View style= {styles.row}>
                                        <Text style= {styles.headerCell}>Device ID: </Text>
                                        <Text style= {styles.cell}>{item.deviceID}</Text>
                                    </View>
                                    <View style= {styles.row}>
                                        <Text style= {styles.headerCell}>Driver Name: </Text>
                                        <Text style= {styles.cell}>{item.driverName}</Text>
                                    </View>
                                    {Array.from({ length: numberOfDays }, (_, dayIndex) => (
                                        <View style= {styles.row}>
                                            <Text key={dayIndex} style= {styles.headerCell}>Day {dayIndex + 1}:</Text>
                                            <Text style= {styles.cell}>{item[days[dayIndex + 1]]}</Text>
                                        </View>
                                        
                                    ))}
                                <View style= {styles.row}>
                                    <Text style= {styles.headerCell}>Total KM:</Text>
                                    <Text style= {styles.cell}>{calculateTotalKm(item)}</Text>
                                    </View>
                                </View>
                            )}
                        </TouchableOpacity>
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
        padding: 16,
        backgroundColor: '#FFF',
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
    //   drop:{
    //     backgroundColor:'lightblue',
    //     height:50,
    //     marginBottom:7,
    //     borderRadius:5
    // },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    calendarIcon: {
        marginRight: 8,
    },
    selectedMonthText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    actions: {
        flexDirection: 'row',
    },
    actionButton: {
        marginLeft: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#CCC',
        borderRadius: 4,
        padding: 8,
        marginRight: 8,
    },
    searchButton: {
        backgroundColor: '#007BFF',
        padding: 8,
        borderRadius: 4,
    },
    tableContainer: {
        flex: 1,
    },
    card: {
        borderWidth: 1,
        borderColor: '#CCC',
        borderRadius: 4,
        padding: 16,
        marginBottom: 8,
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
    heading:{
        fontSize:25,
        textAlign:'center',
        paddingBottom:15,
        color:'black'
      },
    cardHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color:'black'
    },
    noRecords: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    cell: {
        paddingHorizontal: 10,
        padding: 2,
        color: 'black',
    },
    rowdrop:{
        flexDirection: 'row',
        marginBottom: 2,
        justifyContent:'space-between'
    },
});

export default DailyKMreports;
