import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text} from 'react-native';
import axios from 'axios';
import { BarChart } from 'react-native-chart-kit';
import { TapGestureHandler, State } from 'react-native-gesture-handler';
import ErrorDeviceStatusPopup from './ErrorDeviceStatus';
import { useUser } from '../screen/UserContext';
import {useDate} from './DateContext';

const screenWidth = 400;

const DeviceHealthData = () => {
  const [counts, setCounts] = useState({
    gpsStatus: 0,
    imuStatus: 0,
    cameraStatus: 0,
    powerTamperingStatus: 0,
    signalStrengthStatus: 0,
    speakerStatus: 0,
    sosStatus: 0,
    fovStatus: 0,
    sdCardStatus: 0,
    micStatus: 0,
    lowVisibilityStatus: 0,
  });
 
  const [errorDetails, setErrorDetails] = useState({
    gpsStatus: [],
    imuStatus: [],
    cameraStatus: [],
    powerTamperingStatus: [],
    signalStrengthStatus: [],
    speakerStatus: [],
    sosStatus: [],
    fovStatus: [],
    sdCardStatus: [],
    micStatus: [],
    lowVisibilityStatus: [],
  });

  const [fleetUsage, setFleetUsage] = useState({
    avgSpeed: 0,
    totalKm: 0,
    totalVehicle: 0,
    avgDriveTime: 0,
    avgDistance: 0,
    avgIdleTime: 0,
  });
 
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedErrorData, setSelectedErrorData] = useState([]);
  const [selectedErrorLabel, setSelectedErrorLabel] = useState('');
  const [errorPopupVisible, setErrorPopupVisible] = useState(false);
  const [selectedError, setSelectedError] = useState(null);
  const { userId } = useUser();
  const {startDate} = useDate();

  const FleetUsageTile = ({ title, value }) => (
    <View style={styles.tile}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileTitle}>{title}</Text>
    </View>
  );

  const errorTypes = [
    "gpsStatus", "imuStatus", "cameraStatus", "powerTamperingStatus", "signalStrengthStatus",
    "speakerStatus", "sosStatus", "fovStatus", "sdCardStatus", "micStatus", "lowVisibilityStatus"
  ];
 
  const errorLabels = ["GPS", "IMU", "Camera", "Power", "Signal","Speaker", "SOS", "FOV", "SD Card", "Mic", "Visibility"];

useEffect(() => {
  const fetchDeviceHealthData = async () => {
    try {
      const response = await axios.get(`https://www.novusomnifleet.com/hitech-api/device/get-fcw-devicehealth-dashboard/${userId}/NOVU-GRP`);
      const newCounts = { ...counts };
      const newErrorDetails = { ...errorDetails };
      const dataList = response.data.data.errorFcwDeviceList || [];
      dataList.forEach(device => {
        if (device) {
          const deviceInfo = {
            vehicleRegistrationNo: device.vehicleRegistrationNo,
            deviceId: device.deviceId,
            updatedTime: device.updatedTime,
            lastErrorOccuredTime: device.lastErrorOccuredTime,
          };

          if (device.gpsStatus === 1) {
            newCounts.gpsStatus++;
            newErrorDetails.gpsStatus.push(deviceInfo);
          }
          if (device.imuStatus === 1) {
            newCounts.imuStatus++;
            newErrorDetails.imuStatus.push(deviceInfo);
          }
          const cameraStatuses = ['cameraMalFunctionStatus', 'inCabinCameraStatus', 'rearCameraStatus', 'dmsCameraStatus', 'fcwCameraStatus'];
          cameraStatuses.forEach(status => {
            if (device[status] === 1) {
              newCounts.cameraStatus++;
              newErrorDetails.cameraStatus.push(deviceInfo);
            }
          });
          if (device.powerTamperingStatus === 1) {
            newCounts.powerTamperingStatus++;
            newErrorDetails.powerTamperingStatus.push(deviceInfo);
          }
          if (device.signalStrengthStatus === 1) {
            newCounts.signalStrengthStatus++;
            newErrorDetails.signalStrengthStatus.push(deviceInfo);
          }
          if (device.speakerStatus === 1) {
            newCounts.speakerStatus++;
            newErrorDetails.speakerStatus.push(deviceInfo);
          }
          if (device.sosStatus === 1) {
            newCounts.sosStatus++;
            newErrorDetails.sosStatus.push(deviceInfo);
          }
          if (device.fovStatus === 1) {
            newCounts.fovStatus++;
            newErrorDetails.fovStatus.push(deviceInfo);
          }
          if (device.sdCardStatus === 1) {
            newCounts.sdCardStatus++;
            newErrorDetails.sdCardStatus.push(deviceInfo);
          }
          if (device.micStatus === 1) {
            newCounts.micStatus++;
            newErrorDetails.micStatus.push(deviceInfo);
          }
          if (device.lowVisibilityStatus === 1) {
            newCounts.lowVisibilityStatus++;
            newErrorDetails.lowVisibilityStatus.push(deviceInfo);
          }
        }
      });
      setCounts(newCounts); 
      setErrorDetails(newErrorDetails); 
    } catch (error) {
      console.error('Error fetching device health data:', error);
    }
  };

  const fetchFleetUsageData = async () => {
    try {
      const response = await axios.get(`https://www.novusomnifleet.com/hitech-api/dashboard/getAllDeviceStatus/${startDate}/${startDate}/${userId}/NOVU-GRP`);
      const fleetData = response.data.data;
      setFleetUsage({
        avgSpeed: fleetData.avgSpeed || 0,
        totalKm: fleetData.totalKm || 0,
        totalVehicle: fleetData.totalVehcile || 0,
        avgDriveTime: fleetData.avgDriveTime || 0,
        avgDistance: fleetData.avgDistance || 0,
        avgIdleTime: fleetData.avgIdealTime || 0,
      });
    } catch (error) {
      console.error('Error fetching fleet usage data:', error);
    }
  };
  fetchDeviceHealthData();
  fetchFleetUsageData();
}, [startDate, userId]);

const handleBarPress = (event, index) => {
  const { nativeEvent } = event;
  const labels = errorTypes;
  const values = Object.values(counts);
  const barWidth = (screenWidth - 90) / labels.length; 
  const offsetX = nativeEvent.x - 60; 
  if (offsetX >= 0 && index >= 0 && index < labels.length) {
    const index = Math.floor(offsetX / barWidth);
    setSelectedError(index);
    setSelectedErrorLabel(errorLabels[index]);
    setSelectedErrorData(errorDetails[errorTypes[index]]);
    setModalVisible(true);
    setErrorPopupVisible(true);
  }
};

return (
  <ScrollView style={styles.container}>
    <Text style={styles.header}>Device Health Data</Text>
    <TapGestureHandler onHandlerStateChange={(event) => {
      if (event.nativeEvent.state === State.ACTIVE) {
        const index = Math.floor((event.nativeEvent.x - 70) / ((screenWidth - 20) / Object.keys(counts).length));
        handleBarPress(event, index);
      }
    }}>
      <View>
        <BarChart
          data={{
            labels: errorLabels,
            datasets: [
              {
                data: Object.values(counts)
              }
            ]
          }}
          width={screenWidth-40}
          height={310}
          yAxisLabel=""
          chartConfig={{
            backgroundGradientFrom: "#f9f9f9",
            backgroundGradientTo: "#f9f9f9",
            color: (opacity = 0) => `rgba(0, 0, 0, ${opacity})`,
            barPercentage: 0.6,
            strokeWidth: 2,
              useShadowColorFromDataset: false,
              fillShadowGradient: '#4d004d',
              fillShadowGradientOpacity: 1,
          }}
          verticalLabelRotation={40}
          style={styles.chart}
          showValuesOnTopOfBars={true}
          showBarTops={false}
        />
      </View>
    </TapGestureHandler>
    <Text style={styles.sectionTitle}>Fleet Usage</Text>
       <View style={styles.tilesContainer}>
       <FleetUsageTile title="Avg. Speed (km/hr)" value={fleetUsage.avgSpeed.toFixed(2)} />
            <FleetUsageTile title="Total KM (km)" value={fleetUsage.totalKm.toFixed(2)} />
            <FleetUsageTile title="Total Vehicles" value={fleetUsage.totalVehicle.toFixed(2)} />
            <FleetUsageTile title="Avg. Drive Time (hrs)" value={fleetUsage.avgDriveTime.toFixed(2)} />
             <FleetUsageTile title="Avg. Distance (km)" value={fleetUsage.avgDistance.toFixed(2)} />
            <FleetUsageTile title="Avg. Idle Time (hrs)" value={fleetUsage.avgIdleTime.toFixed(2)} />
          </View>
          <ErrorDeviceStatusPopup visible={errorPopupVisible} onClose={setErrorPopupVisible} selectedError={selectedError} errorDetails={errorDetails}/>
    </ScrollView>
);
};
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: '4%',
    elevation: 5,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    margin: '0.5%',
    width: '99%',
    height: '100%',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333333'
  },
  chart: {
    marginVertical: 10,
    borderRadius: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    color: 'black',
  },
  tilesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  tile: {
    width: '45%',
    backgroundColor: '#e6b3e6',
    borderRadius: 10,
    padding: 8,
    marginVertical: 6,
    alignItems: 'center',
    elevation: 5
  },
  tileTitle: {
    fontSize: 14,
    color: '#333',
  },
  tileValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
});
 
export default DeviceHealthData;
 
 