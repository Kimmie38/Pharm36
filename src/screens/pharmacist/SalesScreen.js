import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { spacing, type, radius } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';
import { api } from '../../api/client';
import { apiErrorMessage, confirmAction, showMessage } from '../../utils/ui';

const relativeTime = (date) => {
  if (!date) return '';
  const hours = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 3600000));
  return hours < 1 ? 'just now' : hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
};

export default function SalesScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [tab, setTab] = useState('buy');
  const [offers, setOffers] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [batches, setBatches] = useState([]);
  const [sales, setSales] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [requestOpen, setRequestOpen] = useState(false);
  const [request, setRequest] = useState({ drugName: '', quantity: '', maxUnitPrice: '', category: 'general', note: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [offerResult, ownResult, batchResult, salesResult] = await Promise.all([
        api.get('marketplace/listings', { type: 'offer', page: 1, limit: 100 }),
        api.get('marketplace/listings', { type: 'offer', mine: true, status: 'open', page: 1, limit: 100 }),
        api.get('batches', { state: 'active', page: 1, limit: 100 }),
        api.get('sales', { days: 30 }),
      ]);
      setOffers(offerResult.items || []);
      setMyListings(ownResult.items || []);
      setBatches(batchResult.items || []);
      setSales(salesResult);
    } catch (e) { setError(apiErrorMessage(e)); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const buy = async (listing) => {
    if (!(await confirmAction('Buy this batch?', `This transfers ${listing.quantity} units of ${listing.drugName} into your inventory and records a marketplace order. Payment is not processed in-app.`))) return;
    setBusyId(listing.id);
    try {
      await api.post(`marketplace/listings/${listing.id}/buy`, {});
      showMessage('Batch purchased', 'The stock was transferred into your inventory. Arrange payment with the seller separately.');
      await load();
    } catch (e) { showMessage('Could not buy batch', apiErrorMessage(e)); }
    finally { setBusyId(''); }
  };

  const createListing = async (batch) => {
    if (!(await confirmAction('List this batch?', `Create an offer for all ${batch.quantity} units of ${batch.drugName} at ₦${batch.unitPrice} each?`))) return;
    setBusyId(batch.id);
    try {
      await api.post('marketplace/listings', { batchId: batch.id });
      showMessage('Batch listed', 'Your inventory batch is now visible in the marketplace.');
      await load();
    } catch (e) { showMessage('Could not create listing', apiErrorMessage(e)); }
    finally { setBusyId(''); }
  };

  const cancelListing = async (listing) => {
    if (!(await confirmAction('Cancel this listing?', `${listing.drugName} will be removed from the marketplace.`))) return;
    setBusyId(listing.id);
    try {
      await api.delete(`marketplace/listings/${listing.id}`);
      await load();
    } catch (e) { showMessage('Could not cancel listing', apiErrorMessage(e)); }
    finally { setBusyId(''); }
  };

  const postRequest = async () => {
    if (!request.drugName.trim() || !request.quantity.trim() || !request.maxUnitPrice.trim()) return showMessage('Missing details', 'Enter a drug name, quantity, and maximum unit price.');
    setBusyId('request');
    try {
      await api.post('marketplace/requests', { ...request, drugName: request.drugName.trim(), quantity: request.quantity, maxUnitPrice: request.maxUnitPrice });
      setRequest({ drugName: '', quantity: '', maxUnitPrice: '', category: 'general', note: '' });
      setRequestOpen(false);
      showMessage('Request posted', 'Your request is now visible to other professionals.');
      await load();
    } catch (e) { showMessage('Could not post request', apiErrorMessage(e)); }
    finally { setBusyId(''); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}><Text style={styles.title}>Sales & Marketplace</Text><Text style={styles.subtitle}>Trade batches with other professionals</Text></View>
      <Card style={styles.summary}><View><Text style={styles.summaryLabel}>30-day sales</Text><Text style={styles.summaryValue}>₦{Number(sales?.totalRevenue || 0).toLocaleString()}</Text></View><View style={styles.summaryDivider} /><View><Text style={styles.summaryLabel}>Units sold</Text><Text style={styles.summaryValue}>{sales?.totalUnits ?? '—'}</Text></View></Card>
      <View style={styles.tabRow}>
        <Pressable style={[styles.tab, tab === 'buy' && styles.tabActive]} onPress={() => setTab('buy')}><Text style={[styles.tabText, tab === 'buy' && styles.tabTextActive]}>Buy from others</Text></Pressable>
        <Pressable style={[styles.tab, tab === 'sell' && styles.tabActive]} onPress={() => setTab('sell')}><Text style={[styles.tabText, tab === 'sell' && styles.tabTextActive]}>My listings</Text></Pressable>
      </View>
      {!!error && <Pressable onPress={load} style={styles.errorBox}><Text style={styles.errorText}>{error} · Tap to retry</Text></Pressable>}

      {tab === 'buy' ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 100 }}>
          {offers.map((listing) => <Card key={listing.id} style={styles.listingCard}>
            <View style={styles.listingTop}><Text style={styles.drugName}>{listing.drugName}</Text><Text style={styles.postedAgo}>{relativeTime(listing.createdAt)}</Text></View>
            <Text style={styles.seller}>{listing.seller?.name || 'Professional'} · {listing.seller?.location || listing.seller?.state || 'Pharm36 member'}</Text>
            <View style={styles.listingBottom}><Text style={styles.priceQty}>Qty {listing.quantity} · ₦{listing.unitPrice}/unit</Text><Pressable disabled={busyId === listing.id} style={styles.buyBtn} onPress={() => buy(listing)}><Text style={styles.buyBtnText}>{busyId === listing.id ? 'Buying…' : 'Buy batch'}</Text></Pressable></View>
          </Card>)}
          {!loading && offers.length === 0 && <Text style={styles.emptyText}>No active offers right now.</Text>}
          <Text style={styles.paymentNote}>The API transfers inventory and records orders; it does not collect payment or arrange payouts.</Text>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 110 }}>
          <Text style={styles.sectionNote}>Open offers</Text>
          {myListings.map((listing) => <Card key={listing.id} style={styles.myBatchCard}>
            <View style={{ flex: 1 }}><Text style={styles.drugName}>{listing.drugName}</Text><Text style={styles.postedAgo}>Qty {listing.quantity} · ₦{listing.unitPrice}/unit</Text></View>
            <Pressable style={styles.cancelBtn} disabled={busyId === listing.id} onPress={() => cancelListing(listing)}><Text style={styles.cancelText}>Cancel</Text></Pressable>
          </Card>)}
          {!loading && myListings.length === 0 && <Text style={styles.emptyText}>You have no open offers.</Text>}
          <Text style={[styles.sectionNote, { marginTop: spacing.lg }]}>Active inventory to list</Text>
          {batches.map((batch) => <Card key={batch.id} style={styles.myBatchCard}>
            <View style={{ flex: 1 }}><Text style={styles.drugName}>{batch.drugName}</Text><Text style={styles.postedAgo}>Qty {batch.quantity} · ₦{batch.unitPrice}/unit in stock</Text></View>
            <Pressable style={styles.listBtn} disabled={busyId === batch.id} onPress={() => createListing(batch)}><Ionicons name="megaphone-outline" size={15} color={colors.greenLight} /><Text style={styles.listBtnText}>{busyId === batch.id ? '...' : 'List'}</Text></Pressable>
          </Card>)}
          {!loading && batches.length === 0 && <Text style={styles.emptyText}>Add inventory before creating an offer.</Text>}
        </ScrollView>
      )}

      <View style={styles.fabWrap}><Button label={tab === 'buy' ? 'Post a request' : 'Refresh listings'} onPress={() => tab === 'buy' ? setRequestOpen(true) : load()} loading={loading && tab === 'sell'} /></View>
      <Modal transparent visible={requestOpen} animationType="fade" onRequestClose={() => setRequestOpen(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <Pressable onPress={() => setRequestOpen(false)} style={styles.modalClose}><Ionicons name="close" size={22} color={colors.textPrimary} /></Pressable>
          <Text style={styles.modalTitle}>Post a drug request</Text>
          <Input label="Drug name" placeholder="e.g. Amoxicillin 500mg" value={request.drugName} onChangeText={(value) => setRequest((r) => ({ ...r, drugName: value }))} />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}><View style={{ flex: 1 }}><Input label="Quantity" placeholder="Units" value={request.quantity} onChangeText={(value) => setRequest((r) => ({ ...r, quantity: value }))} keyboardType="numeric" /></View><View style={{ flex: 1 }}><Input label="Max price per unit (₦)" placeholder="0" value={request.maxUnitPrice} onChangeText={(value) => setRequest((r) => ({ ...r, maxUnitPrice: value }))} keyboardType="numeric" /></View></View>
          <Input label="Note (optional)" placeholder="Add details for sellers" value={request.note} onChangeText={(value) => setRequest((r) => ({ ...r, note: value }))} />
          <Button label="Post request" onPress={postRequest} loading={busyId === 'request'} />
        </View></View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.sm }, title: { color: colors.textPrimary, ...type.h1 }, subtitle: { color: colors.textSecondary, ...type.small, marginTop: 4 },
  summary: { marginHorizontal: spacing.lg, marginBottom: spacing.md, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }, summaryLabel: { color: colors.textMuted, fontSize: 11 }, summaryValue: { color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginTop: 4 }, summaryDivider: { height: 36, width: 1, backgroundColor: colors.border },
  tabRow: { flexDirection: 'row', marginHorizontal: spacing.lg, backgroundColor: colors.bgElevated2, borderRadius: radius.md, padding: 4, marginBottom: spacing.md, marginTop: spacing.sm }, tab: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, alignItems: 'center' }, tabActive: { backgroundColor: colors.green }, tabText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' }, tabTextActive: { color: '#06110D' },
  listingCard: { marginBottom: spacing.sm }, listingTop: { flexDirection: 'row', justifyContent: 'space-between' }, drugName: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' }, postedAgo: { color: colors.textMuted, fontSize: 11 }, seller: { color: colors.textSecondary, fontSize: 12.5, marginTop: 3 }, listingBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm }, priceQty: { color: colors.textSecondary, fontSize: 12.5, fontWeight: '600' }, buyBtn: { backgroundColor: colors.green, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill }, buyBtnText: { color: '#06110D', fontSize: 12.5, fontWeight: '700' }, sectionNote: { color: colors.textMuted, fontSize: 12.5, marginBottom: spacing.md, lineHeight: 17 }, myBatchCard: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }, listBtn: { flexDirection: 'row', gap: 5, alignItems: 'center', borderWidth: 1, borderColor: colors.green, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill }, listBtnText: { color: colors.greenLight, fontSize: 12, fontWeight: '700' }, cancelBtn: { borderWidth: 1, borderColor: colors.danger, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill }, cancelText: { color: colors.danger, fontSize: 12, fontWeight: '700' }, fabWrap: { position: 'absolute', bottom: 20, left: spacing.lg, right: spacing.lg },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginVertical: spacing.lg, fontSize: 13 }, paymentNote: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: spacing.md, textAlign: 'center' }, errorBox: { marginHorizontal: spacing.lg, padding: spacing.md, backgroundColor: colors.dangerGlow, borderRadius: radius.md }, errorText: { color: colors.danger, fontSize: 12 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', padding: spacing.lg }, modalCard: { backgroundColor: colors.bgElevated, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: spacing.lg }, modalClose: { alignSelf: 'flex-end', padding: 4 }, modalTitle: { color: colors.textPrimary, ...type.h2, marginBottom: spacing.md },
});
