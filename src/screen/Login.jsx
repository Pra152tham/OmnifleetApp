import { StyleSheet, Text, TextInput, View, Image, KeyboardAvoidingView, ImageBackground } from 'react-native';
import React, { useState } from 'react';
import { useUser } from '../screen/UserContext';
 
const Loginscreen = ({ navigation }) => {
  const [fdata, setfdata] = useState({
    username: '',
    password: '',
  });
  const [errormsg, seterrormsg] = useState(null);
  const { setUserId } = useUser();
 
  const sendtobackend = () => {
    if (fdata.username === '' || fdata.password === '') {
      seterrormsg('All fields are required');
      return;
    } else {
      fetch('https://www.novusomnifleet.com/mobile-auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fdata),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            seterrormsg(data.error);
          } else {
            const userId = data.userDetailsInfo.id;
            setUserId(userId);
            navigation.navigate('Dashboard'); 
          }
        })
        .catch((error) => {
          seterrormsg('An error occurred. Please try again later.');
        });
    }
  };
 
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ImageBackground source={require('../assets/image1.jpg')} style={styles.backgroundImage}>
        <Image source={require('../assets/novuslogo1.png')} style={styles.logo} />
        <Image source={require('../assets/Novuslogo.png')} style={styles.logo2} />
        {errormsg ? <Text style={styles.errmsg}>{errormsg}</Text> : null}
        <View style={styles.formgroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            onChangeText={(text) =>
              setfdata({
                ...fdata,
                username: text,
              })
            }
          />
        </View>
        <View style={styles.formgroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry={true}
            onChangeText={(text) =>
              setfdata({
                ...fdata,
                password: text,
              })
            }
          />
        </View>
        <View>
          <Text style={styles.button} onPress={sendtobackend}>
            Log In
          </Text>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};
 
export default Loginscreen;
 
const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  formgroup: {
    marginBottom: 20,
    width: '80%',
  },
  label: {
    fontSize: 17,
    color: '#fff',
    marginBottom: 10,
    fontWeight:'bold'
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    opacity:1
  },
  input: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    color: '#000',
  },
  errmsg: {
    color: 'red',
    marginBottom: 20,
  },
  logo: {
    width: 230,
    height: 70,
    position: 'absolute',
    top: 20,
    left: 25,
  },
  logo2: {
    width: 280,
    height: 60,
    position: 'absolute',
    bottom: 40,
    right: 30,
  },
  button:{
    backgroundColor:'#6495ED',
    padding:10,
    fontSize:20,
    borderRadius:10,
    miniWidth:150,
    textAlign:'center',
    color:'white',
    margin:10,
  },
});
