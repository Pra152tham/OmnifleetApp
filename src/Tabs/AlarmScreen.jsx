import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Button, Modal, Alert,FlatList,TouchableWithoutFeedback, Animated } from 'react-native';
import { Calendar } from 'react-native-calendars';
import axios from 'axios';
import CardTemplate from '../components/CardTemplate'; // Ensure the correct path to the CardTemplate component
import Video from 'react-native-video';
import VideoCardTemplate from '../components/VideoCardTemplate';
import MapsPopup from '../components/MapsPopup';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { WebView } from 'react-native-webview';
import { useUser } from '../screen/UserContext'; 
import { useDate } from '../components/DateContext';

const cameraTypes = ['DSM', 'VTS', 'FORWARD_CAMERA', 'INWARD_CAMERA'];

const warningTypes = {
  DSM: ["Drowsiness", "Distraction Warning", "Phone Usage", "Harsh Acceleration", "Over Speeding", "Harsh Braking", "Yawning"],
  VTS: ["Over Speeding", "Harsh Acceleration", "Harsh Braking", "SOS", "Night Driving", "Continuous Driving", "Harsh Turning", "Sudden Stoppage"],
  FORWARD_CAMERA: ["Lane Departure Warning", "Forward Collision Warning-Preliminary", "Pedestrian Collision Warning-Mandatory", "Continuous Driving", "SOS", "Night Driving", "Harsh Acceleration", "Harsh Braking", "Over Speeding"],
  INWARD_CAMERA: ["Regular Snapshot", "Drowsiness", "Phone Usage", "Smoking", "Distraction Warning", "Over Speeding", "Camera Obstruction", "Seatbelt Warning", "Yawning", "Vehicle Idling"],
};

const CameraAlertsType = {
  DSM: [619, 618, 625, 621, 613, 609, 614, 638],
  VTS : [609, 613, 614, 611, 612, 610, 615, 637],
  FORWARD_CAMERA : [602, 603, 600, 601, 605, 607, 606, 610, 611, 612, 613, 614, 609],
  INWARD_CAMERA: [617, 641, 619, 618, 621, 623, 625, 609, 513, 639, 638, 640],
}



const warningCodes = {
    "Drowsiness": [619, 618],
    "Distraction Warning": [625],
    "Phone Usage": [621],
    "Harsh Acceleration": [613],
    "Over Speeding": [609],
    "Harsh Braking": [614],
    "Yawning": [638],
    "SOS": [611],
    "Night Driving": [612],
    "Continuous Driving": [610],
    "Harsh Turning": [615],
    "Sudden Stoppage": [637],
    "Lane Departure Warning": [603],
    "Forward Collision Warning-Preliminary": [600, 601,605],
    "Pedestrian Collision Warning-Mandatory": [607, 606],
    "Regular Snapshot": [617, 641],
    "Smoking": [623],
    "Camera Obstruction": [513, 626],
    "Seatbelt Warning": [639],
    "Vehicle Idling": [640],
    "Low Visibility Warning": [602],
};

const AlarmScreen = () => {
  const [activeTab, setActiveTab] = useState('Expandable');
  const [searchParams, setSearchParams] = useState({
    date: new Date(),
    vehicle: '',
    warningType: '',
    cameraType: '',
    group: null,
  });

  const [open, setOpen] = useState(false);
  const [alarms, setAlarms] = useState([]);
  const [filteredAlarms, setFilteredAlarms] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [showCameraDropdown, setShowCameraDropdown] = useState(false);
  const [showWarningDropdown, setShowWarningDropdown] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [currentVideoUrls, setCurrentVideoUrls] = useState([]);
  
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({ latitude: 0, longitude: 0 });
  const [liveStreamModalVisible, setLiveStreamModalVisible] = useState(false);
  const [iframeUrl, setIframeUrl] = useState('');
  const [jSessionId, setJSessionId] = useState('');
  const { userId } = useUser();
  const { startDate } = useDate();


  const Date_ = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
  };

  // const fetch_Data = async () => {
  //   const date_filter = Date_(searchParams.date);
  //   const cameraType = searchParams.cameraType || 'fcw'; // default to 'fcw' if no cameraType is selected
  //   const vehicle = searchParams.vehicle || '0' ;
  //   const warningTypes = Array.isArray(warningCodes[searchParams.warningType]) ? warningCodes[searchParams.warningType] : 0;
  //   const allFetchedAlarms = [];

  //   for (const warningType of warningTypes) {
  //     const url = `https://www.novusomnifleet.com/hitech-api/analyse/warnings-videos/${userId}?pageSize=10&format=json&pageIndex=1&day=${date_filter}&vehicle=${vehicle}&warningType=${warningType}&severity=0&deviceType=${cameraType}&groupId=`;

  //     try {
  //       console.log("the requested url :",url)
  //       const response = await axios.get(url);
  //       console.log('Fetched Alarms:', response.data.data);
  //       allFetchedAlarms.push(...response.data.data);
  //     } catch (error) {
  //       console.error('Error fetching alarms:', error);
  //     }
  //   }

  //   setAlarms(allFetchedAlarms);
  //   setFilteredAlarms(allFetchedAlarms);
  // };

  const camera = (cameraType) => {
    switch (cameraType) {
      case 'FORWARD_CAMERA':
        return "fcw";
      case 'DSM':
        return "dsm";
      case 'VTS':
        return "vts";
      case 'INWARD_CAMERA':
        return "0";
      default:
        return "fcw";
    }
  };

  const fetch_Data = async (withFilters = false) => {
    const date_filter = Date_(searchParams.date);
    const cameraTyp = camera(searchParams.cameraType) || 'fcw';
    const vehicles = searchParams.vehicle ? searchParams.vehicle : '0';
    console.log("Filters applied:",withFilters )
    console.log("*Vehicle filter Applied*",vehicles);
    console.log("*cameraType filter Applied*",cameraTyp);
    
    const warningTypes = Array.isArray(warningCodes[searchParams.warningType]) ? warningCodes[searchParams.warningType] : [0];
    let allAlarms = [];
  
    try {
      for (let i = 0; i < warningTypes.length; i++) {
        const currentWarningType = warningTypes[i];
        const url = withFilters
          ? `https://www.novusomnifleet.com/hitech-api/analyse/warnings-videos/${userId}?pageSize=10&format=json&pageIndex=1&day=${date_filter}&vehicle=${vehicles}&warningType=${currentWarningType}&severity=0&deviceType=${cameraTyp}&groupId=`
          : `https://www.novusomnifleet.com/hitech-api/analyse/warnings-videos/${userId}?pageSize=10&format=json&pageIndex=1&day=${date_filter}&vehicle=0&warningType=0&severity=0&deviceType=fcw&groupId=`;
  
        console.log('Requested URL:', url);
        const response = await axios.get(url);
  
        // Check if the response contains the expected structure
        if (response.data.count > 0 && Array.isArray(response.data.data)) {
          console.log(`Fetched Alarms for warningType ${currentWarningType}:`, response.data.data);
          allAlarms = [...allAlarms, ...response.data.data];
        } else {
          console.error('Unexpected API response structure:', response.data);
        }
      }
  
      setAlarms(allAlarms);
    } catch (error) {
      console.error('Error fetching data:', error.message);
    }
  };
  

  useEffect(() => {
    // Only fetch data when the search button is clicked or filters are cleared
    if (isFiltered) {
      fetch_Data(true); // Fetch data with filters
    } else {
      fetch_Data(); // Fetch default data
    }
  }, [searchParams, isFiltered]);

  useEffect(() => {

    // let date_filter = Date_(searchParams.date);
    // axios.get(`https://www.novusomnifleet.com/hitech-api/analyse/warnings-videos/${userId}?pageSize=10&format=json&pageIndex=1&day=${date_filter}&vehicle=0&warningType=0&severity=0&deviceType=fcw&groupId=`)
    // .then(response => {
    //   console.log(userId);
    //   console.log(date_filter);
    //   console.log('Fetched Alarms:', response.data);
    //   setAlarms(response.data.data);
    //   setFilteredAlarms(response.data.data);
    // })
    // .catch(error => {
    //   console.error(error);
    // });
      
    axios.get(`https://www.novusomnifleet.com/hitech-api/vehicle/get-all-vehicle-by-fleet-manager-id/${userId}`)
      .then(response => {
        console.log('Fetched Vehicles:', response.data);
        setVehicles(response.data.data.map(vehicle => vehicle.registrationNo));
      })
      .catch(error => {
        console.error(error);
      });
    
      axios.get('https://api.novusomnifleet.com/StandardApiAction_login.action?account=admin&password=Thrsl@12')
      .then(response => {
        console.log('Fetched jSessionId:', response.data);
        setJSessionId(response.data.JSESSIONID);
      })
      .catch (error => {
        console.error('Error fetching JSESSIONID:', error);
      });

  }, []);

  const closeDropdowns = () => {
    setShowVehicleDropdown(false);
    setShowCameraDropdown(false);
    setShowWarningDropdown(false);
  };

  const formatDate = (timestampString) => {
    const [year, month, day] = timestampString.split('_');
    return `${year}-${month}-${day}`;
  };

  function findWarningKey(code) {
    for (const [key, codes] of Object.entries(warningCodes)) {
        if (codes.includes(code)) {
            return key;
        }
    }
    return null; // return null if the code is not found
}

  // const handleSearch = () => {
  //   const filtered = alarms.filter(alarm => {
  //     console.log(formatDate(alarm.timestampString));
  //     console.log(searchParams.date.toISOString().split('T')[0]);
  //     const dateMatches = !searchParams.date || formatDate(alarm.timestampString) === searchParams.date.toISOString().split('T')[0];
  //     const vehicleMatches = !searchParams.vehicle || alarm.vehicle.registrationNo === searchParams.vehicle;
  //     const cameraTypeMatches = !searchParams.cameraType || CameraAlertsType[searchParams.cameraType]?.includes(alarm.eventOccured);
  //     const warningTypeMatches = !searchParams.warningType || (warningCodes[searchParams.warningType] || []).includes(alarm.eventOccured);
  //     const groupMatches = !searchParams.group || alarm.group === searchParams.group;
  
  //     return dateMatches && vehicleMatches && cameraTypeMatches && warningTypeMatches && groupMatches;
  //   });
  
  //   setFilteredAlarms(filtered);
  // };

  const handleSearch = () => {
    setShowFilters(false);
    fetch_Data(true);
  };

  const handleClearFilters = () => {
    setSearchParams({
      date: new Date(),
      vehicle: '',
      warningType: '',
      cameraType: '',
      group: '',
    });
    fetch_Data();
  };

  const handleLiveStreamClick = (deviceType, deviceId, jsessionId) => {
    const url = getIframeUrl(deviceType, deviceId, jsessionId);
    setIframeUrl(url);
    //setLiveStreamVideo(true);
    setLiveStreamModalVisible(true);
  };

  const getIframeUrl = (deviceType, deviceId, jsessionId) => {
    console.log("Inside getIframeUrl function", deviceType);
    if (deviceType === 'android') {
      console.log("Device type is android");
      return `https://api3.novusomnifleet.com/livestreaming/${deviceId}?isAudio=false`;
    } else {
      console.log("Device type is not android");
      const url = `https://api.novusomnifleet.com/808gps/open/player/video.html?lang=en&devIdno=346430005486&jsession=${jsessionId}`;
      console.log(url);
      return url;
    }
  };

  // const handleAlarmVideoClick = async (alarm) => {
  //   if (alarm.fileName) {
  //     const timestamp = alarm.timestamp;
  //     const date = new Date(timestamp);
  //     const year = date.getUTCFullYear();
  //     const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  //     const day = String(date.getUTCDate()).padStart(2, '0');
  //     const formattedDate = `${year}-${month}-${day}`;
  //     const url = `https://www.novusomnifleet.com/hitech-api/device/getVp1VideoOnDemand/${alarm.deviceId}/${formattedDate}/${alarm.fileName}`;

  //     try {
  //       const response = await axios.get(url);
  //       if (response.data.status === 200 && response.data.data && response.data.data.length > 0) {
  //         setCurrentVideoUrls(response.data.data);
  //         setShowVideo(true);
  //       } else {
  //         Alert.alert("Video Not Available", "The requested video URL is not available.");
  //       }
  //     } catch (error) {
  //       console.error('Error fetching video URL:', error);
  //       Alert.alert("Error", "Unable to fetch video URL.");
  //     }
  //   } else {
  //     Alert.alert("No Video Available", "This item does not have a video associated with it.");
  //   }
  // };

  const handleAlarmVideoClick = async (alarm, deviceType) => {
    if (alarm.fileName) {
      const timestamp = alarm.timestamp;
      const date = new Date(timestamp);
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      console.log(formattedDate);
  
      if (deviceType === 'android') {
        const arrOfVideoString = alarm.fileName.split(",");
        const fleetId = userId;
  
        const videoRequest = {
          deviceId: alarm.deviceId,
          fleetId: fleetId,
          date: formattedDate,
          fileNames: arrOfVideoString
        };
  
        try {
          const response = await axios.post("https://www.novusomnifleet.com/hitech-api/warning/fetch-android-warning-video", videoRequest, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
  
          if (response.data.status === 200 && response.data.data && response.data.data.length > 0) {
            setCurrentVideoUrls(response.data.data);
            setShowVideo(true);
          } else {
            Alert.alert("Video Not Available", "The requested video URL is not available.");
          }
        } catch (error) {
          console.error('Error fetching video URL for Android:', error);
          Alert.alert("Error", "Unable to fetch video URL.");
        }
      } else {
        const url = `https://www.novusomnifleet.com/hitech-api/device/getVp1VideoOnDemand/${alarm.deviceId}/${formattedDate}/${alarm.fileName}`;
  
        try {
          const response = await axios.get(url);
          if (response.data.status === 200 && response.data.data && response.data.data.length > 0) {
            setCurrentVideoUrls(response.data.data);
            setShowVideo(true);
          } else {
            Alert.alert("Video Not Available", "The requested video URL is not available.");
          }
        } catch (error) {
          console.error('Error fetching video URL:', error);
          Alert.alert("Error", "Unable to fetch video URL.");
        }
      }
    } else {
      Alert.alert("No Video Available", "This item does not have a video associated with it.");
    }
  };
  


  const openMapPopup = (latitude, longitude) => {
    console.log(selectedLocation);
    setSelectedLocation({ latitude: parseFloat(latitude), longitude: parseFloat(longitude) });
    console.log(selectedLocation);
    console.log(selectedLocation.latitude);
    console.log(selectedLocation.longitude);
    setIsMapVisible(true);
    return selectedLocation;
  };

  const renderExpandableView = () => (
    <TouchableWithoutFeedback onPress={() => closeDropdowns()}>
    <View style={styles.expandableView}>
    {showFilters ? (
      <View style={styles.searchBar}>
        <TouchableOpacity onPress={() => setOpen(true)} style={styles.dateInput}>
          <Text>{searchParams.date.toLocaleDateString()}</Text>
        </TouchableOpacity>

        {open && (
          <Modal
            transparent={true}
            animationType="slide"
            visible={open}
            onRequestClose={() => setOpen(false)}
          >
            <View style={styles.modalBackground}>
              <View style={styles.calendarContainer}>
                <Calendar
                  onDayPress={(day) => {
                    setSearchParams({ ...searchParams, date: new Date(day.dateString) });
                    setOpen(false); // Close the calendar after selecting a date
                  }}
                  markedDates={{
                    [searchParams.date.toISOString().split('T')[0]]: { selected: true, marked: true, selectedColor: 'blue' },
                  }}
                  theme={{
                    selectedDayBackgroundColor: '#00adf5',
                    todayTextColor: '#00adf5',
                    arrowColor: '#00adf5',
                  }}
                />
              </View>
            </View>
          </Modal>
        )}
        <TouchableOpacity onPress={() => setShowVehicleDropdown(!showVehicleDropdown)} style={styles.input}>
          <Text>{searchParams.vehicle || 'Select Vehicle'}</Text>
        </TouchableOpacity>
        {showVehicleDropdown && (
          <View style={styles.dropdown}>
            <FlatList
              data={vehicles}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => {
                  setSearchParams({ ...searchParams, vehicle: item });
                  setShowVehicleDropdown(false);
                }}>
                  <Text style={styles.dropdownItem}>{item}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => index.toString()}
              style={styles.dropdownList}
              nestedScrollEnabled
            />
          </View>
        )}
        <TouchableOpacity onPress={() => setShowCameraDropdown(!showCameraDropdown)} style={styles.input}>
          <Text>{searchParams.cameraType || 'Select Camera Type'}</Text>
        </TouchableOpacity>
        {showCameraDropdown && (
          <View style={styles.dropdown}>
            <FlatList
              data={cameraTypes}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => {
                  setSearchParams({ ...searchParams, cameraType: item, warningType: '' });
                  setShowCameraDropdown(false);
                }}>
                  <Text style={styles.dropdownItem}>{item}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => index.toString()}
              style={styles.dropdownList}
              nestedScrollEnabled
            />
          </View>
        )}
        <TouchableOpacity onPress={() => setShowWarningDropdown(!showWarningDropdown)} style={styles.input}>
          <Text>{searchParams.warningType || 'Select Warning Type'}</Text>
        </TouchableOpacity>
        {showWarningDropdown && (
          <View style={styles.dropdown}>
            <FlatList
              data={warningTypes[searchParams.cameraType] || []}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => {
                  setSearchParams({ ...searchParams, warningType: item });
                  setShowWarningDropdown(false);
                }}>
                  <Text style={styles.dropdownItem}>{item}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => index.toString()}
              style={styles.dropdownList}
              nestedScrollEnabled
            />
          </View>
        )}
        <TextInput
          style={styles.input}
          placeholder="Select Group"
          value={searchParams.group}
          onChangeText={(text) => setSearchParams({ ...searchParams, group: text })}
        />
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearFilters} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowFilters(false)} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    ) : (
          <TouchableOpacity onPress={() => setShowFilters(true)} style={styles.filtersButton}>
            <Text style={styles.filtersButtonText}>Filters ▼ </Text>
          </TouchableOpacity>
      )}
      <ScrollView style={styles.cardContainer}>
        {alarms && alarms.length > 0 ? alarms.map((alarm, index) => (
          <CardTemplate
            key={index}
            data={{
              'Vehicle Id': alarm.vehicle.registrationNo,
              'Warning Type': findWarningKey(alarm.eventOccured),
              'Warning Time': formatDate(alarm.timestampString),
              Group: 'NOVU-GRP',
              Speed: alarm.speed,
              Comments: '-',
              'Warning Status': alarm.vehicle.errorStatus,
              'Warning Location': (
                  <TouchableOpacity onPress={() => openMapPopup(alarm.latitude, alarm.longitude)}>
                    <Icon name="location-pin" size={30} color="blue" />
                  </TouchableOpacity>
                ),
              'Live Stream': <TouchableOpacity onPress={() => handleLiveStreamClick(alarm.deviceType, alarm.deviceId, jSessionId)}><Text style={styles.link}>Live Stream</Text></TouchableOpacity>,
              'Talk Back': '-',
              'Alarm Video': <TouchableOpacity onPress={() => handleAlarmVideoClick(alarm , alarm.deviceType)}><Text style={styles.link}>Alarm Video</Text></TouchableOpacity>,
            }}
          />
        )) : (
          <Text style={styles.noDataText}>No Alarms Found</Text>
        )}
      </ScrollView>

        <Modal
          visible={isMapVisible}
          animationType="slide"
          onRequestClose={() => setIsMapVisible(false)}
          transparent={true}
        >
          <View style={styles.mapModalContainer}>
            <View style={styles.mapModalContent}>
              <MapsPopup
                customLatitude={selectedLocation.latitude}
                customLongitude={selectedLocation.longitude}
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsMapVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        
        
        <Modal
          visible={liveStreamModalVisible}
          onRequestClose={() => setLiveStreamModalVisible(false)}
          animationType="slide"
        >
          <View style={{ flex: 1 }}>
            <Button title="Close" onPress={() => setLiveStreamModalVisible(false)} />

            <WebView
              allowsFullscreenVideo={true}
              source={{
                html: `
                  <html>
                    <body style="margin:0;padding:0;overflow:hidden;">
                      <div style="position: relative; padding-bottom: 50.25%; height: 0; overflow: hidden;">
                        <iframe
                          id="live_stream_video"
                          src="${iframeUrl}"
                          allow="autoplay; fullscreen"
                          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
                          frameborder="0"
                        ></iframe>
                      </div>
                    </body>
                  </html>`
              }}
              style={{ flex: 1 }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          </View>
        </Modal>
    </View>
    </TouchableWithoutFeedback>
  );

  const [alertData, setAlertData] = useState({});
  const [showAlertTypeDropdown, setShowAlertTypeDropdown] = useState(false);
  const [showAlertDropdown, setShowAlertDropdown] = useState(false);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [selectedAlertType, setSelectedAlertType] = useState("");
  const [selectedAlert, setSelectedAlert] = useState("");
  const [eventIds, setEventIds] = useState([0]);
  const [topVehiclesByCategory, setTopVehiclesByCategory] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});

  const [showFilters, setShowFilters] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false); // New state to track if data is filtered

  const categoryDisplayNames = {
    seat_belt: "Seat Belt Warnings",
    phone_calling: "Phone Usage Warnings",
    harsh_acceleration: "Harsh Accerelarion Warnings",
    camera_block: "Camera Obstruction Warning",
    harsh_turning : "Harsh Turning Warnings",
    over_speed: "Over Speeding Warnings",
    high_g: "High-G",
    low_visibility_alert: "Low Visibility Warnings",
    vulnerable_road_user: "Vulnerable Road User Warnings",
    drowsiness: "Drowsiness Warnings",
    distracted: "Distraction Warning",
    route_deviation: "Route Deviation Warnings",
    forward_collision: "Forward Collision Warnings",
    hard_braking: "Harsh Braking Warnings",
    vehicle_idling: "Vehicle Idling",
    sos: "SOS",
    smoking: "Smoking",
    yawning: "Yawning",
    lane_deviation: "Lane Deviation Warnings"
  };
  
  const fetchData = async (withFilters = false) => {
    const the_date = format_Date(searchParams.date);
    const groupParam = searchParams.group ? searchParams.group : "null";
    const eventIdParam = eventIds.length > 0 ? eventIds.join(',') : "0";
    const url = withFilters
      ? `https://www.novusomnifleet.com/hitech-api/utility/getAlarm/${userId}?startDate=${the_date}&endDate=${the_date}&vehicleId=0&group=${groupParam}&eventId=${eventIdParam}&fullPage=false&pageSize=10&pageIndex=5`
      : `https://www.novusomnifleet.com/hitech-api/utility/getAlarm/${userId}?startDate=${the_date}&endDate=${the_date}&vehicleId=0&group=null&eventId=0&fullPage=true&pageSize=10&pageIndex=5`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      console.log(url);
      console.log('Dateeee:', the_date);
      console.log('grouppppp:' , groupParam );
      console.log('Fetched eventIdParam:', eventIdParam);
      console.log('Fetched Smart View:', result);
      setAlertData(result.data || {}); // Set the fetched data to the state

      const topVehicles = {};
      for (const category in result.data) {
        const vehicleCount = {};
        result.data[category].forEach(alert => {
          const vehicleId = alert.vehicleId;
          if (!vehicleCount[vehicleId]) {
            vehicleCount[vehicleId] = 0;
          }
          vehicleCount[vehicleId] += 1;
        });

        const sortedVehicles = Object.entries(vehicleCount)
          .sort(([, countA], [, countB]) => countB - countA)
          .slice(0, 2);

        topVehicles[category] = sortedVehicles.map(([vehicleId]) => vehicleId);
      }
      setTopVehiclesByCategory(topVehicles);

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  

  useEffect(() => {
    // Only fetch data when the search button is clicked or filters are cleared
    if (isFiltered) {
      fetchData(true); // Fetch data with filters
    } else {
      fetchData(); // Fetch default data
    }
  }, [searchParams, eventIds, isFiltered]);

    const format_Date = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
  
  
    const handleFilterSearch = () => {
      setShowFilters(false);
      let newEventIds = [0];
      
      if (selectedAlertType === "Simple Warnings") {
        // If a simple warning is selected, find the eventId(s) from the warningCodes
        if (warningCodes[selectedAlert]) {
          newEventIds = warningCodes[selectedAlert];
        }
      } else if (selectedAlertType === "Compound Warnings") {
        switch (selectedAlert) {
          case 'Seatbelt Warning + Distraction Warning':
            newEventIds = [...warningCodes["Seatbelt Warning"], ...warningCodes["Distraction Warning"]];
            break;
          case 'Camera Obstruction + Distraction Warning':
            newEventIds = [...warningCodes["Camera Obstruction"], ...warningCodes["Distraction Warning"]];
            break;
          case 'Collision Warning':
            newEventIds = [
              ...warningCodes["Distraction Warning"],
              ...warningCodes["Forward Collision Warning-Preliminary"],
              ...warningCodes["Pedestrian Collision Warning-Mandatory"]
            ];
            break;
          case 'Distraction Warning + vulnerableRoadUser':
            newEventIds = [...warningCodes["Distraction Warning"], ...warningCodes["Pedestrian Collision Warning-Mandatory"]];
            break;
          case 'Harsh Driving':
            newEventIds = [
              ...warningCodes["Harsh Acceleration"],
              ...warningCodes["Over Speeding"],
              ...warningCodes["Harsh Braking"],
              ...warningCodes["Harsh Turning"]
            ];
            break;
          case 'Continuous Driving + Night Driving + Yawning':
            newEventIds = [
              ...warningCodes["Continuous Driving"],
              ...warningCodes["Night Driving"],
              ...warningCodes["Yawning"]
            ];
            break;
          case 'Smoking + Phone Usage':
            newEventIds = [...warningCodes["Smoking"], ...warningCodes["Phone Usage"]];
            break;
          default:
            newEventIds = [0];
            break;
        }
      }
  
      setEventIds(newEventIds); // Update event IDs
      setIsFiltered(true); // Indicate that the data is filtered
      
    };
  


  const warningTypeOptions = ["Simple Warnings", "Compound Warnings"];
  const simpleWarnings = ["Drowsiness", "Distraction Warning", "Phone Usage", "Harsh Acceleration", "Over Speeding", "Harsh Braking", "Yawning", "SOS", "Night Driving","Continuous Driving", "Harsh Turning", "Sudden Stoppage", "Lane Departure Warning", "Forward Collision Warning-Preliminary", "Pedestrian Collision Warning-Mandatory", "Regular Snapshot", "Smoking", "Camera Obstruction", "Seatbelt Warning", "Vehicle Idling"];
  const compoundWarnings = [
    'Seatbelt Warning + Distraction Warning',
    'Camera Obstruction + Distraction Warning',
    'Collision Warning',
    'Distraction Warning + vulnerableRoadUser',
    'Harsh Driving',
    'Continuous Driving + Night Driving + Yawning',
    'Smoking + Phone Usage'
  ];
  const groups = ["SURE_GRP", "NOVU_GRP"];

  // const handleAlertVideoClick = async (alarm) => {
  //   if (alarm.videoFileName) {
  //     const startIndex = alarm.warningSortKey.indexOf('#') + 1;
  //     const endIndex = alarm.warningSortKey.indexOf(':', startIndex);
  //     const extractedDate = alarm.warningSortKey.substring(startIndex, endIndex);
  //     const url = `https://www.novusomnifleet.com/hitech-api/device/getVp1VideoOnDemand/${alarm.device_id}/${extractedDate}/${alarm.videoFileName}`;
  //     console.log("**video URL** :" ,url);
  //     console.log(alarm.device_id);
  //     console.log(extractedDate);
  //     console.log(alarm.videoFileName);
      
  //     try {
  //       const response = await axios.get(url);
  //       if (response.data.status === 200 && response.data.data && response.data.data.length > 0) {
  //         setCurrentVideoUrls(response.data.data);
  //         setShowVideo(true);
  //       } else {
  //         Alert.alert("Video Not Available", "The requested video URL is not available.");
  //       }
  //     } catch (error) {
  //       console.error('Error fetching video URL:', error);
  //       Alert.alert("Error", "Unable to fetch video URL.");
  //     }
  //   } else {
  //     Alert.alert("No Video Available", "This item does not have a video associated with it.");
  //   }
  // };

  const handleAlertVideoClick = async (alarm, deviceType) => {
    if (alarm.videoFileName) {
      const startIndex = alarm.warningSortKey.indexOf('#') + 1;
      const endIndex = alarm.warningSortKey.indexOf(':', startIndex);
      const extractedDate = alarm.warningSortKey.substring(startIndex, endIndex);
  
      if (deviceType === 'android') {
        const arrOfVideoString = alarm.videoFileName.split(",");
        const fleetId = userId;
  
        const videoRequest = {
          deviceId: alarm.device_id,
          fleetId: fleetId,
          date: extractedDate,
          fileNames: arrOfVideoString
        };
  
        try {
          const response = await axios.post("https://www.novusomnifleet.com/hitech-api/warning/fetch-android-warning-video", videoRequest, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
  
          if (response.data.status === 200 && response.data.data && response.data.data.length > 0) {
            setCurrentVideoUrls(response.data.data);
            setShowVideo(true);
          } else {
            Alert.alert("Video Not Available", "The requested video URL is not available.");
          }
        } catch (error) {
          console.error('Error fetching video URL for Android:', error);
          Alert.alert("Error", "Unable to fetch video URL.");
        }
      } else {
        const url = `https://www.novusomnifleet.com/hitech-api/device/getVp1VideoOnDemand/${alarm.device_id}/${extractedDate}/${alarm.videoFileName}`;
        console.log("**video URL**:", url);
        console.log(alarm.device_id);
        console.log(extractedDate);
        console.log(alarm.videoFileName);
  
        try {
          const response = await axios.get(url);
          if (response.data.status === 200 && response.data.data && response.data.data.length > 0) {
            setCurrentVideoUrls(response.data.data);
            setShowVideo(true);
          } else {
            Alert.alert("Video Not Available", "The requested video URL is not available.");
          }
        } catch (error) {
          console.error('Error fetching video URL:', error);
          Alert.alert("Error", "Unable to fetch video URL.");
        }
      }
    } else {
      Alert.alert("No Video Available", "This item does not have a video associated with it.");
    }
  };
  

  const closeDropdown = () => {
    console.log('Dropdowns are being closed');
    setShowAlertTypeDropdown(false);
    setShowAlertDropdown(false);
    setShowGroupDropdown(false);
  };

  const handleClearFilter = () => {
    setSearchParams(prevState => ({
      ...prevState,
      date: new Date(),
      group: null,
    }));
    setSelectedAlertType("");
    setSelectedAlert("");
    setEventIds([0]);
    setIsFiltered(false); // Reset to indicate no filters applied
    fetchData();
  };

  const toggleViewAll = (category) => {
    setExpandedCategories((prevState) => ({
      ...prevState,
      [category]: !prevState[category],
    }));
  };

  const renderSmartView = () => (
    <TouchableWithoutFeedback onPress={closeDropdown}>
      <View style={styles.smartView}>
      {showFilters ? (
        <View style={styles.searchBar}>
          <TouchableOpacity onPress={() => setOpen(true)} style={styles.dateInput}>
            <Text>{searchParams.date.toLocaleDateString()}</Text>
          </TouchableOpacity>

          {open && (
            <Modal
              transparent={true}
              animationType="slide"
              visible={open}
              onRequestClose={() => setOpen(false)}
            >
              <View style={styles.modalBackground}>
                <View style={styles.calendarContainer}>
                  <Calendar
                    onDayPress={(day) => {
                      setSearchParams({ ...searchParams, date: new Date(day.dateString) });
                      setOpen(false); // Close the calendar after selecting a date
                    }}
                    markedDates={{
                      [searchParams.date.toISOString().split('T')[0]]: { selected: true, marked: true, selectedColor: 'blue' },
                    }}
                    theme={{
                      selectedDayBackgroundColor: '#00adf5',
                      todayTextColor: '#00adf5',
                      arrowColor: '#00adf5',
                    }}
                  />
                </View>
              </View>
            </Modal>
          )}

          <TouchableOpacity onPress={() => setShowAlertTypeDropdown(!showAlertTypeDropdown)} style={styles.input}>
            <Text>{selectedAlertType || 'Select Warning Type'}</Text>
          </TouchableOpacity>
          {showAlertTypeDropdown && (
            <View style={styles.dropdown}>
              <FlatList
                data={warningTypeOptions}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => {
                    setSelectedAlertType(item);
                    setSelectedAlert(""); // Reset selected alert when warning type changes
                    setShowAlertTypeDropdown(false);
                  }}>
                    <Text style={styles.dropdownItem}>{item}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item, index) => index.toString()}
                style={styles.dropdownList}
                nestedScrollEnabled
              />
            </View>
          )}
          <TouchableOpacity onPress={() => setShowAlertDropdown(!showAlertDropdown)} style={styles.input}>
            <Text>{selectedAlert || 'Select Alert'}</Text>
          </TouchableOpacity>
          {showAlertDropdown && (
            <View style={styles.dropdown}>
              <FlatList
                data={selectedAlertType === "Simple Warnings" ? simpleWarnings : compoundWarnings}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => {
                    setSelectedAlert(item);
                    setShowAlertDropdown(false);
                  }}>
                    <Text style={styles.dropdownItem}>{item}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item, index) => index.toString()}
                style={styles.dropdownList}
                nestedScrollEnabled
              />
            </View>
          )}
          <TouchableOpacity onPress={() => setShowGroupDropdown(!showGroupDropdown)} style={styles.input}>
            <Text>{searchParams.group || 'Select Group'}</Text>
          </TouchableOpacity>
          {showGroupDropdown && (
            <View style={styles.dropdown}>
              <FlatList
                data={groups}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => {
                    setSearchParams({ ...searchParams, group: item });
                    setShowGroupDropdown(false);
                  }}>
                    <Text style={styles.dropdownItem}>{item}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item, index) => index.toString()}
                style={styles.dropdownList}
                nestedScrollEnabled
              />
            </View>
          )}
          <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleFilterSearch} style={styles.searchButton}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearFilter} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowFilters(false)} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
        </View>
      ) : (
          <TouchableOpacity onPress={() => setShowFilters(true)} style={styles.filtersButton}>
            <Text style={styles.filtersButtonText}>Filters ▼ </Text>
          </TouchableOpacity>
      )}
        {/* <ScrollView>
          {Object.keys(alertData).map((category) => (
          <View key={category} style={styles.categoryContainer}>
            <Text style={styles.categoryHeader}>{categoryDisplayNames[category] || category}</Text>
            <View style={styles.videoCardContainer}>
              {alertData[category].map((alert, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.videoCard}
                  onPress={() => handleAlertVideoClick(alert, alert.deviceType)}
                >
                  <VideoCardTemplate
                    timestamp={alert.warningSortKey.substring(2, 12) + ' ' + alert.warningSortKey.substring(13, 21)}
                    warningType={category}
                    vehicleId={alert.device_id}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
          ))}
        </ScrollView> */}
        <ScrollView>
          {Object.keys(alertData).map((category) => {
            const isExpanded = expandedCategories[category];
            const videoCardsToShow = isExpanded
              ? alertData[category]
              : alertData[category].slice(0, 4);

            return (
              <View key={category} style={styles.categoryContainer}>
                <View style={styles.categoryHeaderContainer}>
                  <Text style={styles.categoryHeader}>
                    {categoryDisplayNames[category] || category}
                  </Text>
                  <Text style={styles.categorySubHeader}>
                    {`Showing ${videoCardsToShow.length} of ${alertData[category].length}`}
                  </Text>
                </View>
                <View style={styles.categorySubHeader}>
                    <Text style={styles.topVehiclesText}>
                      Driver with Most Warnings: {topVehiclesByCategory[category]?.join(', ') || 'N/A'}
                    </Text>
                  </View>
                <View style={styles.videoCardContainer}>
                  {videoCardsToShow.map((alert, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.videoCard}
                      onPress={() => handleAlertVideoClick(alert, alert.deviceType)}
                    >
                      <VideoCardTemplate
                        timestamp={
                          alert.warningSortKey.substring(2, 12) + ' ' + alert.warningSortKey.substring(13, 21)
                        }
                        warningType={category}
                        vehicleId={alert.device_id}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                {alertData[category].length > 4 && (
                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() => toggleViewAll(category)}
                  >
                    <Text style={styles.viewAllText}>
                      {isExpanded ? '▲ View less' : '▼ View all'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('Expandable')}
          style={[styles.tab, activeTab === 'Expandable' && styles.activeTab]}
        >
          <Text style={styles.tabText}>Expandable</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('SmartView')}
          style={[styles.tab, activeTab === 'SmartView' && styles.activeTab]}
        >
          <Text style={styles.tabText}>SmartView</Text>
        </TouchableOpacity>
      </View>
      {activeTab === 'Expandable' ? renderExpandableView() : renderSmartView()}
      {showVideo && (
        <Modal
          visible={showVideo}
          animationType="slide"
          onRequestClose={() => setShowVideo(false)} // Required for Android
          transparent={true} // Allows the close button to be clickable
        >
          <View style={styles.modalContainer}>
            <View style={styles.headerContainer}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowVideo(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.videoContentContainer}>
                {currentVideoUrls.map((url, index) => (
                  <Video
                    key={index}
                    source={{ uri: url }}
                    style={styles.videoPlayer}
                    controls
                  />
                ))}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    elevation: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 16,
    color: '#333333',
  },
  expandableView: {
    flex: 1,
  },
  filtersButton: {
    backgroundColor: '#F5F5F5', // Background color, adjust to fit your theme
    paddingVertical: 10, // Vertical padding, adjust as needed
    paddingHorizontal: 20, // Horizontal padding, adjust as needed
    borderRadius: 2, // Rounded corners, adjust for more or less rounding
    alignItems: 'center', // Centers the text inside the button
    justifyContent: 'center', // Centers the content vertically
    marginTop: 10, // Adds space above the button, adjust as needed
    marginHorizontal:10,
    borderColor: 'black',
    borderWidth: 1,
  },
  filtersButtonText: {
    color: 'black', // Text color, can be adjusted to match your theme
    fontSize: 16, // Font size, adjust as needed
    fontWeight: 'bold', // Makes the text bold
    textAlign: 'center', // Center-aligns the text
  },
  searchBar: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingTop:5,
  },
  input: {
    height: 40,
    borderColor: 'black',
    borderWidth: 2,
    borderRadius: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
    backgroundColor: '#e6f5ff',
    elevation: 5,
  },
  dateInput: {
    height: 40,
    justifyContent: 'center',
    borderColor: 'black',
    borderWidth: 2,
    borderRadius: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
    backgroundColor: '#e6f5ff',
    elevation: 5,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // semi-transparent background
  },
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  dropdown: {
    marginTop: 0,
    left: 0,
    right: 0,
    backgroundColor: '#e6ffe6',
    borderWidth: 1,
    borderColor: '#black',
    borderRadius: 5,
    zIndex: 1,
    maxHeight: 160,
  },
  dropdownList: {
    maxHeight: 150,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  searchButton: { 
    backgroundColor: '#007BFF', 
    padding: 10, 
    borderRadius: 5 
  },
  searchButtonText: { 
    color: '#fff' 
  },
  clearButton: { 
    backgroundColor: '#FF6347', 
    padding: 10, 
    borderRadius: 5 
  },
  clearButtonText: { 
    color: '#fff' 
  },
  cardContainer: {
    flex: 1,
    padding: 10,
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
    color: '#777777',
  },
  link: {
    color: '#007BFF',
  },
  alertTabs: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  alertTab: {
    flex: 1,
    paddingVertical: 8,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#DDDDDD',
  },
  activeAlertTab: {
    borderBottomColor: '#4CAF50',
  },
  alertList: {
    flex: 1,
  },
  alertHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardTime: {
    fontSize: 12,
    color: '#777777',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Darken background
  },
  headerContainer: {
    width: '100%',
    padding: 1,
    alignItems: 'flex-end', // Position the close button to the right
  },
  closeButton: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
  },
  closeButtonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  videoContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  scrollViewContent: {
    alignItems: 'center',
  },
  videoPlayer: {
    width: '100%',
    height: 200,
  },
  smartView: {
    flex: 1,
  },
  categoryContainer: {
    marginBottom: 16,
    padding: 10,
  },
  categoryHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  categorySubHeader: {
    fontSize: 14,
    color: '#666',
    verticalAlign: 'center',
    marginBottom: 5,
  },
  topVehiclesText: {
    fontSize: 12,
    color: '#555',
    marginVertical: 5,
  },
  viewAllButton: {
    alignItems: 'center',
    marginTop: 3,
    paddingVertical: 1,
    backgroundColor: '#F5F5F5',
  },
  viewAllText: {
    fontSize: 12,
    color: 'black',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  videoCardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 0,
  },
  videoCard: {
    width: '48%',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    marginRight: '2%',
    elevation: 5,
    shadowColor: 'black',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  liveStreamModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveStreamWebView: {
    width: '100%',
    height: '100%',
  },
  mapModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  mapModalContent: {
    width: '90%',
    height: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#f00',
    borderRadius: 5,
    padding: 5,
  },
  closeButtonText: {
    color: '#fff',
  },
});

export default AlarmScreen;
