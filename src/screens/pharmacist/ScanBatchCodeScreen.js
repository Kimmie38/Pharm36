import React from 'react';
import { useTranslation } from 'react-i18next';
import CodeCapture from '../../components/CodeCapture';

export default function ScanBatchCodeScreen({ navigation, route }) {
  const { t } = useTranslation();
  return (
    <CodeCapture
      title={t('scan.batchTitle')}
      buttonLabel={t('scan.useCode')}
      onClose={() => navigation.goBack()}
      onCode={(code) => { route.params?.onScanned?.(code); navigation.goBack(); }}
    />
  );
}
