import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  View,
  TextInput,
  Pressable,
  Alert,
} from "react-native";

import { supabase } from "../../src/lib/supabase";
import { useProfile } from "../../src/hooks/useProfile";

import Screen from "../../src/components/Screen";
import { Card } from "../../src/components/Card";
import { Title, Label, Value } from "../../src/components/Text";
import { Colors } from "../../src/constants/colors";

type Shop = {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  vat_id: string | null;
  email: string | null;
  phone: string | null;
  bank_name: string | null;
  iban: string | null;
  bic: string | null;
};

export default function SettingsScreen() {
  const [userId, setUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<Shop | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id);
    });
  }, []);

  const { profile, loading: profileLoading } = useProfile(userId);

  const editable: boolean = profile?.role === "owner";

  useEffect(() => {
    if (!profile?.shop_id) return;

    const loadShop = async () => {
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .eq("id", profile.shop_id)
        .single();

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      setShop(data);
      setLoading(false);
    };

    loadShop();
  }, [profile?.shop_id]);

  const save = async () => {
    if (!shop) return;

    const { error } = await supabase
      .from("shops")
      .update({
        name: shop.name,
        address: shop.address,
        city: shop.city,
        postal_code: shop.postal_code,
        vat_id: shop.vat_id,
        email: shop.email,
        phone: shop.phone,
        bank_name: shop.bank_name,
        iban: shop.iban,
        bic: shop.bic,
      })
      .eq("id", shop.id);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    Alert.alert("Saved", "Shop settings updated");
  };

  if (loading || profileLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!shop) return null;

  return (
    <Screen>
      <Title>Settings</Title>

      <Card>
        <Label>Company Name</Label>
        <TextInput
          value={shop.name}
          editable={editable}
          onChangeText={(v) => setShop({ ...shop, name: v })}
          style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
        />

        <Label>Address</Label>
        <TextInput
          value={shop.address}
          editable={editable}
          onChangeText={(v) => setShop({ ...shop, address: v })}
          style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
        />

        <Label>City</Label>
        <TextInput
          value={shop.city}
          editable={editable}
          onChangeText={(v) => setShop({ ...shop, city: v })}
          style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
        />

        <Label>Postal Code</Label>
        <TextInput
          value={shop.postal_code}
          editable={editable}
          onChangeText={(v) => setShop({ ...shop, postal_code: v })}
          style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
        />
      </Card>

      <Card>
        <Label>VAT ID</Label>
        <TextInput
          value={shop.vat_id ?? ""}
          editable={editable}
          onChangeText={(v) => setShop({ ...shop, vat_id: v })}
          style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
        />

        <Label>Email</Label>
        <TextInput
          value={shop.email ?? ""}
          editable={editable}
          onChangeText={(v) => setShop({ ...shop, email: v })}
          style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
        />

        <Label>Phone</Label>
        <TextInput
          value={shop.phone ?? ""}
          editable={editable}
          onChangeText={(v) => setShop({ ...shop, phone: v })}
          style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
        />
      </Card>

      <Card>
        <Label>Bank Name</Label>
        <TextInput
          value={shop.bank_name ?? ""}
          editable={editable}
          onChangeText={(v) => setShop({ ...shop, bank_name: v })}
          style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
        />

        <Label>IBAN</Label>
        <TextInput
          value={shop.iban ?? ""}
          editable={editable}
          onChangeText={(v) => setShop({ ...shop, iban: v })}
          style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
        />

        <Label>BIC</Label>
        <TextInput
          value={shop.bic ?? ""}
          editable={editable}
          onChangeText={(v) => setShop({ ...shop, bic: v })}
          style={{ borderWidth: 1, padding: 10 }}
        />
      </Card>

      {editable && (
        <Pressable
          onPress={save}
          style={{
            backgroundColor: Colors.primary,
            padding: 14,
            borderRadius: 8,
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <Value style={{ color: Colors.white }}>Save Settings</Value>
        </Pressable>
      )}
    </Screen>
  );
}
