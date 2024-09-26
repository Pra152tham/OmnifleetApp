import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ImageBackground } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const ReportButton = ({ icon, label, screenName }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate(screenName);
  };

  return (
    <TouchableOpacity style={styles.buttonContainer} onPress={handlePress}>
      <Icon name={icon} size={35} color="#fff" />
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
};

const reports = [
  { id: '1', icon: 'settings', label: 'MANAGER REPORTS', screenName: 'ManagerReports' },
  { id: '2', icon: 'speedometer', label: 'DRIVER PERFORMANCE REPORTS', screenName: 'DriverPerformanceReports' },
  { id: '3', icon: 'key', label: 'DEVICE IGNITION REPORT', screenName: 'DeviceIgnitionReport' },
  { id: '4', icon: 'pulse', label: 'DEVICE HEALTH REPORT', screenName: 'DeviceHealthReport' },
  { id: '5', icon: 'car', label: 'DAILY KM REPORT', screenName: 'DailyKMReport' },
  { id: '6', icon: 'clipboard', label: 'DAILY RUN REPORT', screenName: 'DailyRunReport' },
  { id: '7', icon: 'calendar', label: 'DAILY EVENT REPORT', screenName: 'DailyEventReport' },
  { id: '8', icon: 'moon', label: 'NIGHT DRIVING REPORT', screenName: 'NightDrivingReport' },
  { id: '9', icon: 'timer', label: 'CONTINUOUS DRIVING REPORT', screenName: 'ContinuousDrivingReport' },
  { id: '10', icon: 'hand', label: 'STOPPAGE REPORT', screenName: 'StoppageReport' },
  { id: '12', icon: 'analytics', label: 'TRIP VEHICLE SUMMARY', screenName: 'TripVehicleSummary' },
  { id: '13', icon: 'alarm', label: 'ALARM DISTRIBUTION', screenName: 'AlarmDistribution' }
];

const Reports = () => {
  return (
    <ImageBackground 
      source={{ uri: 'https://example.com/background-image.jpg' }} // Replace with your background image URL
      style={styles.container}
    >
      <Text style={styles.headerText}>Reports</Text>
      <FlatList
        data={reports}
        renderItem={({ item }) => (
          <ReportButton icon={item.icon} label={item.label} screenName={item.screenName} />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
      />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white', // Fallback background color
  },
  list: {
    justifyContent: 'center',
  },
  row: {
    flex: 1,
    justifyContent: 'space-between',
  },
  buttonContainer: {
    flex: 1,
    alignItems: 'center',
    margin: 10,
    paddingVertical: 30,
    paddingHorizontal: 15,
    borderRadius: 15,
    backgroundColor: '#2196F3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
  },
  buttonText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default Reports;
