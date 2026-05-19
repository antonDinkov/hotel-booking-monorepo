import { StyleSheet, Text, View } from 'react-native';

import StatusBadge from '@/components/StatusBadge';
import type { ReviewCardData } from '@repo/types';

type ReviewCardProps = {
  review: ReviewCardData;
};

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.hotel}>{review.hotelName}</Text>
        <StatusBadge label={`${review.rating}/5`} tone="green" />
      </View>
      <Text style={styles.date}>{review.createdAt}</Text>
      <Text style={styles.comment}>{review.comment}</Text>
      {review.partnerReply ? (
        <View style={styles.reply}>
          <Text style={styles.replyLabel}>Partner reply</Text>
          <Text style={styles.replyText}>{review.partnerReply.comment}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  hotel: {
    color: '#172554',
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '900',
  },
  date: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  comment: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 21,
  },
  reply: {
    backgroundColor: '#f0fdfa',
    borderColor: '#99f6e4',
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  replyLabel: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  replyText: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
  },
});
