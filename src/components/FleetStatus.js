import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FleetStatusInfo from './FleetStatusInfo';
import FleetStatusPopup from './FleetStatusPopup';
import DeviceStatusPopup from './DeviceStatusPopup'; 
import WrappedCustomPieChart from './CustomPieChart';
import axios from "axios";
import { useUser } from '../screen/UserContext';
import {useDate} from './DateContext';

const FleetStatus = () => {
  const [activeTab, setActiveTab] = useState('Fleet Status');
  const [activeSubTab, setActiveSubTab] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const [modalVisible3, setModalVisible3] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);
  const [legendItemSelected, setLegendItemSelected] = useState(null);
  const [fleetData, setFleetData] = useState([]);
  const [dsmData, setDsmData] = useState([]);
  const [vtsData, setVtsData] = useState([]);
  const [fcwData, setFcwData] = useState([]);
  const fleetSliceColor = ['#31b91b', '#4a9af5', '#f6cf0c', '#e95400'];

  const {userId} = useUser();
  const {startDate} = useDate();

  const [fleetStatusDetails, setFleetStatusDetails] = useState({
    runningStatus: [],
    inactiveStatus: [],
    idleStatus: [],
    stoppedStatus: [],
  });

  const [dsmDeviceStatusDetails, setDsmDeviceStatusDetails] = useState({
    activeStatus: [],
    inactiveStatus: [],
    installedStatus: [],
    errorStatus: [],
  });

  const [vtsDeviceStatusDetails, setVtsDeviceStatusDetails] = useState({
    activeStatus: [],
    inactiveStatus: [],
    installedStatus: [],
    errorStatus: [],
  });

  const [fcwDeviceStatusDetails, setFcwDeviceStatusDetails] = useState({
    activeStatus: [],
    inactiveStatus: [],
    installedStatus: [],
    errorStatus: [],
  });

  useEffect(() => {
    const fetchFleetData = async () => {
      try {
        const response = await axios.get(`https://www.novusomnifleet.com/hitech-api/dashboard/getAllDeviceStatus/${startDate}/${startDate}/${userId}/NOVU-GRP`);
        const fleetData = response.data.data;
        setFleetData(fleetData);
        setFleetStatusDetails({
          runningStatus: fleetData.runningFleetStatus || [],
          idleStatus: fleetData.idleFleetStatus || [],
          stoppedStatus: fleetData.stopFleetStatus || [],
          inactiveStatus: fleetData.inActiveFleetStatus || [],
        });
      } catch (error) {
        console.error('Error fetching fleet data:', error);
      }
    };

  const fetchDsmData = async () => {
    try {
      const response = await axios.get(`https://www.novusomnifleet.com/hitech-api/device/get-devicehealth-dashboard/${userId}/NOVU-GRP`);
      const dsmData = response.data.data;
      setDsmData(dsmData);
      setDsmDeviceStatusDetails({
        activeStatus: dsmData.activeDeviceList || [],
        inactiveStatus: dsmData.inActiveDeviceList || [],
        installedStatus: dsmData.installedDeviceList || [],
        errorStatus: dsmData.errorDeviceList || [],
      });
    } catch (error) {
      console.error('Error fetching dsm data:', error);
    }
  };

  const fetchVtsData = async () => {
    try {
      const response = await axios.get(`https://www.novusomnifleet.com/hitech-api/device/get-vts-devicehealth-dashboard/${userId}/NOVU-GRP`);
      const vtsData = response.data.data;
      setVtsData(vtsData);
      setVtsDeviceStatusDetails({
        activeStatus: vtsData.activeVtsDeviceList || [],
        inactiveStatus: vtsData.inActiveVtsDeviceList || [],
        installedStatus: vtsData.installedVtsDeviceList || [],
        errorStatus: vtsData.errorVtsDeviceList || [],
      });
    } catch (error) {
      console.error('Error fetching vts data:', error);
    }
  };

  const fetchFcwData = async () => {
    try {
      const response = await axios.get(`https://www.novusomnifleet.com/hitech-api/device/get-fcw-devicehealth-dashboard/${userId}/NOVU-GRP`);
      const fcwData = response.data.data;
      setFcwData(fcwData);
      setFcwDeviceStatusDetails({
        activeStatus: fcwData.activeFcwDeviceList || [],
        inactiveStatus: fcwData.inActiveFcwDeviceList || [],
        installedStatus: fcwData.installedFcwDeviceList || [],
        errorStatus: fcwData.errorFcwDeviceList || [],
      });
    } catch (error) {
      console.error('Error fetching fcw data:', error);
    }
  };
  fetchFleetData();
  fetchDsmData();
  fetchVtsData();
  fetchFcwData();
}, [userId, startDate]);
  
  const toggleModal = () => {
    setModalVisible(!modalVisible);
  };

  const toggleModal2 = () => {
    setModalVisible2(!modalVisible2);
  };

  const toggleModal3 = () => {
    setModalVisible3(!modalVisible3);
  };

  const handleLegendItemClick = (name) => {
    setLegendItemSelected(name); 
    console.log(legendItemSelected);
    if (activeTab === 'Fleet Status') {
      toggleModal2(); 
    } else if (activeTab === 'Device Status') {
      toggleModal3(); 
    }
  };

  const renderChartOrMessage = (series, sliceColor, centerText, data) => {
    const total = series.reduce((acc, val) => acc + val, 0);
    const legendColor = ['#DBFFDB', '#D8EDFF', '#FEF7DA', '#FBDAC9']
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.chartLegendContainer}>
          {total > 0 ? (
            <WrappedCustomPieChart
              widthAndHeight={210}
              series={series}
              sliceColor={sliceColor}
              centerText={centerText}
              data={data}
              onLegendItemClick={handleLegendItemClick}
            />
          ) : (
            <View style={styles.centerTextContainer}>
            <Text style={styles.centerText2}>Vehicles</Text>
              <Text style={styles.centerText}>{centerText}</Text>
              {selectedValue && (
                <Text style={styles.selectedValueText}>
                  {selectedValue.name}: {selectedValue.population}
                </Text>
              )}
            </View>
          )}
           <View style={styles.legendContainer}>
            {data.map((item, index) => {
              if (index % 2 === 0) {
                return (
                  <View key={index}>
                    <TouchableOpacity onPress={() => handleLegendItemClick(data[index].name)}>
                      <View style={[styles.legendItem, { backgroundColor: legendColor[index] }]}>
                        <View style={styles.legendTextContainer}>
                          <Text style={styles.legendNumber}>{item.population}</Text>
                          <View style={styles.legendColorContainer}>
                            <View style={[styles.legendCircle, { backgroundColor: sliceColor[index] }]} />
                            <Text style={styles.legendText}>{item.name}</Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                    {index + 1 < data.length && (
                      <TouchableOpacity onPress={() => handleLegendItemClick(data[index + 1].name)}>
                        <View style={[styles.legendItem, { backgroundColor: legendColor[index + 1] }]}>
                          <View style={styles.legendTextContainer}>
                            <Text style={styles.legendNumber}>{data[index + 1].population}</Text>
                            <View style={styles.legendColorContainer}>
                              <View style={[styles.legendCircle, { backgroundColor: sliceColor[index + 1] }]} />
                              <Text style={styles.legendText}>{data[index + 1].name}</Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }
              return null;
            })}
          </View>
        </View>
      </View>
    );
  };

  const calculateFleetData = () => {
    const fleetSData = [
      { name: 'Running', population: fleetData.runningDeviceCount || 0 },
      { name: 'Idle', population: fleetData.idealDeviceCount || 0 },
      { name: 'Inactive', population: fleetData.inactiveCount || 0 },
      { name: 'Stopped', population: fleetData.stoppedDeviceCount || 0 },
    ];
    let i = 0;
    const fleetFilteredData = [];
    const fleetSeries = [];
    for (i; i < 4; i++) {
      const fleetEntry = {name: fleetSData[i].name, population: fleetSData[i].population};
      fleetFilteredData.push(fleetEntry);
      fleetSeries.push(fleetSData[i].population);
    }
    const fleetTotal = fleetFilteredData.reduce((sum, data) => sum + (data.population || 0), 0);
    return { fleetFilteredData, fleetSeries, fleetTotal };
  };
  
  const calculateDeviceData = (dataPassed) => {
    if (!Array.isArray(dataPassed)) {
      const deviceData = [
        { name: 'Active', population: 0 },
        { name: 'Installed', population: 0 },
        { name: 'Inactive', population: 0 },
        { name: 'Error', population: 0 },
      ];
      const deviceSeries = [0, 0, 0, 0];
      const deviceTotal = 0;
      return { deviceData, deviceSeries, deviceTotal };
    }
    const activeCount = dataPassed.reduce((sum, data) => sum + (data.activeDevices || 0), 0);
    const installedCount = dataPassed.reduce((sum, data) => sum + (data.totalDevices || 0), 0);
    const errorCount = dataPassed.reduce((sum, data) => sum + (data.temperedCount || 0), 0);
    const inactiveCount = dataPassed.reduce((sum, data) => sum + (data.inactiveDevices || 0), 0);

    const deviceData = [
      { name: 'Active', population: activeCount },
      { name: 'Installed', population: installedCount },
      { name: 'Inactive', population: inactiveCount },
      { name: 'Error', population: errorCount },
    ];
    const deviceSeries = [activeCount, installedCount, inactiveCount, errorCount];
    const deviceTotal = activeCount + installedCount + inactiveCount + errorCount;
    return { deviceData, deviceSeries, deviceTotal };
  };

  var deviceStatusDetails = [];
  const calculateFilteredDeviceData = () => {
    if (activeSubTab === 'All') {
      const allData = [dsmData, vtsData, fcwData];
      const combinedData = {
        activeStatus: [...dsmDeviceStatusDetails.activeStatus, ...vtsDeviceStatusDetails.activeStatus, ...fcwDeviceStatusDetails.activeStatus],
        installedStatus: [...dsmDeviceStatusDetails.installedStatus, ...vtsDeviceStatusDetails.installedStatus, ...fcwDeviceStatusDetails.installedStatus],
        inactiveStatus: [...dsmDeviceStatusDetails.inactiveStatus, ...vtsDeviceStatusDetails.inactiveStatus, ...fcwDeviceStatusDetails.inactiveStatus],
        errorStatus: [...dsmDeviceStatusDetails.errorStatus, ...vtsDeviceStatusDetails.errorStatus, ...fcwDeviceStatusDetails.errorStatus],
      };
      deviceStatusDetails = combinedData;
      return calculateDeviceData(allData);
    } 
    else if (activeSubTab === 'DSM') {
      deviceStatusDetails = dsmDeviceStatusDetails;
      return calculateDeviceData([dsmData]);
    }
    else if (activeSubTab === 'VTS') {
      deviceStatusDetails = vtsDeviceStatusDetails;
      return calculateDeviceData([vtsData]);
    }
    else {
      deviceStatusDetails = fcwDeviceStatusDetails;
      return calculateDeviceData([fcwData]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainHeader}>
        <TouchableOpacity onPress={() => setActiveTab('Fleet Status')}>
          <Text style={[styles.mainTitle, activeTab === 'Fleet Status' && styles.mainTitleClicked]}>Fleet Status</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('Device Status')}>
          <Text style={[styles.mainTitle, activeTab === 'Device Status' && styles.mainTitleClicked]}>Device Status</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleModal} style={styles.infoButton}>
          <Text style={styles.infoButtonText}>i</Text>
        </TouchableOpacity>
      </View>
      {activeTab === 'Device Status' && (
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setActiveSubTab('All')}>
            <Text style={[styles.subTitle, activeSubTab === 'All' && styles.subTitleClicked]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveSubTab('DSM')}>
            <Text style={[styles.subTitle, activeSubTab === 'DSM' && styles.subTitleClicked]}>DSM</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveSubTab('VTS')}>
            <Text style={[styles.subTitle, activeSubTab === 'VTS' && styles.subTitleClicked]}>VTS</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveSubTab('FCW-DSM')}>
            <Text style={[styles.subTitle, activeSubTab === 'FCW-DSM' && styles.subTitleClicked]}>FCW-DSM</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.content}>
        {activeTab === 'Fleet Status' && renderChartOrMessage(
          calculateFleetData().fleetSeries,
          fleetSliceColor,
          calculateFleetData().fleetTotal.toString(),
          calculateFleetData().fleetFilteredData,
        )}
        {activeTab === 'Device Status' && renderChartOrMessage(
          calculateFilteredDeviceData().deviceSeries,
          fleetSliceColor,
          calculateFilteredDeviceData().deviceTotal.toString(),
          calculateFilteredDeviceData().deviceData,
        )}
      </View>
      {legendItemSelected !== null && activeTab === 'Fleet Status' && (
        <FleetStatusPopup
          visible={modalVisible2}
          onClose={toggleModal2}
          legendItemSelected={legendItemSelected}
          fleetStatusDetails={fleetStatusDetails}
        />
      )}
      {legendItemSelected !== null && activeTab === 'Device Status' && (
        <DeviceStatusPopup
          visible={modalVisible3}
          onClose={toggleModal3}
          legendItemSelected={legendItemSelected}
          deviceStatusDetails={deviceStatusDetails}
        />
      )}
      <FleetStatusInfo visible={modalVisible} onClose={toggleModal} />
    </SafeAreaView>
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
  mainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3470e3',
  },
  mainTitleClicked: {
    borderBottomWidth: 4,
    borderBottomColor: '#3470e3',
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3470e3',
  },
  subTitleClicked: {
    borderBottomWidth: 2,
    borderBottomColor: '#3470e3',
  },
  content: {
    flex: 1,
  },
  chartLegendContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 15,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 15,
    marginRight: 20,
  },
  legendItem: {
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 8,
    elevation: 2,
    marginVertical: 10,
    marginHorizontal: 20,
    width: 120,
    height: 60,
    borderColor: 'black',
  },
  legendTextContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  legendCircle: {
    width: 12,
    height: 12,
    borderRadius: 5,
    marginRight: 5,
  },
  legendText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 5,
  },
  legendNumber: {
    fontSize: 18,
    fontWeight: 'bold',
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
  centerTextContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
  centerText2: {
    fontSize: 18,
    color: 'black',
  },
  selectedValueText: {
    fontSize: 16,
    color: 'black',
    marginTop: 10,
  },
  legendColorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  }
});

export default FleetStatus;