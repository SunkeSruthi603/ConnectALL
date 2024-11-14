import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, View, TextInput, ScrollView, Button, Alert } from 'react-native';
import { Icon, Card, Avatar } from 'react-native-elements';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import supabase from './client';

const Drawer = createDrawerNavigator();

// Request Push Notification Permissions and get token
async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log('Push notification token:', token);
}

export default function App() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  return (
    <NavigationContainer>
      <Drawer.Navigator initialRouteName="Sign In">
        <Drawer.Screen name="Sign Up" component={SignUpScreen} />
        <Drawer.Screen name="Sign In" component={SignInScreen} />
        <Drawer.Screen name="Home" component={HomeScreen} />
        <Drawer.Screen name="Profile" component={ProfileScreen} />
        <Drawer.Screen name="History" component={HistoryScreen} />
        <Drawer.Screen name="Settings" component={SettingsScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

// Sign Up Screen
function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async () => {
    const { user, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      // Add user to `users` table
      const { error: insertError } = await supabase.from('users').insert([
        { id: user.id, email: user.email }
      ]);

      if (insertError) {
        Alert.alert('Error', insertError.message);
      } else {
        Alert.alert('Success', 'User registered!');
        navigation.navigate('Sign In');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.textInput}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Sign Up" onPress={handleSignUp} />
    </View>
  );
}


// Sign In Screen
function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Signed in successfully!');
      navigation.navigate('Home');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.textInput}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Sign In" onPress={handleSignIn} />
    </View>
  );
}

// Home Screen (Messaging)
function HomeScreen() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  // Fetch messages from Supabase
  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      Alert.alert('Error', 'Could not fetch messages: ' + error.message);
    } else {
      setMessages(data);
    }
  };

  const addMessage = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    Alert.alert('Error', 'You need to be signed in to send messages.');
    return;
  }

  if (message.trim()) {
    const newMessage = {
      content: message,
      sender_id: user.id, // Use authenticated user's ID
      sender: user.name,
      created_at: new Date(),
    };

    const { error } = await supabase.from('messages').insert(newMessage);

    if (error) {
      console.error('Error adding message:', error);
      Alert.alert('Error', 'Failed to add message: ' + error.message);
    } else {
      setMessage('');
      fetchMessages();
    }
  }
};



  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <Text style={styles.title}>Messaging App</Text>
        <View style={styles.messageView}>
          <ScrollView style={styles.scrollContainer}>
            {messages.map((msg, index) => (
              <Card key={index} containerStyle={styles.messageCard}>
                <Text>{msg.sender}: {msg.content}</Text>
              </Card>
            ))}
          </ScrollView>
        </View>
        <View style={styles.inputView}>
          <TextInput
            style={styles.inputtext}
            placeholder="Type your message..."
            value={message}
            onChangeText={setMessage}
          />
          <Icon reverse name="send" type="ionicon" onPress={addMessage} />
        </View>
      </View>
    </SafeAreaProvider>
  );
}

// Profile Screen
function ProfileScreen() {
  return (
    <SafeAreaProvider>
      <View style={styles.profileContainer}>
        <Avatar
          rounded
          size="xlarge"
          icon={{ name: 'user', color: 'grey', type: 'font-awesome' }}
        />
        <Text style={styles.title}>Your Profile</Text>
      </View>
    </SafeAreaProvider>
  );
}

// History Screen
function HistoryScreen() {
  return (
    <SafeAreaProvider>
      <View style={styles.historyContainer}>
        <Text>View your message history here</Text>
      </View>
    </SafeAreaProvider>
  );
}

// Settings Screen
function SettingsScreen() {
  return (
    <SafeAreaProvider>
      <View style={styles.settingsContainer}>
        <Text>Settings</Text>
      </View>
    </SafeAreaProvider>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  messageView: {
    flex: 1,
    marginVertical: 10,
  },
  scrollContainer: {
    flex: 1,
  },
  inputView: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 1,
    marginVertical: 1,
  },
  textInput: {
    
    height:50 ,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 1,
  },
  inputtext: {
    flex:1,
    height:50 ,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 1,
  },
  messageCard: {
    padding: 10,
    borderRadius: 10,
  },
  profileContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  historyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

