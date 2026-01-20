import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  View,
  Alert,
  FlatList,
  TextInput,
  Pressable,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

import { supabase } from "../../../src/lib/supabase";
import { useProfile } from "../../../src/hooks/useProfile";

import Screen from "../../../src/components/Screen";
import { Card } from "../../../src/components/Card";
import { Title, Label, Value } from "../../../src/components/Text";
import { Colors } from "../../../src/constants/colors";

type Invoice = {
  id: string;
  invoice_number: string | null;
  status: "draft" | "final" | "paid" | "cancelled";
  total_net: number;
  total_vat: number;
  total_gross: number;
};

type Item = {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  gross_amount: number;
};

export default function InvoiceDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [userId, setUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const VAT_RATE = 19;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id);
    });
  }, []);

  const { profile, loading: profileLoading } = useProfile(userId);

  const loadInvoice = async () => {
    const { data: inv } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    const { data: itemsData } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id);

    setInvoice(inv);
    setItems(itemsData || []);
    setLoading(false);
  };

  useEffect(() => {
    if (profile?.shop_id && id) {
      loadInvoice();
    }
  }, [profile?.shop_id, id]);

  const addItem = async () => {
    if (!desc || !qty || !price) {
      Alert.alert("Error", "Fill all item fields");
      return;
    }

    const quantity = Number(qty);
    const unitPrice = Number(price);
    const net = quantity * unitPrice;
    const vat = (net * VAT_RATE) / 100;
    const gross = net + vat;

    await supabase.from("invoice_items").insert({
      invoice_id: id,
      description: desc,
      quantity,
      unit_price: unitPrice,
      vat_rate: VAT_RATE,
      net_amount: net,
      vat_amount: vat,
      gross_amount: gross,
    });

    await supabase.rpc("recalculate_invoice_totals", {
      p_invoice_id: id,
    });

    setDesc("");
    setQty("1");
    setPrice("");

    loadInvoice();
  };

  const finalizeInvoice = async () => {
    const session = await supabase.auth.getSession();

    const res = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/finalize-invoice`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify({ invoice_id: id }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      Alert.alert("Error", data.error);
      return;
    }

    Alert.alert(
      "Invoice Finalized",
      `Invoice number: ${data.invoice_number}`
    );

    loadInvoice();
  };

  if (loading || profileLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!invoice) return null;

  const editable = invoice.status === "draft";

  return (
    <Screen>
      <Title>{invoice.invoice_number ?? "Draft Invoice"}</Title>

      <Card>
        <Label>Status</Label>
        <Value>{invoice.status.toUpperCase()}</Value>
      </Card>

      {editable && (
        <Card>
          <Label>Add Item</Label>

          <TextInput
            placeholder="Description"
            value={desc}
            onChangeText={setDesc}
            style={{ borderWidth: 1, padding: 10, marginBottom: 8 }}
          />

          <TextInput
            placeholder="Quantity"
            keyboardType="numeric"
            value={qty}
            onChangeText={setQty}
            style={{ borderWidth: 1, padding: 10, marginBottom: 8 }}
          />

          <TextInput
            placeholder="Unit price (€)"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
            style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
          />

          <Pressable
            onPress={addItem}
            style={{
              backgroundColor: Colors.primary,
              padding: 12,
              alignItems: "center",
              borderRadius: 6,
            }}
          >
            <Value style={{ color: Colors.white }}>Add Item</Value>
          </Pressable>
        </Card>
      )}

      <Title>Items</Title>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={<Label>No items yet</Label>}
        renderItem={({ item }) => (
          <Card>
            <Label>{item.description}</Label>
            <Value>
              {item.quantity} × € {item.unit_price.toFixed(2)}
            </Value>
            <Label>€ {item.gross_amount.toFixed(2)}</Label>
          </Card>
        )}
      />

      <Card>
        <Label>Total Net</Label>
        <Value>€ {invoice.total_net.toFixed(2)}</Value>

        <Label>Total VAT</Label>
        <Value>€ {invoice.total_vat.toFixed(2)}</Value>

        <Label>Total Gross</Label>
        <Value>€ {invoice.total_gross.toFixed(2)}</Value>
      </Card>

      {invoice.status === "draft" && profile?.role === "owner" && (
        <Pressable
          onPress={() =>
            Alert.alert(
              "Finalize Invoice",
              "This action cannot be undone. Continue?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Finalize",
                  style: "destructive",
                  onPress: finalizeInvoice,
                },
              ]
            )
          }
          style={{
            backgroundColor: Colors.primaryDark,
            padding: 14,
            borderRadius: 8,
            alignItems: "center",
            marginTop: 16,
          }}
        >
          <Value style={{ color: Colors.white }}>Finalize Invoice</Value>
        </Pressable>
      )}
    </Screen>
  );
}
