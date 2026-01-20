import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  View,
  TextInput,
  Pressable,
  Alert,
  FlatList,
} from "react-native";

import { supabase } from "../../src/lib/supabase";
import { useProfile } from "../../src/hooks/useProfile";

import Screen from "../../src/components/Screen";
import { Card } from "../../src/components/Card";
import { Title, Label, Value } from "../../src/components/Text";
import { Colors } from "../../src/constants/colors";

type StaffProfile = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  role: "owner" | "staff";
  active: boolean;
};

export default function StaffScreen() {
  const [userId, setUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id);
    });
  }, []);

  const { profile, loading: profileLoading } = useProfile(userId);

  const loadStaff = async () => {
    if (!profile?.shop_id) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, email, role, active")
      .eq("shop_id", profile.shop_id)
      .order("created_at");

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    setStaff(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (profile?.shop_id && profile.role === "owner") {
      loadStaff();
    }
  }, [profile?.shop_id]);

  const createStaff = async () => {
    if (!email) {
      Alert.alert("Error", "Email is required");
      return;
    }

    const session = await supabase.auth.getSession();

    const res = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-staff-user`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify({
          email,
          full_name: fullName,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      Alert.alert("Error", data.error);
      return;
    }

    setEmail("");
    setFullName("");
    loadStaff();
  };

  const disableStaff = async (staffId: string) => {
    Alert.alert("Disable Staff", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Disable",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("profiles")
            .update({ active: false })
            .eq("id", staffId);

          if (error) {
            Alert.alert("Error", error.message);
            return;
          }

          loadStaff();
        },
      },
    ]);
  };

  if (loading || profileLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (profile?.role !== "owner") {
    return (
      <Screen>
        <Title>Staff</Title>
        <Label>Access denied</Label>
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>Staff</Title>

      {/* ADD STAFF */}
      <Card>
        <Label>Add Staff</Label>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
        />

        <TextInput
          placeholder="Full name (optional)"
          value={fullName}
          onChangeText={setFullName}
          style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
        />

        <Pressable
          onPress={createStaff}
          style={{
            backgroundColor: Colors.primary,
            padding: 12,
            borderRadius: 8,
            alignItems: "center",
          }}
        >
          <Value style={{ color: Colors.white }}>Create Staff</Value>
        </Pressable>
      </Card>

      {/* STAFF LIST */}
      <Title>Staff Members</Title>

      <FlatList
        data={staff}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Label>No staff found</Label>}
        renderItem={({ item }) => (
          <Card>
            <Value>{item.full_name ?? item.email}</Value>
            <Label>{item.email}</Label>
            <Label>{item.role.toUpperCase()}</Label>
            {!item.active && <Label style={{ color: Colors.danger }}>DISABLED</Label>}

            {item.role === "staff" && item.active && (
              <Pressable
                onPress={() => disableStaff(item.id)}
                style={{ marginTop: 8 }}
              >
                <Label style={{ color: Colors.danger }}>Disable</Label>
              </Pressable>
            )}
          </Card>
        )}
      />
    </Screen>
  );
}
