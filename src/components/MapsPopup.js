import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, PermissionsAndroid, Platform, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';

const MapsPopup = ({ customLatitude, customLongitude }) => {
  const [loading, setLoading] = useState(true);
  const [fullScreen, setFullScreen] = useState(false);
  const [region, setRegion] = useState({
    latitude: customLatitude || 37.78825,  // Default to a safe latitude
    longitude: customLongitude || -122.4324,  // Default to a safe longitude
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const mapRef = useRef(null);

  useEffect(() => {
    const initialize = async () => {
      if (customLatitude && customLongitude) {
        setRegion({
          latitude: customLatitude,
          longitude: customLongitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
      await requestLocationPermission();
      setLoading(false);
    };
    initialize();
  }, [customLatitude, customLongitude]);

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
    <View style={styles.container}>
      <Text>Map should be displayed below:</Text>
      <View style={fullScreen ? styles.fullScreenMapContainer : styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          provider={PROVIDER_GOOGLE}
        >
          {customLatitude && customLongitude && (
            <Marker
              coordinate={{ latitude: customLatitude, longitude: customLongitude }}
              title={"Custom Location"}
            />
          )}
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

export default MapsPopup;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    width: '100%',
    height: '50%',
  },
  fullScreenMapContainer: {
    ...StyleSheet.absoluteFillObject,
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
});
