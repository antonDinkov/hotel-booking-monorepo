import { StyleSheet, View } from 'react-native';

import ReviewCard from '@/components/ReviewCard';
import ScreenContainer from '@/components/ScreenContainer';
import { reviews } from '@/data/mockReviews';

export default function Reviews() {
  return (
    <ScreenContainer title="My Reviews" subtitle="Published review examples using the web app review concepts.">
      <View style={styles.list}>
        {reviews.map((review) => <ReviewCard review={review} key={review.id} />)}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 14,
  },
});
