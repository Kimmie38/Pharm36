import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { spacing, type} from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';

export default function LoginScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.replace('PharmacistApp');
    }, 900);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>

        <Image source={require('../../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to manage your pharmacy</Text>

        <View style={{ marginTop: spacing.xl, width: '100%' }}>
          <Input
            label="Phone number or email"
            placeholder="you@pharmacy.com"
            value={identifier}
            onChangeText={setIdentifier}
            icon="person-outline"
            autoCapitalize="none"
          />
          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            icon="lock-closed-outline"
            secureTextEntry
          />

          <Pressable style={{ alignSelf: 'flex-end', marginBottom: spacing.lg }}>
            <Text style={styles.forgot}>Forgot password?</Text>
          </Pressable>

          <Button label="Log In" onPress={handleLogin} loading={loading} />

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>New to Pharm36? </Text>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signupLink}>Create an account</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: 70, paddingBottom: 40, alignItems: 'center' },
  backBtn: { position: 'absolute', top: 56, left: spacing.lg, width: 34, height: 34, borderRadius: 17, backgroundColor: colors.bgElevated2, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 84, height: 84, marginBottom: spacing.lg, marginTop: spacing.lg },
  title: { color: colors.textPrimary, ...type.h1 },
  subtitle: { color: colors.textSecondary, ...type.body, marginTop: 6 },
  forgot: { color: colors.greenLight, ...type.small, fontWeight: '600' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  signupText: { color: colors.textSecondary, ...type.small },
  signupLink: { color: colors.greenLight, ...type.small, fontWeight: '700' },
});
