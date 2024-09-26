import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const VideoPlaybackScreen = ({ route, navigation }) => {
  const { videoUrl } = route.params || {}; // Ensure videoUrl is safely extracted

  return (
    <View style={styles.fullScreenContainer}>
      {/* Close Button */}
      

      {/* WebView for video playback, with error handling if no videoUrl */}
      
      {videoUrl ? (
        <WebView
          source={{ uri: videoUrl }}
          style={styles.fullScreenWebView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
        />
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load video. Please try again.</Text>
        </View>
      )}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.closeButton}
        accessibilityLabel="Close video player"
      >
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
      
    </View>
  );
};

// Styles
const styles = StyleSheet.create({

  fullScreenContainer: {
    
    height:'230%',
    width:'230%',
    flex: 1,
    backgroundColor: 'white', // Full-screen background
  },
  fullScreenWebView: {
    marginTop:200,
    flex: 1, // Take full space of the screen
  },
//   videoscreen:{
//     marginTop:12,
//     ,
//     width:150
//   },
  closeButton: {
    padding: 2,
    backgroundColor: 'blue', // Red background for close button
    marginLeft:160,
    marginRight:690,
    marginBottom:220,
    borderRadius:4,
    
    borderWidth:1
  },
  closeButtonText: {
    textAlign:'center',
    padding:5,
    marginTop:2,
    color: 'white',
    fontSize: 16,

  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontSize: 16,
  },
});

export default VideoPlaybackScreen;