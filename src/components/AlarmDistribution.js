import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import AlarmDistributionInfo from './AlarmDistributionInfo';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import axios from 'axios';
import { useUser } from '../screen/UserContext';
import {useDate} from './DateContext';

const PieChartComponent = () => {
  const [selectedTab, setSelectedTab] = useState('all');
  const [dataSets, setDataSets] = useState({ all: [], dsm: [], fcw: [] });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const { userId} = useUser();
  const {startDate} = useDate();

  const errorGroups = {
    'PCW': [607, 606],
    'FCW': [601, 605, 600],
    'Cont. Driving': [610],
    'SOS': [611],
    'Seatbelt': [639, 633],
    'LDW': [603],
    'Phone': [621],
    'Drowsiness': [619, 618],
    'Camera': [513],
    'Yawning': [638],
    'Over Speeding': [609],
    'HA': [613],
    'HT': [615],
    'HB': [614],
    'Blind Spot': [595, 594],
    'DRW': [625],
    'Traffic Alert': [599, 598, 597, 596],
    'Vehicle Idling': [640],
    'Night Driving': [612],
    'nterval Video': [641],
    'Snapshot': [617],
    "Smoking": [623],
    "Sudden Stoppage": [637],
  };

  useEffect(() => {
    fetchData();
  }, [userId, startDate]);

  const fetchData = async () => {
    try {
      const response = await axios.get(`https://www.novusomnifleet.com/hitech-api/warning/getAllWarningWithoutVTS/${startDate}/${startDate}/${userId}/NOVU-GRP`);
      const fetchedData = response.data.data;
      const transformedData = fetchedData.map((item) => item.driverWarningType);
      console.log(transformedData);
      const counts = {};
      transformedData.forEach(code => {
        for (const [name, codes] of Object.entries(errorGroups)) {
          if (codes.includes(code)) {
            if (!counts[name]) {
              counts[name] = { codes: [], count: 0 };
            }
            if (!counts[name].codes.includes(code)) {
              counts[name].codes.push(code);
            }
            counts[name].count += 1;
            break;
          }
        }
      });
      const countsArray = Object.entries(counts).map(([name, { codes, count }]) => ({
        name,
        codes,
        count,
      }));
      processChartData(countsArray);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  

const processChartData = (countsArray) => {
  let dsmCount = 0;
  let fcwCount = 0;
  let dsmData = [];
  let fcwData = [];

  countsArray.forEach(item => {
      // Classify based on the code values
      item.codes.forEach(code => {
          if (code >= 608) {
              dsmCount += item.count;
              dsmData.push(item);
          } else if (code <= 607) {
              fcwCount += item.count;
              fcwData.push(item);
          }
      });
  });

  dsmData = [...new Map(dsmData.map(item => [item.name, item])).values()];
  fcwData = [...new Map(fcwData.map(item => [item.name, item])).values()];

  dsmData.sort((a, b) => b.count - a.count);
  fcwData.sort((a, b) => b.count - a.count);

  const topdsmData = dsmData.slice(0, 3);
  const topfcwData = fcwData.slice(0, 3);

  const totalCount = dsmCount + fcwCount;

  const newDataSets = {
      all: [
          { name: 'DSM', population: (dsmCount / totalCount) * 100, color: '#67b7dc' },
          { name: 'FCW', population: (fcwCount / totalCount) * 100, color: '#6794dc' },
      ],
      dsm: topdsmData.map((item, index) => ({
          name: item.name,
          population: (item.count / dsmCount) * 100,
          color: ['#67b7dc', '#6794dc', '#6771dc'][index]
      })),
      fcw: topfcwData.map((item, index) => ({
          name: item.name,
          population: (item.count / fcwCount) * 100,
          color: ['#67b7dc', '#6794dc', '#6771dc'][index]
      }))
  };
  setDataSets(newDataSets);
};

  const toggleModal = () => {
    setModalVisible(!modalVisible);
  };

  const handleChartPress = (event) => {
    const index = getSliceIndexFromEvent(event);
    setSelectedIndex(index);

    if (index !== null) {
      setIsTooltipVisible(true);
    } else {
      setIsTooltipVisible(false);
    }
  };

  const singleTap = Gesture.Tap()
    .maxDuration(250)
    .onStart(handleChartPress);

  const getSliceIndexFromEvent = (event) => {
    const totalValue = dataSets[selectedTab].reduce((sum, value) => sum + value.population, 0);
    const startingAngles = [];
    let currentAngle = 0;

    for (let i = 0; i < dataSets[selectedTab].length; i++) {
      startingAngles.push(currentAngle);
      const sliceAngle = (dataSets[selectedTab][i].population / totalValue) * 360;
      currentAngle += sliceAngle;
    }

    const centerX = 20 + (screenWidth / 4);
    const centerY = 175;
    const dx = event.x - centerX;
    const dy = event.y - centerY;
    let angle = (Math.atan2(dy, dx) * (180 / Math.PI) + 360) % 360;
    angle = (angle + 90) % 360;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const outerRadius = 80;

    if (distance > outerRadius) {
      return null; 
    }

    for (let i = 0; i < startingAngles.length; i++) {
      const startAngle = startingAngles[i];
      let endAngle = (startingAngles[i] + (dataSets[selectedTab][i].population / totalValue) * 360) % 360;
      if (endAngle === 0 && i !== 0) {
        endAngle = 360;
      }
      if (angle >= startAngle && angle < endAngle) {
        const tooltipX = event.x;
        const tooltipY = event.y - 30; 
        setTooltipPosition({ x: tooltipX, y: tooltipY });
        return i;
      }
    }
    return null;
  };

  const renderLegend = () => {
    return dataSets[selectedTab].map((item, index) => (
      <View key={index} style={styles.legendItem}>
        <View style={[styles.legendColor, { backgroundColor: item.color }]} />
        <Text style={styles.legendText}>{`${item.name} `}</Text>
      </View>
    ));
  };

  return (
    <GestureHandlerRootView>
      <GestureDetector gesture={Gesture.Exclusive(singleTap)}>
        <View style={styles.container}>
              <View style={styles.mainHeader}>
                <Text style={styles.title}>Alarm Distribution</Text>
                <TouchableOpacity onPress={toggleModal} style={styles.infoButton}>
                  <Text style={styles.infoButtonText}>i</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.header}>
                {['All', 'DSM', 'FCW'].map((tab) => (
                  <TouchableOpacity key={tab} onPress={() => setSelectedTab(tab.toLowerCase())}>
                    <Text style={[styles.tab, selectedTab === tab.toLowerCase() && styles.activeTab]}>{tab}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.chartLegendContainer}>
                <PieChart
                  data={dataSets[selectedTab]}
                  width={screenWidth - 200}
                  height={200}
                  hasLegend={false}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="40"
                  absolute
                />
                <View style={styles.legendContainer}>{renderLegend()}</View>
              </View>
              {selectedIndex !== null && isTooltipVisible && (
                <View
                  style={[
                    styles.tooltip,
                    { top: tooltipPosition.y, left: tooltipPosition.x }
                  ]}
                >
                  <View style={[styles.tooltipCircle, { backgroundColor: dataSets[selectedTab][selectedIndex].color }]} />
                  <Text style={styles.tooltipText}>
                    {dataSets[selectedTab][selectedIndex].name}: {dataSets[selectedTab][selectedIndex].population.toFixed(2)}%
                  </Text>
                </View>
              )}
              <AlarmDistributionInfo visible={modalVisible} onClose={toggleModal} />
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  decimalPlaces: 2,
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
  mainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'black',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tab: {
    fontSize: 18,
    color: '#7F7F7F',
    fontWeight: 'bold',
  },
  activeTab: {
    color: '#247ba0',
    borderBottomWidth: 2,
    borderBottomColor: '#247ba0',
  },
  chartLegendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 20,
  },
  legendContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 25,
    marginBottom: 10,
  },
  legendColor: {
    width: 15,
    height: 15,
    borderRadius: 8,
    marginRight: 6,
  },
  legendText: {
    fontSize: 16,
    color: 'black',
  },
  infoButton: {
    paddingHorizontal: 10,
    fontStyle: 'italic',
  },
  infoButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 18,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#000',
    padding: 5,
    borderRadius: 5,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tooltipText: {
    color: '#fff',
    marginLeft: 5,
  },
  tooltipCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 2,
  },
});

export default PieChartComponent; 