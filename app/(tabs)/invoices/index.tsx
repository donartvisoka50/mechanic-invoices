import { ActivityIndicator, FlatList, Pressable, View } from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";

import { supabase } from "../../../src/lib/supabase";
import { useProfile } from "../../../src/hooks/useProfile";

import Screen from "../../../src/components/Screen";
import { Card } from "../../../src/components/Card";
import { Title, Label, Value } from "../../../src/components/Text";
import { Colors } from "../../../src/constants/colors";

type InvoiceRow = {
  id: string;
  invoice_number: string | null;
  invoice_date: string;
  status: "draft" | "final" | "paid" | "cancelled";
  total_gross: number;
};

export default function InvoicesScreen() {
  const [userId, setUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id);
    });
  }, []);

  const { profile, loading: profileLoading } = useProfile(userId);

  useEffect(() => {
    if (!profile?.shop_id) return;

    const loadInvoices = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("invoices")
        .select(
          "id, invoice_number, invoice_date, status, total_gross"
        )
        .eq("shop_id", profile.shop_id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setInvoices(data);
      }

      setLoading(false);
    };

    loadInvoices();
  }, [profile?.shop_id]);

  if (loading || profileLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Screen>
      <Title>Invoices</Title>

      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Label>No invoices found.</Label>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/invoices/${item.id}`)}
          >
            <Card>
              <Label>
                {item.invoice_number ?? "Draft"} • {item.invoice_date}
              </Label>

              <Value>
                € {Number(item.total_gross).toFixed(2)}
              </Value>

              <Label
                style={{
                  marginTop: 6,
                  color:
                    item.status === "paid"
                      ? Colors.success
                      : item.status === "cancelled"
                      ? Colors.danger
                      : Colors.textSecondary,
                }}
              >
                {item.status.toUpperCase()}
              </Label>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}
