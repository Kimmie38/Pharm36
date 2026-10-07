import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { spacing, type, radius } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';
import { pharmacistProfile, professionalTypes, drugCategories } from '../../data/mockData';

const MENU = [
  { icon: 'business-outline', label: 'Store details' },
  { icon: 'notifications-outline', label: 'Reminder settings' },
  { icon: 'card-outline', label: 'Payments & payouts' },
  { icon: 'help-circle-outline', label: 'Help & support' },
];

export default function ProfileScreen({ navigation }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = makeStyles(colors);
  const rowStyles = makeRowStyles(colors);
  const profession = professionalTypes[pharmacistProfile.professionalType];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.profileTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{pharmacistProfile.name.split(' ').map(n => n[0]).join('').slice(0,2)}</Text>
        </View>
        <Text style={styles.name}>{pharmacistProfile.name}</Text>
        <Text style={styles.store}>{pharmacistProfile.storeName}</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Badge label={profession.label} tone="info" />
          <Badge label={pharmacistProfile.pcnStatus === 'active' ? `${profession.councilShort} Verified` : 'Access Revoked'} tone={pharmacistProfile.pcnStatus === 'active' ? 'success' : 'danger'} />
        </View>
      </View>

      <Card style={{ marginHorizontal: spacing.lg, marginTop: spacing.lg }}>
        <InfoRow rowStyles={rowStyles} icon="call-outline" label="Phone" value={pharmacistProfile.phone} />
        <InfoRow rowStyles={rowStyles} icon="mail-outline" label="Email" value={pharmacistProfile.email} />
        <InfoRow rowStyles={rowStyles} icon="location-outline" label="Store location" value={pharmacistProfile.location} />
        <InfoRow rowStyles={rowStyles} icon="map-outline" label="State" value={pharmacistProfile.state} />
        <InfoRow rowStyles={rowStyles} icon="ribbon-outline" label="License No." value={pharmacistProfile.licenseNo} last />
      </Card>

      <View style={{ marginTop: spacing.lg, marginHorizontal: spacing.lg }}>
        <Text style={styles.sectionLabel}>Verification & sections · {profession.councilShort}</Text>
        <Card>
          {profession.sections.map((s, i) => {
            const held = pharmacistProfile.sections.includes(s.key);
            return (
              <View key={s.key} style={[styles.sectionRow, i !== profession.sections.length - 1 && styles.sectionRowBorder]}>
                <Ionicons
                  name={held ? 'checkmark-circle' : 'lock-closed'}
                  size={18}
                  color={held ? colors.success : colors.textMuted}
                  style={{ marginTop: 1 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionRowLabel}>{s.label}</Text>
                  <Text style={styles.sectionRowDesc}>{held ? 'Approved — you can add these drugs' : 'Not registered — these drugs stay locked'}</Text>
                </View>
              </View>
            );
          })}
        </Card>
        <Text style={styles.sectionFootnote}>
          Drug categories outside your approved sections can't be added to inventory. Contact {profession.council} to request a new section.
        </Text>
      </View>

      <View style={{ marginTop: spacing.lg, marginHorizontal: spacing.lg }}>
        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.themeRow}>
          <View style={styles.menuIcon}>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={colors.greenLight} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuLabel}>Dark mode</Text>
            <Text style={styles.menuSub}>{isDark ? 'On — easier on the eyes at night' : 'Off — bright, high-contrast look'}</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.green }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={{ marginTop: spacing.lg, marginHorizontal: spacing.lg, gap: spacing.sm }}>
        {MENU.map((m) => (
          <Pressable key={m.label} style={styles.menuRow}>
            <View style={styles.menuIcon}>
              <Ionicons name={m.icon} size={18} color={colors.greenLight} />
            </View>
            <Text style={styles.menuLabel}>{m.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.logoutBtn} onPress={() => navigation.getParent()?.reset({ index: 0, routes: [{ name: 'RoleSelect' }] })}>
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value, last, rowStyles }) {
  return (
    <View style={[rowStyles.row, !last && rowStyles.border]}>
      <Ionicons name={icon} size={17} color={rowStyles.mutedColor} style={{ marginRight: 10 }} />
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

const makeRowStyles = (colors) => ({
  ...StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    border: { borderBottomWidth: 1, borderBottomColor: colors.border },
    label: { color: colors.textMuted, fontSize: 12.5, width: 100 },
    value: { color: colors.textPrimary, fontSize: 13, flex: 1, textAlign: 'right', fontWeight: '600' },
  }),
  mutedColor: colors.textMuted,
});

const makeStyles = (colors) => StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.sm },
  title: { color: colors.textPrimary, ...type.h1 },
  profileTop: { alignItems: 'center', marginTop: spacing.sm },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.tealDeep, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.green, marginBottom: spacing.sm },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  name: { color: colors.textPrimary, ...type.h2 },
  store: { color: colors.textSecondary, ...type.small, marginTop: 2, marginBottom: spacing.sm },
  sectionLabel: { color: colors.textMuted, ...type.tiny, textTransform: 'uppercase', marginBottom: spacing.sm },
  sectionRow: { flexDirection: 'row', gap: 10, paddingVertical: 11 },
  sectionRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionRowLabel: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  sectionRowDesc: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  sectionFootnote: { color: colors.textMuted, fontSize: 11, lineHeight: 15, marginTop: spacing.sm },
  themeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgElevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgElevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  menuIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(31,174,116,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  menuLabel: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  menuSub: { color: colors.textMuted, fontSize: 11.5, marginTop: 2 },
  logoutBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl, marginHorizontal: spacing.lg, paddingVertical: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.danger },
  logoutText: { color: colors.danger, fontSize: 14, fontWeight: '700' },
});
