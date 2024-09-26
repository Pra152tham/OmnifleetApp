import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Clipboard, Platform , TextInput} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { useUser } from '../../screen/UserContext';
import { Picker } from '@react-native-picker/picker';
import {Menu} from 'react-native-paper';


const NightDriving = ({ navigation }) => {
    const [reportsData, setReportsData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredData, setFilteredData] = useState([]);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [flag, setFlag] = useState(0);
    const [selectedOption, setSelectedOption] = useState('ALL');
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
    }, [startDate, endDate, selectedOption]);

   
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
            //console.log(formattedEndDate);
            const group1 = selectedGroupOption=='Select Vehicle Group'?'null':selectedGroupOption;
            console.log(group1);
            const response = await axios.get(`https://www.novusomnifleet.com/hitech-api/report/getNightDrivingData/${formattedStartDate}/${formattedEndDate}/${userId}/${group1}`);

            const data = response.data.data || [];
            const filteredByTime = filterDataByTimeRange(data, selectedOption);

            setReportsData(filteredByTime);
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



    const filterDataByTimeRange = (data, option) => {
        if (option === 'ALL') return data;

        let startHour, endHour;

        switch (option) {
            case '11 PM to 1 AM':
                startHour = 23;
                endHour = 1;
                break;
            case '1 AM to 4 AM':
                startHour = 1;
                endHour = 4;
                break;
            case '4 AM to 5 AM':
                startHour = 4;
                endHour = 5;
                break;
            default:
                return data;
        }
        
        return data.filter(item => {
            const startTime= starttime(item, 2);
            const timestamp=  item.nightDrivingEndTime;
            const timePart = timestamp.split(":")[1]; // Extracts the hour part
            const endTime = parseInt(timePart, 10);
            
            if (startHour > endHour) {
                return (startTime >= startHour || startTime <endHour) || 
                       (endTime >= startHour || endTime < endHour);
            }
            return (startTime >= startHour && startTime < endHour) || 
                   (endTime >= startHour && endTime < endHour);
        });
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
              <h1>Night Driving Reports</h1>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Device ID</th>
                    <th>Vehicle No</th>
                    <th>Last Location</th>
                    <th>Kilometers</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredData.map(item => `
                    <tr>
                      <td>${starttime(item, 1)}</td>
                      <td>${starttime(item, 0)}</td>
                      <td>${item.nightDrivingEndTime}</td>
                      <td>${item.deviceId}</td>
                      <td>${item.vehicleId}</td>
                      <td>${item.lastLocation}</td>
                      <td>${item.km} km</td>
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
                fileName: 'NightDrivingReports',
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
          Date: ${starttime(item, 1)}
          Start Time: ${starttime(item, 0)}
          End Time: ${item.nightDrivingEndTime}
          Device ID: ${item.deviceId}
          Vehicle No: ${item.vehicleId}
          Last Location: ${item.lastLocation}
          Km: ${item.km} km
        `).join('\n\n');
    
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
    const starttime =(item, flag)=> {
        if(flag==0){
            const timestamp = item.warningSortKey;

            const parts = timestamp.split('#');

            const dateTime = parts[1];
            return dateTime;
        }else if(flag==1){
            const inputString= item.warningSortKey;
            const parts = inputString.split('#');

            const dateTime = parts[1].split(':');

            const date = dateTime[0];
            return date;
        }else if(flag==2){
            const timestamp = item.warningSortKey;
            const hourPartString = timestamp.split(':')[1].split(':')[0];
            const hourPartInt = parseInt(hourPartString, 10);
            return hourPartInt;
        }
        
    }
    
    
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
            <Text style= {styles.heading}>Night Driving report </Text>
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
                selectedValue={selectedOption}
                onValueChange={(itemValue) => setSelectedOption(itemValue)}
                style={styles.dropdown}
            >
                <Picker.Item label="ALL" value="ALL" />
                <Picker.Item label="11 PM to 1 AM" value="11 PM to 1 AM" />
                <Picker.Item label="1 AM to 4 AM" value="1 AM to 4 AM" />
                <Picker.Item label="4 AM to 5 AM" value="4 AM to 5 AM" />
            </Picker>
            </View>
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
            <TouchableOpacity style={styles.searchButton} onPress={fetchReportsData}>
                <Text style={styles.searchButtonText}>Search Filter</Text>
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
                                        <Text style={styles.cardHeaderText}>{item.vehicleId}</Text>
                                    </View>
                
                                    <Icon name={expandedIndex === index ? 'angle-up' : 'angle-down'} size={20} color="black" />
                                </View>
                            </TouchableOpacity>
                            {expandedIndex === index && (
                                <View style={styles.cardContent}>
                                     
                                     <View style={styles.row}>
                                        <Text style={styles.headerCell}>Date:</Text>
                                        <Text style={styles.cell}>{starttime(item, 1)}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Start Time:</Text>
                                        <Text style={styles.cell}>{starttime(item, 0)}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>End Time: </Text>
                                        <Text style={styles.cell}>{item.nightDrivingEndTime}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Last Location:</Text>
                                        <Text style={styles.cell}>{item.lastLocation}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Km:</Text>
                                        <Text style={styles.celladdress}>{item.km} km</Text>
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
    },selectedGroupText:{
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
    datePickerLabel: {
        marginRight: 10,
        fontWeight: 'bold',
        
    },
    datePickerText: {
        color: 'blue',
        fontSize:15,
    
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
        fontSize:14
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
    searchInput: {
        borderWidth: 1,
        borderColor: 'gray',
        padding: 5,
        marginBottom: 10,
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
    celladdress:{
        paddingHorizontal: 10,
        padding: 2,
        color: 'black',
        fontSize:14,
        paddingRight:120
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
    heading:{
        fontSize:25,
        textAlign:'center',
        paddingBottom:15,
        color:'black'
      },
    dropdown: { 
        borderColor: '#ccc', 
        borderWidth: 1, 
        borderRadius: 8,
        marginBottom: 16, 
        padding: 13 ,
        borderWidth:1,
        borderColor:'black'

    },
});

export default NightDriving;