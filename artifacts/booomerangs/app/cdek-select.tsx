import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import api from "@/lib/api";
import { setCdekPoint } from "@/lib/cdekStore";

interface CdekCity {
  city: string;
  code: number;
  region?: string;
}

interface CdekPointRaw {
  code: string;
  name: string;
  location?: {
    address?: string;
    address_full?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  address_comment?: string;
  work_time?: string;
  nearest_station?: string;
  nearest_metro_station?: string;
}

export default function CdekSelectScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [citySearch, setCitySearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<CdekCity | null>(null);
  const [cityResults, setCityResults] = useState<CdekCity[]>([]);
  const [citySearching, setCitySearching] = useState(false);

  const [pointSearch, setPointSearch] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchCities = useCallback(async (text: string) => {
    if (text.length < 2) { setCityResults([]); return; }
    setCitySearching(true);
    try {
      const res = await api.get("/cdek/cities", { params: { city: text } });
      const list = Array.isArray(res.data) ? res.data : (res.data?.cities ?? []);
      setCityResults(list.slice(0, 10));
    } catch {
      setCityResults([]);
    } finally {
      setCitySearching(false);
    }
  }, []);

  const handleCityInput = (text: string) => {
    setCitySearch(text);
    setSelectedCity(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchCities(text), 500);
  };

  const { data: points, isLoading: pointsLoading } = useQuery<CdekPointRaw[]>({
    queryKey: ["cdek-points", selectedCity?.code],
    queryFn: async () => {
      const res = await api.get("/cdek/delivery-points", {
        params: { city_code: selectedCity!.code, type: "PVZ" },
      });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!selectedCity,
    staleTime: 10 * 60 * 1000,
  });

  const filtered = (points ?? []).filter((p) => {
    if (!pointSearch) return true;
    const addr = p.location?.address ?? p.location?.address_full ?? p.name ?? "";
    return addr.toLowerCase().includes(pointSearch.toLowerCase());
  });

  const handleSelect = (p: CdekPointRaw) => {
    setCdekPoint({
      code: p.code,
      name: p.name,
      address: p.location?.address ?? p.location?.address_full ?? "",
      address_comment: p.address_comment,
      work_time: p.work_time,
      nearest_station: p.nearest_metro_station ?? p.nearest_station,
      cityName: selectedCity?.city,
      cityCode: selectedCity?.code,
    });
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>

      {/* Поиск города */}
      {!selectedCity ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Выберите город</Text>
          <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Начните вводить город..."
              placeholderTextColor={colors.mutedForeground}
              value={citySearch}
              onChangeText={handleCityInput}
              autoFocus
            />
            {citySearching && <ActivityIndicator size="small" color={colors.mutedForeground} />}
          </View>

          {cityResults.length > 0 && (
            <FlatList
              data={cityResults}
              keyExtractor={(item) => String(item.code)}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.cityRow, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setSelectedCity(item);
                    setCitySearch(item.city);
                    setCityResults([]);
                  }}
                >
                  <View>
                    <Text style={[styles.cityName, { color: colors.foreground }]}>{item.city}</Text>
                    {item.region && (
                      <Text style={[styles.cityRegion, { color: colors.mutedForeground }]}>{item.region}</Text>
                    )}
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </Pressable>
              )}
            />
          )}

          {citySearch.length > 1 && !citySearching && cityResults.length === 0 && (
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>Город не найден</Text>
          )}
          {citySearch.length === 0 && (
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              Введите название города для поиска пунктов выдачи СДЭК
            </Text>
          )}
        </View>
      ) : (
        <>
          {/* Заголовок с городом */}
          <View style={[styles.cityHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => { setSelectedCity(null); setCitySearch(""); }} style={styles.changeCity}>
              <Feather name="chevron-left" size={18} color={colors.mutedForeground} />
              <Text style={[styles.changeCityText, { color: colors.mutedForeground }]}>Изменить</Text>
            </Pressable>
            <Text style={[styles.cityTitle, { color: colors.foreground }]}>{selectedCity.city}</Text>
          </View>

          {/* Поиск по адресу */}
          <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border, margin: 12 }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Поиск по адресу..."
              placeholderTextColor={colors.mutedForeground}
              value={pointSearch}
              onChangeText={setPointSearch}
            />
            {pointSearch.length > 0 && (
              <Pressable onPress={() => setPointSearch("")}>
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>

          {pointsLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.foreground} size="large" />
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>Загрузка пунктов выдачи...</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.code}
              contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24, gap: 8 }}
              ListEmptyComponent={
                <Text style={[styles.hint, { color: colors.mutedForeground, textAlign: "center", marginTop: 32 }]}>
                  {points?.length === 0 ? "Пунктов выдачи не найдено" : "Не найдено по фильтру"}
                </Text>
              }
              ListHeaderComponent={
                points && points.length > 0 ? (
                  <Text style={[styles.countText, { color: colors.mutedForeground }]}>
                    {filtered.length} пунктов выдачи
                  </Text>
                ) : null
              }
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.pointCard,
                    { backgroundColor: colors.card, opacity: pressed ? 0.85 : 1 },
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <View style={styles.pointHeader}>
                    <View style={[styles.cdekBadge, { backgroundColor: "#00B140" }]}>
                      <Text style={styles.cdekBadgeText}>СДЭК</Text>
                    </View>
                    <Text style={[styles.pointCode, { color: colors.mutedForeground }]}>{item.code}</Text>
                  </View>
                  <Text style={[styles.pointAddress, { color: colors.foreground }]} numberOfLines={2}>
                    {item.location?.address ?? item.location?.address_full ?? item.name}
                  </Text>
                  {item.address_comment && (
                    <Text style={[styles.pointComment, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {item.address_comment}
                    </Text>
                  )}
                  {(item.nearest_metro_station ?? item.nearest_station) && (
                    <View style={styles.metroRow}>
                      <Feather name="map-pin" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.pointMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {item.nearest_metro_station ?? item.nearest_station}
                      </Text>
                    </View>
                  )}
                  {item.work_time && (
                    <View style={styles.metroRow}>
                      <Feather name="clock" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.pointMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {item.work_time}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.selectBtn, { backgroundColor: colors.foreground }]}>
                    <Text style={[styles.selectBtnText, { color: colors.background }]}>Выбрать</Text>
                  </View>
                </Pressable>
              )}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15 },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  cityName: { fontSize: 15, fontWeight: "500" },
  cityRegion: { fontSize: 12, marginTop: 2 },
  hint: { fontSize: 14, marginTop: 8 },
  cityHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  changeCity: { flexDirection: "row", alignItems: "center", gap: 2 },
  changeCityText: { fontSize: 14 },
  cityTitle: { fontSize: 17, fontWeight: "700", flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  countText: { fontSize: 13, marginBottom: 4 },
  pointCard: {
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  pointHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cdekBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  cdekBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  pointCode: { fontSize: 12 },
  pointAddress: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  pointComment: { fontSize: 12, lineHeight: 18 },
  metroRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  pointMeta: { fontSize: 12, flex: 1 },
  selectBtn: {
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  selectBtnText: { fontSize: 14, fontWeight: "600" },
});
