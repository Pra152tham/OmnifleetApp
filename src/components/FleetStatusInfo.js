import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';

const FleetStatusInfo = ({ visible, onClose }) => {
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
            <Text style={styles.col}>Running </Text>
            <Text style={styles.col}>Idle Time </Text>
            <Text style={styles.col}>Stopped </Text>
            <Text style={styles.col}>Inactive </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.col}>Fleet's Ignition is on and it is moving</Text>
            <Text style={styles.col}>Fleet's Ignition is on but it is not moving</Text>
            <Text style={styles.col}>Fleet's Ignition is off</Text>
            <Text style={styles.col}>Fleet has no trip assigned</Text>
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

export default FleetStatusInfo;