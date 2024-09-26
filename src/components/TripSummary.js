import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const TripSummary = () => {
  const [activeTab, setActiveTab] = useState('Load Planning');

  const datasets = {
    'Load Planning': {
      labels: ['West-2', 'West-1', 'North', 'West-3', 'South', 'East'],
      data: [0, 0, 0, 0, 0, 0],
    },
    'Loading': {
      labels: ['West-1', 'South', 'East', 'North', 'West-2', 'West-3'],
      data: [0, 0, 0, 0, 0, 0],
    },
    'Forward Trips': {
      labels: ['South', 'West-2', 'West-1', 'North', 'East', 'West-3'],
      data: [0, 0, 0, 0, 0, 0],
    },
    'Unloading': {
      labels: ['East', 'North', 'South','West-2', 'West-1', 'West-3'],
      data: [0, 0, 0, 0, 0, 0],
    },
    'Return Trips': {
      labels: ['North', 'West-2', 'South', 'West-1', 'West-3', 'East'],
      data: [0, 0, 0, 0, 0, 0],
    },
  };

  const chartConfig = {
    backgroundColor: 'white',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
    },
    fillShadowGradient: "#ff8000",
    fillShadowGradientOpacity :1,
  };

  const tabs = ['Load Planning', 'Loading', 'Forward Trips', 'Unloading', 'Return Trips'];

  const renderChart = () => {
    const selectedDataset = datasets[activeTab];
    return (
      <LineChart
        data={{
          labels: selectedDataset.labels,
          datasets: [
            {
              data: selectedDataset.data,
            },
          ],
        }}
        width={Dimensions.get('window').width - 40}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trip Summary</Text>
      <ScrollView horizontal style={styles.tabsContainer} showsHorizontalScrollIndicator={false}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tab}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            {activeTab === tab && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
      {renderChart()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    margin: 5,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: "black"
  },
  tabsContainer: {
    marginBottom: 10,
  },
  tabs: {
    flexDirection: 'row',
  },
  tab: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  tabText: {
    fontSize: 16,
    color: '#000',
  },
  activeTabText: {
    color: '#1e90ff',
    fontWeight: 'bold',
  },
  activeTabIndicator: {
    marginTop: 2,
    height: 2,
    backgroundColor: '#1e90ff',
    width: '100%',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default TripSummary;