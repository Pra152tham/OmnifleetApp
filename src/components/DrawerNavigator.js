import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { StyleSheet, View, Text } from 'react-native';
import Dashboard from '../screen/Homepage';
import Maps from '../Tabs/MapsScreen';
import Alarms from '../Tabs/AlarmScreen';
import Reports from '../Tabs/REPORTSSCREEN/Reports'
import ManageTrips from '../Tabs/ManageTripsScreen';
import Groups from '../Tabs/GroupsScreen';
import Playback from '../Tabs/PLAYBACKSCREEN/Playback';
import Icon from 'react-native-vector-icons/MaterialIcons'; 

const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props) => {
  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerContent}>
        {props.state.routes.map((route, index) => {
          const focused = props.state.index === index;
          return (
            <View
              key={route.key}
              style={[
                styles.drawerItemContainer,
                focused ? styles.drawerItemFocused : null,
              ]}
            >
              <Icon
                name={
                  route.name === 'Dashboard' ? 'dashboard' :
                  route.name === 'Maps' ? 'place' :
                  route.name === 'Alarms' ? 'notifications' :
                  route.name === 'Reports' ? 'assignment' :
                  route.name === 'ManageTrips' ? 'route' :
                  route.name === 'Groups' ? 'group' :
                  'subscriptions'
                }
                size={34}
                color={focused ? '#154c79' : 'black'}
              />
              <Text
                style={[
                  styles.drawerItemLabel,
                  focused ? styles.drawerItemLabelFocused : null,
                ]}
                onPress={() => props.navigation.navigate(route.name)}
              >
                {route.name}
              </Text>
            </View>
          );
        })}
      </View>
    </DrawerContentScrollView>
  );
};

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator drawerContent={(props) => <CustomDrawerContent {...props} />}>
      <Drawer.Screen name="Dashboard" component={Dashboard} options={{ headerShown: false }}/>
      <Drawer.Screen name="Maps" component={Maps} />
      <Drawer.Screen name="Alarms" component={Alarms} />
      <Drawer.Screen name="Reports" component={Reports} />
      <Drawer.Screen name="ManageTrips" component={ManageTrips} />
      <Drawer.Screen name="Groups" component={Groups} />
      <Drawer.Screen name="Playback" component={Playback} />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    padding: 30,
  },
  drawerItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  drawerItemLabel: {
    fontSize: 18,
    marginLeft: 15,
  },
  drawerItemLabelFocused: {
    color: '#154c79', 
  },
});

export default DrawerNavigator;

