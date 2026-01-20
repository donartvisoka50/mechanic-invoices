import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import { supabase } from "../../src/lib/supabase";
import { useProfile } from "../../src/hooks/useProfile";

import Screen from "../../src/components/Screen";
import { Card } from "../../src/components/Card";
import { Title, Label, Value } from "../../src/components/Text";
import { Colors } from "../../src/constants/colors";

type Shop = {
  id: string;
  name: string;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  vat_id: string | null;
  iban: string | null;
  bic: string | null;
};

export default function ProfileScreen() {
  const [userEmail, setUserEmail] = useState<string>("");
  const [userId, setUserId] = useState<string | undefined>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopLoading, setShopLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id);
      setUserEmail(data.user?.email || "");
    });
  }, []);

  const { profile, loading: profileLoading } = useProfile(userId);

  useEffect(() => {
    const loadShop = async () => {
      if (!profile?.shop_id) {
        setShop(null);
        return;
      }

      setShopLoading(true);

      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .eq("id", profile.shop_id)
        .single();

      if (!error) setShop(data as Shop);

      setShopLoading(false);
    };

    loadShop();
  }, [profile?.shop_id]);

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Logout failed", error.message);
      return;
    }
    router.replace("/(auth)/login");
  };

  const isOwner = profile?.role === "owner";

  if (profileLoading || shopLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <Screen>
      <Title>Profile</Title>

      <Card>
        <Label>Full Name</Label>
        <Value>{profile?.full_name || "—"}</Value>

        <Label style={{ marginTop: 10 }}>Email</Label>
        <Value>{userEmail || "—"}</Value>

        <Label style={{ marginTop: 10 }}>Role</Label>
        <Value>{profile?.role ? profile.role.toUpperCase() : "—"}</Value>

        <Label style={{ marginTop: 10 }}>Active</Label>
        <Value>{profile?.active ? "YES" : "NO"}</Value>
      </Card>

      <Title>Shop</Title>

      <Card>
        <Label>Name</Label>
        <Value>{shop?.name || "—"}</Value>

        <Label style={{ marginTop: 10 }}>Address</Label>
        <Value>
          {shop?.address
            ? `${shop.address}${shop.postal_code || shop.city ? ", " : ""}${
                shop.postal_code || ""
              } ${shop.city || ""}`.trim()
            : "—"}
        </Value>

        <Label style={{ marginTop: 10 }}>Country</Label>
        <Value>{shop?.country || "—"}</Value>

        {!!shop?.vat_id && (
          <>
            <Label style={{ marginTop: 10 }}>VAT ID</Label>
            <Value>{shop.vat_id}</Value>
          </>
        )}

        {!!shop?.phone && (
          <>
            <Label style={{ marginTop: 10 }}>Phone</Label>
            <Value>{shop.phone}</Value>
          </>
        )}

        {!!shop?.email && (
          <>
            <Label style={{ marginTop: 10 }}>Shop Email</Label>
            <Value>{shop.email}</Value>
          </>
        )}
      </Card>

      {isOwner && (
        <>
          <Title>Owner Tools</Title>

          <Card>
            <Pressable
              onPress={() => router.push("/staff")}
              style={({ pressed }) => [
                styles.actionBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.actionBtnText}>Manage Staff</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/settings")}
              style={({ pressed }) => [
                styles.actionBtn,
                { marginTop: 10 },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.actionBtnText}>Shop Settings</Text>
            </Pressable>
          </Card>
        </>
      )}

      <Title>Account</Title>

      <Card>
        <Pressable
          onPress={logout}
          style={({ pressed }) => [
            styles.logoutBtn,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.logoutBtnText}>Logout</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  actionBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  actionBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "700",
  },

  logoutBtn: {
    backgroundColor: "#E53935",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
