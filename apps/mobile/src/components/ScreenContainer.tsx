import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenContainerProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  showNavigation?: boolean;
  scrollable?: boolean;
}>;

export default function ScreenContainer({
  children,
  title,
  subtitle,
  showNavigation = true,
  scrollable = true,
}: ScreenContainerProps) {
  if (showNavigation) {
    return (
      <TabbedScreenContainer title={title} subtitle={subtitle} scrollable={scrollable}>
        {children}
      </TabbedScreenContainer>
    );
  }

  return (
    <FullScreenContainer title={title} subtitle={subtitle} scrollable={scrollable}>
      {children}
    </FullScreenContainer>
  );
}

function FullScreenContainer({
  children,
  title,
  subtitle,
  scrollable = true,
}: PropsWithChildren<Pick<ScreenContainerProps, 'title' | 'subtitle' | 'scrollable'>>) {
  const insets = useSafeAreaInsets();

  return (
    <ScreenShell
      bottomPadding={24 + insets.bottom}
      edges={['top', 'left', 'right', 'bottom'] as const}
      scrollable={scrollable}
      subtitle={subtitle}
      title={title}>
      {children}
    </ScreenShell>
  );
}

function TabbedScreenContainer({
  children,
  title,
  subtitle,
  scrollable = true,
}: PropsWithChildren<Pick<ScreenContainerProps, 'title' | 'subtitle' | 'scrollable'>>) {
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <ScreenShell
      bottomPadding={tabBarHeight + 24}
      edges={['top', 'left', 'right'] as const}
      scrollable={scrollable}
      subtitle={subtitle}
      title={title}>
      {children}
    </ScreenShell>
  );
}

function ScreenShell({
  bottomPadding,
  children,
  edges,
  scrollable,
  title,
  subtitle,
}: PropsWithChildren<{
  bottomPadding: number;
  edges: readonly ['top', 'left', 'right'] | readonly ['top', 'left', 'right', 'bottom'];
  scrollable: boolean;
  subtitle?: string;
  title?: string;
}>) {
  return (
    <SafeAreaView edges={edges} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        {scrollable ? (
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
            keyboardShouldPersistTaps="handled"
            style={styles.scrollView}>
            <View style={styles.content}>
              {title ? (
                <View style={styles.header}>
                  <Text style={styles.title}>{title}</Text>
                  {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </View>
              ) : null}
              {children}
            </View>
          </ScrollView>
        ) : (
          <View style={[styles.scrollContent, styles.nonScrollable, { paddingBottom: bottomPadding }]}>
            <View style={[styles.content, styles.contentFill]}>
              {title ? (
                <View style={styles.header}>
                  <Text style={styles.title}>{title}</Text>
                  {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </View>
              ) : null}
              {children}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fbff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 18,
  },
  nonScrollable: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    maxWidth: 1040,
    width: '100%',
  },
  contentFill: {
    flex: 1,
  },
  header: {
    gap: 8,
    marginBottom: 18,
  },
  title: {
    color: '#172554',
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
});
