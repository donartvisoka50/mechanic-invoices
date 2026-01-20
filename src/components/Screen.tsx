import { View, StyleSheet } from "react-native";
import { Colors } from "../constants/colors";
import { Layout } from "../constants/layout";

export default function Screen({ children }: { children: React.ReactNode }) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Layout.spacing.md,
  },
});
