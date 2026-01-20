import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  View,
  Alert,
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
  city: string | null;
  phone: string | null;
  email: string | null;
};

export default function CustomersScreen() {
  const [userId, setUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id);
    });
  }, []);

  const { profile, loading: profileLoading } = useProfile(userId);

  useEffect(() => {
    if (!profile?.shop_id) return;

    const loadCustomers = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("customers")
        .select("id, name, city, phone, email")
        .eq("shop_id", profile.shop_id)
        .order("created_at", { ascending: false });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        setCustomers(data || []);
      }

      setLoading(false);
    };

    loadCustomers();
  }, [profile?.shop_id]);

  if (loading || profileLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <Screen>
      <Title>Customers</Title>

      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Label>No customers found.</Label>}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              Alert.alert(
                item.name,
                `${item.city ?? ""}\n${item.phone ?? ""}\n${item.email ?? ""}`
              );
            }}
          >
            <Card>
              <Value>{item.name}</Value>

              {item.city && <Label>{item.city}</Label>}
              {item.phone && <Label>{item.phone}</Label>}
              {item.email && <Label>{item.email}</Label>}
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}
