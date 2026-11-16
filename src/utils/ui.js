import { Alert, Platform } from 'react-native';

export function showMessage(title, message) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert([title, message].filter(Boolean).join('\n\n'));
    return;
  }
  Alert.alert(title, message);
}

export function confirmAction(title, message) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Confirm', style: 'destructive', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}

export function apiErrorMessage(error) {
  const details = error?.details;
  if (Array.isArray(details) && details.length) {
    return `${error.message}\n${details.map((item) => `${item.field}: ${item.message}`).join('\n')}`;
  }
  return error?.message || 'Something went wrong. Please try again.';
}
