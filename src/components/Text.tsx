import { Text as RNText, StyleSheet } from "react-native";
import { Colors } from "../constants/colors";

export function Title({ children }: any) {
  return <RNText style={styles.title}>{children}</RNText>;
}

export function Label({ children }: any) {
  return <RNText style={styles.label}>{children}</RNText>;
}

export function Value({ children }: any) {
  return <RNText style={styles.value}>{children}</RNText>;
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  value: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primaryDark,
    marginTop: 4,
  },
});
