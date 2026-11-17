import React from 'react';
import { useTranslation } from 'react-i18next';
import CodeCapture from '../../components/CodeCapture';

export default function ScanDrugScreen({ navigation }) {
  const { t } = useTranslation();
  return (
    <CodeCapture
      title={t('scan.drugTitle')}
      buttonLabel={t('scan.checkBatch')}
      onClose={() => navigation.goBack()}
      onCode={(batchCode) => navigation.replace('DrugInfo', { batchCode })}
    />
  );
}
