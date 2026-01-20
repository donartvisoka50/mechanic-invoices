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

type Customer = {
  id: string;
  name: string;
};

type Vehicle = {
  id: string;
  customer_id: string;
  brand: string | null;
  model: string | null;
  license_plate: string | null;
  vin: string | null;
};

export default function VehiclesScreen() {
  const [userId, setUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [vin, setVin] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id);
    });
  }, []);

  const { profile, loading: profileLoading } = useProfile(userId);

  useEffect(() => {
    if (!profile?.shop_id) return;

    const loadCustomers = async () => {
      const { data } = await supabase
        .from("customers")
        .select("id, name")
        .eq("shop_id", profile.shop_id)
        .order("name");

      setCustomers(data || []);
    };

    loadCustomers();
  }, [profile?.shop_id]);

  useEffect(() => {
    if (!customerId || !profile?.shop_id) {
      setVehicles([]);
      return;
    }

    const loadVehicles = async () => {
      const { data } = await supabase
        .from("vehicles")
        .select("*")
        .eq("shop_id", profile.shop_id)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      setVehicles(data || []);
      setLoading(false);
    };

    loadVehicles();
  }, [customerId, profile?.shop_id]);

  const addVehicle = async () => {
    if (!customerId || !plate) {
      Alert.alert("Error", "Customer and license plate are required");
      return;
    }

    const { error } = await supabase.from("vehicles").insert({
      shop_id: profile!.shop_id,
      customer_id: customerId,
      brand,
      model,
      license_plate: plate,
      vin,
    });

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    setBrand("");
    setModel("");
    setPlate("");
    setVin("");

    // reload
    const { data } = await supabase
      .from("vehicles")
      .select("*")
      .eq("shop_id", profile!.shop_id)
      .eq("customer_id", customerId);

    setVehicles(data || []);
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
      <Title>Vehicles</Title>

      {/* SELECT CUSTOMER */}
      <Card>
        <Label>Select Customer</Label>

        {customers.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => setCustomerId(c.id)}
            style={{ paddingVertical: 6 }}
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

      {customerId && (
        <>
          {/* ADD VEHICLE */}
          <Card>
            <Label>Add Vehicle</Label>

            <TextInput
              placeholder="Brand"
              value={brand}
              onChangeText={setBrand}
              style={{ borderWidth: 1, padding: 10, marginBottom: 8 }}
            />

            <TextInput
              placeholder="Model"
              value={model}
              onChangeText={setModel}
              style={{ borderWidth: 1, padding: 10, marginBottom: 8 }}
            />

            <TextInput
              placeholder="License Plate *"
              value={plate}
              onChangeText={setPlate}
              autoCapitalize="characters"
              style={{ borderWidth: 1, padding: 10, marginBottom: 8 }}
            />

            <TextInput
              placeholder="VIN (optional)"
              value={vin}
              onChangeText={setVin}
              style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
            />

            <Pressable
              onPress={addVehicle}
              style={{
                backgroundColor: Colors.primary,
                padding: 12,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Value style={{ color: Colors.white }}>Add Vehicle</Value>
            </Pressable>
          </Card>

          {/* VEHICLE LIST */}
          <Title>Customer Vehicles</Title>

          <FlatList
            data={vehicles}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Label>No vehicles found</Label>}
            renderItem={({ item }) => (
              <Card>
                <Value>
                  {item.brand} {item.model}
                </Value>
                <Label>{item.license_plate}</Label>
                {item.vin && <Label>VIN: {item.vin}</Label>}
              </Card>
            )}
          />
        </>
      )}
    </Screen>
  );
}
