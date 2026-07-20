import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  type ViewStyle,
  type TextStyle,
  View,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

export function Button({
  children,
  className,
  isDisabled,
  onPress,
  style,
  variant = 'primary',
}: {
  children: ReactNode;
  className?: string;
  isDisabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: ButtonVariant;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        buttonStyles[variant],
        className?.includes('flex-1') && styles.flex1,
        style,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      <Text style={[styles.buttonText, buttonTextStyles[variant]]}>
        {children}
      </Text>
    </Pressable>
  );
}

export function Typography({
  children,
  color,
  style,
  type,
}: {
  children: ReactNode;
  color?: 'default' | 'muted';
  className?: string;
  style?: TextStyle;
  type?: 'body-xs' | 'body-sm';
}) {
  return (
    <Text
      style={[
        type === 'body-xs' ? styles.bodyXs : styles.bodySm,
        color === 'muted' && styles.muted,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function TextField({ children }: { children: ReactNode }) {
  return <View style={styles.field}>{children}</View>;
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Input(props: TextInputProps) {
  return (
    <TextInput
      {...props}
      placeholderTextColor="#8a8f98"
      style={[styles.input, props.style]}
    />
  );
}

export function Card({ children }: { children: ReactNode; variant?: string }) {
  return <View style={styles.card}>{children}</View>;
}

export function CardBody({
  children,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <View style={styles.cardBody}>{children}</View>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.cardTitle}>{children}</Text>;
}

export function CardDescription({ children }: { children: ReactNode }) {
  return <Text style={styles.cardDescription}>{children}</Text>;
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.5,
  },
  button: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  bodySm: {
    color: '#18181b',
    fontSize: 14,
    lineHeight: 20,
  },
  bodyXs: {
    color: '#18181b',
    fontSize: 12,
    lineHeight: 17,
  },
  muted: {
    color: '#626a76',
  },
  field: {
    gap: 6,
  },
  label: {
    color: '#2f3540',
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#c8ced8',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#18181b',
    backgroundColor: '#ffffff',
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d7dce5',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  cardBody: {
    gap: 4,
    padding: 16,
  },
  cardTitle: {
    color: '#18181b',
    fontSize: 17,
    fontWeight: '600',
  },
  cardDescription: {
    color: '#626a76',
    fontSize: 14,
    lineHeight: 20,
  },
});

const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: '#2563eb',
  },
  secondary: {
    backgroundColor: '#e8eefb',
  },
  outline: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#aab3c2',
    backgroundColor: '#ffffff',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
});

const buttonTextStyles = StyleSheet.create({
  primary: {
    color: '#ffffff',
  },
  secondary: {
    color: '#1d4ed8',
  },
  outline: {
    color: '#1d4ed8',
  },
  ghost: {
    color: '#1d4ed8',
  },
});
