import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import ViolationTilesPopup from './ViolationTilesPopup';
import axios from 'axios';
import { useUser } from '../screen/UserContext';
import { useDate } from './DateContext';

const { width, height } = Dimensions.get('window');

const errorGroups = {
  //602,626
  'Pedestrian Collision Warning': [607, 606],
  'Forward Collision Warning': [601, 605, 600],
  'Continuous Driving': [610],
  'SOS': [611],
  'Seatbelt Warning': [639, 633],
  'Lane Departure Warning': [603],
  'Phone Usage': [621],
  'Drowsiness': [619, 618],
  'Camera Obstruction': [513],
  'Yawning': [638],
  'Over Speeding': [609],
  'Harsh Acceleration': [613],
  'Harsh Turning': [615],
  'Harsh Braking': [614],
  'Blind Spot': [595, 594],
  'Distraction Warning': [625],
  'Cross Traffic Alert': [599, 598, 597, 596],
  'Vehicle Idling': [640],
  'Night Driving': [612],
  'Regular Interval Video': [641],
  'Regular Snapshot': [617],
  "Smoking": [623],
  "Sudden Stoppage": [637],
};

const ViolationsScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [violationData, setViolationData] = useState([]);
  const { userId } = useUser();
  const { startDate } = useDate();

  const [errorDetails, setErrorDetails] = useState({
    PedestrianCollisionWarning: [],
    ForwardCollisionWarning: [],
    ContinuousDriving: [],
    SOS: [],
    SeatbeltWarning: [],
    LaneDepartureWarning: [],
    PhoneUsage: [],
    Drowsiness: [],
    CameraObstruction: [],
    Yawning: [],
    OverSpeeding: [],
    HarshAcceleration: [],
    HarshTurning: [],
    HarshBraking: [],
    BlindSpot: [],
    DistractionWarning: [],
    CrossTrafficAlert: [],
    VehicleIdling: [],
    NightDriving: [],
    RegularIntervalVideo: [],
    RegularSnapshot: [],
    Smoking: [],
    SuddenStoppage: []
  });

  const toggleModal = () => {
    setModalVisible(!modalVisible);
  };

  useEffect(() => {
    fetchViolationData();
  }, [userId, startDate]);

  const violationDetails = (violation) => {
    const formattedTitle = violation.title.replace(/\s+/g, '');
    setSelectedViolation(formattedTitle);
    setModalVisible(true);
  };

  const getViolationCount = (data, codes) => {
    const violations = data.filter(item => codes.includes(item.driverWarningType));
    return violations.length;
  };

  const getMostViolationsDriver = (data, codes) => {
    const drivers = data.filter(item => codes.includes(item.driverWarningType)).map(item => item.driverName);
    if (drivers.length === 0) {
      return '';
    }
    const driverFrequency = drivers.reduce((acc, driver) => {
      acc[driver] = (acc[driver] || 0) + 1;
      return acc;
    }, {});
    let mostViolationsDriver = '';
    let maxCount = 0;
    for (const [driver, count] of Object.entries(driverFrequency)) {
      if (count > maxCount) {
        mostViolationsDriver = driver;
        maxCount = count;
      }
    }
    return mostViolationsDriver;
  };

  const fetchViolationData = async () => {
    try {
      const response = await axios.get(`https://www.novusomnifleet.com/hitech-api/warning/getAllWarningWithoutVTS/2024-07-19/2024-07-19/6642f6b1b43dc025f1e7225d/SURE-GRP`);
      const data = response.data.data;
      const newErrorDetails = { ...errorDetails };
      data.forEach(device => {
        if (device) {
          const deviceInfo = {
            device_id: device.device_id,
            vehicleId: device.vehicleId,
            lastDateTime: device.lastDateTime,
            errorType: device.driverWarningType,
            speed: device.gpsSpeed,
            comment: device.comment,
            warningStatus: device.warningStatus,
            location: device.lastLocation,
            warningVideo: device.videoFileName,
            warningSortKey: device.warningSortKey,
          };
          if (device.driverWarningType === 607 || device.driverWarningType === 606) {
            newErrorDetails.PedestrianCollisionWarning.push(deviceInfo);
          }
          if (device.driverWarningType === 601 || device.driverWarningType === 605 || device.driverWarningType === 600) {
            newErrorDetails.ForwardCollisionWarning.push(deviceInfo);
          }
          if (device.driverWarningType === 610) {
            newErrorDetails.ContinuousDriving.push(deviceInfo);
          }
          if (device.driverWarningType === 611) {
            newErrorDetails.SOS.push(deviceInfo);
          }
          if (device.driverWarningType === 639 || device.driverWarningType === 633) {
            newErrorDetails.SeatbeltWarning.push(deviceInfo);
          }
          if (device.driverWarningType === 603) {
            newErrorDetails.LaneDepartureWarning.push(deviceInfo);
          }
          if (device.driverWarningType === 621) {
            newErrorDetails.PhoneUsage.push(deviceInfo);
          }
          if (device.driverWarningType === 619 || device.driverWarningType === 618) {
            newErrorDetails.Drowsiness.push(deviceInfo);
          }
          if (device.driverWarningType === 513) {
            newErrorDetails.CameraObstruction.push(deviceInfo);
          }
          if (device.driverWarningType === 638) {
            newErrorDetails.Yawning.push(deviceInfo);
          }
          if (device.driverWarningType === 609) {
            newErrorDetails.OverSpeeding.push(deviceInfo);
          }
          if (device.driverWarningType === 613) {
            newErrorDetails.HarshAcceleration.push(deviceInfo);
          }
          if (device.driverWarningType === 615) {
            newErrorDetails.HarshTurning.push(deviceInfo);
          }
          if (device.driverWarningType === 614) {
            newErrorDetails.HarshBraking.push(deviceInfo);
          }
          if (device.driverWarningType === 595 || device.driverWarningType === 594) {
            newErrorDetails.BlindSpot.push(deviceInfo);
          }
          if (device.driverWarningType === 625) {
            newErrorDetails.DistractionWarning.push(deviceInfo);
          }
          if (device.driverWarningType === 599 || device.driverWarningType === 598 || device.driverWarningType === 597 || device.driverWarningType === 596) {
            newErrorDetails.CrossTrafficAlert.push(deviceInfo);
          }
          if (device.driverWarningType === 640) {
            newErrorDetails.VehicleIdling.push(deviceInfo);
          }
          if (device.driverWarningType === 612) {
            newErrorDetails.NightDriving.push(deviceInfo);
          }
          if (device.driverWarningType === 641) {
            newErrorDetails.RegularIntervalVideo.push(deviceInfo);
          }
          if (device.driverWarningType === 617) {
            newErrorDetails.RegularSnapshot.push(deviceInfo);
          }
          if (device.driverWarningType === 623) {
            newErrorDetails.Smoking.push(deviceInfo);
          }
          if (device.driverWarningType === 637) {
            newErrorDetails.SuddenStoppage.push(deviceInfo);
          }
        }
      });
      setErrorDetails(newErrorDetails);
      const processedData = Object.keys(errorGroups).map((errorType) => {
        const codes = errorGroups[errorType];
        return {
          title: errorType,
          icon: getIconForErrorType(errorType), 
          mostViolations: getMostViolationsDriver(data, codes),
          violations: getViolationCount(data, codes),
          vehicles: '10% vehicles',
          colors: getColorsForErrorType(errorType), 
          code: codes[0], 
        };
      });
      setViolationData(processedData);
    } catch (error) {
      console.error(error);
    }
  };

  const getIconForErrorType = (errorType) => {
    const iconMapping = {
      'Pedestrian Collision Warning': 'exclamation-triangle',
      'Forward Collision Warning': 'car',
      'Continuous Driving': 'car',
      'SOS': 'exclamation-triangle',
      'Seatbelt Warning': 'tachometer',
      'Lane Departure Warning': 'exclamation-triangle',
      'Phone Usage': 'tachometer',
      'Drowsiness': 'exclamation-triangle',
      'Camera Obstruction': 'exclamation-triangle',
      'Yawning': 'exclamation-triangle',
      'Over Speeding': 'tachometer',
      'Harsh Acceleration': 'exclamation-triangle',
      'Harsh Turning': 'exclamation-triangle',
      'Harsh Braking': 'exclamation-triangle',
      'Blind Spot': 'exclamation-triangle',
      'Distraction Warning': 'exclamation-triangle',
      'Cross Traffic Alert': 'exclamation-triangle',
      'Vehicle Idling': 'exclamation-triangle',
      'Night Driving': 'exclamation-triangle',
      'Regular Interval Video': 'video-camera',
      'Regular Snapshot': 'camera',
      'Smoking': 'exclamation-triangle',
      'Sudden Stoppage': 'car',
    };
    return iconMapping[errorType] || 'exclamation-triangle';
  };

  const getColorsForErrorType = (errorType) => {
    const colorsMapping = {
      'Pedestrian Collision Warning': ['#FFA9A9', '#FF6347'],
      'Forward Collision Warning': ['#71D8B6', '#2ECC71'],
      'Continuous Driving': ['#FFEB99', '#FFD700'],
      'SOS': ['#e9d0af', '#d3a15f'],
      'Seatbelt Warning': ['#f2738c', '#e91640'],
      'Lane Departure Warning': ['#32cd32', '#98e698'],
      'Phone Usage': ['#fb5151', '#d77575'],
      'Drowsiness': ['#add8e6', '#3ca1c3'],
      'Camera Obstruction': ['#f2f20d', '#c6c639'],
      'Yawning': ['#ffa07a', '#eea78b'],
      'Over Speeding': ['#FFA9A9', '#FF6347'],
      'Harsh Acceleration': ['#FFEB99', '#FFD700'],
      'Harsh Turning': ['#ffa07a', '#eea78b'],
      'Harsh Braking': ['#e9d0af', '#d3a15f'],
      'Blind Spot': ['#f2f20d', '#c6c639'],
      'Distraction Warning': ['#fb5151', '#d77575'],
      'Cross Traffic Alert': ['#f2f20d', '#c6c639'],
      'Vehicle Idling': ['#e9d0af', '#d3a15f'],
      'Night Driving': ['#ffa07a', '#eea78b'],
      'Regular Interval Video': ['#f2f20d', '#c6c639'],
      'Regular Snapshot': ['#e9d0af', '#d3a15f'],
      'Smoking': ['#ffa07a', '#eea78b'],
      'Sudden Stoppage': ['#aba07a', '#9aa78b']
    };
    return colorsMapping[errorType];
  };

   return (
<View style={styles.mainContainer}>
     <ScrollView contentContainerStyle={styles.container} horizontal={true}>
       {violationData.map((violation, index) => (
         <TouchableOpacity key={index} onPress={() => violationDetails(violation)}>
          <LinearGradient colors={violation.colors} style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.titleContainer}>
                <Icon name={violation.icon} size={30} color="black" style={styles.icon} />
                <Text style={styles.title}>{violation.title}</Text>
              </View>
              <View style={styles.detailsContainer}>
                <Text style={styles.detailText}>Violations: {violation.violations}</Text>
                <Text style={styles.detailText}>Most Violations: {violation.mostViolations}</Text>
                <Text style={styles.detailText}>Vehicles: {violation.vehicles}</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </ScrollView>
        <ViolationTilesPopup
          visible={modalVisible}
          onClose={toggleModal}
          selectedViolation={selectedViolation}
          errorDetails = {errorDetails}
        />
        </View> 
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 10,
  },
  container: {
    padding: 10,
    flexDirection: 'row', 
  },
  card: {
    marginRight: 8, 
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 1,
    height: '100%',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    maxWidth: 100,
  },
  icon: {
    marginBottom: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    flexWrap: 'wrap', 
  },
  detailsContainer: {
    flex: 2,
    paddingLeft: 15,
  },
  detailText: {
    fontSize:16,
    color: 'black',
  },
});

export default ViolationsScreen;
