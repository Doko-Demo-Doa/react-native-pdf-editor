import { StyleSheet } from 'react-native';

export const layoutStyles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: 12,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  stack: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    gap: 10,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  diagnosticsContent: {
    gap: 8,
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  pdfView: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 16,
  },
});
