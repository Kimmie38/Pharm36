import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { spacing, type, radius } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../auth/AuthContext';
import { api, setAuthToken } from '../../api/client';
import { apiErrorMessage, showMessage } from '../../utils/ui';

const REMINDERS = ['1 year', '6 months', '3 months', '1 month', '2 weeks', '1 week'];

export default function ProfileScreen({ navigation }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout, refreshUser, setUser } = useAuth();
  const styles = makeStyles(colors);
  const rowStyles = makeRowStyles(colors);
  const [modal, setModal] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '', storeName: user?.storeName || '', phone: user?.phone || '', email: user?.email || '', location: user?.location || '', licenseNo: user?.licenseNo || '',
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const profession = user?.profession || {};
  const initials = (user?.name || 'Pharm36').split(' ').map((name) => name[0]).join('').slice(0, 2).toUpperCase();

  const saveProfile = async () => {
    setLoading(true);
    try {
      const result = await api.patch('me', Object.fromEntries(Object.entries(profileForm).map(([key, value]) => [key, value.trim() || undefined])));
      setUser(result.user);
      setModal('');
      showMessage('Profile updated', 'Your account details have been saved.');
    } catch (error) { showMessage('Could not update profile', apiErrorMessage(error)); }
    finally { setLoading(false); }
  };

  const saveReminder = async (value) => {
    setLoading(true);
    try {
      await api.patch('me', { settings: { defaultReminder: value } });
      await refreshUser();
      setModal('');
      showMessage('Reminder updated', `New batches will use the ${value} early reminder.`);
    } catch (error) { showMessage('Could not update reminder', apiErrorMessage(error)); }
    finally { setLoading(false); }
  };

  const changePassword = async () => {
    setLoading(true);
    try {
      const result = await api.post('me/change-password', passwordForm);
      if (result.token) await setAuthToken(result.token);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setModal('');
      showMessage('Password changed', 'Your password has been updated.');
    } catch (error) { showMessage('Could not change password', apiErrorMessage(error)); }
    finally { setLoading(false); }
  };

  const doLogout = async () => {
    await logout();
    navigation.getParent('RootStack')?.reset({ index: 0, routes: [{ name: 'RoleSelect' }] });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.header}><Text style={styles.title}>Profile</Text></View>
      <View style={styles.profileTop}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        <Text style={styles.name}>{user?.name || 'Professional account'}</Text>
        <Text style={styles.store}>{user?.storeName || user?.location || ''}</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}><Badge label={profession.label || user?.professionalType || 'Professional'} tone="info" /><Badge label={user?.pcnStatus === 'active' ? `${profession.councilShort || 'Council'} Active` : 'Access Revoked'} tone={user?.pcnStatus === 'active' ? 'success' : 'danger'} /></View>
      </View>

      <Card style={{ marginHorizontal: spacing.lg, marginTop: spacing.lg }}>
        <InfoRow rowStyles={rowStyles} icon="call-outline" label="Phone" value={user?.phone || '—'} />
        <InfoRow rowStyles={rowStyles} icon="mail-outline" label="Email" value={user?.email || '—'} />
        <InfoRow rowStyles={rowStyles} icon="location-outline" label="Location" value={user?.location || '—'} />
        <InfoRow rowStyles={rowStyles} icon="map-outline" label="State" value={user?.state || '—'} />
        <InfoRow rowStyles={rowStyles} icon="ribbon-outline" label="License No." value={user?.licenseNo || '—'} last />
      </Card>
      <Pressable style={styles.editButton} onPress={() => { setProfileForm({ name: user?.name || '', storeName: user?.storeName || '', phone: user?.phone || '', email: user?.email || '', location: user?.location || '', licenseNo: user?.licenseNo || '' }); setModal('profile'); }}><Ionicons name="create-outline" size={17} color={colors.greenLight} /><Text style={styles.editText}>Edit profile</Text></Pressable>

      <View style={{ marginTop: spacing.lg, marginHorizontal: spacing.lg }}>
        <Text style={styles.sectionLabel}>Verification & sections · {profession.councilShort || 'Council'}</Text>
        <Card>{(user?.sectionDetails || []).map((section, index) => (
          <View key={section.key} style={[styles.sectionRow, index !== user.sectionDetails.length - 1 && styles.sectionRowBorder]}>
            <Ionicons name={section.verified ? 'checkmark-circle' : section.claimed ? 'time-outline' : 'lock-closed'} size={18} color={section.verified ? colors.success : section.claimed ? colors.warning : colors.textMuted} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}><Text style={styles.sectionRowLabel}>{section.label}</Text><Text style={styles.sectionRowDesc}>{section.verified ? 'Council confirmed' : section.claimed ? 'Awaiting council confirmation' : 'Not registered'}</Text></View>
          </View>
        ))}</Card>
        <Text style={styles.sectionFootnote}>Restricted drug categories stay locked until the relevant section is confirmed by {profession.council || 'your council'}.</Text>
      </View>

      <View style={{ marginTop: spacing.lg, marginHorizontal: spacing.lg }}>
        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.themeRow}><View style={styles.menuIcon}><Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={colors.greenLight} /></View><View style={{ flex: 1 }}><Text style={styles.menuLabel}>Dark mode</Text><Text style={styles.menuSub}>{isDark ? 'On — easier on the eyes at night' : 'Off — bright, high-contrast look'}</Text></View><Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: colors.border, true: colors.green }} thumbColor="#fff" /></View>
      </View>

      <View style={{ marginTop: spacing.lg, marginHorizontal: spacing.lg, gap: spacing.sm }}>
        <Text style={styles.sectionLabel}>Account</Text>
        <Pressable style={styles.menuRow} onPress={() => setModal('reminder')}><View style={styles.menuIcon}><Ionicons name="notifications-outline" size={18} color={colors.greenLight} /></View><Text style={styles.menuLabel}>Reminder settings</Text><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></Pressable>
        <Pressable style={styles.menuRow} onPress={() => setModal('password')}><View style={styles.menuIcon}><Ionicons name="key-outline" size={18} color={colors.greenLight} /></View><Text style={styles.menuLabel}>Change password</Text><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></Pressable>
        <Pressable style={styles.menuRow} onPress={() => showMessage('Payments & payouts', 'Marketplace transfers are not processed by this backend yet.')}><View style={styles.menuIcon}><Ionicons name="card-outline" size={18} color={colors.greenLight} /></View><Text style={styles.menuLabel}>Payments & payouts</Text><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></Pressable>
        <Pressable style={styles.menuRow} onPress={() => showMessage('Help & support', 'Contact your Pharm36 administrator for account or regulatory assistance.')}><View style={styles.menuIcon}><Ionicons name="help-circle-outline" size={18} color={colors.greenLight} /></View><Text style={styles.menuLabel}>Help & support</Text><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></Pressable>
      </View>

      <Pressable style={styles.logoutBtn} onPress={doLogout}><Ionicons name="log-out-outline" size={18} color={colors.danger} /><Text style={styles.logoutText}>Log out</Text></Pressable>

      <Modal transparent visible={!!modal} animationType="fade" onRequestClose={() => setModal('')}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Pressable onPress={() => setModal('')} style={styles.modalClose}><Ionicons name="close" size={22} color={colors.textPrimary} /></Pressable>
            {modal === 'profile' && <>
              <Text style={styles.modalTitle}>Edit profile</Text>
              <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 500 }}>
                <Input label="Full name" value={profileForm.name} onChangeText={(value) => setProfileForm((f) => ({ ...f, name: value }))} />
                <Input label="Store / practice name" value={profileForm.storeName} onChangeText={(value) => setProfileForm((f) => ({ ...f, storeName: value }))} />
                <Input label="Phone" value={profileForm.phone} onChangeText={(value) => setProfileForm((f) => ({ ...f, phone: value }))} keyboardType="phone-pad" />
                <Input label="Email" value={profileForm.email} onChangeText={(value) => setProfileForm((f) => ({ ...f, email: value }))} autoCapitalize="none" keyboardType="email-address" />
                <Input label="Location" value={profileForm.location} onChangeText={(value) => setProfileForm((f) => ({ ...f, location: value }))} />
                <Input label="License number" value={profileForm.licenseNo} onChangeText={(value) => setProfileForm((f) => ({ ...f, licenseNo: value }))} />
              </ScrollView>
              <Button label="Save profile" onPress={saveProfile} loading={loading} />
            </>}
            {modal === 'reminder' && <><Text style={styles.modalTitle}>Default early reminder</Text>{REMINDERS.map((value) => <Pressable key={value} style={styles.optionRow} onPress={() => saveReminder(value)}><Text style={styles.optionText}>{value}</Text>{user?.settings?.defaultReminder === value && <Ionicons name="checkmark" size={18} color={colors.greenLight} />}</Pressable>)}</>}
            {modal === 'password' && <><Text style={styles.modalTitle}>Change password</Text><Input label="Current password" value={passwordForm.currentPassword} onChangeText={(value) => setPasswordForm((f) => ({ ...f, currentPassword: value }))} secureTextEntry /><Input label="New password (8+ characters)" value={passwordForm.newPassword} onChangeText={(value) => setPasswordForm((f) => ({ ...f, newPassword: value }))} secureTextEntry /><Button label="Update password" onPress={changePassword} loading={loading} /></>}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value, last, rowStyles }) {
  return <View style={[rowStyles.row, !last && rowStyles.border]}><Ionicons name={icon} size={17} color={rowStyles.mutedColor} style={{ marginRight: 10 }} /><Text style={rowStyles.label}>{label}</Text><Text style={rowStyles.value}>{value}</Text></View>;
}

const makeRowStyles = (colors) => ({ ...StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }, border: { borderBottomWidth: 1, borderBottomColor: colors.border }, label: { color: colors.textMuted, fontSize: 12.5, width: 100 }, value: { color: colors.textPrimary, fontSize: 13, flex: 1, textAlign: 'right', fontWeight: '600' } }), mutedColor: colors.textMuted });
const makeStyles = (colors) => StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.sm }, title: { color: colors.textPrimary, ...type.h1 }, profileTop: { alignItems: 'center', marginTop: spacing.sm }, avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.tealDeep, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.green, marginBottom: spacing.sm }, avatarText: { color: '#fff', fontSize: 24, fontWeight: '800' }, name: { color: colors.textPrimary, ...type.h2 }, store: { color: colors.textSecondary, ...type.small, marginTop: 2, marginBottom: spacing.sm }, editButton: { flexDirection: 'row', gap: 6, alignItems: 'center', alignSelf: 'center', padding: spacing.sm }, editText: { color: colors.greenLight, fontSize: 13, fontWeight: '700' },
  sectionLabel: { color: colors.textMuted, ...type.tiny, textTransform: 'uppercase', marginBottom: spacing.sm }, sectionRow: { flexDirection: 'row', gap: 10, paddingVertical: 11 }, sectionRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border }, sectionRowLabel: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' }, sectionRowDesc: { color: colors.textMuted, fontSize: 11, marginTop: 2 }, sectionFootnote: { color: colors.textMuted, fontSize: 11, lineHeight: 15, marginTop: spacing.sm },
  themeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgElevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md }, menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgElevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md }, menuIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(31,174,116,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm }, menuLabel: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '600' }, menuSub: { color: colors.textMuted, fontSize: 11.5, marginTop: 2 },
  logoutBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl, marginHorizontal: spacing.lg, paddingVertical: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.danger }, logoutText: { color: colors.danger, fontSize: 14, fontWeight: '700' }, modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', padding: spacing.lg }, modalCard: { backgroundColor: colors.bgElevated, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: spacing.lg, maxHeight: '90%' }, modalClose: { alignSelf: 'flex-end', padding: 4 }, modalTitle: { color: colors.textPrimary, ...type.h2, marginBottom: spacing.md }, optionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }, optionText: { color: colors.textPrimary, fontSize: 14 },
});
