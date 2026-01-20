import { ActivityIndicator, View } from "react-native";
import { useEffect, useState } from "react";
import { supabase } from "../../src/lib/supabase";
import { useProfile } from "../../src/hooks/useProfile";

import Screen from "../../src/components/Screen";
import { Card } from "../../src/components/Card";
import { Title, Label, Value } from "../../src/components/Text";

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [stats, setStats] = useState({
    invoicesToday: 0,
    invoicesMonth: 0,
    revenueMonth: 0,
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id);
    });
  }, []);

  const { profile, loading: profileLoading } = useProfile(userId);

  useEffect(() => {
    if (!profile?.shop_id) return;

    const loadStats = async () => {
      setLoading(true);

      const today = new Date().toISOString().split("T")[0];
      const firstDayOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      )
        .toISOString()
        .split("T")[0];

      const { data: todayInvoices } = await supabase
        .from("invoices")
        .select("id")
        .eq("shop_id", profile.shop_id)
        .eq("invoice_date", today);

      const { data: monthInvoices } = await supabase
        .from("invoices")
        .select("total_gross")
        .eq("shop_id", profile.shop_id)
        .gte("invoice_date", firstDayOfMonth)
        .neq("status", "cancelled");

      const revenue =
        monthInvoices?.reduce(
          (sum, inv) => sum + Number(inv.total_gross || 0),
          0
        ) || 0;

      setStats({
        invoicesToday: todayInvoices?.length || 0,
        invoicesMonth: monthInvoices?.length || 0,
        revenueMonth: revenue,
      });

      setLoading(false);
    };

    loadStats();
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
      <Title>Dashboard</Title>

      <Card>
        <Label>Invoices Today</Label>
        <Value>{stats.invoicesToday}</Value>
      </Card>

      <Card>
        <Label>Invoices This Month</Label>
        <Value>{stats.invoicesMonth}</Value>
      </Card>

      <Card>
        <Label>Revenue This Month</Label>
        <Value>€ {stats.revenueMonth.toFixed(2)}</Value>
      </Card>
    </Screen>
  );
}
