import * as React from 'react';import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DrawerNavigator from './src/components/DrawerNavigator'; 
import { DateProvider } from './src/components/DateContext';
import { PaperProvider } from 'react-native-paper';
import { UserProvider } from './src/screen/UserContext';
import Loginscreen from './src/screen/Login';
import ManagerReports from './src/Tabs/REPORTSSCREEN/managerreports';
import Driverhealth from './src/Tabs/REPORTSSCREEN/Driverhealthreports';
import Driverreports from './src/Tabs/REPORTSSCREEN/Driverperformanereports';
import Continuousreports from './src/Tabs/REPORTSSCREEN/ContinousdrivingReports';
import DailyKMreports from './src/Tabs/REPORTSSCREEN/DailyKmreports';
import Ignitionreport from './src/Tabs/REPORTSSCREEN/Ignitionreport';
import Stoppagereport from './src/Tabs/REPORTSSCREEN/Stoppagereport';
import NightDriving from './src/Tabs/REPORTSSCREEN/NightDrivingreport';
import Dailyrunreport from './src/Tabs/REPORTSSCREEN/Dailyrun';
import Dailyeventreport from './src/Tabs/REPORTSSCREEN/DailyEvent';
import Tripvehiclereport from './src/Tabs/REPORTSSCREEN/tripvehicle';
import Alarmreport from './src/Tabs/REPORTSSCREEN/alarm';
import VideoPlaybackScreen from './src/Tabs/PLAYBACKSCREEN/videoplaybackscreen';




const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <UserProvider>
      <DateProvider>
        <PaperProvider>
          <NavigationContainer>
          <Stack.Navigator 
            screenOptions={{
              headerShown: false,
            }}>
              <Stack.Screen name="Login" component={Loginscreen} />
              <Stack.Screen name="Dashboard" component={DrawerNavigator} />
              <Stack.Screen name= "ManagerReports" component={ManagerReports} options={{headerShown:false}}/>
              <Stack.Screen name= "DeviceHealthReport" component={Driverhealth} options={{headerShown:false}}/>
              <Stack.Screen name= "DriverPerformanceReports" component={Driverreports} options={{headerShown:false}}/>
              <Stack.Screen name= "ContinuousDrivingReport" component={Continuousreports} options={{headerShown:false}}/>
              <Stack.Screen name= "DailyKMReport" component={DailyKMreports} options={{headerShown:false}}/>
              <Stack.Screen name= "DeviceIgnitionReport" component={Ignitionreport} options={{headerShown:false}}/>
              <Stack.Screen name= "StoppageReport" component={Stoppagereport} options={{headerShown:false}}/> 
              <Stack.Screen name= "NightDrivingReport" component={NightDriving} options={{headerShown:false}}/>
              <Stack.Screen name= "DailyRunReport" component={Dailyrunreport} options={{headerShown:false}}/>
              <Stack.Screen name= "DailyEventReport" component={Dailyeventreport} options={{headerShown:false}}/>
              <Stack.Screen name= "TripVehicleSummary" component={Tripvehiclereport} options={{headerShown:false}}/>
              <Stack.Screen name= "AlarmDistribution" component={Alarmreport} options={{headerShown:false}}/>
              <Stack.Screen name= "VideoPlaybackScreen" component={VideoPlaybackScreen}/>
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </DateProvider>
    </UserProvider>
  );
}
