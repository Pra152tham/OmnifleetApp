import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, PermissionsAndroid, Platform, ActivityIndicator, TouchableOpacity, Linking, Dimensions, Image } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Geocoder from 'react-native-geocoding';
import {useUser} from '../screen/UserContext';
import {useDate} from './DateContext';

const truckIcon = require('../assets/truck.png'); 

const LiveLocation = () => {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullScreen, setFullScreen] = useState(false);
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const {userId} = useUser();
  const {startDate} = useDate();
  const mapRef = useRef(null);

  useEffect(() => {
    Geocoder.init('AIzaSyA5-QZgtqQKR_09f6ob_ZgjN4POg8QMzuY');
    requestLocationPermission();
    fetchDeviceData();
  }, [userId, startDate]);

  const fetchDeviceData = async () => {
    try {
      const response = await fetch(`https://www.novusomnifleet.com/hitech-api/dashboard/getAllDeviceStatus/${startDate}/${startDate}/${userId}/NOVU-GRP`); 
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
          console.log('You can use the location');
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

  const toggleFullScreen = () => {
    setFullScreen(!fullScreen);
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

  return (
    <View style={fullScreen ? styles.fullScreenContainer : styles.container}>
      <Text style={styles.title}>Live Location</Text>
      <View style={fullScreen ? styles.fullScreenMapContainer : styles.mapContainer}>
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
        <TouchableOpacity style={styles.fullScreenButton} onPress={toggleFullScreen}>
          <Icon name={fullScreen ? "fullscreen-exit" : "fullscreen"} size={30} color="black" />
        </TouchableOpacity>
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
};

export default LiveLocation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    elevation: 3,
    margin: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'black',
  },
  fullScreenContainer: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  heading: {
    alignContent: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 1,
  },
  mapContainer: {
    width: '100%',
    height: Dimensions.get('window').height * 0.5,
  },
  fullScreenMapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    padding: 5,
    borderRadius: 5,
    elevation: 2,
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
    width: 150,
  },
  calloutTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  calloutDescription: {
    fontSize: 10,
  },
  truckIcon: {
    width: 30, 
    height: 30, 
  },
});
