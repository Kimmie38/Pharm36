import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, type} from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';

// NOTE: This is a UI simulation of the scanning experience for the design pass.
// Wiring to a real camera + barcode reader (e.g. expo-camera's BarcodeScanner)
// is a follow-up integration step once the interface is approved.
export default function ScanBatchCodeScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [scanning, setScanning] = useState(true);
  const lineY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(lineY, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(lineY, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();

    const timer = setTimeout(() => {
      const fakeCode = '50' + Math.floor(Math.random() * 100000000000).toString().padStart(11, '0');
      setScanning(false);
      route.params?.onScanned?.(fakeCode);
      setTimeout(() => navigation.goBack(), 550);
    }, 2200);

    return () => { loop.stop(); clearTimeout(timer); };
  }, []);

  const translateY = lineY.interpolate({ inputRange: [0, 1], outputRange: [0, 210] });

  return (
    <View style={styles.container}>
      <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn} hitSlop={10}>
        <Ionicons name="close" size={24} color="#fff" />
      </Pressable>

      <Text style={styles.title}>Scan batch code</Text>
      <Text style={styles.subtitle}>Hold the straight-line barcode inside the frame</Text>

      <View style={styles.frameWrap}>
        <View style={styles.frame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          {scanning && (
            <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
          )}
          {!scanning && (
            <View style={styles.successWrap}>
              <Ionicons name="checkmark-circle" size={54} color={colors.success} />
            </View>
          )}
        </View>
      </View>

      <Text style={styles.status}>{scanning ? 'Scanning…' : 'Code captured'}</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', alignItems: 'center', paddingTop: 80 },
  closeBtn: { position: 'absolute', top: 56, right: spacing.lg, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  title: { color: '#fff', ...type.h2 },
  subtitle: { color: 'rgba(255,255,255,0.6)', ...type.small, marginTop: 6, marginBottom: spacing.xl },
  frameWrap: { width: 280, height: 210, alignItems: 'center', justifyContent: 'center' },
  frame: { width: 280, height: 210, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)' },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: colors.greenLight },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
  scanLine: { position: 'absolute', top: 0, left: 8, right: 8, height: 2, backgroundColor: colors.greenLight, shadowColor: colors.greenLight, shadowOpacity: 0.9, shadowRadius: 8 },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  status: { color: 'rgba(255,255,255,0.7)', ...type.small, marginTop: spacing.xl },
});
