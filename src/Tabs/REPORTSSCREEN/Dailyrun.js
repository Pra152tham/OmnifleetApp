import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Clipboard, Platform, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { useUser } from '../../screen/UserContext';
import {Menu} from 'react-native-paper';

const Dailyrunreport = ({ navigation }) => {
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
            console.log(formattedStartDate);
            console.log(formattedEndDate);
            console.log(userId);
            const response = await axios.get(`https://www.novusomnifleet.com/hitech-api/report/download-report-by-custom-date/${formattedStartDate}/${formattedStartDate}/${userId}/${group1}`);
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
            <th>Date</th>
            <th>Device ID</th>
            <th>Vehicle No</th>
            <th>Device Type</th>
            <th>Total Km Today</th>
            <th>Rash Driving Event Count</th>
            <th>Rash Driving Safety Score</th>
            <th>Night Driving Event Count</th>
            <th>Night Driving Safety Score</th>
            <th>Overspeeding Event Count</th>
            <th>Overspeeding Safety Score</th>
            <th>Continuous Driving Event Count</th>
            <th>Continuous Driving Safety Score</th>
            <th>Mobile Usage Event Count</th>
            <th>Mobile Usage Safety Score</th>
            <th>Driving Without Seatbelt Event Count</th>
            <th>Driving Without Seatbelt Safety Score</th>
            <th>Rapid Acceleration Event Count</th>
            <th>Rapid Acceleration Safety Score</th>
            <th>Hard Braking Event Count</th>
            <th>Hard Braking Safety Score</th>
            <th>Unsafe Parking Event Count</th>
            <th>Unsafe Parking Safety Score</th>
            <th>Smoking Event Count</th>
            <th>Smoking Safety Score</th>
            <th>Route Plan Deviation Event Count</th>
            <th>Route Plan Deviation Safety Score</th>
            <th>Total Safety Score</th>
        </tr>
    </thead>
    <tbody>
        ${filteredData.map(item => `
            <tr>
                <td>${item.date_time}</td>
                <td>${item.deviceId}</td>
                <td>${item.vehicle}</td>
                <td>FCW</td>
                <td>${item.totalKmToday}</td>
                <td>0</td>
                <td>${item.rashDrivingSafetyScore}</td>
                <td>${item.nightDrivingCount}</td>
                <td>${item.nightDrivingSafetyScore}</td>
                <td>${item.overspeedingCount}</td>
                <td>${item.overspeedingSafetyScore}</td>
                <td>${item.continiuosDrivingCount}</td>
                <td>${item.continiuosDrivingSafetyScore}</td>
                <td>${item.callToCallCountVp1}</td>
                <td>${item.callToCallSafetyScore}</td>
                <td>${item.driverWithoutSeatBeltCount}</td>
                <td>${item.driverWithoutSeatBeltSafetyScore}</td>
                <td>${item.harshaccelerationFcwCount}</td>
                <td>${item.harshAccelerationFcwSafetyScore}</td>
                <td>${item.hardBrakingFcwCount}</td>
                <td>${item.hardBrakingFcwSafetyScore}</td>
                <td>${item.unsafeParkingCount}</td>
                <td>${item.unsafeParkingSafetyScore}</td>
                <td>${item.smokingCountVp1}</td>
                <td>${item.smokingSafetyScore}</td>
                <td>${item.adherenceRoutePlanCount}</td>
                <td>${item.adherenceRoutePlanSafetyScore}</td>
                <td>${item.totalSafetyScore}</td>
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

    const copyAllToClipboard = () => {
        const textContent = filteredData.map(item => `
      Driver Name: ${item.driverName}
      Date: ${item.date_time}
      Device ID: ${item.deviceId}
      Vehicle No: ${item.vehicle}
      Devide Type: FCW
      Total Km Today: ${item.totalKmToday}
      Rash Driving Event Count: 0
      Rash Driving Safety Score: ${item.rashDrivingSafetyScore}
      Night Driving Event Count: ${item.nightDrivingCount}
      Night Driving Safety Score: ${item.nightDrivingSafetyScore}
      Overspeeding Event Count: ${item.overspeedingCount}
      Overspeeding Safety Score: ${item.overspeedingSafetyScore}
      Continuous Driving Event Count: ${item.continiuosDrivingCount}
      Continuous Driving Safety Score: ${item.continiuosDrivingSafetyScore}
      Mobile Usage Event Count: ${item.callToCallCountVp1}
      Mobile Usage Safety Score: ${item.callToCallSafetyScore}
      Driving Without Seatbelt Event Count: ${item.driverWithoutSeatBeltCount}
      Driving Without Seatbelt Safety Score: ${item.driverWithoutSeatBeltSafetyScore}
      Rapid Acceleration Event Count: ${item.harshaccelerationFcwCount}
      Rapid Acceleration Safety Score: ${item.harshAccelerationFcwSafetyScore}
      Hard Braking Event Count: ${item.hardBrakingFcwCount}
      Hard Braking Safety Score: ${item.hardBrakingFcwSafetyScore}
      Unsafe Parking Event Count: ${item.unsafeParkingCount}
      Unsafe Parking Safety Score: ${item.unsafeParkingSafetyScore}
      Smoking Event Count: ${item.smokingCountVp1}
      Smoking Safety Score: ${item.smokingSafetyScore}
      Route Plan Deviation Event Count: ${item.adherenceRoutePlanCount}
      Route Plan Deviation Safety Score: ${item.adherenceRoutePlanSafetyScore}
      Total Safety Score: ${item.totalSafetyScore}
    `).join('\n');

        Clipboard.setString(textContent);
        Alert.alert('Copied to Clipboard', 'All report data has been copied to the clipboard.');
    };

    const toggleExpand = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };
    const datefetch= (item, flag)=>{
        if(flag==0){
            const date= item.date_time;
            const conacte= date.split('_').slice(0, 3).join('-');
            //console.log(conacte);
            return conacte;
        }
        else if(flag==1){
            const datetime= item.startTime
            const datepart= datetime.split(':')[0];
            //console.log(datepart);
            return datepart;
        }else if(flag==2){
            const datetime= item.lastUpdateTime;
            const datepart= datetime.split('_').slice(0,3).join('-');
            return datepart;
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
            <Text style= {styles.heading}>Daily Run Report</Text>
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
                                        <Text style={styles.cardHeaderText}>Name: </Text>
                                        <Text style={styles.cardHeaderText}>{item.driverFullName}</Text>
                                    </View>
                                    <View style={styles.subheader}>
                                        <Text style={styles.cardHeaderText}>Asset Type:</Text>
                                        <Text style={styles.cardHeaderText}>{}</Text>
                                    </View>
                                    <View style={styles.subheader}>
                                        <Text style={styles.cardHeaderText}>Date:</Text>
                                        <Text style={styles.cardHeaderText}>{datefetch(item, 0)}</Text>
                                    </View>
                                    <Icon name={expandedIndex === index ? 'angle-up' : 'angle-down'} size={20} color="black" />
                                </View>
                            </TouchableOpacity>
                            {expandedIndex === index && (
                                <View style={styles.cardContent}>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Start Time:</Text>
                                        <Text style={styles.cell}>{datefetch(item, 1)}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>End Date: </Text>
                                        <Text style={styles.cell}>{datefetch(item, 2)}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Start Location:</Text>
                                        <Text style={styles.cell}>{item.startLatitude} ,{item.startLongitude}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Start Lattitude:</Text>
                                        <Text style={styles.cell}>{item.startLatitude}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Start Longitude:</Text>
                                        <Text style={styles.cell}>{item.startLongitude}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>End Location :</Text>
                                        <Text style={styles.cell}>{item.lastLatitude}, {item.lastLongitude}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>End Lattitude:</Text>
                                        <Text style={styles.cell}>{item.lastLatitude}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>End Longitude:</Text>
                                        <Text style={styles.cell}>{item.lastLongitude}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Moving Time(Min):</Text>
                                        <Text style={styles.cell}>{item.totalDriveTime}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Stop Time(Min):</Text>
                                        <Text style={styles.cell}>{item.stoppedTime}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Distance(KM):</Text>
                                        <Text style={styles.cell}>{item.totalKmToday}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Over Speed:</Text>
                                        <Text style={styles.cell}>{item.overspeedingCount}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Harsh Acceleration:</Text>
                                        <Text style={styles.cell}>{item.harshaccelerationFcwCount}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Night Driving:</Text>
                                        <Text style={styles.cell}>{item.nightDrivingKm}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Max Speed:</Text>
                                        <Text style={styles.cell}>{item.maxSpeed}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.headerCell}>Asset Type:</Text>
                                        <Text style={styles.cell}>N/A</Text>
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
});

export default Dailyrunreport;
