import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { IrMappingProvider, useIrMapping } from './src/context/IrMappingContext';
import { TestAndMapScreen } from './src/screens/TestAndMapScreen';
import { RemoteScreen } from './src/screens/RemoteScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { RootStackParamList } from './src/navigation/types';
import { USER_IR_CODES } from './src/constants/irData';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0B0E14',
    card: '#151923',
    text: '#F9FAFB',
    border: '#252B3B',
    primary: '#38BDF8',
  },
};

const RootNavigator: React.FC = () => {
  const { isLoaded, mappedUserCodesCount } = useIrMapping();

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  // Start on TestAndMap first until all 19 codes are mapped (or jump to Remote anytime!)
  const initialRouteName: keyof RootStackParamList =
    mappedUserCodesCount >= USER_IR_CODES.length ? 'Remote' : 'TestAndMap';

  return (
    <NavigationContainer theme={AppTheme}>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerStyle: { backgroundColor: '#151923' },
          headerTintColor: '#F9FAFB',
          headerTitleStyle: { fontWeight: '800', fontSize: 16 },
          contentStyle: { backgroundColor: '#0B0E14' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="TestAndMap"
          component={TestAndMapScreen}
          options={{
            title: '1. Test & Map IR Codes',
          }}
        />
        <Stack.Screen
          name="Remote"
          component={RemoteScreen}
          options={{
            title: 'RGB IR Remote',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'IR Protocol & Code Table',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <IrMappingProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </IrMappingProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B0E14',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
