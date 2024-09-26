import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';

const AlarmDistributionInfo = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.row}>
            <Text style={styles.col}>ALL </Text>
            <Text style={styles.col}>DSM </Text>
            <Text style={styles.col}>FCW </Text>
            <Text style={styles.col}>Abbreviation </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.col}>Summation of Top three Alarm Events of All Devices</Text>
            <Text style={styles.col}>Top three Alarm Events of DSM Device</Text>
            <Text style={styles.col}>Top three Alarm Events of FCW Device</Text>
            <Text style={styles.col}>SW - Smoking Warning , DSW - Distracted Warning , DRW - Drowsiness Warning , YW - Yawning Warning</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
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
    color: "black"
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

export default AlarmDistributionInfo;