import { ReactNode, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import AppTextInput from '@/components/AppTextInput';
import DateRangeCalendar from '@/components/DateRangeCalendar';
import EmptyState from '@/components/EmptyState';
import ListingResultCard from '@/components/ListingResultCard';
import { searchHotels } from '@/lib/clientApi';
import type { Listing, ListingSearchPagination, SearchHotelsInput } from '@/types/hotel-panel';

type SearchPanelProps = {
  ctaLabel?: string;
  favoriteHotelIds?: number[];
  footerContent?: ReactNode;
};

const INITIAL_SEARCH: SearchHotelsInput = {
  checkInDate: '',
  checkOutDate: '',
  destination: '',
  guests: '',
};

const PAGE_SIZE = 6;

export default function SearchPanel({ ctaLabel = 'Search', favoriteHotelIds = [], footerContent }: SearchPanelProps) {
  const [searchValues, setSearchValues] = useState<SearchHotelsInput>(INITIAL_SEARCH);
  const [missingFields, setMissingFields] = useState<Record<keyof SearchHotelsInput, boolean>>(getEmptyErrors());
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);
  const [results, setResults] = useState<Listing[]>([]);
  const [pagination, setPagination] = useState<ListingSearchPagination | null>(null);
  const [activeSearch, setActiveSearch] = useState<SearchHotelsInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const requestIdRef = useRef(0);

  const favoriteSet = useMemo(() => new Set(favoriteHotelIds), [favoriteHotelIds]);
  const totalItems = pagination?.totalItems ?? results.length;
  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  const today = getTodayDateString();

  async function executeSearch({
    page = 1,
    append = false,
    values = searchValues,
    isRefresh = false,
  }: {
    page?: number;
    append?: boolean;
    values?: SearchHotelsInput;
    isRefresh?: boolean;
  } = {}) {
    const normalized = normalizeSearchValues(values);
    const validation = validateSearch(normalized);
    setMissingFields(validation.errors);
    setDateRangeError(validation.rangeError);

    if (!validation.valid) return;
    if (append && (isSearching || isFetchingMore)) return;

    const requestId = ++requestIdRef.current;

    if (append) {
      setIsFetchingMore(true);
    } else if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsSearching(true);
    }

    if (!append && !isRefresh) {
      setResults([]);
      setPagination(null);
    }

    setError(null);
    setActiveSearch(normalized);

    try {
      const payload = await searchHotels(normalized, page, PAGE_SIZE);
      if (requestId !== requestIdRef.current) return;

      setResults((current) => (append ? mergeResults(current, payload.listings) : payload.listings));
      setPagination(payload.pagination);
    } catch (searchError) {
      if (requestId !== requestIdRef.current) return;
      setError(searchError instanceof Error ? searchError.message : 'Search failed.');
      if (!append) {
        setResults([]);
        setPagination(null);
      }
    } finally {
      if (requestId !== requestIdRef.current) return;
      setIsSearching(false);
      setIsFetchingMore(false);
      setIsRefreshing(false);
    }
  }

  function updateValue(key: keyof SearchHotelsInput, value: string) {
    setSearchValues((current) => ({ ...current, [key]: value }));
    setMissingFields((current) => ({ ...current, [key]: false }));
  }

  function updateGuests(value: string) {
    const sanitized = value.replace(/[^0-9]/g, '');
    updateValue('guests', sanitized);
  }

  function updateDates(range: { startDate: string; endDate: string }) {
    setSearchValues((current) => ({
      ...current,
      checkInDate: range.startDate,
      checkOutDate: range.endDate,
    }));
    setMissingFields((current) => ({
      ...current,
      checkInDate: false,
      checkOutDate: false,
    }));
    setDateRangeError(null);
  }

  function handleSearchPress() {
    void executeSearch({ page: 1 });
  }

  function handleRefresh() {
    if (!activeSearch) return;
    void executeSearch({ page: 1, values: activeSearch, isRefresh: true });
  }

  function handleEndReached() {
    if (!activeSearch || !pagination || !hasMore || isSearching || isFetchingMore) return;
    void executeSearch({ page: pagination.page + 1, append: true, values: activeSearch });
  }

  function handleRetry() {
    if (!activeSearch) return;
    void executeSearch({ page: 1, values: activeSearch });
  }

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={results}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState()}
        ListFooterComponent={renderFooter()}
        ListHeaderComponent={renderHeader()}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={styles.resultItem}>
            <ListingResultCard
              isFavorite={favoriteSet.has(Number(item.id))}
              listing={item}
              searchParams={activeSearch ?? undefined}
            />
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  function renderHeader() {
    return (
      <View style={styles.wrapper}>
        <View style={styles.card}>
          <AppTextInput
            label="Destination"
            onChangeText={(value) => updateValue('destination', value)}
            placeholder="Where to?"
            value={searchValues.destination}
          />
          {missingFields.destination ? <Text style={styles.errorText}>Destination is required.</Text> : null}
          <View style={styles.inlineFields}>
            <DateField label="Check in" value={searchValues.checkInDate} error={missingFields.checkInDate} />
            <DateField label="Check out" value={searchValues.checkOutDate} error={missingFields.checkOutDate} />
          </View>
          {dateRangeError ? <Text style={styles.errorText}>{dateRangeError}</Text> : null}
          <DateRangeCalendar
            endDate={searchValues.checkOutDate}
            minDate={today}
            onChange={updateDates}
            startDate={searchValues.checkInDate}
          />
          <AppTextInput
            keyboardType="number-pad"
            label="Guests"
            onChangeText={updateGuests}
            placeholder="2"
            value={searchValues.guests}
          />
          {missingFields.guests ? <Text style={styles.errorText}>Guests are required.</Text> : null}
          <AppButton
            disabled={isSearching || isFetchingMore}
            label={isSearching ? 'Searching...' : ctaLabel}
            onPress={handleSearchPress}
          />
        </View>

        {activeSearch ? (
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Search results for {activeSearch.destination}</Text>
            <Text style={styles.resultsMeta}>
              {isSearching && results.length === 0 ? 'Loading results...' : `${totalItems} properties found`}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  function renderEmptyState() {
    if (!activeSearch) return null;
    if (isSearching) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator color="#2563eb" size="large" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Search failed. {error}</Text>
          <AppButton label="Retry" onPress={handleRetry} variant="secondary" />
        </View>
      );
    }

    return (
      <EmptyState
        actionLabel="Search again"
        message="Try adjusting your dates, guests, or destination."
        onAction={handleSearchPress}
        title="No properties found"
      />
    );
  }

  function renderFooter() {
    return (
      <View style={styles.footer}>
        {isFetchingMore ? <ActivityIndicator color="#2563eb" size="large" /> : null}
        {error && results.length > 0 ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Unable to load more results. {error}</Text>
            <AppButton label="Retry" onPress={handleRetry} variant="secondary" />
          </View>
        ) : null}
        {footerContent ? <View style={styles.footerContent}>{footerContent}</View> : null}
      </View>
    );
  }
}

function DateField({ label, value, error }: { label: string; value: string; error?: boolean }) {
  const hasValue = value.trim().length > 0;

  return (
    <View style={[styles.dateField, error ? styles.dateFieldError : null]}>
      <Text style={styles.dateLabel}>{label}</Text>
      <Text style={[styles.dateValue, !hasValue ? styles.datePlaceholder : null]}>
        {hasValue ? value : 'Select date'}
      </Text>
    </View>
  );
}

function getEmptyErrors(): Record<keyof SearchHotelsInput, boolean> {
  return {
    checkInDate: false,
    checkOutDate: false,
    destination: false,
    guests: false,
  };
}

function normalizeSearchValues(values: SearchHotelsInput): SearchHotelsInput {
  return {
    ...values,
    destination: values.destination.trim(),
    guests: values.guests.trim(),
  };
}

function validateSearch(values: SearchHotelsInput) {
  const guestsCount = Number(values.guests);
  const guestsInvalid = !Number.isInteger(guestsCount) || guestsCount < 1;
  const errors = {
    checkInDate: values.checkInDate.trim().length === 0,
    checkOutDate: values.checkOutDate.trim().length === 0,
    destination: values.destination.trim().length === 0,
    guests: values.guests.trim().length === 0 || guestsInvalid,
  };

  let rangeError: string | null = null;
  if (!errors.checkInDate && !errors.checkOutDate) {
    const checkIn = parseDate(values.checkInDate);
    const checkOut = parseDate(values.checkOutDate);
    if (!checkIn || !checkOut) {
      rangeError = 'Dates must be valid.';
    } else if (checkOut <= checkIn) {
      rangeError = 'Check-out must be after check-in.';
    }
  }

  return {
    errors,
    rangeError,
    valid: !errors.checkInDate && !errors.checkOutDate && !errors.destination && !errors.guests && !rangeError,
  };
}

function parseDate(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function mergeResults(current: Listing[], next: Listing[]): Listing[] {
  const seen = new Set(current.map((item) => item.id));
  const merged = [...current];

  for (const item of next) {
    if (!seen.has(item.id)) {
      merged.push(item);
    }
  }

  return merged;
}

function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#bfdbfe',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 14,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
  container: {
    flex: 1,
  },
  dateField: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 6,
    minWidth: 150,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateFieldError: {
    borderColor: '#fca5a5',
  },
  dateLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  datePlaceholder: {
    color: '#94a3b8',
  },
  dateValue: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    gap: 16,
    paddingBottom: 32,
    paddingTop: 16,
  },
  footerContent: {
    marginTop: 8,
  },
  inlineFields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  listContent: {
    paddingBottom: 12,
  },
  list: {
    flex: 1,
  },
  resultItem: {
    marginBottom: 14,
  },
  resultsHeader: {
    gap: 4,
    marginTop: 16,
  },
  resultsMeta: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '700',
  },
  resultsTitle: {
    color: '#172554',
    fontSize: 22,
    fontWeight: '900',
  },
  wrapper: {
    gap: 16,
    marginBottom: 12,
  },
});
