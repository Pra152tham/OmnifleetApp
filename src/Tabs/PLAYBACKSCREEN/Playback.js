import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, FlatList,Linking, Button} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { useUser } from '../../screen/UserContext';
import {Menu} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation
import RNFS from 'react-native-fs'; // Import the file system module



const Playback = () => {

  const navigation = useNavigation();
  const [selectedStatus, setSelectedStatus] = useState('Video Play Back');
  const [Date1, setDate] = useState(new Date());
  const[startDate ,setstartdate]= useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [downloadMessages, setDownloadMessages] = useState({}); // State to track messages for each item
  const { userId } = useUser();
  const [registrationNumbers, setRegistrationNumbers] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [filteredNumbers, setFilteredNumbers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const[Vehiclenumber , setVehiclenumber]= useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportsData, setReportsData] = useState([]);
  const [selectchannel, setselectchannel]= useState('All');
  const [menuVisible, setMenuVisible] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [flag, setFlag]= useState(0);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // New state for current page
  const itemsPerPage = 10; // Number of items per page

const handleChannelPress = (groupName) => {
    setselectchannel(groupName);
    
    setMenuVisible(false);
    // Optionally refetch or filter data based on the selected group
};

  useEffect(() => {
      fetchReportsData();
  }, [Date1]);


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
      const formattedStartDate = moment(Date1).format('YYYY-MM-DD');
      setstartdate(formattedStartDate);
      console.log(Vehiclenumber);
      let channel= '-1';
      if(selectchannel=='All'){
        channel= '-1';
      }
      else if(selectchannel=='Channel_0(FCW)'){
        channel= '0';
      }
      else if(selectchannel== 'Channel_0(DSM)'){
        channel= '1';
      }
      else if(selectchannel== 'Channel_0(In Cabin Camera)'){
        channel= '2';
      }
      else if(selectchannel== 'Channel_0(Rear Camera)'){
        channel= '3';
      }
      console.log(channel);

      const response = await axios.get(`https://www.novusomnifleet.com/hitech-api/playback/getAllPlayBackVideos/${Vehiclenumber}/${channel}/${formattedStartDate}`);
  
      // Check if response contains valid data
      if (response.data && response.data.data) {
        const responseData = response.data.data;
  
        // Check if 'files' exist and are not null or empty
        if (responseData.files && responseData.files.length > 0) {
          // console.log("Files available:", responseData.files);
          setReportsData(responseData.files); // Set the 'files' array as the report data
        } 
        else if (responseData.deviceStatus === 'Device Ignition Status OFF') {
          console.error('Device Ignition Status OFF');
          setReportsData([]); // Set empty reports data
        }
        else if (responseData.deviceStatus === null || responseData.deviceStatus === '') {
          console.error('No device status data found');
          setReportsData([]); // Reset reports data to empty
        }
      } 
      else {
        console.error('No data received from API');
        setReportsData([]); // Reset reports data to empty
      }
    } catch (error) {
      console.error('Error fetching reports data:', error);
      setReportsData([]); // Reset reports data on error
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


const handleSearchChange = (text) => {
  setSearchText(text);
      // Filter registration numbers based on search input
      const filtered = registrationNumbers.filter((reg) =>
        reg.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredNumbers(filtered);
      setDropdownVisible(true); // Show dropdown when searching
};


const handleDownload = async (uniqueKey, item) => {
  try {
    // Unique key using item's index in the original reportsData array

    // Initialize the message for the particular item
    setDownloadMessages(prevState => ({
      ...prevState,
      [uniqueKey]: 'Download Started...'
    }));

    const downloadUrl = await fetchdownload(item, uniqueKey);
    if (downloadUrl) {
      await downloadVideoFile(downloadUrl, uniqueKey); // Pass uniqueKey to update message for this specific item
    }
  } catch (error) {
    setDownloadMessages(prevState => ({
      ...prevState,
      [uniqueKey]: 'Error fetching download URL'
    }));
  }
};

const fetchdownload = async (item, uniqueKey) => {
  try {
    const chn = item.chn;
    const devid = item.devIdno;
    const strime = convertor(item, 0);
    const entime = convertor(item, 1);

    const response = await axios.get(
      `https://www.novusomnifleet.com/hitech-api/playback/uploadPlayBackVideos/${devid}/${chn}/${strime}/${entime}`
    );

    if (response.status === 200) {
      const responseData = response.data;
      const data = responseData.data;  // Access the actual 'data' string

      if (data === "Downloading Started") {
        setDownloadMessages(prevState => ({
          ...prevState,
          [uniqueKey]: "Your task is scheduled. The download will begin in 2-10 minutes. Please check back later."
        }));
      } else if (data === "Something went wrong try again") {
        setDownloadMessages(prevState => ({
          ...prevState,
          [uniqueKey]: "Something went wrong. Please try again."
        }));
      } else if (data === "Downloading in progress") {
        setDownloadMessages(prevState => ({
          ...prevState,
          [uniqueKey]: "Downloading is already in progress."
        }));
      } else if (data === "Device Ignition Status OFF") {
        setDownloadMessages(prevState => ({
          ...prevState,
          [uniqueKey]: "Device Ignition Status is OFF. Please try again later."
        }));
      } else if (data.startsWith("signal")) {
        setDownloadMessages(prevState => ({
          ...prevState,
          [uniqueKey]: `Device signal strength is ${data.substring(6)}. Please try again later.`
        }));
      } else if (data === "CurrentVideo Downloading Started") {
        setDownloadMessages(prevState => ({
          ...prevState,
          [uniqueKey]: "Current video download started."
        }));
      } else if (data.startsWith("Old downloading started")) {
        let channel = "";
        const chn = data.substring(23, 24);
        if (chn == 0) {
          channel = "FCW";
        } else if (chn == 1) {
          channel = "DSM";
        } else if (chn == 2) {
          channel = "In Cabin Camera";
        } else if (chn == 3) {
          channel = "Rear Camera";
        }
        setDownloadMessages(prevState => ({
          ...prevState,
          [uniqueKey]: `You can download this video once the previous download request (time range: ${data.substring(24)} Channel: ${channel}) is completed.`
        }));
      } else {
        // Assume that any other response is the video download URL
        return data;
      }
    }
  } catch (error) {
    console.error('Error fetching vehicle data:', error);
    setDownloadMessages(prevState => ({
      ...prevState,
      [uniqueKey]: 'Error fetching video URL'
    }));
    throw new Error('Error fetching video URL');
  }
};

const downloadVideoFile = async (downloadUrl, uniqueKey) => {
  const fileName = `video-${uniqueKey}.mp4`; // You can dynamically set this name
  const downloadDest = `${RNFS.DownloadDirectoryPath}/${fileName}`; // Path to save in Downloads folder

  try {
    const downloadResult = await RNFS.downloadFile({
      fromUrl: downloadUrl,
      toFile: downloadDest,
    }).promise;

    if (downloadResult.statusCode === 200) {
      setDownloadMessages(prevState => ({
        ...prevState,
        [uniqueKey]: 'Download Completed Successfully!'
      }));
    } else {
      setDownloadMessages(prevState => ({
        ...prevState,
        [uniqueKey]: 'Download Failed!'
      }));
    }
  } catch (err) {
    setDownloadMessages(prevState => ({
      ...prevState,
      [uniqueKey]: 'Error downloading the file!'
    }));
  }
};


const showDatePicker1 = (type) => {
      setShowDatePicker(true);
};

const onDateChange = (event, selectedDate, type) => {
  const currentDate = selectedDate || Date1;

      setShowDatePicker(Platform.OS === 'ios');
      setDate(currentDate);
};

const toggleExpand = (index) => {
  const uniqueIndex = `${currentPage}-${index}`;
  setExpandedIndex(expandedIndex === uniqueIndex ? null : uniqueIndex);
};


const concanatevideourl= (item)=>{
  const adder= 'https://api.novusomnifleet.com/root/VideoPlayExample.html#';

  const adder2= item.PlaybackUrlWs;
  // console.log(adder2);
  const adder3= adder+adder2;
  console.log(adder3);
  
return adder3
}

const convertor = (item, flag) => {
  if (flag === 0 && item && item.beg != null) {  // Use strict equality and check item validity
    let d = new Date(0);
    const timer = item.beg;
    d.setUTCSeconds(timer - 19800);  // Adjusting time zone manually (IST likely)
    
    const time = startDate+":"+d.toString().substring(16, 24);  // Extracting time part HH:MM:SS
    console.log(time);  // Logging the time
    return time
  }
  else if (flag === 1 && item && item.beg != null) {  // Use strict equality and check item validity
    let d = new Date(0);
    const timer = item.end;
    d.setUTCSeconds(timer - 19800);  // Adjusting time zone manually (IST likely)
    const time = startDate+":"+d.toString().substring(16, 24);  // Extracting time part HH:MM:SS
    console.log(time);  // Logging the time
    return time;
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
    <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.switchContainer}>
          <TouchableOpacity
            style={[styles.switchButton, selectedStatus === 'Video Play Back' && styles.selectedButton]}
            onPress={() => setSelectedStatus('Video Play Back')}
          >
            <Text style={[styles.switchButtonText, selectedStatus === 'Video Play Back' && styles.selectedButtonText]}>Video Play Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switchButton, selectedStatus === 'Alarm Video Play Back' && styles.selectedButton]}
            onPress={() => setSelectedStatus('Alarm Video Play Back')}
          >
            <Text style={[styles.switchButtonText, selectedStatus === 'Alarm Video Play Back' && styles.selectedButtonText]}>Alarm Video Play Back</Text>
          </TouchableOpacity>
        </View>
        {selectedStatus==='Video Play Back' && 
        <View style = {styles.container2}>
          <View style={styles.datePickers}>
                  <View style={styles.datePickerContainer}>
                      <Text style={styles.datePickerLabel}>Select Date:</Text>
                      <TouchableOpacity onPress={() => showDatePicker1()}>
                          <Text style={styles.datePickerText}>{moment(Date1).format('YYYY-MM-DD')}</Text>
                      </TouchableOpacity>
                  </View>
              </View>
              {showDatePicker && (
                <DateTimePicker
                    value={Date1}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => onDateChange(event, selectedDate)}
                />
            )}
            <View style= {styles.drop}>
              <Menu
                  visible={menuVisible}
                  onDismiss={() => setMenuVisible(false)}
                  anchor={
                      <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.groupSelector}>
                          <Text style={styles.selectedGroupText}>{selectchannel}</Text>
                          <Icon name="angle-down" size={16} color="#000" style= {styles.icon1}/>
                      </TouchableOpacity>
                  }>
                  <Menu.Item onPress={() => handleChannelPress('All')} title="All" />
                  <Menu.Item onPress={() => handleChannelPress('Channel_0(FCW)')} title="Channel_0(FCW)" />
                  <Menu.Item onPress={() => handleChannelPress('Channel_0(DSM)')} title="Channel_0(DSM)" />
                  <Menu.Item onPress={() => handleChannelPress('Channel_0(In Cabin Camera)')} title="Channel_0(In Cabin Camera)" />
                  <Menu.Item onPress={() => handleChannelPress('Channel_0(Rear Camera)')} title="Channel_0(Rear Camera)" />
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
                    scrollEnabled={false}
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
            <TouchableOpacity style={styles.searchButton} onPress={fetchReportsData}>
                <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
            <TextInput
                style={styles.searchInput1}
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
                                        <Text style={styles.cardHeaderText}>Vehicle ID:</Text>
                                        <Text style={styles.cardHeaderText}>{Vehiclenumber}</Text>
                                    </View>
                                    <View style={styles.subheader}>
                                        <Text style={styles.cardHeaderText}>Device ID:</Text>
                                        <Text style={styles.cardHeaderText}>{item.devIdno}</Text>
                                    </View>
                                   
                                    <Icon name={expandedIndex === index ? 'angle-up' : 'angle-down'} size={20} color="black" />
                                </View>
                            </TouchableOpacity>
                            {expandedIndex === `${currentPage}-${index}` && (
                               <View style={styles.cardContent}>
                               <View style={styles.row}>
                                   <Text style={styles.headerCell}>Channel</Text>
                                   <Text style={styles.cell}>{item.chn}</Text>
                               </View>
                               <View style={styles.row}>
                                   <Text style={styles.headerCell}>Start Time</Text>
                                   <Text style={styles.cell}>{convertor(item, 0)}</Text>
                               </View>
                               <View style={styles.row}>
                                   <Text style={styles.headerCell}>End Time</Text>
                                   <Text style={styles.cell}>{convertor(item, 1)}</Text>
                               </View>
                               <View style={styles.row}>
                                 {/* Touchable to open the VideoPlaybackScreen */}
                                 <Text style={styles.headerCell}>Watch Video</Text>
                                 <TouchableOpacity onPress={() => navigation.navigate('VideoPlaybackScreen', { videoUrl: concanatevideourl(item) })}>
                                   <Text style={styles.linkText}>Watch Video</Text>
                                 </TouchableOpacity>
                               </View>
                               <View style={styles.row}>
                                <Text style={styles.headerCell}>Download Video</Text>
                                <View style={styles.container}>
                                  <TouchableOpacity onPress={() => handleDownload(`${currentPage}-${index}-${item.devIdno}-${item.chn}`, item)}>
                                    <Text style={styles.linkText}>Download Video</Text>
                                  </TouchableOpacity>

                                  {downloadMessages[`${currentPage}-${index}-${item.devIdno}-${item.chn}`] ? (
                                    <Text style={styles.message}>{downloadMessages[`${currentPage}-${index}-${item.devIdno}-${item.chn}`]}</Text> // Display the message for this item
                                  ) : null}
                                </View>
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
            }
            </ScrollView>
  );
};
 
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    
    backgroundColor: '#f8f9fa',
  },
  container2:{
    paddingHorizontal:8
  },
  container3: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  
  },
  switchButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    backgroundColor: '#dee2e6',
    borderRadius: 5,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#007bff',
  },
  switchButtonText: {
    fontSize: 16,
    color: '#000',
  },
  selectedButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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
    fontSize:18,
    color:'black'

},
datePickerText: {
  paddingHorizontal:5,
  marginVertical:5,
  borderWidth:1,
  fontSize:16,
  color: 'blue',
  padding:4,
  borderRadius:4
},
selectedGroupText:{
  padding:15,
  fontSize:15,
  textAlign:'center',
  color:'black',

},
linkText: {
  color: 'blue',
  textDecorationLine: 'underline',
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

headerCell: {
  fontWeight: 'bold',
  width: 120,
  color: 'grey',
},
noDataText: {
  textAlign: 'center',
  marginTop: 20,
  fontSize: 18,
  color: 'red',
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
searchInput1: {
  borderWidth: 1,
  borderColor: 'black',
  padding: 5,
  paddingHorizontal:2,
  marginBottom: 10,
  borderRadius:5
},
container1: {
  marginTop: 2,
 
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

messageContainer: { padding: 10, backgroundColor: '#dff0d8', marginTop: 10 },
  messageText: { color: '#3c763d', fontWeight: 'bold' },
});
 
export default Playback;