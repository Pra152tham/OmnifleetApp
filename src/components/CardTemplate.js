import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const CardTemplate = ({ data }) => {
  const [expanded, setExpanded] = useState(false);
  const [arrowRotation] = useState(new Animated.Value(0));

  const keys = Object.keys(data);
  const displayedKeys = expanded ? keys : keys.slice(0, 2);

  const toggleExpand = () => {
    setExpanded(!expanded);
    Animated.timing(arrowRotation, {
      toValue: expanded ? 0 : 180,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const arrowRotationInterpolation = arrowRotation.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.rowContainer}>
      {displayedKeys.map((key, index) => (
        <View key={index} style={styles.row}>
          <Text style={styles.headerCell}>{key}:</Text>
          <Text style={styles.cell}>{data[key]}</Text>
        </View>
      ))}
      {keys.length > 2 && (
        <TouchableOpacity onPress={toggleExpand} style={styles.expandButton}>
          <Animated.View style={{ transform: [{ rotate: arrowRotationInterpolation }] }}>
            <Icon name="chevron-down" size={10} color="#000" />
          </Animated.View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 4,
    elevation: 2,
    shadowColor: '#ccc',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  headerCell: {
    fontWeight: '900',
    width: 130,
    color: '#00004d',
    fontSize: 16
  },
  cell: {
    flex: 1,
    color: '#0039e6',
    fontSize: 16
  },
  expandButton: {
    marginTop: 2,
    width: 15,
    padding: 2,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  }
});

export default CardTemplate;
