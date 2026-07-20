import { Typography } from 'heroui-native';
import { Platform, ScrollView } from 'react-native';

export function LogView({ lines }: { lines: string[] }) {
  return (
    <ScrollView className="max-h-36 rounded-2xl bg-surface-secondary p-2.5">
      {lines.map((line, i) => (
        <Typography
          key={i}
          type="body-xs"
          className="mb-1"
          style={{
            fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
          }}
        >
          {line}
        </Typography>
      ))}
    </ScrollView>
  );
}
