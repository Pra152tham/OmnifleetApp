import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Clipboard, Platform,TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { useUser } from '../../screen/UserContext';
import {Menu} from 'react-native-paper';

const Continuousreports = ({ navigation }) => {
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
            console.log(userId);
            const group1 = selectedGroupOption=='Select Vehicle Group'?'null':selectedGroupOption;
            console.log(group1);
            const response = await axios.get(`https://www.novusomnifleet.com/hitech-api/report/getContinuousDrivingData/${formattedStartDate}/${formattedEndDate}/${userId}/${group1}`);

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
                    <h1>Continuous Driving Report</h1>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Vehicle No</th>
                                <th>Continuous Driving Alert</th>
                                <th>Start Time</th>
                                <th>End Time</th>
                                <th>Time Stamp (hours)</th>
                                <th>Distance (Km)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredData.map(item => `
                                <tr>
                                    <td>${item.date_time}</td>
                                    <td>${item.vehicleId}</td>
                                    <td>1</td>
                                    <td>${Datetimechange(item, 1)}</td>
                                    <td>${Datetimechange(item, 0)}</td>
                                    <td>${Datetimechange(item, 2)} hours</td>
                                    <td>${item.km} Km</td>
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
                fileName: 'ContinuousDrivingReport',
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
            Date: ${item.date_time}
            Vehicle No: ${item.vehicleId}
            Continuous Driving Alert: 1
            Start Time: ${Datetimechange(item, 1)}
            End Time: ${Datetimechange(item, 0)}
            Time Stamp: ${Datetimechange(item, 2)} hours
            Distance: ${item.km} Km
        `).join('\n\n');
    
        Clipboard.setString(textContent);
        Alert.alert('Copied to Clipboard', 'All report data has been copied to the clipboard.');
    };
    

    const toggleExpand = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };
    const Datetimechange= (item, flag)=> {

        if(flag==1){
            const timestamp = item.warningSortKey;

            const dateTimePart = timestamp.split('#')[1];

            // Split the dateTimePart by ':' to get the time part
            const timeParts = dateTimePart.split(':');
            const hours24 = parseInt(timeParts[1], 10);
            const minutes = timeParts[2];
            const seconds = timeParts[3].split('#')[0];

            // Convert to 12-hour format
            const period = hours24 >= 12 ? 'PM' : 'AM';
            const hours12 = hours24 % 12 || 12; // Convert '0' hour to '12' for 12-hour format

            const formattedTime = `${hours12}:${minutes}:${seconds} ${period}`;
            return formattedTime;
        }
        else if(flag==-1){
            const datetimeString= item.warningSortKey;
            const timeMatch = datetimeString.match(/\d{4}-\d{2}-\d{2}/);
            const timeString = timeMatch ? timeMatch[0] : null;
            return timeString;
        }else if(flag==0){
            const timestamp= item.continuousDrivingEndTime;
            const parts = timestamp.split(':');
            const hours24 = parseInt(parts[1], 10);
            const minutes = parts[2];
            const seconds = parts[3];

            // Convert to 12-hour format
            const period = hours24 >= 12 ? 'PM' : 'AM';
            const hours12 = hours24 % 12 || 12; // Convert '0' hour to '12' for 12-hour format

            const formattedTime = `${hours12}:${minutes}:${seconds} ${period}`;
            return formattedTime;
        }else if(flag==2){
            const timestamp = item.warningSortKey;

            const dateTimePart = timestamp.split('#')[1];

            // Split the dateTimePart by ':' to get the time part
            const timeParts = dateTimePart.split(':');
            const hours12 = parseInt(timeParts[1], 10);
            const minutes = timeParts[2];
            const seconds = timeParts[3].split('#')[0];

            const formattedTime = `${hours12}:${minutes}:${seconds}`;
            console.log(formattedTime);

            const timestamp1= item.continuousDrivingEndTime;
            const parts = timestamp1.split(':');
            const hours121 = parseInt(parts[1], 10);
            const minutes1 = parts[2];
            const seconds1 = parts[3];
            const formattedTime1 = `${hours121}:${minutes1}:${seconds1}`;
            console.log(formattedTime);
            console.log(formattedTime1);

            const baseDate = '2024-08-08'; // any arbitrary date

            const date1 = new Date(`${baseDate}T${formattedTime}`);
            const date2 = new Date(`${baseDate}T${formattedTime1}`);
          
            const diffInMs = date2 - date1;
          
            const diffInHours = diffInMs / (1000 * 60 * 60);
          
            return diffInHours;
      
            
        }
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
            <Text style= {styles.heading}>Continuous Driving report</Text>
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
                filteredData.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => toggleExpand(index)}
                        style={styles.cardContent}
                    >
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardHeaderText}>Date:</Text>
                                <Text style={styles.cardHeaderText}>{Datetimechange(item,-1)}</Text>
                            </View>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardHeaderText}>Vehicle No:</Text>
                                <Text style={styles.cardHeaderText}>{item.vehicleId}</Text>
                            </View>
                            {expandedIndex === index && (
                                <>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Continous Driving Alert:</Text>
                                        <Text style={styles.cell}>1</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Start Time:</Text>
                                        <Text style={styles.cell}>{Datetimechange(item, 1)}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>End Time:</Text>
                                        <Text style={styles.cell}>{Datetimechange(item, 0)}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Time Stamp:</Text>
                                        <Text style={styles.cell}>{Datetimechange(item,2)} hours</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Distance:</Text>
                                        <Text style={styles.cell}>{item.km} Km</Text>
                                    </View>
                                </>
                            )}
                        </View>
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
        padding: 20,
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
        padding:2,
        
    },
    cardTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        
    },
    cardContent: {
        marginTop: 10,
    },
    cardHeaderText: {
        fontSize: 15,
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
        padding:2,
        fontSize:13

    },
});

export default Continuousreports;
