import { Tabs, Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { supabase } from "../../src/lib/supabase";
import { useProfile } from "../../src/hooks/useProfile";
import { Colors } from "../../src/constants/colors";

export default function TabsLayout() {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user?.id);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const { profile, loading: profileLoading } = useProfile(userId);

  if (loading || profileLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: Colors.background,
        }}
      >
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  // Not logged in → go to login
  if (!userId) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
        }}
      />

      <Tabs.Screen
        name="invoices"
        options={{
          title: "Invoices",
        }}
      />

      <Tabs.Screen
        name="new-invoice"
        options={{
          title: "New Invoice",
        }}
      />

      <Tabs.Screen
        name="customers"
        options={{
          title: "Customers",
        }}
      />

      <Tabs.Screen
        name="vehicles"
        options={{
          title: "Vehicles",
        }}
      />

      {profile?.role === "owner" && (
        <>
          <Tabs.Screen
            name="staff"
            options={{
              title: "Staff",
            }}
          />

          <Tabs.Screen
            name="settings"
            options={{
              title: "Settings",
            }}
          />
        </>
      )}
    </Tabs>
  );
}
