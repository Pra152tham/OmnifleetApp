import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';


const VideoCardTemplate = ({ timestamp, warningType, vehicleId }) => {
  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <FontAwesome name="play-circle" size={30} color="green" />
      </View>
      <View style={styles.infoContainer}>
        <View style={styles.row}>
          <FontAwesome name="clock-o" size={14} color="yellow" />
          <Text style={styles.timestamp}>{timestamp}</Text>
        </View>
        <View style={styles.row}>
          <FontAwesome name="bell" size={14} color="white" />
          <Text style={styles.warningType}>{warningType}</Text>
        </View>
        <View style={styles.row}>
          <FontAwesome name="car" size={14} color="white" />
          <Text style={styles.vehicleId}>{vehicleId}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    elevation: 5,
  },
  iconContainer: {
    marginRight: 10,
    elevation: 2,
  },
  infoContainer: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  timestamp: {
    color: 'yellow',
    marginLeft: 5,
  },
  warningType: {
    color: 'white',
    marginLeft: 5,
  },
  vehicleId: {
    color: 'white',
    marginLeft: 5,
  },
});

export default VideoCardTemplate;


