import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import FleetStatus from '../components/FleetStatus';
import DeviceHealthData from '../components/DeviceHealthData';
import AlarmDistribution from '../components/AlarmDistribution';
import PerformanceScore from '../components/PerformanceScore';
import TripSummary from '../components/TripSummary';
import ViolationScreen from '../components/ViolationTiles';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import TopHeader from '../components/TopHeader';
import LiveLocation from '../components/LiveLocation';

const Dashboard = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <TopHeader />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <FleetStatus />
          <DeviceHealthData />
          <TripSummary />
          <AlarmDistribution />
          <PerformanceScore />
          <LiveLocation />
          <ViolationScreen />
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  scrollContainer: {
    padding: 10,
  },
});

export default Dashboard;
