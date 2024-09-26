import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PieChart from 'react-native-pie-chart';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';

const CustomPieChart = ({ widthAndHeight, series, sliceColor, centerText, data }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const handleChartPress = (event) => {
    const index = getSliceIndexFromEvent(event);
    setSelectedIndex(index);

    if (index !== null) {
      console.log('Selected slice index:', index);
      setIsTooltipVisible(true);
    } else {
      setIsTooltipVisible(false);
    }
  };

  const singleTap = Gesture.Tap()
    .maxDuration(250)
    .onStart(handleChartPress);

  const getSliceIndexFromEvent = (event) => {
    const totalValue = series.reduce((sum, value) => sum + value, 0);
    const startingAngles = [];
    let currentAngle = 0;

    for (let i = 0; i < series.length; i++) {
      startingAngles.push(currentAngle);
      const sliceAngle = (series[i] / totalValue) * 360;
      currentAngle += sliceAngle;
    }

    const centerX = widthAndHeight / 2;
    const centerY = widthAndHeight / 2;
    const dx = event.x - centerX;
    const dy = event.y - centerY;
    let angle = (Math.atan2(dy, dx) * (180 / Math.PI) + 360) % 360;
    angle = (angle + 90) % 360; 
    const distance = Math.sqrt(dx * dx + dy * dy);

    const outerRadius = widthAndHeight / 2;
    const coverRadius = 0.5;
    const innerRadius = outerRadius * coverRadius;

    if (distance < innerRadius || distance > outerRadius) {
      return null; 
    }

    for (let i = 0; i < startingAngles.length; i++) {
      const startAngle = startingAngles[i];
      let endAngle = (startingAngles[i] + (series[i] / totalValue) * 360) % 360;
      if (endAngle === 0 && i != 0) {
        endAngle = 360;
      }
      if (angle >= startAngle && angle < endAngle) {
        const tooltipX = ((event.x - centerX) + (event.x + centerX))/2;
        const tooltipY = ((event.y - centerY) + (event.y + centerY))/2;

        setTooltipPosition({ x: tooltipX, y: tooltipY });
        return i;
      }
    }
    return null;
  };

  return (
    <GestureDetector gesture={Gesture.Exclusive(singleTap)}>
      <View style={styles.chartWrapper}>
        <View style={{ alignItems: 'center' }}>
          <PieChart
            widthAndHeight={widthAndHeight}
            series={series}
            sliceColor={sliceColor}
            doughnut
            coverRadius={0.6}
            coverFill={'#FFF'}
            sliceSpace={15}
          />
          <View style={styles.centerTextContainer}>
          <Text style={styles.centerText2}>Vehicles</Text>
            <Text style={styles.centerText}>{centerText}</Text>
          </View>
          {selectedIndex !== null && (
            <View
              style={[
                styles.tooltip,
                { top: tooltipPosition.y - 30, left: tooltipPosition.x - 30 }
              ]}
            >
              <View style={[styles.tooltipCircle, { backgroundColor: sliceColor[selectedIndex] }]} />
              <Text style={styles.tooltipText}>
                {data[selectedIndex].name}: {data[selectedIndex].population}
              </Text>
            </View>
          )}
        </View>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  chartWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerTextContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'black',
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
  centerText2: {
    fontSize: 18,
    color: 'black',
  },
});

const WrappedCustomPieChart = (props) => (
  <GestureHandlerRootView>
    <CustomPieChart {...props} />
  </GestureHandlerRootView>
);

export default WrappedCustomPieChart;