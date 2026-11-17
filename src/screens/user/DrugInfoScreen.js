import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Modal, TextInput, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { spacing, type, radius } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';
import { api } from '../../api/client';
import { apiErrorMessage, showMessage } from '../../utils/ui';
import { useTranslation } from 'react-i18next';

const REASONS = [
  ['suspected_fake', 'Suspected fake'], ['expired', 'Expired'], ['damaged_seal', 'Damaged seal'],
  ['wrong_info', 'Wrong information'], ['unregistered_seller', 'Unregistered seller'], ['other', 'Other'],
];

const FDA_DISCLAIMER = 'AI-selected medicine information is shown only as excerpts verified against the official U.S. FDA label. The leaflet in your pack (which may differ for NAFDAC-registered products) always takes priority. This is not medical advice; ask a pharmacist or doctor before using any medicine.';
const LABEL_SECTIONS = [
  ['indications', 'Official label: uses'], ['dosage', 'Official label: dosage'], ['pediatric', 'Official label: children'],
  ['adverseReactions', 'Official label: side effects'], ['warnings', 'Official label: warnings'], ['contraindications', 'Official label: do not use'],
];

export default function DrugInfoScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { batchCode: rawBatchCode, name: rawName } = route.params || {};
  const batchCode = String(rawBatchCode || '').trim();
  const requestedName = String(rawName || '').trim();
  const [record, setRecord] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lookupError, setLookupError] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('other');
  const [description, setDescription] = useState('');
  const [reportBusy, setReportBusy] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [askBusy, setAskBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setRecord(null);
    setInfo(null);
    setLookupError('');
    setAnswer(null);
    setQuestion('');

    if (!batchCode && !requestedName) {
      setLookupError('No batch code or drug name was provided. Go back and search or enter a code.');
      setLoading(false);
      return () => { active = false; };
    }

    const registryRequest = batchCode
      ? api.get('public/drugs/verify', { batchCode }, { auth: false })
      : Promise.resolve(null);
    const infoRequest = api.get('public/drugs/info', batchCode ? { batchCode } : { name: requestedName }, { auth: false });

    Promise.allSettled([registryRequest, infoRequest]).then(([registryResult, infoResult]) => {
      if (!active) return;
      const errors = [];
      if (batchCode && registryResult.status === 'fulfilled') setRecord(registryResult.value);
      else if (batchCode && registryResult.status === 'rejected') errors.push(apiErrorMessage(registryResult.reason));
      if (infoResult.status === 'fulfilled') setInfo(infoResult.value);
      else errors.push(apiErrorMessage(infoResult.reason));
      if (errors.length) setLookupError(errors.join(' '));
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [batchCode, requestedName]);

  const submitReport = async () => {
    const drugName = record?.drug?.name || info?.drug?.name || requestedName || undefined;
    setReportBusy(true);
    try {
      await api.post('public/reports', {
        ...(batchCode ? { batchCode } : {}),
        ...(drugName ? { drugName } : {}),
        reason,
        description: description.trim() || undefined,
      }, { auth: false });
      setReportOpen(false);
      setDescription('');
      showMessage('Report received', 'Thank you. Your report has been sent for review.');
    } catch (e) { showMessage('Could not send report', apiErrorMessage(e)); }
    finally { setReportBusy(false); }
  };

  const askAboutDrug = async () => {
    const cleanQuestion = question.trim();
    if (cleanQuestion.length < 3) {
      showMessage('Add a little more detail', 'Questions must be at least 3 characters.');
      return;
    }
    const target = batchCode ? { batchCode } : { name: info?.drug?.name || requestedName };
    setAskBusy(true);
    setAnswer(null);
    try {
      const result = await api.post('public/drugs/ask', { ...target, question: cleanQuestion }, { auth: false });
      setAnswer(result);
    } catch (e) {
      showMessage('Question unavailable', apiErrorMessage(e));
    } finally { setAskBusy(false); }
  };

  const openSource = async (url) => {
    if (!url || !/^https:\/\//i.test(url)) return;
    try { await Linking.openURL(url); }
    catch { showMessage('Could not open source', 'The label source link is unavailable on this device.'); }
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.greenLight} /><Text style={styles.loadingTitle}>{batchCode ? 'Checking batch and medicine information…' : 'Loading medicine information…'}</Text><Text style={styles.loadingSub}>This may retrieve an official label for the first lookup.</Text></View>;

  const found = Boolean(record?.found);
  const drug = record?.drug || {};
  const status = record?.expiryStatus;
  const expiryLabel = status === 'expired' ? 'Expired' : status === 'expiring_2w' ? 'Expiring within 2 weeks' : status === 'expiring_1m' ? 'Expiring within 1 month' : status === 'ok' ? 'In date' : 'Unknown expiry';
  const safeLabel = status === 'expired' ? 'Expired — do not use' : record?.inconsistentRecords ? 'Inconsistent registry records' : record?.safeToUse ? 'More than 30 days to expiry' : 'Check expiry and packaging';
  const displayName = info?.drug?.name || drug.name || requestedName || 'Medicine information';
  const generalDisclaimer = info?.disclaimers?.general || FDA_DISCLAIMER;
  const labelExcerpts = info?.labelExcerpts || {};
  const sourceUrl = info?.source?.url;
  const doseGroups = [
    ['Adult dosage from label', info?.dosage?.adults?.statements],
    ['Children’s dosage from label', info?.dosage?.children?.statements],
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
      <View style={styles.header}><Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}><Ionicons name="chevron-back" size={22} color={colors.textPrimary} /></Pressable><Text style={styles.headerTitle}>Drug Details</Text><View style={{ width: 34 }} /></View>

      {batchCode ? (
        <>
          <LinearGradient colors={found && !record?.recalled ? [colors.tealDeep, colors.green] : ['#7A1A16', colors.danger]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.verifyBanner}>
            <Ionicons name={found ? 'document-text' : 'warning'} size={30} color="#fff" />
            <Text style={styles.verifyTitle}>{record?.recalled ? t('recall.title') : found ? 'Registered record found' : 'No registered record'}</Text>
            <Text style={styles.verifySub}>{record?.summary || 'The registry could not be checked just now.'}</Text>
            {found && record?.flags?.includes('no_nafdac_number') ? <Text style={[styles.verifySub, { marginTop: 8 }]}>{t('recall.noNafdac')}</Text> : null}
          </LinearGradient>
          {found && <Card style={styles.card}>
            <View style={styles.drugTop}><View style={{ flex: 1 }}><Text style={styles.drugName}>{drug.name || 'Drug record'}</Text><Text style={styles.drugStrength}>{[drug.strength, drug.form].filter(Boolean).join(' · ')}</Text></View><Badge label={expiryLabel} tone={status === 'expired' || status === 'expiring_2w' ? 'danger' : status === 'expiring_1m' ? 'warning' : 'success'} /></View>
            <View style={styles.divider} />
            <DetailRow icon="business-outline" label="Manufacturer" value={drug.manufacturer || 'Not recorded'} />
            <DetailRow icon="calendar-outline" label="Manufactured" value={drug.manufactureDate || 'Not recorded'} />
            <DetailRow icon="alert-circle-outline" label="Expires" value={`${drug.expiryDate || 'Unknown'}${Number.isFinite(drug.daysToExpiry) ? ` (${drug.daysToExpiry}d left)` : ''}`} />
            <DetailRow icon="barcode-outline" label="Batch code" value={drug.batchCode || batchCode} />
            <DetailRow icon="storefront-outline" label="Registered by" value={record?.registeredPharmacy || 'Not available'} last />
          </Card>}
          {!found && <Card style={styles.card}><DetailRow icon="barcode-outline" label="Batch code" value={record?.batchCode || batchCode} last /></Card>}
        </>
      ) : (
        <View style={styles.nameBanner}><Ionicons name="medical-outline" size={25} color={colors.greenLight} /><Text style={styles.nameBannerTitle}>{displayName}</Text><Text style={styles.nameBannerSub}>Information from an official medicine label</Text></View>
      )}

      {!!lookupError && <View style={styles.errorCard}><Ionicons name="cloud-offline-outline" size={18} color={colors.danger} /><Text style={styles.errorText}>{lookupError}</Text></View>}

      {info?.available ? (
        <>
          <Card style={styles.card}>
            <View style={styles.sectionTitleRow}><Text style={styles.sectionTitle}>Medicine information</Text>{info.reviewed ? <Badge label="Pharmacist reviewed" tone="success" /> : null}</View>
            {info.drug?.ingredients?.length ? <Text style={styles.mutedLine}>Active ingredient{info.drug.ingredients.length > 1 ? 's' : ''}: {info.drug.ingredients.join(', ')}</Text> : null}
            {info.drug?.brandNames?.length ? <Text style={styles.mutedLine}>Label brand names: {info.drug.brandNames.join(', ')}</Text> : null}
            {!!info.summary && <Text style={styles.summary}>{info.summary}</Text>}
            {info.humanCorrectionPending && <View style={styles.caution}><Ionicons name="time-outline" size={17} color={colors.warning} /><Text style={styles.cautionText}>An administrator correction is pending pharmacist review and is not applied. The official-label information remains in effect.</Text></View>}
            {info.generatedBy === 'ai-label-excerpts' && <View style={styles.caution}><Ionicons name="information-circle-outline" size={17} color={colors.warning} /><Text style={styles.cautionText}>AI-selected content is shown only as verbatim excerpts verified against the relevant official-label section. Unverified paraphrases are omitted; read the full label below.</Text></View>}
            {info.generatedBy === 'curated' && info.reviewed && <View style={styles.caution}><Ionicons name="checkmark-circle-outline" size={17} color={colors.greenLight} /><Text style={styles.cautionText}>A pharmacist-reviewed correction is applied. Compare it with the full official label and the leaflet in your pack.</Text></View>}
            {!info.structured && <View style={styles.caution}><Ionicons name="information-circle-outline" size={17} color={colors.warning} /><Text style={styles.cautionText}>No AI-selected label excerpts are available. The official label excerpts are shown below.</Text></View>}
            <BulletSection title="What it is used for" items={info.uses} />
            {doseGroups.map(([title, statements]) => <DoseSection key={title} title={title} statements={statements} />)}
            {info.dosage?.children?.notice ? <View style={styles.caution}><Ionicons name="warning-outline" size={17} color={colors.warning} /><Text style={styles.cautionText}>{info.dosage.children.notice}</Text></View> : null}
            <BulletSection title="Common side effects" items={info.sideEffects?.common} />
            <BulletSection title="Serious side effects" items={info.sideEffects?.serious} warning />
            <BulletSection title="When to seek help" items={info.whenToSeekHelp} warning />
            <BulletSection title="Who should not use it" items={info.doNotUseIf} />
            <BulletSection title="Warnings" items={info.warnings} />
            <BulletSection title="Interactions" items={info.interactions} />
            <BulletSection title="Pregnancy and breastfeeding" items={info.pregnancyBreastfeeding} />
            <BulletSection title="Overdose" items={info.overdose} warning />
            <BulletSection title="Storage" items={info.storage} />
          </Card>

          <Card style={styles.card}>
            <View style={styles.sectionTitleRow}><Ionicons name="document-text-outline" size={18} color={colors.greenLight} /><Text style={[styles.sectionTitle, { flex: 1 }]}>Official label source</Text></View>
            <Text style={styles.mutedLine}>{info.source?.name || 'U.S. FDA drug label'}</Text>
            {info.source?.effectiveDate ? <Text style={styles.mutedLine}>Label date: {info.source.effectiveDate}</Text> : null}
            {info.source?.labeller ? <Text style={styles.mutedLine}>Manufacturer: {info.source.labeller}</Text> : null}
            {sourceUrl ? <Pressable onPress={() => openSource(sourceUrl)} style={styles.sourceLink}><Text style={styles.sourceText}>Open source label</Text><Ionicons name="open-outline" size={15} color={colors.greenLight} /></Pressable> : null}
            {LABEL_SECTIONS.filter(([key]) => Boolean(labelExcerpts[key])).map(([key, title]) => <View key={key} style={styles.excerptBlock}><Text style={styles.excerptTitle}>{title}</Text><Text style={styles.excerptText}>{labelExcerpts[key]}</Text></View>)}
          </Card>

          <Card style={styles.card}>
            <View style={styles.sectionTitleRow}><Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.greenLight} /><Text style={[styles.sectionTitle, { flex: 1 }]}>Ask about this medicine</Text></View>
            <Text style={styles.mutedLine}>Answers are limited to the stored label. Limit: 6 questions per minute and 40 per day.</Text>
            <TextInput value={question} onChangeText={setQuestion} placeholder="e.g. Can I take it with food?" placeholderTextColor={colors.textMuted} multiline maxLength={300} style={styles.questionInput} />
            <Button label="Ask from the label" onPress={askAboutDrug} loading={askBusy} />
            {answer?.available ? <View style={[styles.answerBox, answer.emergency && styles.emergencyBox]}>
              <Text style={styles.answerTitle}>{answer.emergency ? 'Emergency guidance' : answer.grounded === false ? 'Not confirmed by the label' : 'Official label excerpt'}</Text>
              <Text style={styles.answerText}>{answer.answer}</Text>
              {answer.source?.url ? <Pressable onPress={() => openSource(answer.source.url)}><Text style={styles.answerSource}>Source: {answer.source.name || 'official drug label'}</Text></Pressable> : null}
              {!!answer.disclaimers?.emergency && answer.emergency ? <Text style={styles.mutedLine}>{answer.disclaimers.emergency}</Text> : null}
            </View> : null}
          </Card>
        </>
      ) : (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Label information unavailable</Text>
          <Text style={styles.mutedLine}>{info?.message || 'The official label service could not find information for this medicine. Try its generic name or ask a pharmacist.'}</Text>
          {info?.reason === 'VETERINARY_NOT_SUPPORTED' ? <Text style={styles.mutedLine}>Veterinary products are not covered by this information service yet.</Text> : null}
        </Card>
      )}

      <View style={styles.disclaimer}><Ionicons name="information-circle-outline" size={18} color={colors.info} /><Text style={styles.disclaimerText}>{generalDisclaimer}</Text></View>
      {batchCode && <View style={styles.registryNote}><Ionicons name="shield-checkmark-outline" size={17} color={colors.info} /><Text style={styles.registryNoteText}>{safeLabel}. Registry matching cannot prove a pack is authentic; inspect its seal and consult a pharmacist if anything looks wrong.</Text></View>}
      <Pressable style={styles.reportBtn} onPress={() => setReportOpen(true)}><Ionicons name="flag-outline" size={16} color={colors.danger} /><Text style={styles.reportText}>Report a problem with this drug</Text></Pressable>

      <Modal transparent visible={reportOpen} animationType="fade" onRequestClose={() => setReportOpen(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <Pressable onPress={() => setReportOpen(false)} style={styles.modalClose}><Ionicons name="close" size={22} color={colors.textPrimary} /></Pressable>
          <Text style={styles.modalTitle}>Report a problem</Text>
          <Text style={styles.reasonLabel}>Reason</Text>
          <View style={styles.reasonWrap}>{REASONS.map(([value, label]) => <Pressable key={value} onPress={() => setReason(value)} style={[styles.reasonChip, reason === value && styles.reasonChipActive]}><Text style={[styles.reasonText, reason === value && styles.reasonTextActive]}>{label}</Text></Pressable>)}</View>
          <Text style={styles.reasonLabel}>Details (optional)</Text>
          <TextInput value={description} onChangeText={setDescription} placeholder="Describe what you noticed" placeholderTextColor={colors.textMuted} multiline style={styles.textArea} />
          <Button label="Send report" onPress={submitReport} loading={reportBusy} />
        </View></View>
      </Modal>
    </ScrollView>
  );
}

function DetailRow({ icon, label, value, last }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return <View style={[styles.detailRow, !last && styles.detailBorder]}><Ionicons name={icon} size={16} color={colors.textMuted} style={{ marginRight: 10 }} /><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue} numberOfLines={3}>{String(value ?? '')}</Text></View>;
}

function BulletSection({ title, items, warning = false }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  if (!Array.isArray(items) || items.length === 0) return null;
  return <View style={styles.dataSection}><Text style={styles.dataTitle}>{title}</Text>{items.map((item, index) => <View key={`${title}-${index}`} style={styles.bulletRow}><Text style={[styles.bullet, warning && { color: colors.warning }]}>•</Text><Text style={styles.dataText}>{String(item)}</Text></View>)}</View>;
}

function DoseSection({ title, statements }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  if (!Array.isArray(statements) || statements.length === 0) return null;
  return <View style={styles.dataSection}><Text style={styles.dataTitle}>{title}</Text>{statements.map((statement, index) => {
    const text = typeof statement === 'string' ? statement : statement?.text;
    const quote = typeof statement === 'object' ? statement?.quote : null;
    if (!text) return null;
    const displayText = String(text).replace(/\s+/g, ' ').trim();
    const displayQuote = quote && String(quote).replace(/\s+/g, ' ').trim() !== displayText ? quote : null;
    return <View key={`${title}-${index}`} style={styles.doseBox}><Text style={styles.dataText}>{displayText}</Text>{displayQuote ? <Text style={styles.quoteText}>From the label: “{displayQuote}”</Text> : null}</View>;
  })}</View>;
}

const makeStyles = (colors) => StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl }, loadingTitle: { color: colors.textPrimary, ...type.h3, marginTop: spacing.lg, textAlign: 'center' }, loadingSub: { color: colors.textMuted, ...type.small, marginTop: 8, textAlign: 'center', lineHeight: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.sm }, backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.bgElevated2, alignItems: 'center', justifyContent: 'center' }, headerTitle: { color: colors.textPrimary, ...type.h3 },
  verifyBanner: { alignItems: 'center', marginHorizontal: spacing.lg, padding: spacing.xl, borderRadius: radius.lg, marginTop: spacing.sm }, verifyTitle: { color: '#fff', ...type.h2, marginTop: spacing.sm, textAlign: 'center' }, verifySub: { color: 'rgba(255,255,255,0.9)', ...type.small, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  nameBanner: { alignItems: 'center', marginHorizontal: spacing.lg, padding: spacing.lg, borderRadius: radius.lg, marginTop: spacing.sm, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border }, nameBannerTitle: { color: colors.textPrimary, ...type.h2, marginTop: spacing.sm, textAlign: 'center' }, nameBannerSub: { color: colors.textSecondary, ...type.small, marginTop: 4 },
  card: { marginHorizontal: spacing.lg, marginTop: spacing.lg }, drugTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }, drugName: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' }, drugStrength: { color: colors.textSecondary, fontSize: 13, marginTop: 3 }, divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 11 }, detailBorder: { borderBottomWidth: 1, borderBottomColor: colors.border }, detailLabel: { color: colors.textMuted, fontSize: 12, width: 100 }, detailValue: { color: colors.textPrimary, fontSize: 12.5, flex: 1, textAlign: 'right', fontWeight: '600' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm }, sectionTitle: { color: colors.textPrimary, ...type.h3 }, mutedLine: { color: colors.textSecondary, ...type.small, lineHeight: 18, marginBottom: 5 }, summary: { color: colors.textPrimary, ...type.body, lineHeight: 21, marginTop: spacing.sm },
  dataSection: { marginTop: spacing.md }, dataTitle: { color: colors.greenLight, fontSize: 13, fontWeight: '800', marginBottom: 6 }, bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 5 }, bullet: { color: colors.greenLight, fontSize: 16, lineHeight: 19 }, dataText: { color: colors.textPrimary, fontSize: 13, lineHeight: 19, flex: 1 }, doseBox: { backgroundColor: colors.bgElevated2, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.xs }, quoteText: { color: colors.textMuted, fontSize: 11.5, lineHeight: 17, marginTop: 5, fontStyle: 'italic' },
  caution: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: 'rgba(232,169,61,0.12)', padding: spacing.sm, borderRadius: radius.sm, marginTop: spacing.md }, cautionText: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, flex: 1 },
  sourceLink: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingVertical: 8 }, sourceText: { color: colors.greenLight, fontSize: 13, fontWeight: '700' }, excerptBlock: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, marginTop: spacing.sm }, excerptTitle: { color: colors.textPrimary, fontSize: 12.5, fontWeight: '700', marginBottom: 4 }, excerptText: { color: colors.textSecondary, fontSize: 11.5, lineHeight: 17 },
  questionInput: { minHeight: 70, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgElevated2, color: colors.textPrimary, borderRadius: radius.md, padding: spacing.md, textAlignVertical: 'top', marginVertical: spacing.sm }, answerBox: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: 'rgba(31,174,116,0.1)', borderWidth: 1, borderColor: colors.border }, emergencyBox: { backgroundColor: 'rgba(214,71,66,0.12)', borderColor: colors.danger }, answerTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '800', marginBottom: 5 }, answerText: { color: colors.textPrimary, fontSize: 13, lineHeight: 19 }, answerSource: { color: colors.greenLight, fontSize: 11.5, marginTop: 8 },
  disclaimer: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', backgroundColor: 'rgba(61,169,232,0.1)', marginHorizontal: spacing.lg, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.lg }, disclaimerText: { flex: 1, color: colors.textSecondary, fontSize: 12, lineHeight: 18 }, registryNote: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: 'rgba(61,169,232,0.1)', marginHorizontal: spacing.lg, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.sm }, registryNoteText: { flex: 1, color: colors.textSecondary, fontSize: 12, lineHeight: 18 }, errorCard: { flexDirection: 'row', gap: 8, marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: 'rgba(214,71,66,0.1)' }, errorText: { color: colors.danger, flex: 1, fontSize: 12, lineHeight: 17 },
  reportBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg, marginHorizontal: spacing.lg, paddingVertical: 13, borderRadius: radius.md, borderWidth: 1, borderColor: colors.danger }, reportText: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', padding: spacing.lg }, modalCard: { backgroundColor: colors.bgElevated, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: spacing.lg }, modalClose: { alignSelf: 'flex-end', padding: 4 }, modalTitle: { color: colors.textPrimary, ...type.h2, marginBottom: spacing.md }, reasonLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: spacing.sm }, reasonWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md }, reasonChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 10 }, reasonChipActive: { borderColor: colors.green, backgroundColor: 'rgba(31,174,116,0.12)' }, reasonText: { color: colors.textSecondary, fontSize: 11.5 }, reasonTextActive: { color: colors.greenLight, fontWeight: '700' }, textArea: { minHeight: 90, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgElevated2, color: colors.textPrimary, borderRadius: radius.md, padding: spacing.md, textAlignVertical: 'top', marginBottom: spacing.md },
});
