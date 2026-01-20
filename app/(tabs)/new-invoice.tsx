import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  View,
  TextInput,
} from "react-native";
import { router } from "expo-router";

import { supabase } from "../../src/lib/supabase";
import { useProfile } from "../../src/hooks/useProfile";

import Screen from "../../src/components/Screen";
import { Card } from "../../src/components/Card";
import { Title, Label, Value } from "../../src/components/Text";
import { Colors } from "../../src/constants/colors";

type Customer = {
  id: string;
  name: string;
};

type Vehicle = {
  id: string;
  brand: string | null;
  model: string | null;
  license_plate: string | null;
};

export default function NewInvoiceScreen() {
  const [userId, setUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id);
    });
  }, []);

  const { profile, loading: profileLoading } = useProfile(userId);

  useEffect(() => {
    if (!profile?.shop_id) return;

    const loadData = async () => {
      setLoading(true);

      const { data: customersData } = await supabase
        .from("customers")
        .select("id, name")
        .eq("shop_id", profile.shop_id)
        .order("name");

      setCustomers(customersData || []);

      setLoading(false);
    };

    loadData();
  }, [profile?.shop_id]);

  useEffect(() => {
    if (!customerId || !profile?.shop_id) {
      setVehicles([]);
      setVehicleId(null);
      return;
    }

    supabase
      .from("vehicles")
      .select("id, brand, model, license_plate")
      .eq("shop_id", profile.shop_id)
      .eq("customer_id", customerId)
      .then(({ data }) => {
        setVehicles(data || []);
      });
  }, [customerId]);

  const createInvoice = async () => {
    if (!customerId) {
      Alert.alert("Error", "Please select a customer");
      return;
    }

    const { data, error } = await supabase
      .from("invoices")
      .insert({
        shop_id: profile!.shop_id,
        customer_id: customerId,
        vehicle_id: vehicleId,
        notes,
        status: "draft",
      })
      .select("id")
      .single();

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    router.replace(`/invoices/${data.id}`);
  };

  if (loading || profileLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <Screen>
      <Title>New Invoice</Title>

      {/* CUSTOMER */}
      <Card>
        <Label>Select Customer</Label>

        {customers.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => setCustomerId(c.id)}
            style={{
              paddingVertical: 10,
            }}
          >
            <Value
              style={{
                color:
                  customerId === c.id
                    ? Colors.primary
                    : Colors.textPrimary,
              }}
            >
              {c.name}
            </Value>
          </Pressable>
        ))}
      </Card>

      {/* VEHICLE */}
      {vehicles.length > 0 && (
        <Card>
          <Label>Select Vehicle (optional)</Label>

          {vehicles.map((v) => (
            <Pressable
              key={v.id}
              onPress={() => setVehicleId(v.id)}
              style={{ paddingVertical: 8 }}
            >
              <Value
                style={{
                  color:
                    vehicleId === v.id
                      ? Colors.primary
                      : Colors.textPrimary,
                }}
              >
                {v.brand} {v.model} ({v.license_plate})
              </Value>
            </Pressable>
          ))}
        </Card>
      )}

      {/* NOTES */}
      <Card>
        <Label>Notes</Label>
        <TextInput
          placeholder="Internal notes (optional)"
          placeholderTextColor={Colors.textSecondary}
          value={notes}
          onChangeText={setNotes}
          multiline
          style={{
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: 8,
            padding: 10,
            minHeight: 80,
            color: Colors.textPrimary,
          }}
        />
      </Card>

      {/* CREATE */}
      <Pressable
        onPress={createInvoice}
        style={{
          backgroundColor: Colors.primary,
          padding: 14,
          borderRadius: 8,
          alignItems: "center",
          marginTop: 10,
        }}
      >
        <Value style={{ color: Colors.white }}>Create Draft Invoice</Value>
      </Pressable>
    </Screen>
  );
}
