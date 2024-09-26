import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const PerformanceScoreInfo = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
          <View style={styles.modalContent}>
            <View style={styles.row}>
              <Text style={styles.col}>Events </Text>
              <Text style={styles.col}>Distance </Text>
              <Text style={styles.col}>Normalized Events (events/distance)*1000 </Text>
              <Text style={styles.col}>Score </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.col}>Ex: Over speeding event count: 12</Text>
              <Text style={styles.col}>Ex: 200 km</Text>
              <Text style={styles.col}>Normalized over speeding event count: (12/200)*1000 = 60</Text>
              <Text style={styles.col}>0</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    marginTop: 300,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    minWidth: 800, 
    alignItems: 'center',
    maxHeight: 200,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  col: {
    flex: 1,
    textAlign: 'left',
    borderWidth: 1,
    borderColor: '#3470a3',
    padding: 10,
    color: 'black',
    minWidth: 300,
    maxWidth: 300,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 5,
  },
  closeText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default PerformanceScoreInfo;