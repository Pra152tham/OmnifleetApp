import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, FlatList, Button, PermissionsAndroid, Platform, ActivityIndicator, Linking, Dimensions, Image } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import Video from 'react-native-video';
import DateTimePicker from '@react-native-community/datetimepicker';
import Geocoder from 'react-native-geocoding';
import axios from 'axios';
import { useUser } from '../screen/UserContext';
import { useDate } from '../components/DateContext';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Make sure to install and import Ionicons
import YellowCircle from '../assets/yellow-circle-icons.png'
import GreenCircle from '../assets/green-dot-icon.png';

const truckIcon = require('../assets/truck.png');

const MapsScreen = () => {
  const [activeTab, setActiveTab] = useState('Track and Trace');
  const [markers, setMarkers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [group, setGroup] = useState('');
  const [trip, setTrip] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showVehiclesDropdown, setShowVehiclesDropdown] = useState(false);
  const [route, setRoute] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false); // Control the visibility of the search bar
  const { userId } = useUser();
  const {StartDate} = useDate();
  const [showVideo, setShowVideo] = useState(false);
  const [currentVideoUrls, setCurrentVideoUrls] = useState([]);
  
  const mapRef = useRef(null);
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    Geocoder.init('AIzaSyA5-QZgtqQKR_09f6ob_ZgjN4POg8QMzuY');
    requestLocationPermission();
    fetchDeviceData();
  }, [userId, startDate]);

  useEffect(() => {
    fetchVehicles();
    requestLocationPermission();
  }, [userId]);

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`https://www.novusomnifleet.com/hitech-api/vehicle/get-all-vehicle-by-fleet-manager-id/${userId}`);
      console.log('Fetched Vehicles:', response.data);
      setVehicles(response.data.data.map(vehicle => ({
        registrationNo: vehicle.registrationNo,
      })));
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchRouteData = async () => {
    if (!startDate || !endDate || !vehicleId) return;

    console.log(startDate);
    console.log(endDate);
    console.log(vehicleId);
    console.log(userId);
    console.log(`https://www.novusomnifleet.com/hitech-api/utility/getAllFcwsEventDataTrip/${userId}?toDate=${endDate}&fromDate=${startDate}&deviceId=${vehicleId}`);

    setLoading(true);
    try {
        const config = {
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
            }
        };

        const responseFetch = await fetch(
            `https://www.novusomnifleet.com/hitech-api/utility/getAllFcwsEventDataTrip/${userId}?toDate=${endDate}&fromDate=${startDate}&deviceId=${vehicleId}`,
            config
        );

        const jsonResponse = await responseFetch.json();
        console.log("Response JSON:", jsonResponse);

        if (jsonResponse && jsonResponse.data) {
            const locations = jsonResponse.data.locations;

            // Map the locations to include latitude, longitude, and index
            const indexedMarkers = locations.map((location, index) => ({
                latitude: location.latitude,
                longitude: location.longitude,
                driverWarningType: location.driverWarningType,
                formatDate: location.formatDate,
                deviceId: location.deviceId,
                fileName: location.fileName,
                driverWarningAlarm: location.driverWarningAlarm,
                deviceType: location.deviceType,
                index: index, // adding index for each location
            }));

            // Set markers with the mapped locations
            setMarkers(indexedMarkers);

            // Fetch route with the locations
            fetchRoute(indexedMarkers);
        } else {
            console.error('Error fetching route data:', jsonResponse?.message || 'No data returned');
        }
    } catch (error) {
        console.log('Error fetching route data:', error);
    } finally {
        setLoading(false);
    }
  };

  

  const fetchRoute = async (locations) => {
    if (locations.length < 2) {
      console.error("Not enough locations to fetch route");
      return;
    }
  
    const chunkSize = 23; 
    let routePoints = [];
  
    for (let i = 0; i < locations.length; i += chunkSize) {
      const start = locations[i];
      const end = locations[Math.min(i + chunkSize, locations.length - 1)];
      const waypoints = locations.slice(i + 1, Math.min(i + chunkSize, locations.length - 1))
        .map(loc => `${loc.latitude},${loc.longitude}`).join('|');
  
      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&waypoints=${waypoints}&key=AIzaSyA5-QZgtqQKR_09f6ob_ZgjN4POg8QMzuY`
        );
  
        if (response.data.routes && response.data.routes.length > 0) {
          const points = decodePolyline(response.data.routes[0].overview_polyline.points);
          routePoints = routePoints.concat(points);
        } else {
          console.error('No routes found in the response:', response.data);
        }
      } catch (error) {
        console.error('Error fetching route:', error);
      }
    }
  
    setRoute(routePoints);

    // Adjust the map's camera to show all markers and route points
    if (mapRef.current && routePoints.length > 0) {
      const coordinates = [...routePoints, ...locations];
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  const decodePolyline = (encoded) => {
    let points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({ latitude: lat / 1E5, longitude: lng / 1E5 });
    }

    return points;
  };

  const fetchDeviceData = async () => {
    try {
      const response = await fetch(`https://www.novusomnifleet.com/hitech-api/dashboard/getAllDeviceStatus/${StartDate}/${StartDate}/${userId}/NOVU-GRP`); 
      const result = await response.json();
      if (result.status === 200 && result.data && result.data.liveLocationResponseList) {
        const { liveLocationResponseList } = result.data;
        const markerData = await Promise.all(
          liveLocationResponseList.map(async device => {
            const address = await getAddressFromCoords(device.lastLatitude, device.lastLongitude);
            return {
              latitude: device.lastLatitude,
              longitude: device.lastLongitude,
              vehicleRegistrationNo: device.vehicleRegistrationNo,
              deviceId: device.deviceId,
              lastUpdateTime: device.lastUpdateTime,
              address: address,
            };
          })
        );
        setMarkers(markerData);
        if (markerData.length > 0) {
          setRegion({
            ...region,
            latitude: markerData[0].latitude,
            longitude: markerData[0].longitude,
          });
        }
      } else {
        console.error('Error: Invalid status or no data in response:', result);
      }
    } catch (error) {
      console.error('Error fetching device data:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs to access your location.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Location permission granted');
        } else {
          console.log('Location permission denied');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const getAddressFromCoords = async (latitude, longitude) => {
    try {
      const res = await Geocoder.from(latitude, longitude);
      const address = res.results[0].formatted_address;
      return address;
    } catch (error) {
      return 'No address available';
    }
  };

  const zoomIn = () => {
    mapRef.current.animateToRegion({
      ...region,
      latitudeDelta: region.latitudeDelta / 2,
      longitudeDelta: region.longitudeDelta / 2,
    });
  };
 
  const zoomOut = () => {
    mapRef.current.animateToRegion({
      ...region,
      latitudeDelta: region.latitudeDelta * 2,
      longitudeDelta: region.longitudeDelta * 2,
    });
  };
 
  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${region.latitude},${region.longitude}`;
    Linking.openURL(url);
  };
 
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const handleStartDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(Platform.OS === 'ios');
    setStartDate(currentDate.toISOString().split('T')[0]);
  };

  const handleEndDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(Platform.OS === 'ios');
    setEndDate(currentDate.toISOString().split('T')[0]);
  };

  const handleVehicleSelect = (vehicle) => {
    setVehicleId(vehicle.registrationNo);
    setShowVehiclesDropdown(false);
  };

  const renderVehicleItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleVehicleSelect(item)}>
      <Text style={styles.dropdownItem}>{item.registrationNo}</Text>
    </TouchableOpacity>
  );

  const handleOutsidePress = () => {
    if (searchBarVisible) {
      setSearchBarVisible(false);
    }
  };

  const handleAlarmVideoClick = async (marker, deviceType) => {
    if (marker.fileName) {
      const formattedDate = marker.formatDate.split(' ')[0];
      console.log(formattedDate);
  
      if (deviceType === 'android') {
        const arrOfVideoString = marker.fileName.split(",");
  
        const videoRequest = {
          deviceId: marker.deviceId,
          fleetId: userId,
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

  

  const renderTrackAndTrace = () => (
    <View style={styles.trackAndTraceContainer}>
      {showSearchBar && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchBar}
            placeholder="Group"
            value={group}
            onChangeText={setGroup}
          />
          <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.searchBar}>
            <Text>{startDate ? startDate : 'Start Date'}</Text>
          </TouchableOpacity>
          {showStartDatePicker && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display="default"
              onChange={handleStartDateChange}
            />
          )}
          <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={styles.searchBar}>
            <Text>{endDate ? endDate : 'End Date'}</Text>
          </TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display="default"
              onChange={handleEndDateChange}
            />
          )}
          <TouchableOpacity onPress={() => setShowVehiclesDropdown(!showVehiclesDropdown)} style={styles.searchBar}>
            <Text>{vehicleId || 'Select Vehicle'}</Text>
          </TouchableOpacity>
          {showVehiclesDropdown && (
            <FlatList
              data={vehicles}
              renderItem={renderVehicleItem}
              keyExtractor={(item) => item.registrationNo}
              style={styles.dropdown}
            />
          )}
          <TextInput
            style={styles.searchBar}
            placeholder="Trip"
            value={trip}
            onChangeText={setTrip}
          />
          <Button title="Submit" onPress={fetchRouteData} />
        </View>
      )}
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: markers.length > 0 ? markers[0].latitude : 0,
          longitude: markers.length > 0 ? markers[0].longitude : 0,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {markers.length > 0 && markers.map((marker, index) => (
          <Marker
            key={index}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            icon={ marker.driverWarningType != 0 ? YellowCircle : GreenCircle}
            onPress={() => handleAlarmVideoClick(marker, marker.deviceType)}
          />
        ))}
        {route.length > 0 && (
          <Polyline
            coordinates={route}
            strokeColor="#000"
            strokeWidth={6}
          />
        )}
      </MapView>
      <TouchableOpacity
        onPress={() => setShowSearchBar(!showSearchBar)}
        style={styles.zoomButtonsContainer}
      >
        {showSearchBar ? (
          <Icon name="close" size={24} color="black" />
        ) : (
          <Icon name="search" size={24} color="black" />
        )}
      </TouchableOpacity>
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

  const renderLiveTracking = () => (
    <View style={styles.fullScreenContainer}>
      <View style={styles.map}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          provider={PROVIDER_GOOGLE}
        >
          {markers.map((marker, index) => (
            <Marker
              key={index}
              coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
              title={marker.vehicleRegistrationNo}
              description={`Vehicle ID: ${marker.vehicleRegistrationNo}\nDevice ID: ${marker.deviceId}\nTime: ${marker.lastUpdateTime}\nAddress: ${marker.address}`}
            >
              <Image source={truckIcon} style={styles.truckIcon} />
              <Callout>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>{marker.vehicleRegistrationNo}</Text>
                  <Text style={styles.calloutDescription}>Vehicle ID: {marker.vehicleRegistrationNo}</Text>
                  <Text style={styles.calloutDescription}>Device ID: {marker.deviceId}</Text>
                  <Text style={styles.calloutDescription}>Time: {marker.lastUpdateTime}</Text>
                  <Text style={styles.calloutDescription}>Address: {marker.address}</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
        <View style={styles.zoomButtonsContainer}>
          <TouchableOpacity style={styles.zoomButton} onPress={zoomIn}>
            <Icon name="zoom-in" size={30} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomButton} onPress={zoomOut}>
            <Icon name="zoom-out" size={30} color="black" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.googleMapsButton} onPress={openInGoogleMaps}>
          <Icon name="map" size={30} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity style={activeTab === 'Track and Trace' ? styles.activeTabButton : styles.tabButton} onPress={() => setActiveTab('Track and Trace')}>
          <Text style={styles.tabText}>Track and Trace</Text>
        </TouchableOpacity>
        <TouchableOpacity style={activeTab === 'Live Tracking' ? styles.activeTabButton : styles.tabButton} onPress={() => setActiveTab('Live Tracking')}>
          <Text style={styles.tabText}>Live Tracking</Text>
        </TouchableOpacity>
      </View>
      {activeTab === 'Track and Trace' ? renderTrackAndTrace() : renderLiveTracking()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  tabContainer: {
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding:5,
    paddingVertical:0,
    backgroundColor: '#f9f9f9',
  },
  tabButton: {
    backgroundColor: '#f9f9f9',
    padding:5,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: 'blue',
    padding:1,
    flexDirection: 'row',
  },
  activeTabText: {
    borderBottomColor: '#000',
  },
  map: {
    flex: 1,
    zIndex: -1, // Ensure map is behind the tabs
  },
  trackAndTraceContainer: {
    flex: 1,
  },
  searchToggle: {
    alignSelf: 'left',
    marginVertical: 10,
    background: 'transparent',
    paddingHorizontal: 20,
    backgroundColor: 'transparent', // Remove the white background
    zIndex: 10, // Ensure it's above the map
    elevation: 5, // Give it an elevation for shadow
  },
  searchToggleText: {
    color: 'blue',
    fontWeight: 'bold',
  },
  searchContainer: {
    position: 'absolute',
    top: 45, // Adjust the top position as needed
    left: 10,
    right: 10,
    backgroundColor: 'transparent', // Remove the white background
    zIndex: 10, // Ensure it's above the map
    elevation: 5, // Give it an elevation for shadow
  },
  searchBar: {
    height: 40,
    backgroundColor: '#f9f9f9', // The search bar itself can still have a background
    textAlignVertical:'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    elevation: 2, // A small elevation to make it look slightly elevated
    shadowColor: '#000', // Add shadow for a more elevated effect
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    marginBottom:5,
    opacity:0.9,
  },
  dropdown: {
    maxHeight: 150,
    backgroundColor: 'white',
    marginTop: 5,
    borderRadius: 5,
  },
  dropdownItem: {
    padding: 10,
    borderBottomColor: 'gray',
    borderBottomWidth: 1,
  },
  fullScreenContainer: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  zoomButtonsContainer: {
    position: 'absolute',
    bottom: 50,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    elevation: 2,
  },
  zoomButton: {
    padding: 5,
  },
  googleMapsButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'white',
    padding: 5,
    borderRadius: 5,
    elevation: 2,
  },
  calloutContainer: {
    width: 250,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calloutVideo: {
    width: 200,
    height: 100,
    marginTop: 10,
  },
  calloutTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  calloutDescription: {
    fontSize: 10,
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
  videoPlayer: {
    width: '100%',
    height: 200,
  },
  loading: {
    position: 'absolute',
    top: Dimensions.get('window').height / 2,
    left: Dimensions.get('window').width / 2,
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  truckIcon: {
    width: 30, 
    height: 30, 
  },
});

export default MapsScreen;





// import React, { useEffect, useState, useRef } from 'react';
// import {
//   StyleSheet, Text, View, PermissionsAndroid, Platform, ActivityIndicator, TouchableOpacity, Linking,
//   Dimensions, TextInput, Modal, FlatList
// } from 'react-native';
// import MapView, { Marker, PROVIDER_GOOGLE, Callout, Polyline } from 'react-native-maps';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import Geocoder from 'react-native-geocoding';
// import axios from 'axios';
// import { useUser } from '../screen/UserContext';
// import { useDate } from '../components/DateContext';
// import Calendar from 'react-native-calendars';



// const MapsScreen = () => {
//   const [markers, setMarkers] = useState([]);
//   const [routeCoordinates, setRouteCoordinates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState('Track and Trace');
//   const [region, setRegion] = useState({
//     latitude: 37.78825,
//     longitude: -122.4324,
//     latitudeDelta: 0.0922,
//     longitudeDelta: 0.0421,
//   });
//   const { userId } = useUser();
//   const { DateToday } = useDate();
//   const [startDate, setStartDate] = useState(null);
//   const [endDate, setEndDate] = useState(null);
//   const [vehicleId, setVehicleId] = useState('');
//   const [vehicles, setVehicles] = useState([]);
//   const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
//   const [calendarOpen, setCalendarOpen] = useState(false);
//   const [calendarMode, setCalendarMode] = useState('start');
//   const mapRef = useRef(null);
 
//   useEffect(() => {
//     Geocoder.init('AIzaSyA5-QZgtqQKR_09f6ob_ZgjN4POg8QMzuY');
//     requestLocationPermission();
//     if (activeTab === 'Live Tracking') {
//       fetchDeviceData();
//     }
//   }, [userId, startDate]);
 
//   const fetchDeviceData = async () => {
//     try {
//       const response = await fetch(`https://www.novusomnifleet.com/hitech-api/dashboard/getAllDeviceStatus/${startDate}/${startDate}/${userId}/NOVU-GRP`); 
//       const result = await response.json();
//       if (result.status === 200 && result.data && result.data.liveLocationResponseList) {
//         const { liveLocationResponseList } = result.data;
//         const markerData = await Promise.all(
//           liveLocationResponseList.map(async device => {
//             const address = await getAddressFromCoords(device.lastLatitude, device.lastLongitude);
//             return {
//               latitude: device.lastLatitude,
//               longitude: device.lastLongitude,
//               vehicleRegistrationNo: device.vehicleRegistrationNo,
//               deviceId: device.deviceId,
//               lastUpdateTime: device.lastUpdateTime,
//               address: address,
//             };
//           })
//         );
//         setMarkers(markerData);
//         if (markerData.length > 0) {
//           setRegion({
//             ...region,
//             latitude: markerData[0].latitude,
//             longitude: markerData[0].longitude,
//           });
//         }
//       } else {
//         console.error('Error: Invalid status or no data in response:', result);
//       }
//     } catch (error) {
//       console.error('Error fetching device data:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     axios.get(`https://www.novusomnifleet.com/hitech-api/vehicle/get-all-vehicle-by-fleet-manager-id/${userId}`)
//       .then(response => {
//         console.log('Fetched Vehicles:', response.data);
//         setVehicles(response.data.data.map(vehicle => vehicle.registrationNo));
//       })
//       .catch(error => {
//         console.error(error);
//       });
//   }, []);

//   const fetchLocationData = async () => {
//     try {
//       const response = await fetch(`https://www.novusomnifleet.com/hitech-api/utility/getAllFcwsEventDataTrip/${userId}?toDate=${endDate}&fromDate=${startDate}&deviceId=${vehicleId}`);
//       const result = await response.json();
//       if (result.status === 200 && result.data && result.data.locations) {
//         const locations = result.data.locations.map(loc => ({
//           latitude: loc.latitude,
//           longitude: loc.longitude,
//         }));

//         setRouteCoordinates(locations);
//         drawRoute(locations);
//       }
//     } catch (error) {
//       console.error('Error fetching location data:', error);
//     }
//   };

//   const drawRoute = async (locations) => {
//     if (locations.length < 2) return;

//     const waypoints = locations.slice(1, -1).map(loc => `${loc.latitude},${loc.longitude}`).join('|');
//     const origin = `${locations[0].latitude},${locations[0].longitude}`;
//     const destination = `${locations[locations.length - 1].latitude},${locations[locations.length - 1].longitude}`;

//     try {
//       const response = await fetch(
//         `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=${waypoints}&key=AIzaSyA5-QZgtqQKR_09f6ob_ZgjN4POg8QMzuY`
//       );
//       const result = await response.json();
//       if (result.status === 'OK') {
//         const points = decodePolyline(result.routes[0].overview_polyline.points);
//         setRouteCoordinates(points);
//       } else {
//         console.error('Error fetching directions:', result);
//       }
//     } catch (error) {
//       console.error('Error fetching directions:', error);
//     }
//   };

//   const decodePolyline = (t, e) => {
//     for (
//       var n, o, u = 0, l = 0, r = 0, d = [], h = 0, i = 0, a = null, c = Math.pow(10, e || 5);
//       u < t.length;

//     ) {
//       (a = null), (h = 0), (i = 0);
//       do (a = t.charCodeAt(u++) - 63), (i |= (31 & a) << h), (h += 5);
//       while (a >= 32);
//       (n = 1 & i ? ~(i >> 1) : i >> 1), (h = 0), (i = 0);
//       do (a = t.charCodeAt(u++) - 63), (i |= (31 & a) << h), (h += 5);
//       while (a >= 32);
//       (o = 1 & i ? ~(i >> 1) : i >> 1),
//         (l += n),
//         (r += o),
//         d.push([l / c, r / c]);
//     }
//     return d.map(function (t) {
//       return { latitude: t[0], longitude: t[1] };
//     });
//   };
 
//   const requestLocationPermission = async () => {
//     if (Platform.OS === 'android') {
//       try {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//           {
//             title: 'Location Permission',
//             message: 'This app needs to access your location.',
//             buttonNeutral: 'Ask Me Later',
//             buttonNegative: 'Cancel',
//             buttonPositive: 'OK',
//           }
//         );
//         if (granted === PermissionsAndroid.RESULTS.GRANTED) {
//           console.log('You can use the location');
//         } else {
//           console.log('Location permission denied');
//         }
//       } catch (err) {
//         console.warn(err);
//       }
//     }
//   };
 
//   const getAddressFromCoords = async (latitude, longitude) => {
//     try {
//       const res = await Geocoder.from(latitude, longitude);
//       const address = res.results[0].formatted_address;
//       return address;
//     } catch (error) {
//       return 'No address available';
//     }
//   };
 
//   const zoomIn = () => {
//     mapRef.current.animateToRegion({
//       ...region,
//       latitudeDelta: region.latitudeDelta / 2,
//       longitudeDelta: region.longitudeDelta / 2,
//     });
//   };
 
//   const zoomOut = () => {
//     mapRef.current.animateToRegion({
//       ...region,
//       latitudeDelta: region.latitudeDelta * 2,
//       longitudeDelta: region.longitudeDelta * 2,
//     });
//   };
 
//   const openInGoogleMaps = () => {
//     const url = `https://www.google.com/maps/search/?api=1&query=${region.latitude},${region.longitude}`;
//     Linking.openURL(url);
//   };

//   const onDatePress = (mode) => {
//     setCalendarMode(mode);
//     setCalendarOpen(true);
//   };

//   const handleDateSelect = (day) => {
//     const selectedDate = day.dateString;
//     if (calendarMode === 'start') {
//       setStartDate(selectedDate);
//     } else if (calendarMode === 'end') {
//       setEndDate(selectedDate);
//     }
//     setCalendarOpen(false);
//   };

//   const handleVehicleSelect = (vehicle) => {
//     setVehicleId(vehicle);
//     setShowVehicleDropdown(false);
//   };
 
//   if (loading) {
//     return (
//       <View style={styles.loaderContainer}>
//         <ActivityIndicator size="large" color="#0000ff" />
//       </View>
//     );
//   }

//   const renderTabContent = () => {
//     if (activeTab === 'Track and Trace') {
//       return (
//         <>
//           <View style={styles.searchFilters}>
//             <TouchableOpacity style={styles.searchBar} onPress={() => onDatePress('start')}>
//               <Text>{startDate || 'Select Start Date'}</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.searchBar} onPress={() => onDatePress('end')}>
//               <Text>{endDate || 'Select End Date'}</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={styles.searchBar}
//               onPress={() => setShowVehicleDropdown(!showVehicleDropdown)}
//             >
//               <Text>{vehicleId || 'Select Vehicle'}</Text>
//             </TouchableOpacity>
//             {showVehicleDropdown && (
//               <FlatList
//                 data={vehicles}
//                 renderItem={renderVehicleItem}
//                 keyExtractor={(item) => item}
//                 style={styles.vehicleDropdown}
//               />
//             )}
//           </View>
//           <TouchableOpacity
//             style={[
//               styles.searchButton,
//               startDate && endDate && vehicleId ? styles.activeButton : styles.inactiveButton,
//             ]}
//             onPress={fetchLocationData}
//             disabled={!startDate || !endDate || !vehicleId}
//           >
//             <Text style={styles.searchButtonText}>Search</Text>
//           </TouchableOpacity>
//         </>
//       );
//     } else if (activeTab === 'Live Tracking') {
//       return null;
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.tabBar}>
//         <TouchableOpacity
//           style={[styles.tab, activeTab === 'Track and Trace' && styles.activeTab]}
//           onPress={() => setActiveTab('Track and Trace')}
//         >
//           <Text style={styles.tabText}>Track and Trace</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[styles.tab, activeTab === 'Live Tracking' && styles.activeTab]}
//           onPress={() => setActiveTab('Live Tracking')}
//         >
//           <Text style={styles.tabText}>Live Tracking</Text>
//         </TouchableOpacity>
//       </View>
//       {renderTabContent()}
//       <MapView
//         provider={PROVIDER_GOOGLE}
//         ref={mapRef}
//         style={styles.map}
//         region={region}
//         onRegionChangeComplete={(region) => setRegion(region)}
//       >
//         {markers.map((marker, index) => (
//           <Marker
//             key={index}
//             coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
//             title={marker.vehicleRegistrationNo}
//             description={`Last Update: ${marker.lastUpdateTime}\nAddress: ${marker.address}`}
//           />
//         ))}
//         {routeCoordinates.length > 0 && (
//           <Polyline
//             coordinates={routeCoordinates}
//             strokeColor="#FF0000"
//             strokeWidth={4}
//           />
//         )}
//       </MapView>
//       <View style={styles.mapButtons}>
//         <TouchableOpacity style={styles.zoomButton} onPress={zoomIn}>
//           <Icon name="zoom-in" size={24} color="#000" />
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.zoomButton} onPress={zoomOut}>
//           <Icon name="zoom-out" size={24} color="#000" />
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.mapLinkButton} onPress={openInGoogleMaps}>
//           <Icon name="map" size={24} color="#000" />
//         </TouchableOpacity>
//       </View>
//       <Modal visible={calendarOpen} transparent={true} animationType="slide">
//         <View style={styles.calendarContainer}>
//           <Calendar onDayPress={handleDateSelect} />
//           <TouchableOpacity onPress={() => setCalendarOpen(false)} style={styles.calendarCloseButton}>
//             <Text style={styles.calendarCloseText}>Close</Text>
//           </TouchableOpacity>
//         </View>
//       </Modal>
//     </View>
//   );
// };

 
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f9f9f9',
//     borderRadius: 10,
//     padding: '1%',
//     elevation: 5,
//     shadowColor: 'black',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 1,
//     margin: '0.5%',
//   },
//   tabContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     backgroundColor: '#f0f0f0',
//     paddingVertical: 10,
//   },
//   tabButton: {
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 5,
//   },
//   tabText: {
//     fontSize: 16,
//     color: '#666',
//   },
//   activeTab: {
//     backgroundColor: '#007bff',
//   },
//   activeTabText: {
//     color: '#fff',
//   },
//   fullScreenContainer: {
//     flex: 1,
//     backgroundColor: '#f9f9f9',
//   },
//   heading: {
//     alignContent: 'center',
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 1,
//   },
//   mapContainer: {
//     width: '100%',
//     height: Dimensions.get('window').height * 0.5,
//   },
//   fullScreenMapContainer: {
//     flex: 1,
//   },
//   map: {
//     ...StyleSheet.absoluteFillObject,
//   },
//   overlayContainer: {
//     position: 'absolute',
//     top: 10,
//     right: 10,
//     backgroundColor: 'white',
//     padding: 10,
//     borderRadius: 5,
//     elevation: 5,
//     alignItems: 'center',
//   },
//   overlayContainerTop: {
//     position: 'absolute',
//     top: 10,
//     left: 10,
//     right: 10,
//     backgroundColor: 'white',
//     padding: 10,
//     borderRadius: 5,
//     elevation: 5,
//     alignItems: 'center',
//   },
//   input: {
//     height: 40,
//     backgroundColor: '#fff',
//     borderRadius: 5,
//     paddingHorizontal: 10,
//     marginVertical: 5,
//     borderWidth: 1,
//     borderColor: '#ccc',
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   actionButton: {
//     backgroundColor: '#333333',
//     borderRadius: 5,
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     marginTop: 10,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//   },
//   loaderContainer: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   dropdown: {
//     backgroundColor: '#fff',
//     borderColor: '#ccc',
//     borderWidth: 1,
//     borderRadius: 5,
//     marginTop: 5,
//     width: '100%',
//     maxHeight: 150,
//   },
//   dropdownItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' },
//   dropdownList: { paddingHorizontal: 10 },
//   zoomButtonsContainer: {
//     position: 'absolute',
//     bottom: 50,
//     right: 10,
//     backgroundColor: 'white',
//     borderRadius: 5,
//     elevation: 2,
//   },
//   zoomButton: {
//     padding: 5,
//   },
//   googleMapsButton: {
//     position: 'absolute',
//     bottom: 10,
//     right: 10,
//     backgroundColor: 'white',
//     padding: 5,
//     borderRadius: 5,
//     elevation: 2,
//   },
//   calloutContainer: {
//     width: 150,
//   },
//   calloutTitle: {
//     fontSize: 12,
//     fontWeight: 'bold',
//   },
//   calloutDescription: {
//     fontSize: 10,
//   },
//   calendarContainer: { backgroundColor: 'white', borderRadius: 10, padding: 20 },
//   dateInput: { height: 40, borderColor: '#000', borderWidth: 1, borderRadius: 5, paddingHorizontal: 10, marginTop: 10 },
// });
// export default MapsScreen;

