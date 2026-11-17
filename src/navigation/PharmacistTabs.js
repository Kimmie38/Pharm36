import React, { useEffect, useRef, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/pharmacist/HomeScreen';
import InventoryScreen from '../screens/pharmacist/InventoryScreen';
import DataInputScreen from '../screens/pharmacist/DataInputScreen';
import ScanBatchCodeScreen from '../screens/pharmacist/ScanBatchCodeScreen';
import BatchDetailScreen from '../screens/pharmacist/BatchDetailScreen';
import ExpiryScreen from '../screens/pharmacist/ExpiryScreen';
import SalesScreen from '../screens/pharmacist/SalesScreen';
import ProfileScreen from '../screens/pharmacist/ProfileScreen';
import StickerScreen from '../screens/pharmacist/StickerScreen';
import SyncBanner from '../components/SyncBanner';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { api } from '../api/client';

const Tab = createBottomTabNavigator();
const InventoryStack = createNativeStackNavigator();
const HStack = createNativeStackNavigator();
const ExpiryStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function ProfileStackNavigator() {
  return <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
    <ProfileStack.Screen name="Sticker" component={StickerScreen} />
  </ProfileStack.Navigator>;
}

function InventoryStackNavigator() {
  return <InventoryStack.Navigator screenOptions={{ headerShown: false }}>
    <InventoryStack.Screen name="InventoryHome" component={InventoryScreen} />
    <InventoryStack.Screen name="DataInput" component={DataInputScreen} />
    <InventoryStack.Screen name="BatchDetail" component={BatchDetailScreen} />
    <InventoryStack.Screen name="ScanBatchCode" component={ScanBatchCodeScreen} options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
  </InventoryStack.Navigator>;
}
function HomeStackNavigator() {
  return <HStack.Navigator screenOptions={{ headerShown: false }}>
    <HStack.Screen name="HomeMain" component={HomeScreen} />
    <HStack.Screen name="Inventory" component={InventoryScreen} />
    <HStack.Screen name="DataInput" component={DataInputScreen} />
    <HStack.Screen name="BatchDetail" component={BatchDetailScreen} />
    <HStack.Screen name="ScanBatchCode" component={ScanBatchCodeScreen} options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
    <HStack.Screen name="Sales" component={SalesScreen} />
    <HStack.Screen name="Expiry" component={ExpiryScreen} />
    <HStack.Screen name="Profile" component={ProfileScreen} />
    <HStack.Screen name="Sticker" component={StickerScreen} />
  </HStack.Navigator>;
}
function ExpiryStackNavigator() {
  return <ExpiryStack.Navigator screenOptions={{ headerShown: false }}>
    <ExpiryStack.Screen name="ExpiryHome" component={ExpiryScreen} />
    <ExpiryStack.Screen name="BatchDetail" component={BatchDetailScreen} />
  </ExpiryStack.Navigator>;
}

function ExpiryTabButton({ onPress, accessibilityState, count }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = makeButtonStyles(colors);
  const focused = accessibilityState?.selected;
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const makeLoop = (value, delay) => Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(value, { toValue: 1, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(value, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    const first = makeLoop(pulse1, 0);
    const second = makeLoop(pulse2, 800);
    first.start(); second.start();
    return () => { first.stop(); second.stop(); };
  }, [pulse1, pulse2]);
  const ringStyle = (value) => ({ opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }), transform: [{ scale: value.interpolate({ inputRange: [0, 1], outputRange: [1, 2] }) }] });
  return <Pressable onPress={onPress} style={styles.wrap} hitSlop={8}>
    <View style={styles.ringAnchor}><Animated.View style={[styles.ring, ringStyle(pulse1)]} /><Animated.View style={[styles.ring, ringStyle(pulse2)]} /><View style={styles.core}><Ionicons name="alert-circle" size={26} color="#fff" /></View>
      {count > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text></View>}
    </View><Text style={[styles.label, focused && styles.labelActive]}>{t('tabs.expiry')}</Text>
  </Pressable>;
}

export default function PharmacistTabs() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [expiringCount, setExpiringCount] = useState(0);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const result = await api.get('batches/expiring');
        if (active) setExpiringCount(result.total || result.items?.length || 0);
      } catch { if (active) setExpiringCount(0); }
    };
    load();
    const timer = setInterval(load, 60000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  return <View style={{ flex: 1 }}><SyncBanner /><Tab.Navigator screenOptions={({ route }) => ({
    headerShown: false,
    tabBarStyle: styles.tabBar,
    tabBarActiveTintColor: colors.greenLight,
    tabBarInactiveTintColor: colors.textMuted,
    tabBarLabelStyle: { fontSize: 10.5, fontWeight: '600', marginBottom: 4 },
    tabBarIcon: ({ color, focused }) => {
      const icons = { Home: focused ? 'home' : 'home-outline', Inventory: focused ? 'cube' : 'cube-outline', Sales: focused ? 'swap-horizontal' : 'swap-horizontal-outline', Profile: focused ? 'person' : 'person-outline' };
      return <Ionicons name={icons[route.name]} size={22} color={color} />;
    },
  })}>
    <Tab.Screen name="Home" component={HomeStackNavigator} options={{ tabBarLabel: t('tabs.home') }} />
    <Tab.Screen name="Inventory" component={InventoryStackNavigator} options={{ tabBarLabel: t('tabs.inventory') }} />
    <Tab.Screen name="Expiry" component={ExpiryStackNavigator} options={{ tabBarButton: (props) => <ExpiryTabButton {...props} count={expiringCount} /> }} />
    <Tab.Screen name="Sales" component={SalesScreen} options={{ tabBarLabel: t('tabs.sales') }} />
    <Tab.Screen name="Profile" component={ProfileStackNavigator} options={{ tabBarLabel: t('tabs.profile') }} />
  </Tab.Navigator></View>;
}

const makeStyles = (colors) => StyleSheet.create({ tabBar: { backgroundColor: colors.bgElevated, borderTopColor: colors.border, height: 84, paddingTop: 8 } });
const makeButtonStyles = (colors) => StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' }, ringAnchor: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: -26 }, ring: { position: 'absolute', width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: colors.danger }, core: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.bgElevated, shadowColor: colors.danger, shadowOpacity: 0.7, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 8 }, badge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#fff', borderRadius: 8, minWidth: 17, height: 17, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: colors.danger }, badgeText: { color: colors.danger, fontSize: 9, fontWeight: '800' }, label: { fontSize: 10.5, fontWeight: '600', color: colors.textMuted, marginTop: 5 }, labelActive: { color: colors.danger },
});
