import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Card, Rating } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import PerformanceScoreInfo from './PerformanceScoreInfo';
import DriverDataPopup from './DriverDataPopup';
import AllDriversPopup from './AllDriversPopup';
import axios from 'axios';
import { useUser } from '../screen/UserContext';
import { useDate } from './DateContext';

const { width, height } = Dimensions.get('window');

const transporterData = {
  top3: [
    { score: 100, km: 135.3, rating: 5 },
    { score: 75, km: 3.61, rating: 4 },
    { score: 70, km: 1.08, rating: 3 },
  ],
  bottom3: [
    { score: 55, km: 0.09, rating: 2 },
    { score: 'N/A', km: 'N/A', rating: 1 },
    { score: 'N/A', km: 'N/A', rating: 0 },
  ],
};

const DriverCard = ({ driver, rank, onClick, category, index }) => (
  <Card containerStyle={styles.card}>
    <TouchableOpacity onPress={() => onClick(driver, category, index)}>
      <View style={styles.rankContainer}>
        {rank === '#1' && <Icon name="trophy" style={[styles.trophyIcon, styles.gold]} />}
        {rank === '#2' && <Icon name="trophy" style={[styles.trophyIcon, styles.silver]} />}
        {rank === '#3' && <Icon name="trophy" style={[styles.trophyIcon, styles.bronze]} />}
        {parseInt(rank.slice(1)) > 3 && <Icon name="exclamation-triangle" style={[styles.icon, styles.warning]} />}
      </View>
      <Card.Title style={styles.cardTitle}>{driver.name}</Card.Title>
      <Card.Divider />
      <View style={styles.cardContent}>
        <Text>Score: {driver.score}</Text>
        <Text>KM: {driver.km}</Text>
        <Rating imageSize={20} readonly startingValue={driver.rating} style={styles.rating} />
      </View>
    </TouchableOpacity>
  </Card>
);

const TransporterCard = ({ transporter, rank }) => (
  <Card containerStyle={styles.card}>
    <View style={styles.rankContainer}>
      {rank === '#1' && <Icon name="trophy" style={[styles.trophyIcon, styles.gold]} />}
      {rank === '#2' && <Icon name="trophy" style={[styles.trophyIcon, styles.silver]} />}
      {rank === '#3' && <Icon name="trophy" style={[styles.trophyIcon, styles.bronze]} />}
      {parseInt(rank.slice(1)) > 3 && <Icon name="exclamation-triangle" style={[styles.icon, styles.warning]} />}
    </View>
    <Card.Title style={styles.cardTitle}>Transporter</Card.Title>
    <Card.Divider />
    <View style={styles.cardContent}>
      <Text>Score: {transporter.score}</Text>
      <Text>KM: {transporter.km}</Text>
      <Rating imageSize={20} readonly startingValue={transporter.rating} style={styles.rating} />
    </View>
  </Card>
);

const PerformanceScore = () => {
  const [selectedTab, setSelectedTab] = useState('driver');
  const [selectedSubTab, setSelectedSubTab] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [driverPopupVisible, setDriverPopupVisible] = useState(false);
  const [allDriverPopupVisible, setAllDriverPopupVisible] = useState(false);
  const { userId } = useUser();
  const { startDate} = useDate();
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [topDrivers, setTopDrivers] = useState([]);
  const [bottomDrivers, setBottomDrivers] = useState([]);
  const [driverOfTheWeek, setDriverOfTheWeek] = useState(null);

  const [driverStatusDetails, setDriverStatusDetails] = useState({
    allDrivers: [],
    topDrivers: [],
    bottomDrivers: [],
  });

  useEffect(() => {
    fetchDriversData();
  }, [userId, startDate]);

  const fetchDriversData = async () => {
    try {
      const response = await axios.get(`https://www.novusomnifleet.com/hitech-api/driver/get-all-driver-score-data/${startDate}/${startDate}/${userId}/NOVU-GRP`);
      const drivers = response.data.data;
      const popupData = drivers.map(item => ([
        item.date_time,
        item.driverFullName || 'N/A',
        item.vehicle,
        item.deviceId,
        item.DeviceType || 'FCW',
        item.totalKmToday || 0,
        item.rashDrivingSafetyScore || 0,
        item.nightDrivingSafetyScore || 0,
        item.overspeedingSafetyScore || 0,
        item.continiuosDrivingSafetyScore || 0,
        item.seatBeltCountVp1 || 0,
        item.totalSafetyScore || 0,
      ]));
      const transformedData = drivers.map(driver => ({
        name: driver.driverName || 'N/A',
        score: driver.totalSafetyScore,
        km: driver.totalKmToday,
        rating: driver.driverStar,
      }));
      transformedData.sort((a, b) => b.score - a.score);
      setTopDrivers(transformedData.slice(-3).reverse());
      setBottomDrivers(transformedData.slice(0, 3));
      popupData.sort((a, b) => b.score - a.score);
      setDriverStatusDetails({
        allDrivers: popupData,
        topDrivers: popupData.slice(-3).reverse(),
        bottomDrivers: popupData.slice(0, 3)
      });
      if (transformedData.length > 0) {
        setDriverOfTheWeek(transformedData.at(-1).name);
      }
    } catch (error) {
      console.error('Error fetching drivers data:', error);
    }
  };

  const toggleModal = () => {
    setModalVisible(!modalVisible);
  };

  const toggleAllDriverPopup = () => {
    setAllDriverPopupVisible(true);
  };

  const toggleDriverPopup = (driver, category, index) => {
    setSelectedDriver(driver);
    setSelectedCategory(category);
    setSelectedIndex(index);
    setDriverPopupVisible(true);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.mainHeader}>
        <Text style={styles.title}>Performance Score</Text>
        <TouchableOpacity onPress={toggleModal} style={styles.infoButton}>
          <Text style={styles.infoButtonText}>i</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedTab('driver')}>
          <Text style={[styles.tab, selectedTab === 'driver' && styles.activeTab]}>Driver</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedTab('transporter')}>
          <Text style={[styles.tab, selectedTab === 'transporter' && styles.activeTab]}>Transporter</Text>
        </TouchableOpacity>
      </View>
      {selectedTab === 'driver' && (
        <>
        <View style={styles.subHeader}>
            <TouchableOpacity onPress={toggleAllDriverPopup}>
              <Text style={[styles.subTab, selectedSubTab === 'all' && styles.activeSubTab]}>
                <Icon name="users" /> All Drivers
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.subHeader}>
              <Text style={[styles.activeSubTab]}>
                <Icon name="trophy" /> Driver of the Week: {driverOfTheWeek}
              </Text>
          </View>
          <View style={styles.twoColumns}>
            <View style={styles.column}>
              <Text style={styles.sectionTitle}>Top 3 Drivers:</Text>
              {topDrivers.map((driver, index) => (
                <DriverCard key={index} driver={driver} rank={`#${index + 1}`} onClick={toggleDriverPopup} category="top" index={index}/>
              ))}
            </View>
            <View style={styles.column}>
              <Text style={styles.sectionTitle}>Bottom 3 Drivers:</Text>
              {bottomDrivers.map((driver, index) => (
                <DriverCard key={index} driver={driver} rank={`#${index + 4}`} onClick={toggleDriverPopup} category="bottom" index={index}/>
              ))}
            </View>
          </View>
        </>
      )}
      {selectedTab === 'transporter' && (
        <>
          <View style={styles.subHeader}>
            <TouchableOpacity onPress={() => setSelectedSubTab('all')}>
              <Text style={[styles.subTab, selectedSubTab === 'all' && styles.activeSubTab]}>
                <Icon name="users" /> Total Transporter
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.subHeader}>
            <TouchableOpacity onPress={() => setSelectedSubTab('weekly')}>
              <Text style={[styles.subTab, selectedSubTab === 'weekly' && styles.activeSubTab]}>
                <Icon name="trophy" /> Transporter of the Week: Transporter Name
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.twoColumns}>
            <View style={styles.column}>
              <Text style={styles.sectionTitle}>Top 3:</Text>
              {transporterData.top3.map((transporter, index) => (
                <TransporterCard key={index} transporter={transporter} rank={`#${index + 1}`} />
              ))}
            </View>
            <View style={styles.column}>
              <Text style={styles.sectionTitle}>Bottom 3:</Text>
              {transporterData.bottom3.map((transporter, index) => (
                <TransporterCard key={index} transporter={transporter} rank={`#${index + 4}`} />
              ))}
            </View>
          </View>
        </>
      )}
      <PerformanceScoreInfo visible={modalVisible} onClose={toggleModal} />
      <DriverDataPopup
        visible={driverPopupVisible}
        onClose={() => setDriverPopupVisible(false)}
        category={selectedCategory}
        driverStatusDetails={driverStatusDetails}
        index={selectedIndex}
      />
      <AllDriversPopup visible={allDriverPopupVisible} onClose={() => setAllDriverPopupVisible(false)} />
    </ScrollView>
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
  infoButton: {
    paddingHorizontal: 10,
    fontStyle: 'italic',
  },
  infoButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: width < 400 ? 18 : 20,
  },
  title: {
    fontSize: width < 400 ? 18 : 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'black',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  tab: {
    fontSize: width < 400 ? 16 : 18,
    color: '#7F7F7F',
    paddingBottom: 8,
  },
  activeTab: {
    color: '#247ba0',
    borderBottomWidth: 2,
    borderBottomColor: '#247ba0',
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  subTab: {
    fontSize: width < 400 ? 14 : 16,
    color: '#7F7F7F',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  activeSubTab: {
    color: '#247ba0',
    backgroundColor: '#d0e8f2',
    fontSize: width < 400 ? 14 : 16,
    padding: 8,
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: width < 400 ? 18 : 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  card: {
    flex: 1,
    margin: 5,
    padding: 8,
    borderRadius: 10,
    marginBottom: 10,
    width: '88%',
    height: '30%',
  },
  cardTitle: {
    fontSize: width < 400 ? 16 : 18,
    marginBottom: 10,
    marginLeft: 20,
  },
  cardContent: {
    marginTop: -10,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  twoColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    marginHorizontal: 5,
  },
  rating: {
    marginTop: 10,
  },
  rankContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trophyIcon: {
    fontSize: width < 400 ? 20 : 22,
    marginRight: 10,
    marginLeft: -5,
  },
  gold: {
    color: '#FFD700',
  },
  silver: {
    color: '#C0C0C0',
  },
  bronze: {
    color: '#CD7F32',
  },
  warning: {
    color: 'red',
    fontSize: width < 400 ? 20 : 22,
    marginRight: 5,
  },
});

export default PerformanceScore;
