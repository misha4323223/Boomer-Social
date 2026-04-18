import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import api from "@/lib/api";

interface Review {
  id: number;
  productId: number;
  authorName: string;
  rating: number;
  comment: string | null;
  createdAt: string | null;
}

function StarRow({
  rating,
  interactive = false,
  onRate,
  size = 18,
}: {
  rating: number;
  interactive?: boolean;
  onRate?: (r: number) => void;
  size?: number;
}) {
  const [hovered, setHovered] = useState(0);
  const effective = interactive ? hovered || rating : rating;

  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((val) => (
        <Pressable
          key={val}
          onPress={() => interactive && onRate?.(val)}
          onPressIn={() => interactive && setHovered(val)}
          onPressOut={() => interactive && setHovered(0)}
          hitSlop={4}
          disabled={!interactive}
        >
          <Feather
            name="star"
            size={size}
            color={val <= effective ? "#facc15" : "#6b7280"}
            style={{ marginRight: 2 }}
          />
        </Pressable>
      ))}
    </View>
  );
}

function pluralReviews(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return "отзыв";
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return "отзыва";
  return "отзывов";
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function ReviewSection({ productId }: { productId: number }) {
  const colors = useColors();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const res = await api.get(`/reviews/${productId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 30_000,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      await api.post("/reviews", {
        productId,
        rating,
        comment: comment.trim() || null,
        source: "mobile_app",
      });
    },
    onSuccess: () => {
      setRating(0);
      setComment("");
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Спасибо!", "Ваш отзыв появится после модерации.");
    },
    onError: (err: any) => {
      Alert.alert("Ошибка", err?.response?.data?.error ?? "Не удалось отправить отзыв");
    },
  });

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <View style={[styles.section, { borderTopColor: colors.border }]}>
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Отзывы</Text>
        {reviews.length > 0 && (
          <View style={styles.avgRow}>
            <StarRow rating={Math.round(avgRating)} size={14} />
            <Text style={[styles.avgText, { color: colors.mutedForeground }]}>
              {avgRating.toFixed(1)} · {reviews.length} {pluralReviews(reviews.length)}
            </Text>
          </View>
        )}
      </View>

      {/* ─── Write button / login prompt ─────────────────────────────── */}
      {user ? (
        <Pressable
          onPress={() => setShowForm((v) => !v)}
          style={[styles.writeBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <Feather
            name={showForm ? "chevron-up" : "edit-2"}
            size={15}
            color={colors.mutedForeground}
          />
          <Text style={[styles.writeBtnText, { color: colors.foreground }]}>
            {showForm ? "Свернуть" : "Написать отзыв"}
          </Text>
        </Pressable>
      ) : (
        <View style={[styles.loginPrompt, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="log-in" size={15} color={colors.mutedForeground} />
          <Text style={[styles.loginText, { color: colors.mutedForeground }]}>
            Войдите, чтобы оставить отзыв
          </Text>
        </View>
      )}

      {/* ─── Review form ─────────────────────────────────────────────── */}
      {showForm && user && (
        <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.formAuthor, { color: colors.mutedForeground }]}>
            Отзыв от:{" "}
            <Text style={{ color: colors.foreground, fontWeight: "600" }}>{user.name}</Text>
          </Text>

          <Text style={[styles.formLabel, { color: colors.foreground }]}>Оценка</Text>
          <StarRow rating={rating} interactive onRate={setRating} size={28} />

          <Text style={[styles.formLabel, { color: colors.foreground }]}>
            Комментарий{" "}
            <Text style={{ color: colors.mutedForeground, fontWeight: "400" }}>(необязательно)</Text>
          </Text>
          <TextInput
            style={[
              styles.textarea,
              { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground },
            ]}
            placeholder="Поделитесь впечатлениями..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
          />

          <Pressable
            onPress={() => submitMutation.mutate()}
            disabled={rating === 0 || submitMutation.isPending}
            style={[
              styles.submitBtn,
              {
                backgroundColor:
                  rating === 0 ? colors.card : colors.foreground,
                borderColor: rating === 0 ? colors.border : colors.foreground,
              },
            ]}
          >
            {submitMutation.isPending ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Text
                style={[
                  styles.submitBtnText,
                  { color: rating === 0 ? colors.mutedForeground : colors.background },
                ]}
              >
                {rating === 0 ? "Выберите оценку" : "Отправить отзыв"}
              </Text>
            )}
          </Pressable>
        </View>
      )}

      {/* ─── Reviews list ─────────────────────────────────────────────── */}
      {isLoading ? (
        <ActivityIndicator color={colors.mutedForeground} style={{ marginTop: 16 }} />
      ) : reviews.length === 0 ? (
        <Text style={[styles.empty, { color: colors.mutedForeground }]}>
          Отзывов пока нет. Будьте первым!
        </Text>
      ) : (
        reviews.map((review) => (
          <View
            key={review.id}
            style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.reviewHeader}>
              <View style={styles.reviewMeta}>
                <Text style={[styles.reviewAuthor, { color: colors.foreground }]}>
                  {review.authorName}
                </Text>
                {review.createdAt && (
                  <Text style={[styles.reviewDate, { color: colors.mutedForeground }]}>
                    {formatDate(review.createdAt)}
                  </Text>
                )}
              </View>
              <StarRow rating={review.rating} size={13} />
            </View>
            {review.comment ? (
              <Text style={[styles.reviewComment, { color: colors.mutedForeground }]}>
                {review.comment}
              </Text>
            ) : null}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
    paddingTop: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  header: { gap: 6 },
  title: { fontSize: 16, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  avgRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  avgText: { fontSize: 13 },
  starRow: { flexDirection: "row", alignItems: "center" },
  writeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  writeBtnText: { fontSize: 14, fontWeight: "500" },
  loginPrompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  loginText: { fontSize: 13 },
  form: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  formAuthor: { fontSize: 13 },
  formLabel: { fontSize: 13, fontWeight: "600" },
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 80,
  },
  submitBtn: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  submitBtnText: { fontSize: 15, fontWeight: "700" },
  empty: { fontSize: 14, paddingVertical: 8 },
  reviewCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  reviewMeta: { gap: 2, flex: 1, marginRight: 8 },
  reviewAuthor: { fontSize: 14, fontWeight: "600" },
  reviewDate: { fontSize: 12 },
  reviewComment: { fontSize: 14, lineHeight: 20 },
});
