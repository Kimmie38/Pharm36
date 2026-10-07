import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, Easing, StyleSheet, Text, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0.6)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(10)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo pop-in with a soft overshoot
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5.5,
          tension: 55,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(textTranslate, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();

    // Expanding ring pulse behind the logo (loops)
    const pulse = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ringScale, { toValue: 1.35, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(ringScale, { toValue: 0.9, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(ringOpacity, { toValue: 0, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0.55, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    pulse.start();

    // Loading dots
    const makeDotLoop = (val, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 380, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0.25, duration: 380, useNativeDriver: true }),
        ])
      );
    makeDotLoop(dot1, 0).start();
    makeDotLoop(dot2, 150).start();
    makeDotLoop(dot3, 300).start();

    const timer = setTimeout(() => {
      navigation.replace('RoleSelect');
    }, 2600);

    return () => {
      clearTimeout(timer);
      pulse.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.ring,
            {
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            },
          ]}
        />
        <Animated.View style={{ opacity: glowOpacity }}>
          <LinearGradient
            colors={[colors.green + '55', 'transparent']}
            style={styles.glow}
          />
        </Animated.View>
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          }}
        >
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textTranslate }], alignItems: 'center' }}>
          <Text style={styles.tagline}>Verified pharmacists. Safe medicine.</Text>
        </Animated.View>
      </View>

      <View style={styles.loadingWrap}>
        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, { opacity: dot1 }]} />
          <Animated.View style={[styles.dot, { opacity: dot2 }]} />
          <Animated.View style={[styles.dot, { opacity: dot3 }]} />
        </View>
        <Text style={styles.loadingText}>Loading</Text>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  logo: { width: width * 0.5, height: width * 0.5 },
  ring: {
    position: 'absolute',
    width: width * 0.62,
    height: width * 0.62,
    borderRadius: width * 0.62,
    borderWidth: 2,
    borderColor: colors.greenLight,
  },
  glow: {
    position: 'absolute',
    top: -width * 0.15,
    left: -width * 0.15,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
  },
  tagline: { color: colors.textSecondary, fontSize: 13, marginTop: 18, letterSpacing: 0.2 },
  loadingWrap: { position: 'absolute', bottom: 64, alignItems: 'center' },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.greenLight },
  loadingText: { color: colors.textMuted, fontSize: 12, letterSpacing: 1 },
});
