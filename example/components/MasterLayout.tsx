import { SafeAreaView } from 'react-native-safe-area-context';

export function MasterLayout({ children }: { children: React.ReactNode }) {
  return <SafeAreaView>{children}</SafeAreaView>;
}
