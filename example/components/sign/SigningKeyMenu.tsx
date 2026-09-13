import { Ionicons } from '@expo/vector-icons';
import { Button, Menu } from 'heroui-native';

export type SigningKeyMode = 'software' | 'biometric';

const OPTIONS: Array<{
  value: SigningKeyMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { value: 'software', label: 'Dummy (generated)', icon: 'key-outline' },
  { value: 'biometric', label: 'Biometric', icon: 'finger-print-outline' },
];

export function SigningKeyMenu({
  value,
  onChange,
}: {
  value: SigningKeyMode;
  onChange: (mode: SigningKeyMode) => void;
}) {
  const selected = OPTIONS.find((option) => option.value === value)!;

  return (
    <Menu className="gap-1">
      <Menu.Label>Signing key</Menu.Label>
      <Menu.Trigger asChild>
        <Button variant="outline">
          <Ionicons name={selected.icon} size={16} />
          <Button.Label>{selected.label}</Button.Label>
          <Ionicons name="chevron-down" size={14} />
        </Button>
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Overlay />
        <Menu.Content presentation="popover" width={220}>
          <Menu.Label>Signing key</Menu.Label>
          <Menu.Group
            selectionMode="single"
            selectedKeys={new Set([value])}
            onSelectionChange={(keys) => {
              const [next] = Array.from(keys);
              if (next) onChange(next as SigningKeyMode);
            }}
          >
            {OPTIONS.map((option) => (
              <Menu.Item key={option.value} id={option.value}>
                <Ionicons name={option.icon} size={18} />
                <Menu.ItemTitle>{option.label}</Menu.ItemTitle>
                <Menu.ItemIndicator />
              </Menu.Item>
            ))}
          </Menu.Group>
        </Menu.Content>
      </Menu.Portal>
    </Menu>
  );
}
