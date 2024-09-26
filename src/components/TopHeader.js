import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useDate } from './DateContext';
import { useNavigation } from '@react-navigation/native';

// const formatDateToYYYYMMDD = (date) => {
//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, '0'); 
//   const day = String(date.getDate()).padStart(2, '0');
//   return `${year}-${month}-${day}`;
// };

const TopHeader = () => {
  const { startDate, setStartDate } = useDate();
  const [selectedGroup, setSelectedGroup] = useState('Select Vehicle Group');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDeviceType, setSelectedDeviceType] = useState('FCW');
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [showDevicePicker, setShowDevicePicker] = useState(false);

  const navigation = useNavigation();

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setStartDate(date.toISOString().split('T')[0]);
    }
  };

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={styles.toggleButton}>
        <Icon name="bars" size={24} color="#000" />
      </TouchableOpacity>
      <Text style={styles.title}>Dashboard</Text>
      <View style={styles.iconGroup}>
        <TouchableOpacity onPress={() => setShowGroupPicker(true)} style={styles.iconButton}>
          <Icon name="object-group" size={24} color="#0073e6" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.iconButton}>
          <Icon name="calendar" size={24} color="#0073e6" />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={new Date(startDate)} 
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
          />
        )}
        <TouchableOpacity onPress={() => setShowDevicePicker(true)} style={styles.iconButton}>
          <Icon name="truck" size={24} color="#0073e6" />
        </TouchableOpacity>
      </View>
      <Modal
        visible={showGroupPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGroupPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedGroup}
              onValueChange={(itemValue) => setSelectedGroup(itemValue)}
            >
              <Picker.Item label="Select Vehicle Group" value="Vehicle Group" />
              <Picker.Item label="NOVU-GRP" value="NOVU-GRP" />
            </Picker>
            <TouchableOpacity onPress={() => setShowGroupPicker(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showDevicePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDevicePicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedDeviceType}
              onValueChange={(itemValue) => setSelectedDeviceType(itemValue)}
            >
              <Picker.Item label="GPS Switch" value="GPS" />
              <Picker.Item label="FCW" value="FCW" />
              <Picker.Item label="DSM" value="DSM" />
              <Picker.Item label="VTS" value="VTS" />
            </Picker>
            <TouchableOpacity onPress={() => setShowDevicePicker(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  toggleButton: {
    padding: 5,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    marginLeft: 24,
  },
  iconGroup: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 10,
    marginRight: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '80%',
    padding: 20,
  },
  modalCloseButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#0073e6',
    borderRadius: 5,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default TopHeader;

