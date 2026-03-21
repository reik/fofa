import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { useAuthStore } from '../store/authStore';
import { colors } from '../constants/colors';
import { AuthStackParamList, MainTabParamList, MessagesStackParamList } from '../types';

import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

import { DashboardScreen } from '../screens/DashboardScreen';
import { FamilyScreen } from '../screens/FamilyScreen';
import { ConversationListScreen } from '../screens/ConversationListScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { CommunityScreen } from '../screens/CommunityScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const MsgStack = createNativeStackNavigator<MessagesStackParamList>();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Dashboard: '🏠', Family: '👨‍👩‍👧', Messages: '💬', Community: '🌱', Profile: '👤',
  };
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icons[name]}</Text>;
}

function MessagesStack() {
  return (
    <MsgStack.Navigator screenOptions={{ headerTintColor: colors.brand }}>
      <MsgStack.Screen name="ConversationList" component={ConversationListScreen} options={{ title: 'Messages' }} />
      <MsgStack.Screen name="Chat" component={ChatScreen} options={({ route }) => ({ title: route.params.partnerName })} />
    </MsgStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { borderTopColor: colors.border },
        headerTintColor: colors.brand,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontWeight: '700' },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Feed' }} />
      <Tab.Screen name="Family" component={FamilyScreen} />
      <Tab.Screen name="Messages" component={MessagesStack} options={{ headerShown: false }} />
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerTintColor: colors.brand, headerBackTitle: '' }}>
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Reset Password' }} />
    </AuthStack.Navigator>
  );
}

export function RootNavigator() {
  const token = useAuthStore(s => s.token);
  return (
    <NavigationContainer>
      {token ? <MainTabs /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
