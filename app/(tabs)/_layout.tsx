import { Tabs } from "expo-router";
import { Colors } from "../../src/constants/colors";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: Colors.primary,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="customers" options={{ title: "Customers" }} />
      <Tabs.Screen name="vehicles" options={{ title: "Vehicles" }} />
      <Tabs.Screen name="new-invoice" options={{ title: "New Invoice" }} />
      <Tabs.Screen name="invoices/index" options={{ title: "Invoices" }} />
      <Tabs.Screen name="staff" options={{ title: "Staff" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
